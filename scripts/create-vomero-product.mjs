// Cria/atualiza o produto promocional "NIKE VOMERO 5 RNR W/ CUTE CORD".
// A categoria do site vem do productType da Shopify: "sales" => aba Promoções.
// Uso: node scripts/create-vomero-product.mjs
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

if (!domain || !token) {
  console.error("Falta SHOPIFY_ADMIN_STORE_DOMAIN ou SHOPIFY_ADMIN_ACCESS_TOKEN no .env");
  process.exit(1);
}

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

const HANDLE = "nike-vomero-5-rnr-w-cute-cord";
const TITLE = "NIKE VOMERO 5 RNR W/ CUTE CORD";
const PRICE = "79.99";
const SIZES = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45];
// Edição limitada: 2 pares por tamanho (20 no total).
const STOCK_PER_SIZE = 2;

const PRODUCT_SET = `
  mutation ProductSet($input: ProductSetInput!, $synchronous: Boolean) {
    productSet(input: $input, synchronous: $synchronous) {
      product {
        id
        handle
        title
        status
        productType
        totalInventory
        variants(first: 20) { nodes { id price sku inventoryQuantity } }
      }
      userErrors { field message }
    }
  }
`;

const BY_HANDLE = `
  query ByHandle($query: String!) {
    products(first: 1, query: $query) { nodes { id } }
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
  const loc = locs.locations.nodes.find((l) => l.isActive) || locs.locations.nodes[0];
  if (!loc) throw new Error("Nenhuma localização ativa na Shopify.");

  const existing = await admin(BY_HANDLE, { query: `handle:${HANDLE}` });
  const existingId = existing.products.nodes[0]?.id;

  const input = {
    ...(existingId ? { id: existingId } : { handle: HANDLE }),
    title: TITLE,
    descriptionHtml:
      "<p>Nike Vomero 5 RNR para mulher, em branco e prata, com atacadores <em>cute cord</em> texturados. " +
      "Silhueta desportiva com amortecimento generoso e detalhes metálicos.</p>" +
      "<p><strong>Edição limitada</strong> — unidades muito reduzidas. Preço promocional de 79,99 €.</p>",
    vendor: "Uffa Store",
    productType: "sales",
    tags: ["nike-vomero-5-rnr", "sales", "UffaCatalog", "edicao-limitada"],
    status: "ACTIVE",
    productOptions: [{ name: "Tamanho", values: SIZES.map((size) => ({ name: String(size) })) }],
    variants: SIZES.map((size) => ({
      optionValues: [{ optionName: "Tamanho", name: String(size) }],
      price: PRICE,
      sku: `VOMERO5-CORD-WHT-${size}`,
      inventoryPolicy: "DENY",
      inventoryItem: { tracked: true },
      inventoryQuantities: [{ locationId: loc.id, name: "available", quantity: STOCK_PER_SIZE }],
    })),
    files: [
      {
        originalSource: "https://www.uffastore.pt/produtos/uffa-modelo-padrao.webp",
        alt: TITLE,
        contentType: "IMAGE",
      },
    ],
  };

  console.log(`${existingId ? "A atualizar" : "A criar"} "${TITLE}" (${PRICE} €, ${SIZES.length} tamanhos)...`);
  const res = await admin(PRODUCT_SET, { input, synchronous: true });
  if (res.productSet.userErrors.length > 0) {
    console.error("Erros:", res.productSet.userErrors);
    process.exit(1);
  }

  const product = res.productSet.product;
  console.log(`OK: ${product.id} | handle=${product.handle} | tipo=${product.productType} | stock=${product.totalInventory}`);
  console.log(`Variantes: ${product.variants.nodes.length}`);

  const pubs = await admin(PUBLICATIONS);
  const publicationInputs = pubs.publications.nodes.map((p) => ({ publicationId: p.id }));
  const pubRes = await admin(PUBLISH, { id: product.id, input: publicationInputs });
  const pubErrors = pubRes.publishablePublish.userErrors;
  if (pubErrors.length > 0) {
    console.error("Erros de publicação:", pubErrors);
  } else {
    console.log(`Publicado em: ${pubs.publications.nodes.map((p) => p.name).join(", ")}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
