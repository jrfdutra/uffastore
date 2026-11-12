// Introspeção do esquema Admin API para confirmar as mutações disponíveis.
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

async function gql(query) {
  const res = await fetch(`https://${domain}/admin/api/${version}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({ query }),
  });
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join(" | "));
  return json.data;
}

const data = await gql(`
  query Introspect {
    productSet: __type(name: "Mutation") { fields { name } }
    productSetInput: __type(name: "ProductSetInput") {
      inputFields { name type { name kind ofType { name kind ofType { name } } } }
    }
    productVariantSetInput: __type(name: "ProductVariantSetInput") {
      inputFields { name type { name kind ofType { name kind ofType { name } } } }
    }
    stagedInput: __type(name: "StagedUploadInput") {
      inputFields { name type { name kind ofType { name } } }
    }
  }
`);

const hasProductSet = data.productSet.fields.some((f) => f.name === "productSet");
console.log("productSet disponível:", hasProductSet);
console.log("\nProductSetInput:");
for (const f of data.productSetInput.inputFields) {
  const t = f.type.name ?? f.type.ofType?.name ?? f.type.ofType?.ofType?.name;
  console.log(`  ${f.name}: ${t} (${f.type.kind})`);
}
console.log("\nProductVariantSetInput:");
for (const f of data.productVariantSetInput.inputFields) {
  const t = f.type.name ?? f.type.ofType?.name ?? f.type.ofType?.ofType?.name;
  console.log(`  ${f.name}: ${t} (${f.type.kind})`);
}
console.log("\nStagedUploadInput:");
for (const f of data.stagedInput.inputFields) {
  const t = f.type.name ?? f.type.ofType?.name ?? f.type.ofType?.ofType?.name;
  console.log(`  ${f.name}: ${t} (${f.type.kind})`);
}
