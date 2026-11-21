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
    products(first: 10, query: "title:Adidas Campus 00 Criança") {
      nodes {
        id
        title
        vendor
        tags
        options { name values }
        variants(first: 10) {
          nodes {
            id
            price
            compareAtPrice
            selectedOptions { name value }
          }
        }
      }
    }
  }
`;

const PRODUCT_SET = `
  mutation ProductSet($input: ProductSetInput!) {
    productSet(input: $input) {
      product { id title productType }
      userErrors { field message }
    }
  }
`;

async function main() {
  console.log("A procurar o produto Adidas Campus 00 Criança...");
  const data = await admin(GET_PRODUCT);
  const products = data.products.nodes;
  if (products.length === 0) {
    console.error("Produto não encontrado!");
    return;
  }
  const product = products[0];
  console.log(`Encontrado: ${product.title} (${product.id})`);

  // Atualizar productType para "Promoções - Black Friday", mantendo o título com destaque e as mesmas variantes
  const productOptions = product.productOptions.map((opt) => ({
    name: opt.name,
    values: opt.values.map((v) => ({ name: v.name })),
  }));

  const variants = product.variants.nodes.map((v) => ({
    optionValues: v.selectedOptions.map((so) => ({ optionName: so.name, name: so.value })),
    price: v.price,
    compareAtPrice: v.compareAtPrice,
    sku: `ADIDAS-CAMPUS-00-CRIANCA-${v.selectedOptions
      .map((so) => so.value)
      .join("-")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")}`,
    inventoryPolicy: "DENY",
    inventoryItem: { tracked: true },
    inventoryQuantities: [
      { locationId: "gid://shopify/Location/123726889308", name: "available", quantity: 100 },
    ],
  }));

  const input = {
    id: product.id,
    title: product.title, // Mantém o destaque "Criança" no título
    vendor: product.vendor,
    productType: "Promoções - Black Friday", // Categoria padrão unificada
    tags: ["Black Friday"],
    status: "ACTIVE",
    productOptions,
    variants,
  };

  const res = await admin(PRODUCT_SET, { input });
  if (res.productSet?.userErrors?.length > 0) {
    console.error("Erro ao atualizar categoria:", res.productSet.userErrors);
  } else {
    console.log(
      `✅ Categoria atualizada com sucesso para "Promoções - Black Friday"! O título mantém-se como "${res.productSet.product.title}".`,
    );
  }
}

main().catch(console.error);
