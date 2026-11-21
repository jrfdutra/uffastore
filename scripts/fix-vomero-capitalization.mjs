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
    products(first: 50) {
      nodes {
        id
        title
        vendor
      }
    }
  }
`;

const PRODUCT_SET = `
  mutation ProductSet($input: ProductSetInput!) {
    productSet(input: $input) {
      product { id title vendor }
      userErrors { field message }
    }
  }
`;

function toTitleCase(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => {
      const upper = ["W/", "S/", "RNR", "GS", "PRO", "NB", "AIR", "MAX"];
      if (upper.includes(word.toUpperCase())) return word.toUpperCase();
      if (word.match(/^\d+[ºª]$/i)) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

async function main() {
  console.log("A carregar produtos para normalizar capitalização...");
  const data = await admin(GET_PRODUCTS);
  const products = data.products.nodes;

  const targetTitles = ["Nike Vomero 5", "Nike Vomero 5 RNR"];

  for (const product of products) {
    if (!targetTitles.includes(product.title)) continue;

    const newVendor = toTitleCase(product.vendor);
    const newTitle = toTitleCase(product.title);

    if (product.vendor === newVendor && product.title === newTitle) {
      console.log(`Já OK: ${product.vendor} | ${product.title}`);
      continue;
    }

    console.log(
      `A atualizar: "${product.vendor}" -> "${newVendor}" | "${product.title}" -> "${newTitle}"`,
    );
    try {
      const res = await admin(PRODUCT_SET, {
        input: {
          id: product.id,
          vendor: newVendor,
          title: newTitle,
        },
      });
      if (res.productSet?.userErrors?.length > 0) {
        console.error(`Erro:`, res.productSet.userErrors);
      } else {
        console.log(`Sucesso!`);
      }
    } catch (err) {
      console.error(`Erro inesperado:`, err.message);
    }
  }

  console.log("Fim!");
}

main().catch(console.error);
