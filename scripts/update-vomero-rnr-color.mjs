import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

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

const GET_VOMERO_RNR = `
  query {
    products(first: 10, query: "title:Vomero 5 RNR") {
      nodes {
        id
        title
        vendor
        status
        productType
        tags
        options { name values }
        variants(first: 10) {
          nodes {
            id
            title
            price
            compareAtPrice
            selectedOptions { name value }
          }
        }
      }
    }
  }
`;

const LOCATIONS = `query { locations(first: 10) { nodes { id name isActive } } }`;

const PRODUCT_SET = `
  mutation ProductSet($input: ProductSetInput!) {
    productSet(input: $input) {
      product { id title vendor }
      userErrors { field message }
    }
  }
`;

async function main() {
  console.log("A buscar o produto Nike Vomero 5 RNR atual...");
  
  const data = await admin(GET_VOMERO_RNR);
  const products = data.products.nodes;
  
  if (products.length === 0) {
    console.log("Produto não encontrado!");
    return;
  }
  
  const product = products[0];
  console.log(`Encontrado: ${product.title} (${product.id})`);
  console.log("Variantes atuais:");
  for (const v of product.variants.nodes) {
    console.log(`  - ${v.title}: €${v.price} (comp: €${v.compareAtPrice})`);
  }
  
  // Mapear preços atuais por título da variante
  const priceMap = {};
  for (const v of product.variants.nodes) {
    priceMap[v.title] = {
      price: v.price,
      compareAtPrice: v.compareAtPrice
    };
  }
  
  // Nova estrutura: 2 opções
  // 1. Cor: "Bege/Cromado" (única cor, mantendo os preços atuais)
  // 2. Cute Cord: "Com Cute Cord", "Sem Cute Cord"
  
  const productOptions = [
    { name: "Cor", values: [{ name: "Bege/Cromado" }] },
    { name: "Cute Cord", values: [{ name: "Com Cute Cord" }, { name: "Sem Cute Cord" }] }
  ];
  
  // Criar variantes combinadas (1 cor × 2 cute cord = 2 variantes)
  // Manter os mesmos preços que já existem
  const locationId = "gid://shopify/Location/123726889308"; // Rua Alcino de Araújo
  const variants = [
    {
      optionValues: [
        { optionName: "Cor", name: "Bege/Cromado" },
        { optionName: "Cute Cord", name: "Com Cute Cord" }
      ],
      price: priceMap["Com Cute Cord"]?.price || "94.99",
      compareAtPrice: priceMap["Com Cute Cord"]?.compareAtPrice || "124.99",
      sku: "NIKE-VOMERO-5-RNR-BEGE-CROMADO-COM-CUTE-CORD",
      inventoryPolicy: "DENY",
      inventoryItem: { tracked: true },
      inventoryQuantities: [{ locationId, name: "available", quantity: 100 }]
    },
    {
      optionValues: [
        { optionName: "Cor", name: "Bege/Cromado" },
        { optionName: "Cute Cord", name: "Sem Cute Cord" }
      ],
      price: priceMap["Sem Cute Cord"]?.price || "69.99",
      compareAtPrice: priceMap["Sem Cute Cord"]?.compareAtPrice || "89.99",
      sku: "NIKE-VOMERO-5-RNR-BEGE-CROMADO-SEM-CUTE-CORD",
      inventoryPolicy: "DENY",
      inventoryItem: { tracked: true },
      inventoryQuantities: [{ locationId, name: "available", quantity: 100 }]
    }
  ];
  
  const input = {
    id: product.id,
    title: product.title,
    vendor: product.vendor,
    productType: product.productType,
    tags: product.tags,
    status: product.status,
    productOptions,
    variants
  };
  
  console.log("\nA atualizar produto com nova estrutura de opções:");
  console.log("  Opção 1: Cor (Bege/Cromado)");
  console.log("  Opção 2: Cute Cord (Com Cute Cord, Sem Cute Cord)");
  console.log("  Total de variantes: 2");
  
  try {
    const res = await admin(PRODUCT_SET, { input, synchronous: true });
    if (res.productSet?.userErrors?.length > 0) {
      console.error("Erro:", res.productSet.userErrors);
    } else {
      console.log("\n✅ Produto atualizado com sucesso!");
      console.log(`ID: ${res.productSet.product.id}`);
      console.log(`Título: ${res.productSet.product.title}`);
    }
  } catch (err) {
    console.error("Erro inesperado:", err.message);
  }
}

main().catch(console.error);