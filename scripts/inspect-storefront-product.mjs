import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const raw = await readFile(resolve(ROOT, ".env"), "utf8");
const env = {};
for (const line of raw.split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const handle = process.argv[2];
if (!handle) throw new Error("Indica o handle.");

const r = await fetch(
  `https://${env.VITE_SHOPIFY_STORE_DOMAIN}/api/${env.SHOPIFY_ADMIN_API_VERSION || "2026-07"}/graphql.json`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    },
    body: JSON.stringify({
      query: `query($handle: String!) {
        product(handle: $handle) {
          title
          options { name values }
          variants(first: 100) {
            nodes {
              title
              quantityAvailable
              selectedOptions { name value }
            }
          }
        }
      }`,
      variables: { handle },
    }),
  },
);

const j = await r.json();
const p = j.data?.product;
if (!p) {
  console.log(JSON.stringify(j.errors ?? j, null, 2));
  process.exit(1);
}
console.log(p.title);
console.log("Opções:", JSON.stringify(p.options));
console.log("Variantes:", p.variants.nodes.length);
for (const v of p.variants.nodes.slice(0, 30)) {
  console.log(
    " -",
    v.selectedOptions.map((o) => `${o.name}=${o.value}`).join(" | "),
    "stock:",
    v.quantityAvailable,
  );
}
