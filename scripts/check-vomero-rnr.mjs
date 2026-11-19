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
  return json.data;
}

const GET_VOMERO_RNR = `
  query {
    products(first: 10, query: "title:Vomero 5 RNR") {
      nodes {
        id
        title
        vendor
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

const data = await admin(GET_VOMERO_RNR);
const products = data.products.nodes;

console.log("=== NIKE VOMERO 5 RNR ATUAL NA SHOPIFY ===\n");
for (const p of products) {
  console.log(`Produto: ${p.title} (${p.vendor})`);
  console.log(`Opções: ${JSON.stringify(p.options, null, 2)}`);
  console.log(`Variantes:`);
  for (const v of p.variants.nodes) {
    console.log(`  - ${v.title}: €${v.price} (comp: €${v.compareAtPrice})`);
    console.log(`    selectedOptions: ${JSON.stringify(v.selectedOptions)}`);
  }
}