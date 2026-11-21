import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const raw = await readFile(resolve(ROOT, ".env"), "utf8");
const env = {};
for (const line of raw.split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const domain = env.SHOPIFY_ADMIN_STORE_DOMAIN;
const token = env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const version = env.SHOPIFY_ADMIN_API_VERSION || "2026-07";

async function admin(query, variables = {}) {
  const r = await fetch(`https://${domain}/admin/api/${version}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({ query, variables }),
  });
  const j = await r.json();
  if (!r.ok || j.errors) throw new Error(JSON.stringify(j.errors || j));
  return j.data;
}

const data = await admin(`
  {
    locations(first: 5) { nodes { id name isActive } }
    productVariants(first: 250) {
      nodes { id title inventoryQuantity inventoryItem { id } product { title } }
    }
  }
`);

const location = data.locations.nodes.find((l) => l.isActive) ?? data.locations.nodes[0];
const variants = data.productVariants.nodes;
const below = variants.filter((v) => v.inventoryQuantity < 100);
console.log(
  `Location: ${location.name} | variantes: ${variants.length} | abaixo de 100: ${below.length}`,
);

if (!below.length) {
  console.log("Todos os produtos já têm stock 100.");
  process.exit(0);
}

const res = await admin(
  `mutation Adjust($input: InventoryAdjustQuantitiesInput!) {
    inventoryAdjustQuantities(input: $input) @idempotent(key: "stock100-bf-2026") { userErrors { field message } }
  }`,
  {
    input: {
      name: "available",
      reason: "correction",
      changes: below.map((v) => ({
        inventoryItemId: v.inventoryItem.id,
        locationId: location.id,
        delta: 100 - v.inventoryQuantity,
        changeFromQuantity: v.inventoryQuantity,
      })),
    },
  },
);
const errs = res.inventoryAdjustQuantities.userErrors;
if (errs.length) {
  console.error("Erros:", errs);
  process.exit(1);
}
console.log(`✅ Stock reposto a 100 em ${below.length} variantes.`);

const check = await admin(`{ productVariants(first: 250) { nodes { inventoryQuantity } } }`);
const qty = check.productVariants.nodes.map((v) => v.inventoryQuantity);
console.log(
  `Verificação -> min=${Math.min(...qty)} max=${Math.max(...qty)} | sem stock: ${qty.filter((q) => q <= 0).length}`,
);
