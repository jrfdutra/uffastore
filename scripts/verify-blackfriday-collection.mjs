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
  if (!response.ok || json.errors?.length) throw new Error(JSON.stringify(json.errors || json));
  return json.data;
}

const q = `
  query {
    collectionByHandle(handle: "black-friday") {
      id title handle
      productsCount { count }
      products(first: 100) { nodes { title productType } }
    }
    products(first: 250) { nodes { title productType tags } }
  }
`;

const data = await admin(q);
const c = data.collectionByHandle;
console.log(`Coleção: ${c.title} (${c.handle})`);
console.log(`Produtos na coleção: ${c.productsCount.count}`);
const inCol = new Set(c.products.nodes.map((p) => p.title));
const missing = data.products.nodes.filter((p) => !inCol.has(p.title));
console.log(`Produtos fora da coleção: ${missing.length}`);
if (missing.length) for (const m of missing) console.log(`  - ${m.title}`);

const byType = {};
for (const p of data.products.nodes) byType[p.productType] = (byType[p.productType] || 0) + 1;
console.log("Categorias originais preservadas:", byType);
