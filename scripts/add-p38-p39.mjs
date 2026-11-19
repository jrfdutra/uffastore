import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const CSV_PATH = resolve(ROOT, "produtos_blackfriday_final.csv");

async function loadEnv() {
  const raw = await readFile(resolve(ROOT, ".env"), "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = await loadEnv();
const domain = env.SHOPIFY_ADMIN_STORE_DOMAIN;
const token = env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const version = env.SHOPIFY_ADMIN_API_VERSION || "2026-07";

async function admin(query, variables = {}) {
  const response = await fetch(`https://${domain}/admin/api/${version}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({ query, variables }),
  });
  const json = await response.json();
  if (!response.ok || json.errors?.length) {
    throw new Error(JSON.stringify(json.errors || json));
  }
  return json.data;
}

const PRODUCT_SET = `
  mutation ProductSet($input: ProductSetInput!) {
    productSet(input: $input) {
      product { id handle title status variants(first: 10) { nodes { id price compareAtPrice } } }
      userErrors { field message }
    }
  }
`;

const LOCATIONS = `query { locations(first: 10) { nodes { id name isActive } } }`;
const PUBLICATIONS = `query { publications(first: 20) { nodes { id name } } }`;
const PUBLISH = `
  mutation Publish($id: ID!, $input: [PublicationInput!]!) {
    publishablePublish(id: $id, input: $input) {
      userErrors { field message }
    }
  }
`;

function toTitleCase(str) {
  if (!str) return "";
  return str.toLowerCase().split(" ").map(word => {
    const upper = ["W/", "S/", "RNR", "GS", "PRO", "NB", "AIR", "MAX"];
    if (upper.includes(word.toUpperCase())) return word.toUpperCase();
    if (word.match(/^\d+[ºª]$/i)) return word.toLowerCase();
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(" ");
}

function normalize(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  console.log("Iniciando cadastro dos novos produtos P38 e P39...");

  const locs = await admin(LOCATIONS);
  const loc = locs.locations.nodes.find((l) => l.isActive) || locs.locations.nodes[0];
  const pubs = await admin(PUBLICATIONS);
  const onlineStore = pubs.publications.nodes.find((p) => /online store/i.test(p.name));

  const csvRaw = await readFile(CSV_PATH, "utf8");
  const lines = csvRaw.split(/\r?\n/).filter(l => l.trim());
  
  // Agrupar por Ref
  const refMap = new Map();
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(";");
    const [ref, modelo, marca, opcao, valorOpcao, precoAtual, precoBF, price, compareAt, obs] = cols;
    if (!refMap.has(ref)) {
      refMap.set(ref, {
        ref,
        modelo: modelo?.trim(),
        marca: marca?.trim(),
        obs: obs?.trim() || "",
        variants: []
      });
    }
    refMap.get(ref).variants.push({
      opcao: opcao?.trim() || "",
      valorOpcao: valorOpcao?.trim() || "",
      price: price?.trim() || "",
      compareAtPrice: compareAt?.trim() || "",
      obs: obs?.trim() || ""
    });
  }

  // Processar apenas P38 e P39
  for (const ref of ["P38", "P39"]) {
    const item = refMap.get(ref);
    if (!item) {
      console.log(`${ref} não encontrado no CSV!`);
      continue;
    }

    const formattedTitle = `${toTitleCase(item.marca)} ${toTitleCase(item.modelo)}`;
    const handle = normalize(`${item.marca}-${item.modelo}`).replace(/\s+/g, "-");

    // Construir as opções e variantes
    const optionMap = new Map();
    for (const v of item.variants) {
      if (v.opcao) {
        if (!optionMap.has(v.opcao)) {
          optionMap.set(v.opcao, new Set());
        }
        optionMap.get(v.opcao).add(v.valorOpcao);
      }
    }

    const productOptions = [];
    for (const [optName, valuesSet] of optionMap.entries()) {
      productOptions.push({
        name: optName,
        values: Array.from(valuesSet).map(val => ({ name: val }))
      });
    }

    const variants = item.variants.map(v => {
      return {
        optionValues: [{ optionName: v.opcao, name: v.valorOpcao }],
        price: v.price,
        compareAtPrice: v.compareAtPrice,
        sku: `${item.marca}-${item.modelo}-${v.valorOpcao}`.replace(/\s+/g, "-").toUpperCase(),
        inventoryPolicy: "DENY",
        inventoryItem: { tracked: true },
        inventoryQuantities: [{ locationId: loc.id, name: "available", quantity: 100 }]
      };
    });

    const input = {
      handle,
      title: formattedTitle,
      descriptionHtml: `<p>Super promoção de Black Friday para o modelo ${formattedTitle} da ${toTitleCase(item.marca)}!</p>`,
      vendor: item.marca.toUpperCase(),
      productType: "Promoções - Black Friday",
      tags: "Black Friday",
      status: "ACTIVE",
      productOptions,
      variants,
      files: [
        {
          originalSource: "https://www.uffastore.pt/produtos/uffa-modelo-padrao.webp",
          alt: formattedTitle,
          contentType: "IMAGE"
        }
      ]
    };

    console.log(`[CRIAR] Ref ${item.ref}: ${formattedTitle} (${variants.length} variante(s))...`);
    try {
      const res = await admin(PRODUCT_SET, { input, synchronous: true });
      if (res.productSet?.userErrors?.length > 0) {
        console.error(`Erro ao cadastrar ${formattedTitle}:`, res.productSet.userErrors);
      } else {
        const prodId = res.productSet.product.id;
        console.log(`Sucesso: Cadastrado com ID ${prodId}`);
        if (onlineStore) {
          await admin(PUBLISH, { id: prodId, input: [{ publicationId: onlineStore.id }] });
          console.log(`Publicado na Online Store.`);
        }
      }
    } catch (err) {
      console.error(`Erro inesperado ao cadastrar ${formattedTitle}:`, err.message);
    }
  }
}

main().catch(console.error);