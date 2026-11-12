// Cópia de segurança do catálogo antes de qualquer alteração.
// Exporta todos os produtos da Shopify (incluindo arquivados) e os ficheiros
// locais que definem o catálogo.
//
// Uso: node scripts/backup-catalog.mjs
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
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
    throw new Error(
      `HTTP ${response.status}: ${(json.errors ?? []).map((e) => e.message).join(" | ")}`,
    );
  }
  return json.data;
}

const QUERY = `
  query Backup($cursor: String) {
    products(first: 50, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id
        handle
        title
        descriptionHtml
        status
        productType
        vendor
        tags
        totalInventory
        publishedAt
        featuredImage { url altText }
        options { name values }
        media(first: 20) { nodes { mediaContentType ... on MediaImage { id image { url } } } }
        variants(first: 100) {
          nodes {
            id
            sku
            title
            price
            compareAtPrice
            inventoryQuantity
            availableForSale
            barcode
            selectedOptions { name value }
            image { url }
          }
        }
      }
    }
  }
`;

const all = [];
let cursor = null;
let hasNext = true;
while (hasNext) {
  const data = await admin(QUERY, { cursor });
  all.push(...data.products.nodes);
  hasNext = data.products.pageInfo.hasNextPage;
  cursor = data.products.pageInfo.endCursor;
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const dir = resolve(ROOT, "shopify-sync", "backups", stamp);
await mkdir(dir, { recursive: true });

await writeFile(resolve(dir, "shopify-products.json"), JSON.stringify(all, null, 2), "utf8");

// CSV simples para leitura rápida
const csv = ["handle,title,status,productType,variantId,sku,color,size,price,inventoryQuantity"];
for (const p of all) {
  for (const v of p.variants.nodes) {
    const color = v.selectedOptions.find((o) => /cor|color/i.test(o.name))?.value ?? "";
    const size = v.selectedOptions.find((o) => /tamanho|size|escal/i.test(o.name))?.value ?? "";
    csv.push(
      [
        p.handle,
        `"${p.title.replace(/"/g, '""')}"`,
        p.status,
        p.productType ?? "",
        v.id,
        v.sku ?? "",
        color,
        size,
        v.price,
        v.inventoryQuantity ?? "",
      ].join(","),
    );
  }
}
await writeFile(resolve(dir, "shopify-variants.csv"), csv.join("\n"), "utf8");

for (const file of ["src/data/catalogo.json", "src/lib/consolidated-catalog.ts"]) {
  const target = resolve(dir, file.replace(/^src\//, "").replace(/\//g, "-"));
  await copyFile(resolve(ROOT, file), target);
}

await writeFile(
  resolve(dir, "LEIA-ME.txt"),
  [
    "Cópia de segurança do catálogo UFFA",
    `Data: ${new Date().toISOString()}`,
    `Loja: ${domain}`,
    `Produtos exportados: ${all.length}`,
    `Variantes exportadas: ${all.reduce((n, p) => n + p.variants.nodes.length, 0)}`,
    "",
    "Ficheiros:",
    "- shopify-products.json: exportação completa (Admin API)",
    "- shopify-variants.csv: variantes em formato tabular",
    "- catalogo.json: catálogo local de preços/escalões",
    "- consolidated-catalog.ts: catálogo local consolidado",
    "",
    "Restauro: os produtos arquivados podem ser republicados no painel da Shopify.",
  ].join("\n"),
  "utf8",
);

console.log(`Backup criado em: shopify-sync/backups/${stamp}`);
console.log(
  `Produtos: ${all.length} | Variantes: ${all.reduce((n, p) => n + p.variants.nodes.length, 0)}`,
);
