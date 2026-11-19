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
    products(first: 100) {
      nodes {
        id
        title
        vendor
        productType
        tags
      }
    }
  }
`;

const data = await admin(GET_ALL);
const products = data.products.nodes;

console.log("VERIFICAÇÃO DE TAGS E CATEGORIAS:\n");
let allOk = true;
for (const p of products) {
  const hasTag = p.tags?.includes("Black Friday") || false;
  const correctType = p.productType === "Promoções - Black Friday";
  const status = hasTag && correctType ? "✓" : "✗";
  if (!hasTag || !correctType) allOk = false;
  console.log(`${status} ${p.vendor} | ${p.title}`);
  console.log(`    Tags: ${p.tags || "—"}`);
  console.log(`    Categoria: ${p.productType || "—"}`);
  console.log("");
}

console.log(allOk ? "TODOS OS PRODUTOS COM TAGS E CATEGORIAS CORRETAS!" : "Há produtos sem a configuração correta.");