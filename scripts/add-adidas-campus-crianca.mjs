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
  console.log("A criar o produto Adidas Campus 00 Criança...");

  const pubs = await admin(PUBLICATIONS);
  const onlineStore = pubs.publications.nodes.find((p) => /online store/i.test(p.name));

  const productOptions = [
    {
      name: "Cor",
      values: [{ name: "Rosa" }, { name: "Preto e Branco" }],
    },
    {
      name: "Tamanho",
      values: [{ name: "34" }, { name: "35" }],
    },
  ];

  const colors = ["Rosa", "Preto e Branco"];
  const sizes = ["34", "35"];
  const variants = [];

  for (const color of colors) {
    for (const size of sizes) {
      variants.push({
        optionValues: [
          { optionName: "Cor", name: color },
          { optionName: "Tamanho", name: size },
        ],
        price: "104.99",
        compareAtPrice: "149.99",
        sku: `ADIDAS-CAMPUS-00-CRIANCA-${color.toUpperCase().replace(/[^A-Z]/g, "")}-${size}`,
        inventoryPolicy: "DENY",
        inventoryItem: { tracked: true },
        inventoryQuantities: [
          { locationId: "gid://shopify/Location/123726889308", name: "available", quantity: 100 },
        ],
      });
    }
  }

  const input = {
    handle: "adidas-campus-00-crianca",
    title: "Adidas Campus 00 Criança",
    descriptionHtml: "<p>Adidas Campus 00 de criança em promoção de Black Friday!</p>",
    vendor: "Adidas",
    productType: "Criança",
    tags: ["Black Friday", "Criança"],
    status: "ACTIVE",
    productOptions,
    variants,
    files: [
      {
        originalSource: "https://www.uffastore.pt/produtos/uffa-modelo-padrao.webp",
        alt: "Adidas Campus 00 Criança",
        contentType: "IMAGE",
      },
    ],
  };

  const res = await admin(PRODUCT_SET, { input });
  if (res.productSet?.userErrors?.length > 0) {
    console.error("Erros ao criar Adidas Campus 00 Criança:", res.productSet.userErrors);
  } else {
    const prodId = res.productSet.product.id;
    console.log(`✅ Adidas Campus 00 Criança criado com sucesso! ID: ${prodId}`);
    if (onlineStore) {
      await admin(PUBLISH, { id: prodId, input: [{ publicationId: onlineStore.id }] });
      console.log("Publicado na Online Store.");
    }
  }
}

main().catch(console.error);
