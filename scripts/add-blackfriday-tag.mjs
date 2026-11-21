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

const GET_ALL = `
  query {
    products(first: 100) {
      nodes {
        id
        title
        vendor
        status
        productType
        tags
        options { name values }
        variants(first: 10) {
          nodes {
            id
            title
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
      product { id title productType tags }
      userErrors { field message }
    }
  }
`;

const data = await admin(GET_ALL);
const products = data.products.nodes;

console.log("A atualizar produtos com:");
console.log("- Tag 'Black Friday'");
console.log("- Categoria 'Promoções - Black Friday'");
console.log("- Preços com linha riscada (compareAtPrice)");
console.log("=".repeat(60) + "\n");

let updated = 0;
for (const p of products) {
  const tags = p.tags || "";
  if (tags.includes("Black Friday")) {
    console.log(`Já atualizado: ${p.title}`);
    continue;
  }

  const newTags = tags ? `${tags}, Black Friday`.trim() : "Black Friday";

  // Rebuild variants with proper optionValues
  const variantsInput = p.variants.nodes.map((v) => {
    const optionValues = (v.selectedOptions || []).map((so) => ({
      optionName: so.name,
      name: so.value,
    }));
    // If no selectedOptions (simple product with Default Title)
    if (optionValues.length === 0) {
      optionValues.push({ optionName: "Title", name: "Default Title" });
    }
    return {
      id: v.id,
      price: v.price,
      compareAtPrice: v.compareAtPrice,
      optionValues,
    };
  });

  // Build productOptions from existing options
  const productOptions = p.options.map((opt) => ({
    name: opt.name,
    values: opt.values.map((v) => ({ name: v })),
  }));

  const input = {
    id: p.id,
    title: p.title,
    vendor: p.vendor,
    productType: "Promoções - Black Friday",
    tags: newTags,
    status: "ACTIVE",
    productOptions,
    variants: variantsInput,
  };

  try {
    const res = await admin(PRODUCT_SET, { input });
    if (res.productSet?.userErrors?.length > 0) {
      console.error(`Erro em ${p.title}:`, res.productSet.userErrors);
    } else {
      console.log(
        `✓ Atualizado: ${p.title} -> tags: "${newTags}", productType: "Promoções - Black Friday"`,
      );
      updated++;
    }
  } catch (err) {
    console.error(`Erro:`, err.message);
  }
}

console.log("\n" + "=".repeat(60));
console.log(`Total de produtos atualizados com sucesso: ${updated}`);
