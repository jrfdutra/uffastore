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

const COLLECTIONS = `
  query {
    collections(first: 50) {
      nodes {
        id
        title
        handle
        sortOrder
        ruleSet { appliedDisjunctively rules { column relation condition } }
        productsCount { count }
      }
    }
  }
`;

const PRODUCTS = `
  query {
    products(first: 250) {
      nodes {
        id
        title
        productType
        category { id name fullName }
        tags
      }
    }
  }
`;

const data = await admin(COLLECTIONS);
console.log("=== COLEÇÕES EXISTENTES ===");
if (data.collections.nodes.length === 0) {
  console.log("(nenhuma)");
}
for (const c of data.collections.nodes) {
  console.log(`- ${c.title} | handle: ${c.handle} | produtos: ${c.productsCount.count}`);
  if (c.ruleSet?.rules?.length) {
    console.log(
      `    regras: ${JSON.stringify(c.ruleSet.rules)} (disjuntas: ${c.ruleSet.appliedDisjunctively})`,
    );
  }
}

const p = await admin(PRODUCTS);
console.log("\n=== PRODUTOS: productType vs category (taxonomia) ===");
const byType = {};
for (const prod of p.products.nodes) {
  byType[prod.productType] = (byType[prod.productType] || 0) + 1;
}
console.log("productType:", byType);
console.log("\nAmostra de category (taxonomia):");
for (const prod of p.products.nodes.slice(0, 5)) {
  console.log(`  - ${prod.title} -> ${prod.category ? prod.category.fullName : "(sem category)"}`);
}
const withTag = p.products.nodes.filter((x) => x.tags.includes("Black Friday")).length;
console.log(`\nProdutos com tag "Black Friday": ${withTag}/${p.products.nodes.length}`);
