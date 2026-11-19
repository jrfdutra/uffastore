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

const GET_PRODUCTS = `
  query {
    products(first: 250) {
      nodes {
        id
        title
      }
    }
  }
`;

const DELETE_PRODUCT = `
  mutation ProductDelete($input: ProductDeleteInput!) {
    productDelete(input: $input) {
      deletedProductId
      userErrors {
        field
        message
      }
    }
  }
`;

async function main() {
  console.log("A carregar produtos para eliminação...");
  const data = await admin(GET_PRODUCTS);
  const products = data.products.nodes;

  console.log(`Encontrados ${products.length} produtos para eliminar.`);

  for (const product of products) {
    console.log(`A eliminar produto: ${product.title} (${product.id})...`);
    try {
      const res = await admin(DELETE_PRODUCT, { input: { id: product.id } });
      if (res.productDelete?.userErrors?.length > 0) {
        console.error(`Erro ao eliminar ${product.title}:`, res.productDelete.userErrors);
      } else {
        console.log(`Sucesso: Produto eliminado (${res.productDelete?.deletedProductId}).`);
      }
    } catch (err) {
      console.error(`Erro ao tentar eliminar ${product.title}:`, err.message);
    }
  }

  console.log("Fim do processo de eliminação!");
}

main().catch(console.error);
