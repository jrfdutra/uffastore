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

async function admin(query) {
  const response = await fetch(`https://${domain}/admin/api/2026-07/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({ query }),
  });
  const json = await response.json();
  return json.data;
}

const data = await admin(`
  query {
    products(first: 50, query: "Superstar") {
      nodes {
        title
        vendor
        status
        variants(first: 5) {
          nodes { title price compareAtPrice }
        }
      }
    }
  }
`);

console.log("=== PRODUTOS SUPERSTAR NA LOJA ===");
if (data.products.nodes.length === 0) {
  console.log("Nenhum produto Superstar encontrado.");
} else {
  for (const p of data.products.nodes) {
    console.log(`- ${p.title} (${p.vendor})`);
    for (const v of p.variants.nodes) {
      console.log(
        `    * Variante: ${v.title} | Preço: €${v.price} (Compare: €${v.compareAtPrice})`,
      );
    }
  }
}
