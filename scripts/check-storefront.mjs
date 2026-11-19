import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const raw = await readFile(resolve(ROOT, ".env"), "utf8");
const env = {};
for (const line of raw.split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const domain = env.VITE_SHOPIFY_STORE_DOMAIN;
const token = env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN;
console.log("domain:", domain, "| token:", token ? token.slice(0, 8) + "..." : "(vazio)");

const query = `
  query {
    products(first: 50) {
      nodes {
        handle
        title
        productType
        tags
        options { name values }
        priceRange { minVariantPrice { amount } }
        variants(first: 10) { nodes { title price { amount } selectedOptions { name value } quantityAvailable } }
      }
    }
  }
`;

const res = await fetch(`https://${domain}/api/2026-07/graphql.json`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": token },
  body: JSON.stringify({ query }),
});
const json = await res.json();
console.log("HTTP:", res.status);
if (json.errors) console.log("errors:", JSON.stringify(json.errors));
const nodes = json.data?.products?.nodes ?? [];
console.log("produtos devolvidos:", nodes.length);
for (const n of nodes.slice(0, 8)) {
  console.log(`- ${n.title} | type=${n.productType} | min=${n.priceRange.minVariantPrice.amount} | opts=${n.options.map(o=>o.name).join(",")} | variants=${n.variants.nodes.length}`);
}
