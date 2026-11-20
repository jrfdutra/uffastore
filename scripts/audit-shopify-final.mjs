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

const data = await admin(`{
  products(first: 100) {
    nodes {
      id title handle status vendor productType tags
      publishedAt
      options { name values }
      variants(first: 100) {
        nodes {
          id title sku price compareAtPrice inventoryQuantity inventoryPolicy
          selectedOptions { name value }
        }
      }
    }
  }
  publications(first: 20) { nodes { id name } }
}`);

const products = data.products.nodes;
const problems = [];
const warnings = [];

const ADIDAS_RE = /^\d{2}( [⅓⅔])?$/;
const SIZE_OPT_RE = /tamanho|size/i;

let totalVariants = 0;
let totalStock = 0;
let zeroStock = 0;
let noCompareAt = [];
let notActive = [];
let notPublished = [];
let noBlackFriday = [];
let adidasBadFormat = [];
let duplicateVariants = [];
let soldOutVariants = [];

for (const p of products) {
  if (p.status !== "ACTIVE") notActive.push(`${p.title} (${p.status})`);
  if (!p.publishedAt) notPublished.push(p.title);

  const hasBF = (p.tags ?? []).some((t) => /black\s*friday/i.test(t));
  if (!hasBF) noBlackFriday.push(p.title);

  const sizeOpt = p.options.find((o) => SIZE_OPT_RE.test(o.name));
  const isAdidas = /adidas/i.test(p.vendor || "") || /adidas/i.test(p.title);

  if (!sizeOpt) {
    problems.push(`${p.title}: sem opção de tamanho`);
  } else {
    if (sizeOpt.values.length === 0) problems.push(`${p.title}: opção de tamanho vazia`);
    const lower = sizeOpt.values.map((v) => v.toLowerCase());
    if (lower.includes("tamanho único") || lower.includes("único")) {
      problems.push(`${p.title}: contém "Tamanho Único"`);
    }
    if (isAdidas) {
      const bad = sizeOpt.values.filter((v) => !ADIDAS_RE.test(v.trim()));
      if (bad.length) adidasBadFormat.push(`${p.title}: ${bad.join(", ")}`);
    }
  }

  const seen = new Set();
  for (const v of p.variants.nodes) {
    totalVariants += 1;
    totalStock += v.inventoryQuantity ?? 0;
    if ((v.inventoryQuantity ?? 0) <= 0) {
      zeroStock += 1;
      soldOutVariants.push(`${p.title} · ${v.title}`);
    }
    if (!v.compareAtPrice) noCompareAt.push(`${p.title} · ${v.title}`);
    const key = v.selectedOptions.map((o) => `${o.name}=${o.value}`).sort().join("|");
    if (seen.has(key)) duplicateVariants.push(`${p.title} · ${key}`);
    seen.add(key);
  }
}

console.log("=== RESUMO SHOPIFY ===");
console.log(`Produtos: ${products.length}`);
console.log(`Variantes: ${totalVariants}`);
console.log(`Stock total (pares): ${totalStock}`);
console.log(`Variantes sem stock: ${zeroStock}`);
console.log(`Canais de publicação: ${data.publications.nodes.map((x) => x.name).join(", ")}`);
console.log("");

function report(label, list) {
  if (list.length === 0) {
    console.log(`✅ ${label}: OK`);
  } else {
    console.log(`❌ ${label}: ${list.length}`);
    for (const item of list.slice(0, 25)) console.log(`   - ${item}`);
    if (list.length > 25) console.log(`   ... e mais ${list.length - 25}`);
  }
}

report("Todos os produtos ACTIVE", notActive);
report("Todos publicados", notPublished);
report("Todos com tag Black Friday", noBlackFriday);
report("Todas as variantes com preço antigo", noCompareAt);
report("Variantes duplicadas", duplicateVariants);
report("Formato numeração Adidas", adidasBadFormat);
report("Variantes sem stock", soldOutVariants.slice(0, 5));

if (problems.length) {
  console.log(`\n❌ PROBLEMAS: ${problems.length}`);
  for (const p of problems) console.log(`   - ${p}`);
} else {
  console.log("\n✅ Estrutura de opções: OK");
}

// Amostra de tamanhos por marca
console.log("\n=== AMOSTRA DE TAMANHOS ===");
for (const p of products.slice(0, 6)) {
  const sizeOpt = p.options.find((o) => SIZE_OPT_RE.test(o.name));
  console.log(`${p.vendor} | ${p.title}: ${sizeOpt ? sizeOpt.values.join(", ") : "—"}`);
}
const adidasSample = products.filter((p) => /adidas/i.test(p.vendor || ""));
for (const p of adidasSample) {
  const sizeOpt = p.options.find((o) => SIZE_OPT_RE.test(o.name));
  console.log(`ADIDAS | ${p.title}: ${sizeOpt ? sizeOpt.values.join(", ") : "—"}`);
}
