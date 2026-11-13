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

const PRODUCT_SET = `
  mutation ProductSet($input: ProductSetInput!, $synchronous: Boolean) {
    productSet(input: $input, synchronous: $synchronous) {
      product { id handle title status variants(first: 10) { nodes { id price inventoryQuantity } } }
      userErrors { field message }
    }
  }
`;

const BY_HANDLE = `
  query ByHandle($query: String!) {
    products(first: 1, query: $query) {
      nodes { id }
    }
  }
`;

const PUBLICATIONS = `query { publications(first: 20) { nodes { id name } } }`;
const LOCATIONS = `query { locations(first: 10) { nodes { id name isActive } } }`;
const PUBLISH = `
  mutation Publish($id: ID!, $input: [PublicationInput!]!) {
    publishablePublish(id: $id, input: $input) {
      userErrors { field message }
    }
  }
`;

async function main() {
  const locs = await admin(LOCATIONS);
  const loc = locs.locations.nodes.find(l => l.isActive) || locs.locations.nodes[0];
  const pubs = await admin(PUBLICATIONS);
  const onlineStore = pubs.publications.nodes.find(p => /online store/i.test(p.name));

  const existing = await admin(BY_HANDLE, { query: "handle:teste" });
  const existingId = existing.products.nodes[0]?.id;

  const input = {
    ...(existingId ? { id: existingId } : { handle: "teste" }),
    title: "Teste",
    descriptionHtml: "<p>Produto exclusivo para testes de checkout (0,50 €).</p>",
    vendor: "Uffa Store",
    productType: "sales",
    status: "ACTIVE",
    productOptions: [
      { name: "Tamanho", values: [{ name: "40" }] }
    ],
    variants: [
      {
        optionValues: [{ optionName: "Tamanho", name: "40" }],
        price: "0.50",
        sku: "TESTE-050",
        inventoryPolicy: "DENY",
        inventoryItem: { tracked: true },
        inventoryQuantities: [{ locationId: loc.id, name: "available", quantity: 100 }],
      }
    ],
    files: [
      {
        originalSource: "https://www.uffastore.pt/produtos/uffa-modelo-padrao.webp",
        alt: "Teste",
        contentType: "IMAGE"
      }
    ]
  };

  console.log("A criar/atualizar produto 'Teste' (0.50 €) na Shopify...");
  const res = await admin(PRODUCT_SET, { input, synchronous: true });
  if (res.productSet.userErrors.length > 0) {
    console.error("Erros:", res.productSet.userErrors);
    return;
  }

  const product = res.productSet.product;
  console.log(`Produto atualizado com sucesso! ID: ${product.id}`);

  if (onlineStore) {
    console.log(`A publicar na ${onlineStore.name}...`);
    const pubRes = await admin(PUBLISH, {
      id: product.id,
      input: [{ publicationId: onlineStore.id }]
    });
    console.log("Resultado da publicação:", pubRes);
  }

  const variantId = product.variants.nodes[0]?.id;
  console.log(`Variant ID para teste: ${variantId}`);
}

main().catch(console.error);
