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

const GET_PRODUCT = `
  query {
    products(first: 10, query: "title:Nike Air Force") {
      nodes {
        id
        title
        vendor
        productType
        tags
        status
      }
    }
  }
`;

const PRODUCT_SET = `
  mutation ProductSet($input: ProductSetInput!) {
    productSet(input: $input) {
      product { id title variants(first: 10) { nodes { title price compareAtPrice } } }
      userErrors { field message }
    }
  }
`;

async function main() {
  console.log("A procurar o produto Nike Air Force...");
  const data = await admin(GET_PRODUCT);
  const products = data.products.nodes;
  if (products.length === 0) {
    console.error("Produto não encontrado!");
    return;
  }
  const product = products[0];
  console.log(`Encontrado: ${product.title} (${product.id})`);

  const productOptions = [
    {
      name: "Cor",
      values: [{ name: "Branco e Laranja" }, { name: "Bege e Rosa" }],
    },
  ];

  const variants = [
    {
      optionValues: [{ optionName: "Cor", name: "Branco e Laranja" }],
      price: "94.99",
      compareAtPrice: "179.99",
      sku: "NIKE-AIR-FORCE-BRANCO-LARANJA",
      inventoryPolicy: "DENY",
      inventoryItem: { tracked: true },
      inventoryQuantities: [
        { locationId: "gid://shopify/Location/123726889308", name: "available", quantity: 100 },
      ],
    },
    {
      optionValues: [{ optionName: "Cor", name: "Bege e Rosa" }],
      price: "154.99",
      compareAtPrice: "179.90",
      sku: "NIKE-AIR-FORCE-BEGE-ROSA",
      inventoryPolicy: "DENY",
      inventoryItem: { tracked: true },
      inventoryQuantities: [
        { locationId: "gid://shopify/Location/123726889308", name: "available", quantity: 100 },
      ],
    },
  ];

  const input = {
    id: product.id,
    title: product.title,
    vendor: product.vendor,
    productType: product.productType,
    tags: product.tags,
    status: product.status,
    productOptions,
    variants,
  };

  const res = await admin(PRODUCT_SET, { input });
  if (res.productSet?.userErrors?.length > 0) {
    console.error("Erros ao atualizar produto:", res.productSet.userErrors);
  } else {
    console.log(
      "✅ Produto Nike Air Force atualizado com sucesso com as 2 cores e preços específicos!",
    );
    const updatedVariants = res.productSet.product.variants.nodes;
    for (const v of updatedVariants) {
      console.log(`  - ${v.title} | Preço: €${v.price} | Compare At: €${v.compareAtPrice}`);
    }
  }
}

main().catch(console.error);
