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

const PUBLICATIONS = `query { publications(first: 20) { nodes { id name } } }`;
const PRODUCT_ID = `query { productByHandle(handle: "teste") { id title } }`;
const PUBLISH = `
  mutation Publish($id: ID!, $input: [PublicationInput!]!) {
    publishablePublish(id: $id, input: $input) {
      userErrors { field message }
    }
  }
`;

async function main() {
  const pubs = await admin(PUBLICATIONS);
  const prod = await admin(PRODUCT_ID);
  if (!prod.productByHandle) {
    console.error("Produto 'teste' não encontrado no Admin.");
    return;
  }
  const productId = prod.productByHandle.id;
  console.log(`A publicar ${productId} (${prod.productByHandle.title}) em todas as publicações...`);

  const publicationInputs = pubs.publications.nodes.map(p => ({ publicationId: p.id }));
  const res = await admin(PUBLISH, { id: productId, input: publicationInputs });
  console.log("Resultado:", res);
}

main().catch(console.error);
