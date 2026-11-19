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

async function admin(query) {
  const r = await fetch(`https://${domain}/admin/api/${version}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({ query }),
  });
  return (await r.json()).data;
}

const data = await admin(`{
  products(first: 100) {
    nodes {
      title vendor handle
      options { name values }
    }
  }
}`);

const prods = data.products.nodes;
const byVendor = {};
for (const p of prods) {
  const v = p.vendor || "N/A";
  if (!byVendor[v]) byVendor[v] = [];
  const sizeOpt = p.options.find((o) => /tamanho|size/i.test(o.name));
  byVendor[v].push({ title: p.title, sizes: sizeOpt ? sizeOpt.values : [] });
}

for (const [vendor, list] of Object.entries(byVendor)) {
  console.log(`\n=== ${vendor} (${list.length} produtos) ===`);
  for (const p of list) {
    console.log(`  ${p.title}: ${p.sizes.length ? p.sizes.join(", ") : "sem tamanho"}`);
  }
}
