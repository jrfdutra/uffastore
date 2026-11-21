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
        productType
        tags
        status
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
      product { id title }
      userErrors { field message }
    }
  }
`;

async function main() {
  console.log(
    "A verificar todos os produtos na loja para padronizar títulos com 'With' ou 'W/'...",
  );
  const data = await admin(GET_PRODUCTS);
  const products = data.products.nodes;

  for (const p of products) {
    let newTitle = p.title;
    // Se o título contiver variações de rope laces em português ou informal (ex: "com rope laces", "com cordões", etc.)
    // Vamos garantir que se refere a "W/ Rope Laces" ou "With Rope Laces"

    // Substituições comuns no título
    if (/com\s+rope\s+laces/i.test(newTitle)) {
      newTitle = newTitle.replace(/com\s+rope\s+laces/gi, "W/ Rope Laces");
    }
    if (/com\s+cordões/i.test(newTitle)) {
      newTitle = newTitle.replace(/com\s+cordões/gi, "W/ Rope Laces");
    }

    if (newTitle !== p.title) {
      console.log(`Atualizando título: "${p.title}" -> "${newTitle}"`);
      const variants = p.variants.nodes.map((v) => ({
        optionValues: v.selectedOptions.map((so) => ({ optionName: so.name, name: so.value })),
        price: v.price,
        compareAtPrice: v.compareAtPrice,
        inventoryPolicy: "DENY",
        inventoryItem: { tracked: true },
        inventoryQuantities: [
          { locationId: "gid://shopify/Location/123726889308", name: "available", quantity: 100 },
        ],
      }));

      const input = {
        id: p.id,
        title: newTitle,
        vendor: p.vendor,
        productType: p.productType,
        tags: p.tags,
        status: p.status,
        productOptions: p.options.map((opt) => ({
          name: opt.name,
          values: opt.values.map((val) => ({ name: val })),
        })),
        variants,
      };

      const res = await admin(PRODUCT_SET, { input });
      if (res.productSet?.userErrors?.length > 0) {
        console.error(`Erro ao atualizar ${newTitle}:`, res.productSet.userErrors);
      } else {
        console.log(`✅ Sucesso!`);
      }
    }
  }

  console.log("Verificação e ajuste de títulos concluídos com sucesso!");
}

main().catch(console.error);
