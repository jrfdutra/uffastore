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

async function main() {
  console.log("A atualizar Nike AIR Force Chapa Dourada para incluir W/ Rope Laces...");

  // Encontrar o ID do produto atual Nike AIR Force Chapa Dourada (que tem id 15999570706780 ou similar)
  const productInput = {
    id: "gid://shopify/Product/15999570706780",
    title: "Nike AIR Force Chapa Dourada W/ Rope Laces",
    vendor: "Nike",
    productType: "Promoções - Black Friday",
    tags: ["Black Friday"],
    status: "ACTIVE",
    productOptions: [{ name: "Title", values: [{ name: "Default Title" }] }],
    variants: [{
      optionValues: [{ optionName: "Title", name: "Default Title" }],
      price: "124.99",
      compareAtPrice: "174.99",
      sku: "NIKE-AIR-FORCE-CHAPA-DOURADA-W-ROPE-LACES",
      inventoryPolicy: "DENY",
      inventoryItem: { tracked: true },
      inventoryQuantities: [{ locationId: "gid://shopify/Location/123726889308", name: "available", quantity: 100 }]
    }]
  };

  const res = await admin(PRODUCT_SET, { input: productInput });
  if (res.productSet?.userErrors?.length > 0) {
    console.error("Erro:", res.productSet.userErrors);
  } else {
    const p = res.productSet.product;
    console.log(`✅ Atualizado com sucesso: ${p.title} | Preço: €${p.variants.nodes[0].price} | Compare At: €${p.variants.nodes[0].compareAtPrice}`);
  }
}

main().catch(console.error);
