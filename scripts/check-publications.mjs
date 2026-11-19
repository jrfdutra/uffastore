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
  const j = await r.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors));
  return j.data;
}

const data = await admin(`
  {
    publications(first: 20) { nodes { id name } }
    products(first: 3) {
      nodes {
        title
        status
        publishedAt
        resourcePublicationsV2(first: 20) { nodes { publication { id name } isPublished } }
      }
    }
  }
`);

console.log("=== PUBLICAÇÕES ===");
for (const p of data.publications.nodes) console.log(`- ${p.name} (${p.id})`);

console.log("\n=== AMOSTRA DE PRODUTOS ===");
for (const p of data.products.nodes) {
  console.log(`- ${p.title} | status=${p.status} | publishedAt=${p.publishedAt}`);
  for (const rp of p.resourcePublicationsV2.nodes) {
    console.log(`    ${rp.isPublished ? "✔" : "✘"} ${rp.publication.name}`);
  }
}
