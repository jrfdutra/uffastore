// Verificação read-only do estado da loja Shopify (Admin API).
// Uso: node scripts/shopify-inspect.mjs
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

if (!domain || !token) {
  console.error("Falta SHOPIFY_ADMIN_STORE_DOMAIN ou SHOPIFY_ADMIN_ACCESS_TOKEN no .env");
  process.exit(1);
}

async function admin(query, variables = {}) {
  const response = await fetch(`https://${domain}/admin/api/${version}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  });
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Resposta não-JSON (${response.status}): ${text.slice(0, 300)}`);
  }
  if (!response.ok || json.errors?.length) {
    throw new Error(
      `HTTP ${response.status}: ${(json.errors ?? []).map((e) => e.message).join(" | ") || text.slice(0, 300)}`,
    );
  }
  return json.data;
}

const QUERY = `
  query Products {
    shop { name myshopifyDomain currencyCode }
    products(first: 50) {
      nodes {
        id
        handle
        title
        status
        productType
        totalInventory
        featuredImage { url }
        options { name values }
        variants(first: 5) {
          nodes {
            id
            title
            price
            inventoryQuantity
            selectedOptions { name value }
          }
        }
      }
    }
  }
`;

const data = await admin(QUERY);
console.log(
  `Loja: ${data.shop.name} (${data.shop.myshopifyDomain}) — moeda ${data.shop.currencyCode}`,
);
console.log(`Total de produtos: ${data.products.nodes.length}`);
console.log("");
for (const p of data.products.nodes) {
  const opts = p.options.map((o) => `${o.name}[${o.values.length}]`).join(" ");
  console.log(
    `- ${p.status.padEnd(6)} ${p.handle} | ${p.title} | tipo=${p.productType || "-"} | stock=${p.totalInventory} | ${opts}`,
  );
}
