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

const query = `{
  products(first: 50, query: "jordan") {
    nodes {
      handle title productType tags
      availableForSale
      priceRange { minVariantPrice { amount } maxVariantPrice { amount } }
      variants(first: 10) { nodes { title price { amount } quantityAvailable selectedOptions { name value } } }
    }
  }
}`;

const res = await fetch(`https://${domain}/api/2026-07/graphql.json`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": token },
  body: JSON.stringify({ query }),
});
const json = await res.json();
if (json.errors) console.log(json.errors);
for (const n of json.data?.products?.nodes ?? []) {
  console.log(
    `- ${n.title} (${n.handle}) | type=${n.productType} | tags=${n.tags.join(",")} | disponível=${n.availableForSale} | min=${n.priceRange.minVariantPrice.amount} max=${n.priceRange.maxVariantPrice.amount}`,
  );
  for (const v of n.variants.nodes)
    console.log(
      `    * ${v.title} | ${v.price.amount} | qty=${v.quantityAvailable} | ${v.selectedOptions.map((o) => o.name + "=" + o.value).join("; ")}`,
    );
}
