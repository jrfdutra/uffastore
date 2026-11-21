import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const ENV_PATH = resolve(ROOT, ".env");

async function loadEnv() {
  const raw = await readFile(ENV_PATH, "utf8");
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
    throw new Error(`API Error: ${JSON.stringify(json.errors)}`);
  }
  return json.data;
}

async function getAllProducts() {
  const all = [];
  let hasNext = true;
  let cursor = null;
  while (hasNext) {
    const data = await admin(
      `
      query($after: String) {
        products(first: 100, after: $after) {
          pageInfo { hasNextPage endCursor }
          nodes { id title vendor status }
        }
      }
    `,
      { after: cursor },
    );
    all.push(...data.products.nodes);
    hasNext = data.products.pageInfo.hasNextPage;
    cursor = data.products.pageInfo.endCursor;
  }
  return all;
}

const products = await getAllProducts();
console.log(`Total produtos na loja: ${products.length}`);
console.log("\nLista de produtos:");
products.forEach((p) => console.log(`${p.id} | ${p.vendor} | ${p.title} | ${p.status}`));
