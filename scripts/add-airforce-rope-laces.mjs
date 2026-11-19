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
      product { id title productType status variants(first: 10) { nodes { id title price compareAtPrice } } }
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
  console.log("A criar produto Air Force With Rope Laces...");

  const pubs = await admin(PUBLICATIONS);
  const onlineStore = pubs.publications.nodes.find((p) => /online store/i.test(p.name));

  const productOptions = [
    {
      name: "Cor",
      values: [
        { name: "Branca" },
        { name: "Preta" }
      ]
    }
  ];

  const variants = [
    {
      optionValues: [{ optionName: "Cor", name: "Branca" }],
      price: "139.99",
      compareAtPrice: "164.99",
      sku: "NIKE-AIR-FORCE-ROPE-LACES-BRANCA",
      inventoryPolicy: "DENY",
      inventoryItem: { tracked: true },
      inventoryQuantities: [{ locationId: "gid://shopify/Location/123726889308", name: "available", quantity: 100 }]
    },
    {
      optionValues: [{ optionName: "Cor", name: "Preta" }],
      price: "139.99",
      compareAtPrice: "164.99",
      sku: "NIKE-AIR-FORCE-ROPE-LACES-PRETA",
      inventoryPolicy: "DENY",
      inventoryItem: { tracked: true },
      inventoryQuantities: [{ locationId: "gid://shopify/Location/123726889308", name: "available", quantity: 100 }]
    }
  ];

  const input = {
    handle: "air-force-with-rope-laces",
    title: "Air Force With Rope Laces",
    descriptionHtml: "<p>Air Force With Rope Laces em promoção Black Friday!</p>",
    vendor: "Nike",
    productType: "Promoções - Black Friday",
    tags: ["Black Friday"],
    status: "ACTIVE",
    productOptions,
    variants,
    files: [
      {
        originalSource: "https://www.uffastore.pt/produtos/uffa-modelo-padrao.webp",
        alt: "Air Force With Rope Laces",
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
    for (const v of prod.variants.nodes) {
      console.log(`  - ${v.title} | Preço BF: €${v.price} | Compare At: €${v.compareAtPrice}`);
    }
    if (onlineStore) {
      await admin(PUBLISH, { id: prod.id, input: [{ publicationId: onlineStore.id }] });
      console.log("Publicado na Online Store.");
    }
  }
}

main().catch(console.error);