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
  mutation ProductSet($input: ProductSetInput!) {
    productSet(input: $input) {
      product { id title variants(first: 10) { nodes { title price compareAtPrice } } }
      userErrors { field message }
    }
  }
`;

const PUBLICATIONS = `query { publications(first: 20) { nodes { id name } } }`;
const PUBLISH = `
  mutation Publish($id: ID!, $input: [PublicationInput!]!) {
    publishablePublish(id: $id, input: $input) {
      userErrors { field message }
    }
  }
`;

async function main() {
  console.log("A criar o produto Nike P6000 com variantes de cor...");

  const pubs = await admin(PUBLICATIONS);
  const onlineStore = pubs.publications.nodes.find((p) => /online store/i.test(p.name));

  const productOptions = [
    {
      name: "Cor",
      values: [
        { name: "Branca com Logo Dourado" },
        { name: "Bege com Logo Rosa" }
      ]
    }
  ];

  const variants = [
    {
      optionValues: [{ optionName: "Cor", name: "Branca com Logo Dourado" }],
      price: "74.99",
      compareAtPrice: "114.99",
      sku: "NIKE-P6000-BRANCA-LOGODOURADO",
      inventoryPolicy: "DENY",
      inventoryItem: { tracked: true },
      inventoryQuantities: [{ locationId: "gid://shopify/Location/123726889308", name: "available", quantity: 100 }]
    },
    {
      optionValues: [{ optionName: "Cor", name: "Bege com Logo Rosa" }],
      price: "74.99",
      compareAtPrice: "114.99",
      sku: "NIKE-P6000-BEGE-LOGOROSA",
      inventoryPolicy: "DENY",
      inventoryItem: { tracked: true },
      inventoryQuantities: [{ locationId: "gid://shopify/Location/123726889308", name: "available", quantity: 100 }]
    }
  ];

  const input = {
    handle: "nike-p6000",
    title: "Nike P6000",
    descriptionHtml: "<p>Super promoção de Black Friday para o modelo Nike P6000!</p>",
    vendor: "Nike",
    productType: "Promoções - Black Friday",
    tags: ["Black Friday"],
    status: "ACTIVE",
    productOptions,
    variants,
    files: [
      {
        originalSource: "https://www.uffastore.pt/produtos/uffa-modelo-padrao.webp",
        alt: "Nike P6000",
        contentType: "IMAGE"
      }
    ]
  };

  const res = await admin(PRODUCT_SET, { input });
  if (res.productSet?.userErrors?.length > 0) {
    console.error("Erros ao criar Nike P6000:", res.productSet.userErrors);
  } else {
    const prodId = res.productSet.product.id;
    console.log(`✅ Nike P6000 criado com sucesso! ID: ${prodId}`);
    if (onlineStore) {
      await admin(PUBLISH, { id: prodId, input: [{ publicationId: onlineStore.id }] });
      console.log("Publicado na Online Store.");
    }
  }
}

main().catch(console.error);
