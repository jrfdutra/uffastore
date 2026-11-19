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

const LIST_PRODUCTS = `
  query {
    products(first: 50) {
      nodes {
        id
        title
        vendor
        status
        productType
        tags
        variants(first: 10) {
          nodes {
            id
            title
            price
            compareAtPrice
            selectedOptions {
              name
              value
            }
          }
        }
      }
    }
  }
`;

function toTitleCase(str) {
  if (!str) return "";
  return str.toLowerCase().split(" ").map(word => {
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
  console.log("=== COMPARAÇÃO E SINCRONIA FINAL ===");
  
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
    });
  }

  // Obter produtos da Shopify
  const shopifyData = await admin(LIST_PRODUCTS);
  const sps = shopifyData.products.nodes;

  let allInSync = true;
  const inSyncList = [];
  const outOfSyncList = [];

  for (const [ref, item] of refMap.entries()) {
    const isAmbiguous = item.obs.toLowerCase().includes("título repetido") || 
      item.variants.some(v => v.opcao && item.variants.some(v2 => v2 !== v && normalize(v2.opcao) === normalize(v.opcao) && normalize(v2.valorOpcao) === normalize(v.valorOpcao)));
    
    if (isAmbiguous) {
      // Ignorado, então não comparamos
      continue;
    }

    // Achar produto correspondente na Shopify
    const expectedTitle = `${toTitleCase(item.marca)} ${toTitleCase(item.modelo)}`;
    const shopifyProduct = sps.find(p => normalize(p.title) === normalize(expectedTitle));

    if (!shopifyProduct) {
      console.log(`❌ [Erro] Produto não encontrado na loja: "${expectedTitle}" (Ref ${ref})`);
      allInSync = false;
      outOfSyncList.push(ref);
      continue;
    }

    // Verificar Tags e Categoria
    const hasTag = shopifyProduct.tags.includes("Black Friday");
    const hasCategory = shopifyProduct.productType === "Promoções - Black Friday";
    const isActive = shopifyProduct.status === "ACTIVE";

    if (!hasTag || !hasCategory || !isActive) {
      console.log(`❌ [Erro] Problema nos metadados de "${expectedTitle}" (Ref ${ref}): Tag: ${hasTag}, Cat: ${hasCategory}, Status: ${isActive}`);
      allInSync = false;
      outOfSyncList.push(ref);
      continue;
    }

    // Verificar variantes e preços
    let varsInSync = true;
    for (const v of item.variants) {
      const optionName = v.opcao ? toTitleCase(v.opcao) : "";
      const optionValue = v.valorOpcao ? toTitleCase(v.valorOpcao) : "";
      
      const foundVar = shopifyProduct.variants.nodes.find(sv => {
        if (!optionName) return true; // Default title
        return sv.selectedOptions.some(so => normalize(so.name) === normalize(optionName) && normalize(so.value) === normalize(optionValue));
      });

      if (!foundVar) {
        console.log(`❌ [Erro] Variante não encontrada na loja para "${expectedTitle}": ${optionName}: ${optionValue}`);
        varsInSync = false;
        allInSync = false;
        continue;
      }

      const priceMatch = parseFloat(foundVar.price) === parseFloat(v.price);
      const compareMatch = parseFloat(foundVar.compareAtPrice) === parseFloat(v.compareAtPrice);

      if (!priceMatch || !compareMatch) {
        console.log(`❌ [Erro] Preços dessincronizados para "${expectedTitle}": Variando: ${foundVar.title}. Loja: ${foundVar.price}/${foundVar.compareAtPrice} vs Esperado: ${v.price}/${v.compareAtPrice}`);
        varsInSync = false;
        allInSync = false;
      }
    }

    if (varsInSync) {
      inSyncList.push(ref);
    } else {
      outOfSyncList.push(ref);
    }
  }

  console.log(`\nSincronia Global: ${allInSync ? "Perfeita (100% Sincronizado)" : "Incompleta"}`);
  console.log(`Produtos em Sincronia Perfeita: ${inSyncList.join(", ")}`);
  if (outOfSyncList.length > 0) {
    console.log(`Produtos fora de Sincronia: ${outOfSyncList.join(", ")}`);
  }
}

main().catch(console.error);
