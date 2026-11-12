// Publica os 6 modelos do catálogo UFFA na Online Store da Shopify.
//
// Requer os scopes read_publications e write_publications na app de Admin API.
// Uso: node scripts/shopify-publish.mjs
//
// É idempotente: produtos já publicados mantêm-se e os que faltam são publicados.
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { consolidatedProducts } from "../src/lib/consolidated-catalog.ts";

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

const PUBLICATIONS = `query { publications(first: 20) { nodes { id name } } }`;

const PRODUCT_ID = `
  query ProductId($query: String!) {
    products(first: 1, query: $query) {
      nodes { id handle status publishedAt }
    }
  }
`;

const PUBLISH = `
  mutation Publish($id: ID!, $input: [PublicationInput!]!) {
    publishablePublish(id: $id, input: $input) {
      userErrors { field message }
    }
  }
`;

const publications = await admin(PUBLICATIONS);
const onlineStore = publications.publications.nodes.find((p) => /online store/i.test(p.name));
if (!onlineStore) {
  console.error("Publicação Online Store não encontrada.");
  process.exit(1);
}
console.log(`Publicação: ${onlineStore.name} (${onlineStore.id})`);

let problemas = 0;
for (const produto of consolidatedProducts) {
  const data = await admin(PRODUCT_ID, { query: `handle:${produto.handle}` });
  const node = data.products.nodes[0];
  if (!node) {
    console.log(`✗ ${produto.handle}: produto não existe`);
    problemas += 1;
    continue;
  }

  const result = await admin(PUBLISH, {
    id: node.id,
    input: [{ publicationId: onlineStore.id }],
  });
  const errors = result.publishablePublish.userErrors ?? [];
  if (errors.length) {
    console.log(`✗ ${produto.handle}: ${errors.map((e) => e.message).join("; ")}`);
    problemas += 1;
    continue;
  }

  const check = await admin(PRODUCT_ID, { query: `handle:${produto.handle}` });
  const publishedAt = check.products.nodes[0]?.publishedAt;
  if (!publishedAt) {
    console.log(`✗ ${produto.handle}: continua sem publishedAt`);
    problemas += 1;
    continue;
  }
  console.log(`✓ ${produto.handle}: publicado (${publishedAt})`);
}

// Confirmação final pela Storefront API (é isto que o site consome).
const storefrontDomain = env.VITE_SHOPIFY_STORE_DOMAIN || domain;
const storefrontToken = env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN;
if (storefrontToken) {
  const response = await fetch(`https://${storefrontDomain}/api/${version}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": storefrontToken,
    },
    body: JSON.stringify({ query: `{ products(first: 50) { nodes { handle } } }` }),
  });
  const json = await response.json();
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join(" | "));
  const publicos = new Set(json.data.products.nodes.map((p) => p.handle));
  const emFalta = consolidatedProducts
    .map((produto) => produto.handle)
    .filter((handle) => !publicos.has(handle));
  if (emFalta.length) {
    problemas += 1;
    console.log(`✗ Em falta na loja pública: ${emFalta.join(", ")}`);
  } else {
    console.log(`✓ Loja pública mostra os 6 modelos (${publicos.size} produtos públicos)`);
  }
}

console.log(
  problemas === 0 ? "\nPublicação concluída." : `\n${problemas} problema(s) encontrado(s).`,
);
process.exitCode = problemas === 0 ? 0 : 1;
