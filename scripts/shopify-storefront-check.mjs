// Teste read-only à Storefront API para confirmar domínio/token e produtos visíveis.
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
const token = env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const version = env.SHOPIFY_ADMIN_API_VERSION || "2026-07";

const QUERY = `{ shop { name primaryDomain { url } } products(first: 20) { nodes { handle title featuredImage { url } } } }`;

for (const domain of [env.VITE_SHOPIFY_STORE_DOMAIN, env.SHOPIFY_ADMIN_STORE_DOMAIN]) {
  try {
    const res = await fetch(`https://${domain}/api/${version}/graphql.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": token },
      body: JSON.stringify({ query: QUERY }),
    });
    const text = await res.text();
    const json = JSON.parse(text);
    if (json.errors?.length) {
      console.log(`[${domain}] ERRO: ${json.errors.map((e) => e.message).join(" | ")}`);
      continue;
    }
    console.log(
      `[${domain}] OK → ${json.data.shop.name} (${json.data.shop.primaryDomain.url}) — ${json.data.products.nodes.length} produtos públicos`,
    );
    for (const p of json.data.products.nodes) console.log(`   • ${p.handle} — ${p.title}`);
  } catch (error) {
    console.log(`[${domain}] FALHOU: ${error.message}`);
  }
}
