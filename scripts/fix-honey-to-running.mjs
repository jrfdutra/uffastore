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

const GET_ALL = `
  query {
    products(first: 250) {
      nodes { id title productType }
    }
  }
`;

const PRODUCT_SET = `
  mutation ProductSet($input: ProductSetInput!) {
    productSet(input: $input) {
      product { id title productType }
      userErrors { field message }
    }
  }
`;

async function main() {
  const data = await admin(GET_ALL);
  const products = data.products.nodes.filter(
    (p) => (p.productType || "").trim().toLowerCase() === "honey",
  );

  if (products.length === 0) {
    console.log("Nenhum produto com a categoria 'Honey' encontrado.");
    return;
  }

  console.log(`Encontrados ${products.length} produto(s) com categoria 'Honey':`);
  for (const p of products) console.log(`  - ${p.title}`);

  for (const p of products) {
    const res = await admin(PRODUCT_SET, { input: { id: p.id, productType: "Running" } });
    if (res.productSet?.userErrors?.length > 0) {
      console.error(`Erro ao atualizar ${p.title}:`, res.productSet.userErrors);
    } else {
      console.log(`✅ ${p.title} -> ${res.productSet.product.productType}`);
    }
  }

  console.log("Categorização atualizada para 'Running'.");
}

main().catch(console.error);
