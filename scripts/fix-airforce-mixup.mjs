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
  console.log("A corrigir produto P11 (Nike AIR Force Perolas Simbolo S/ Rope Laces)...");
  const p11Input = {
    id: "gid://shopify/Product/15999570411868",
    title: "Nike AIR Force Perolas Simbolo S/ Rope Laces",
    vendor: "Nike",
    productType: "Promoções - Black Friday",
    tags: ["Black Friday"],
    status: "ACTIVE",
    productOptions: [{ name: "Title", values: [{ name: "Default Title" }] }],
    variants: [
      {
        optionValues: [{ optionName: "Title", name: "Default Title" }],
        price: "99.98",
        compareAtPrice: "139.99",
        sku: "NIKE-AIR-FORCE-PEROLAS-SIMBOLO-S-ROPE-LACES",
        inventoryPolicy: "DENY",
        inventoryItem: { tracked: true },
        inventoryQuantities: [
          { locationId: "gid://shopify/Location/123726889308", name: "available", quantity: 100 },
        ],
      },
    ],
  };

  await admin(PRODUCT_SET, { input: p11Input });
  console.log("✅ P11 restaurado com sucesso!");

  console.log(
    "A atualizar Nike Air Force correto com as 2 cores (Branco e Laranja / Bege e Rosa)...",
  );
  const airForceInput = {
    id: "gid://shopify/Product/15999799853404",
    title: "Nike Air Force",
    vendor: "Nike",
    productType: "Promoções - Black Friday",
    tags: ["Black Friday"],
    status: "ACTIVE",
    productOptions: [
      {
        name: "Cor",
        values: [{ name: "Branco e Laranja" }, { name: "Bege e Rosa" }],
      },
    ],
    variants: [
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
    ],
  };

  const res = await admin(PRODUCT_SET, { input: airForceInput });
  console.log("✅ Nike Air Force atualizado com sucesso com as duas variantes!");
  const vars = res.productSet.product.variants.nodes;
  for (const v of vars) {
    console.log(`  - ${v.title} | Preço: €${v.price} | Compare At: €${v.compareAtPrice}`);
  }
}

main().catch(console.error);
