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

const response = await fetch(`https://${domain}/admin/api/${version}/graphql.json`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
  body: JSON.stringify({
    query: `{
      menus(first: 10) {
        nodes {
          id title handle
          items { title type url items { title type url } }
        }
      }
    }`,
  }),
});
const json = await response.json();
if (json.errors) {
  console.log("Menus não acessíveis:", JSON.stringify(json.errors));
} else {
  for (const m of json.data.menus.nodes) {
    console.log(`Menu: ${m.title} (${m.handle})`);
    for (const i of m.items) {
      console.log(`  - ${i.title} [${i.type}] ${i.url || ""}`);
      for (const s of i.items || []) console.log(`      * ${s.title} [${s.type}] ${s.url || ""}`);
    }
  }
}
