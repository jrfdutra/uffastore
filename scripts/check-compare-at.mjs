import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const raw = await readFile(resolve(ROOT, ".env"), "utf8");
const env = {};
for (const line of raw.split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const domain = env.SHOPIFY_ADMIN_STORE_DOMAIN;
const token = env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const version = env.SHOPIFY_ADMIN_API_VERSION || "2026-07";

const r = await fetch(`https://${domain}/admin/api/${version}/graphql.json`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
  body: JSON.stringify({
    query: `{
      products(first: 100) {
        nodes {
          title
          status
          variants(first: 100) {
            nodes { price compareAtPrice }
          }
        }
      }
    }`,
  }),
});
const j = await r.json();
if (j.errors) throw new Error(JSON.stringify(j.errors));

for (const p of j.data.products.nodes) {
  const sem = p.variants.nodes.filter((v) => !v.compareAtPrice);
  const preco = new Set(p.variants.nodes.map((v) => v.price));
  if (sem.length) {
    console.log(
      `${p.title} [${p.status}] — ${sem.length}/${p.variants.nodes.length} variantes sem preço antigo | preços: ${[...preco].join(", ")}`,
    );
  }
}
