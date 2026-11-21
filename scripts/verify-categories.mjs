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

const response = await fetch(`https://${domain}/admin/api/${version}/graphql.json`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
  body: JSON.stringify({
    query: "{ products(first: 250) { nodes { title productType status } } }",
  }),
});
const json = await response.json();
const nodes = json.data.products.nodes;

const counts = {};
for (const p of nodes) {
  const key = p.productType || "(vazio)";
  counts[key] = (counts[key] || 0) + 1;
}

console.log(`Total de produtos: ${nodes.length}`);
console.log("Distribuição por categoria:", counts);
console.log("");
console.log("Produtos Vomero:");
for (const p of nodes.filter((x) => /vomero/i.test(x.title))) {
  console.log(`  - ${p.title} -> ${p.productType} (${p.status})`);
}
