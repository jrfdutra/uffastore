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
        status
        productType
        tags
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
  const data = await admin(GET_PRODUCT);
  const p = data.products.nodes[0];
  if (!p) {
    console.log("Produto não encontrado.");
    return;
  }

  // Atualizar productType para "Promoções - Black Friday" (mantendo a categoria padrão)
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
    title: p.title,
    vendor: p.vendor,
    productType: "Promoções - Black Friday",
    tags: p.tags,
    status: p.status,
    productOptions: [
      { name: "Cor", values: [{ name: "Rosa" }, { name: "Preto e Branco" }] },
      { name: "Tamanho", values: [{ name: "34" }, { name: "35" }] },
    ],
    variants,
  };

  const res = await admin(PRODUCT_SET, { input });
  if (res.productSet?.userErrors?.length > 0) {
    console.error("Erros:", res.productSet.userErrors);
  } else {
    console.log(
      "✅ Categoria alterada para 'Promoções - Black Friday' com sucesso! (Título mantém 'Adidas Campus 00 Criança')",
    );
  }
}

main().catch(console.error);
