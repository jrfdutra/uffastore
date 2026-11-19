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

async function admin(query, variables = {}) {
  const r = await fetch(`https://${domain}/admin/api/${version}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({ query, variables }),
  });
  const j = await r.json();
  if (!r.ok || j.errors) throw new Error(JSON.stringify(j.errors || j));
  return j.data;
}

const GET = `{ products(first: 100) { nodes { id title } } publications(first: 20) { nodes { id name } } }`;
const PUBLISH = `
  mutation Publish($id: ID!, $input: [PublicationInput!]!) {
    publishablePublish(id: $id, input: $input) { userErrors { field message } }
  }
`;

const data = await admin(GET);
const products = data.products.nodes;
const pubs = data.publications.nodes;
console.log(`Produtos: ${products.length} | Publicações: ${pubs.map((p) => p.name).join(", ")}`);

let ok = 0;
for (const p of products) {
  const res = await admin(PUBLISH, {
    id: p.id,
    input: pubs.map((pub) => ({ publicationId: pub.id })),
  });
  const errs = res.publishablePublish.userErrors;
  if (errs.length) {
    console.error(`✘ ${p.title}:`, errs);
  } else {
    ok++;
  }
}
console.log(`Publicados em todos os canais: ${ok}/${products.length}`);
