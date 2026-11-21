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

const r = await fetch(`https://${domain}/admin/api/${version}/graphql.json`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
  body: JSON.stringify({
    query: `{
      products(first: 100) {
        nodes {
          title
          options { name values }
          variants(first: 100) {
            nodes { price compareAtPrice inventoryQuantity selectedOptions { name value } }
          }
        }
      }
    }`,
  }),
});
const j = await r.json();
if (j.errors) throw new Error(JSON.stringify(j.errors));

let totalVariants = 0;
let badStock = 0;
let unicos = 0;
const problems = [];

for (const p of j.data.products.nodes) {
  const sizeOpt = p.options.find((o) => /tamanho/i.test(o.name));
  const qty = p.variants.nodes.map((v) => v.inventoryQuantity);
  totalVariants += qty.length;
  badStock += qty.filter((q) => q !== 20).length;
  unicos += p.options.some((o) => o.values.some((v) => /único|unico/i.test(v))) ? 1 : 0;
  if (!sizeOpt) problems.push(`${p.title}: sem opção Tamanho`);
  const vals = sizeOpt?.values ?? [];
  if (vals.some((v) => !/^\d+(\.\d+)?$/.test(v)))
    problems.push(`${p.title}: tamanho inválido ${vals}`);
  console.log(
    `${p.title} | ${qty.length} variantes | stock min/max ${Math.min(...qty)}/${Math.max(...qty)} | tamanhos: ${vals.length}`,
  );
}

console.log(`\nTotal variantes: ${totalVariants}`);
console.log(`Variantes fora de 20: ${badStock}`);
console.log(`Produtos com "Único": ${unicos}`);
console.log(`Problemas: ${problems.length ? "\n - " + problems.join("\n - ") : "nenhum"}`);
