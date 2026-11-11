// Sincroniza os variantId do catálogo local (src/lib/shop-data.ts)
// com os IDs reais das variantes na loja Shopify configurada no .env.
//
// Uso: node scripts/sync-shopify-variants.mjs
//
// É necessário depois de importar/reimportar os produtos na Shopify, porque os
// GIDs das variantes mudam de loja para loja e de importação para importação.

import { readFile, writeFile } from "node:fs/promises";
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
const domain = env.VITE_SHOPIFY_STORE_DOMAIN;
const token = env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const version = env.VITE_SHOPIFY_API_VERSION || "2026-07";

if (!domain || !token) {
  console.error("Falta VITE_SHOPIFY_STORE_DOMAIN ou VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN no .env");
  process.exit(1);
}

const query = `
  query Variants($first: Int!) {
    products(first: $first) {
      nodes {
        handle
        variants(first: 100) {
          nodes {
            id
            selectedOptions { name value }
          }
        }
      }
    }
  }
`;

const response = await fetch(`https://${domain}/api/${version}/graphql.json`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Shopify-Storefront-Access-Token": token,
  },
  body: JSON.stringify({ query, variables: { first: 100 } }),
});

if (!response.ok) {
  console.error(`Shopify respondeu ${response.status}`);
  process.exit(1);
}

const json = await response.json();
if (json.errors?.length) {
  console.error(json.errors.map((error) => error.message).join("\n"));
  process.exit(1);
}

/** handle -> size -> variantId */
const byHandle = new Map();
for (const product of json.data.products.nodes) {
  const sizes = new Map();
  for (const variant of product.variants.nodes) {
    const option = variant.selectedOptions.find((item) => item.name === "Tamanho");
    const size = Number.parseInt(option?.value ?? variant.id, 10);
    if (Number.isFinite(size)) sizes.set(size, variant.id);
  }
  byHandle.set(product.handle, sizes);
}

const filePath = resolve(ROOT, "src/lib/shop-data.ts");
const source = await readFile(filePath, "utf8");
const lines = source.split(/\r?\n/);

let currentHandle = null;
let updated = 0;
const missing = [];

const productIdPattern = /^\s{4}id:\s*"([^"]+)",\s*$/;
const sizePattern =
  /^(\s*\{\s*size:\s*(\d+),\s*stock:\s*\d+,\s*sku:\s*"[^"]*",\s*variantId:\s*")([^"]*)("\s*\},?\s*)$/;

const next = lines.map((line) => {
  const productMatch = line.match(productIdPattern);
  if (productMatch) {
    currentHandle = productMatch[1];
    return line;
  }

  const sizeMatch = line.match(sizePattern);
  if (!sizeMatch || !currentHandle) return line;

  const size = Number.parseInt(sizeMatch[2], 10);
  const variantId = byHandle.get(currentHandle)?.get(size);
  if (!variantId) {
    missing.push(`${currentHandle} / ${size}`);
    return line;
  }

  if (variantId !== sizeMatch[3]) updated += 1;
  return `${sizeMatch[1]}${variantId}${sizeMatch[4]}`;
});

await writeFile(filePath, next.join(source.includes("\r\n") ? "\r\n" : "\n"), "utf8");

console.log(`Loja: ${domain}`);
console.log(`Produtos na Shopify: ${byHandle.size}`);
console.log(`variantId atualizados em shop-data.ts: ${updated}`);
if (missing.length) {
  console.log(`Sem correspondência na Shopify (${missing.length}):`);
  for (const item of missing) console.log(`  - ${item}`);
}
