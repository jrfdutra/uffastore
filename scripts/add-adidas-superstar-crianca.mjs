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
      product { id title productType status variants(first: 10) { nodes { id title price compareAtPrice inventoryQuantity } } }
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
  console.log("A criar produto Adidas Superstar Criança...");

  const pubs = await admin(PUBLICATIONS);
  const onlineStore = pubs.publications.nodes.find((p) => /online store/i.test(p.name));

  const productOptions = [
    {
      name: "Tamanho",
      values: [{ name: "34" }]
    }
  ];

  const variants = [
    {
      optionValues: [{ optionName: "Tamanho", name: "34" }],
      price: "54.99",
      compareAtPrice: "79.99",
      sku: "ADIDAS-SUPERSTAR-CRIANCA-34",
      inventoryPolicy: "DENY",
      inventoryItem: { tracked: true },
      inventoryQuantities: [{ locationId: "gid://shopify/Location/123726889308", name: "available", quantity: 1 }]
    }
  ];

  const input = {
    handle: "adidas-superstar-crianca",
    title: "Adidas Superstar Criança",
    descriptionHtml: "<p>Adidas Superstar de criança em promoção especial de Black Friday!</p>",
    vendor: "Adidas",
    productType: "Promoções - Black Friday",
    tags: ["Black Friday"],
    status: "ACTIVE",
    productOptions,
    variants,
    files: [
      {
        originalSource: "https://www.uffastore.pt/produtos/uffa-modelo-padrao.webp",
        alt: "Adidas Superstar Criança",
        contentType: "IMAGE"
      }
    ]
  };

  const res = await admin(PRODUCT_SET, { input });
  if (res.productSet?.userErrors?.length > 0) {
    console.error("Erros:", res.productSet.userErrors);
  } else {
    const prod = res.productSet.product;
    console.log(`✅ Produto criado com sucesso! ID: ${prod.id}`);
    console.log(`Título: ${prod.title}`);
    console.log(`Preço: ${prod.variants.nodes[0].price} | Compare At: ${prod.variants.nodes[0].compareAtPrice} | Stock: ${prod.variants.nodes[0].inventoryQuantity}`);
    if (onlineStore) {
      await admin(PUBLISH, { id: prod.id, input: [{ publicationId: onlineStore.id }] });
      console.log("Publicado na Online Store.");
    }
  }
}

main().catch(console.error);
