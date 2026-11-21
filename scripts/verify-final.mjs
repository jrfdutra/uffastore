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
        status
        variants(first: 10) {
          nodes {
            id
            title
            price
            compareAtPrice
          }
        }
      }
    }
  }
`;

const data = await admin(GET_ALL);
const products = data.products.nodes;

console.log("=".repeat(120));
console.log("VERIFICAÇÃO FINAL - Catálogo Shopify | Black Friday");
console.log("=".repeat(120));
console.log(`Total de produtos: ${products.length}\n`);

let idx = 1;
for (const p of products) {
  console.log(`[${idx++}] ${p.vendor} | ${p.title}`);
  console.log(`    Status: ${p.status}`);
  const v = p.variants.nodes;
  if (v.length === 1) {
    console.log(`    Preço: ${v[0].price} | Compare: ${v[0].compareAtPrice || "-"}`);
  } else {
    v.forEach((variant) => {
      console.log(
        `    - ${variant.title}: ${variant.price} (comp: ${variant.compareAtPrice || "-"})`,
      );
    });
  }
  console.log("");
}
