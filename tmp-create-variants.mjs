import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split(/\r?\n/)
    .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^"|"$/g, "")];
    }),
);

const VERSION = "2026-07";

async function gql(query, variables = {}) {
  const res = await fetch(
    `https://${env.SHOPIFY_ADMIN_STORE_DOMAIN}/admin/api/${VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": env.SHOPIFY_ADMIN_ACCESS_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    },
  );
  const json = await res.json();
  if (!res.ok || json.errors) throw new Error(JSON.stringify(json.errors ?? json));
  return json.data;
}

// Get the location ID first
const loc = await gql(`query { locations(first: 5) { nodes { id name } } }`);
const locationId = loc.locations.nodes[0].id;
console.log("Location ID:", locationId);

const handles = [
  "air-force-floral-w-rope-laces-gs",
  "air-force-floral-w-rope-laces-senior",
  "nike-dunk-w-rope-laces-gs",
  "nike-dunk-w-rope-laces-senior",
  "air-force-lanvin-w-gs",
  "air-force-lanvin-w-senior",
  "floral-black-gs",
  "floral-black-senior",
  "air-force-w-rope-laces-gs",
  "air-force-w-rope-laces-senior",
];

for (const handle of handles) {
  const d = await gql(
    `query($handle: String!) {
      productByHandle(handle: $handle) {
        id
        title
        priceRange { minVariantPrice { amount } }
        options { id name values }
        variants(first: 100) {
          nodes {
            id
            title
            price
            selectedOptions { name value }
          }
        }
      }
    }`,
    { handle },
  );

  const product = d.productByHandle;
  if (!product) {
    console.log("Produto não encontrado:", handle);
    continue;
  }

  console.log("\nProcessando:", product.title, "(", handle, ")");
  
  const existingVariants = product.variants.nodes;
  const hasColor = product.options.some((o) => /cor|color/i.test(o.name));
  
  const colors = hasColor
    ? Array.from(new Set(existingVariants.map((v) => v.selectedOptions.find((o) => /cor|color/i.test(o.name))?.value).filter(Boolean)))
    : [null];

  const isGs = handle.endsWith("-gs");
  const targetSizes = isGs
    ? [36, 36.5, 37, 37.5, 38, 38.5, 39, 39.5]
    : [40, 40.5, 41, 41.5, 42, 42.5, 43, 43.5, 44, 44.5, 45];

  const price = product.priceRange.minVariantPrice.amount;

  // Get the option names to map values correctly
  const colorOptionName = product.options.find((o) => /cor|color/i.test(o.name))?.name;
  const sizeOptionName = product.options.find((o) => /tamanho|size|escal/i.test(o.name))?.name;
  console.log("  Opções:", colorOptionName, sizeOptionName);

  const newVariantsInput = [];
  for (const color of colors) {
    for (const size of targetSizes) {
      const sizeStr = String(size);
      const exists = existingVariants.some((v) => {
        const vSize = v.selectedOptions.find((o) => /tamanho|size|escal/i.test(o.name))?.value;
        const vColor = color ? v.selectedOptions.find((o) => /cor|color/i.test(o.name))?.value : null;
        return vSize === sizeStr && (!color || vColor === color);
      });

      if (!exists) {
        // Try the format that matches what variants already have
        const selectedOptions = [];
        if (colorOptionName && color) {
          selectedOptions.push({ name: colorOptionName, value: color });
        }
        if (sizeOptionName) {
          selectedOptions.push({ name: sizeOptionName, value: sizeStr });
        }
        newVariantsInput.push({
          price: String(price),
          selectedOptions,
          inventoryQuantities: [{ availableQuantity: 5, locationId }],
        });
      }
    }
  }

  if (newVariantsInput.length === 0) {
    console.log("  Nada para criar");
    continue;
  }

  console.log(`  Criando ${newVariantsInput.length} variantes...`);

  const created = await gql(
    `mutation($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkCreate(productId: $productId, variants: $variants) {
        productVariants { id title price selectedOptions { name value } }
        userErrors { field message }
      }
    }`,
    { productId: product.id, variants: newVariantsInput },
  );

  const errors = created.productVariantsBulkCreate.userErrors;
  if (errors.length) {
    console.log("  ERROS:", JSON.stringify(errors));
  } else {
    const variants = created.productVariantsBulkCreate.productVariants;
    console.log(`  Criadas ${variants.length} variantes com sucesso`);
  }
}