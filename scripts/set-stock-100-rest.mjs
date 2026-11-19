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
const locationId = 123726889308;

const res = await fetch(`https://${domain}/admin/api/${version}/product_variants.json?limit=250`, {
  headers: { "X-Shopify-Access-Token": token },
});
const json = await res.json();
const variants = json.product_variants ?? [];
console.log(`Variantes via REST: ${variants.length}`);

let updated = 0;
for (const v of variants) {
  const set = await fetch(`https://${domain}/admin/api/${version}/inventory_levels/set.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({
      location_id: locationId,
      inventory_item_id: v.inventory_item_id,
      available: 100,
    }),
  });
  if (set.ok) updated++;
  else console.error(`✘ ${v.title}:`, await set.text());
}
console.log(`Stock definido a 100: ${updated}/${variants.length}`);
