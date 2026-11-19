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

const GET_PRODUCTS = `
  query {
    products(first: 50) {
      nodes {
        id
        title
      }
    }
  }
`;

const PRODUCT_SET = `
  mutation ProductSet($input: ProductSetInput!) {
    productSet(input: $input) {
      userErrors { field message }
    }
  }
`;

const CATEGORY_MAP = [
  "Limitada", "Limitada", "Lifestyle", "Limitada", "Lifestyle",
  "Lifestyle", "Limitada", "Limitada", "Limitada", "Limitada",
  "Limitada", "Lifestyle", "Lifestyle", "Limitada", "Lifestyle",
  "Limitada", "Lifestyle", "Limitada", "Limitada", "Lifestyle",
  "Lifestyle", "Lifestyle", "Honey", "Honey", "Lifestyle",
  "Limitada", "Lifestyle", "Lifestyle", "Limitada", "Lifestyle",
  "Lifestyle", "Lifestyle"
];

async function main() {
  const data = await admin(GET_PRODUCTS);
  // Sort to match email list order (Shopify products are often returned in creation or ID order)
  const products = data.products.nodes.sort((a, b) => a.id.localeCompare(b.id));

  console.log(`Encontrados ${products.length} produtos.`);
  
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const category = CATEGORY_MAP[i] || "Promoções - Black Friday";
    console.log(`Atualizando ${p.title} para categoria: ${category}`);
    
    // Using the same update pattern as before, just changing productType
    const input = {
      id: p.id,
      productType: category
    };
    
    const res = await admin(PRODUCT_SET, { input });
    if (res.productSet?.userErrors?.length > 0) {
      console.error(`Erro ao atualizar ${p.title}:`, res.productSet.userErrors);
    }
  }
  console.log("Categorização concluída.");
}

main().catch(console.error);
