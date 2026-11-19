import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const CSV_PATH = resolve(ROOT, "produtos_blackfriday_final.csv");

async function loadEnv() {
  try {
    const raw = await readFile(resolve(ROOT, ".env"), "utf8");
    const env = {};
    for (const line of raw.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
    return env;
  } catch (e) {
    console.error("Erro ao ler .env");
    process.exit(1);
  }
}

const env = await loadEnv();
const domain = env.SHOPIFY_ADMIN_STORE_DOMAIN;
const token = env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const version = env.SHOPIFY_ADMIN_API_VERSION || "2026-07";

if (!domain || !token) {
  console.error("Falta SHOPIFY_ADMIN_STORE_DOMAIN ou SHOPIFY_ADMIN_ACCESS_TOKEN no .env");
  process.exit(1);
}

async function admin(query, variables = {}) {
  const response = await fetch(`https://${domain}/admin/api/${version}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({ query, variables }),
  });
  const json = await response.json();
  if (!response.ok || json.errors?.length) {
    throw new Error(`API Error: ${JSON.stringify(json.errors || response.statusText)}`);
  }
  return json.data;
}

async function getShopifyProducts() {
  const query = `
    query {
      products(first: 100) {
        nodes {
          id
          title
          vendor
          variants(first: 100) {
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
  const data = await admin(query);
  return data.products.nodes;
}

function normalize(str) {
  return str.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

async function main() {
  const csvRaw = await readFile(CSV_PATH, "utf8");
  const lines = csvRaw.split(/\r?\n/).slice(1);
  const csvProducts = lines.filter(l => l.trim()).map(line => {
    const [ref, modelo, marca, opcao, valorOpcao, precoAtual, precoBF, price, compareAt, obs] = line.split(";");
    return { ref, modelo, marca, opcao, valorOpcao, price: parseFloat(price), compareAt: parseFloat(compareAt), obs };
  });

  const shopifyProducts = await getShopifyProducts();
  
  const results = [];
  const titlesInShopify = shopifyProducts.reduce((acc, p) => {
    const key = `${normalize(p.title)}|${normalize(p.vendor || "")}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const processedRefs = new Set();
  
  for (const p of csvProducts) {
    if (processedRefs.has(p.ref)) continue;
    processedRefs.add(p.ref);

    const key = `${normalize(p.modelo)}|${normalize(p.marca)}`;
    const matches = titlesInShopify[key] || [];

    if (matches.length === 0) {
      results.push({ ...p, category: "NOVO", action: "Criar" });
    } else if (matches.length === 1) {
      results.push({ ...p, category: "EXISTE", action: "Atualizar" });
    } else {
      results.push({ ...p, category: "AMBÍGUO", action: "Ignorar" });
    }
  }

  console.table(results.map(r => ({ Ref: r.ref, Modelo: r.modelo, Categoria: r.category, Ação: r.action, Price: r.price, Compare: r.compareAt })));
}

main().catch(console.error);
