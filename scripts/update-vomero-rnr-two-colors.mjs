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

const GET_VOMERO_RNR = `
  query {
    products(first: 10, query: "title:Vomero 5 RNR") {
      nodes {
        id
        title
        vendor
        status
        productType
        tags
      }
    }
  }
`;

const PRODUCT_SET = `
  mutation ProductSet($input: ProductSetInput!) {
    productSet(input: $input) {
      product { id title variants(first: 10) { nodes { title price compareAtPrice selectedOptions { name value } } } }
      userErrors { field message }
    }
  }
`;

async function main() {
  console.log("A procurar o produto Nike Vomero 5 RNR...");
  const data = await admin(GET_VOMERO_RNR);
  const products = data.products.nodes;
  if (products.length === 0) {
    console.error("Produto não encontrado!");
    return;
  }
  const product = products[0];
  console.log(`Encontrado: ${product.title} (${product.id})`);

  // Definir opções: Cor (Bege/Cromado, Branca e Prata) e Cute Cord (Com Cute Cord, Sem Cute Cord)
  const productOptions = [
    { 
      name: "Cor", 
      values: [{ name: "Bege/Cromado" }, { name: "Branca e Prata" }] 
    },
    { 
      name: "Cute Cord", 
      values: [{ name: "Com Cute Cord" }, { name: "Sem Cute Cord" }] 
    }
  ];

  const variants = [
    // 1. Bege/Cromado + Com Cute Cord
    {
      optionValues: [
        { optionName: "Cor", name: "Bege/Cromado" },
        { optionName: "Cute Cord", name: "Com Cute Cord" }
      ],
      price: "94.99",
      compareAtPrice: "124.99",
      sku: "VOMERO-5-RNR-BEGE-CROMADO-COM",
      inventoryPolicy: "DENY",
      inventoryItem: { tracked: true },
      inventoryQuantities: [{ locationId: "gid://shopify/Location/123726889308", name: "available", quantity: 100 }]
    },
    // 2. Bege/Cromado + Sem Cute Cord
    {
      optionValues: [
        { optionName: "Cor", name: "Bege/Cromado" },
        { optionName: "Cute Cord", name: "Sem Cute Cord" }
      ],
      price: "69.99",
      compareAtPrice: "89.99",
      sku: "VOMERO-5-RNR-BEGE-CROMADO-SEM",
      inventoryPolicy: "DENY",
      inventoryItem: { tracked: true },
      inventoryQuantities: [{ locationId: "gid://shopify/Location/123726889308", name: "available", quantity: 100 }]
    },
    // 3. Branca e Prata + Com Cute Cord
    {
      optionValues: [
        { optionName: "Cor", name: "Branca e Prata" },
        { optionName: "Cute Cord", name: "Com Cute Cord" }
      ],
      price: "89.99",
      compareAtPrice: "109.99",
      sku: "VOMERO-5-RNR-BRANCA-PRATA-COM",
      inventoryPolicy: "DENY",
      inventoryItem: { tracked: true },
      inventoryQuantities: [{ locationId: "gid://shopify/Location/123726889308", name: "available", quantity: 100 }]
    },
    // 4. Branca e Prata + Sem Cute Cord
    {
      optionValues: [
        { optionName: "Cor", name: "Branca e Prata" },
        { optionName: "Cute Cord", name: "Sem Cute Cord" }
      ],
      price: "69.99",
      compareAtPrice: "89.99",
      sku: "VOMERO-5-RNR-BRANCA-PRATA-SEM",
      inventoryPolicy: "DENY",
      inventoryItem: { tracked: true },
      inventoryQuantities: [{ locationId: "gid://shopify/Location/123726889308", name: "available", quantity: 100 }]
    }
  ];

  const input = {
    id: product.id,
    title: product.title,
    vendor: product.vendor,
    productType: product.productType,
    tags: product.tags,
    status: product.status,
    productOptions,
    variants
  };

  console.log("A atualizar produto Nike Vomero 5 RNR com 2 cores e 4 variantes combinadas...");
  const res = await admin(PRODUCT_SET, { input });
  if (res.productSet?.userErrors?.length > 0) {
    console.error("Erros:", res.productSet.userErrors);
  } else {
    console.log("✅ Produto atualizado com sucesso!");
    const updatedVariants = res.productSet.product.variants.nodes;
    for (const v of updatedVariants) {
      console.log(`  - ${v.title} | Preço: €${v.price} | Compare: €${v.compareAtPrice}`);
    }
  }
}

main().catch(console.error);
