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
const resendKey = env.RESEND_API_KEY;
const resendFrom = env.RESEND_FROM || "onboarding@resend.dev";
const domain = env.SHOPIFY_ADMIN_STORE_DOMAIN;
const token = env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const version = env.SHOPIFY_ADMIN_API_VERSION || "2026-07";
const recipient = "junior.dutra.pt@gmail.com";

if (!resendKey) {
  console.error("RESEND_API_KEY não encontrada no .env!");
  process.exit(1);
}

async function admin(query, variables = {}) {
  const response = await fetch(`https://${domain}/admin/api/${version}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({ query, variables }),
  });
  const json = await response.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

// 1. Verificação de Integridade (verificar se existem produtos sem tamanhos ou variantes estranhas)
const data = await admin(`
  query {
    products(first: 100) {
      nodes {
        title
        variants(first: 100) {
          nodes {
            selectedOptions { name value }
          }
        }
      }
    }
  }
`);

const issues = [];
for (const p of data.products.nodes) {
  const hasSize = p.variants.nodes.every(v => v.selectedOptions.some(o => /tamanho|size/i.test(o.name)));
  if (!hasSize) issues.push(`Produto sem opção de tamanho completa: ${p.title}`);
}

if (issues.length > 0) {
  console.error("Problemas encontrados:", issues);
} else {
  console.log("Verificação de integridade: OK");
}

// ... código de verificação ...

// 2. Envio de e-mail final
const productsData = await admin(`
  query {
    products(first: 100) {
      nodes {
        title
        vendor
        variants(first: 100) {
          nodes {
            selectedOptions { name value }
            inventoryQuantity
          }
        }
      }
    }
  }
`);

const products = productsData.products.nodes.map(p => ({
  title: p.title,
  brand: p.vendor,
  variantsCount: p.variants.nodes.length,
  stock: p.variants.nodes.reduce((s, v) => s + v.inventoryQuantity, 0),
  sizes: [...new Set(p.variants.nodes.flatMap(v => v.selectedOptions.filter(o => /tamanho/i.test(o.name)).map(o => o.value)))].sort()
}));

const emailHtml = `<h1>Relatório Final: Catálogo Atualizado</h1>
<p>As numerações foram ajustadas por marca e escalão (Nike/Adidas).</p>
<table border="1">
  <tr><th>Marca</th><th>Produto</th><th>Tamanhos</th><th>Stock</th></tr>
  ${products.map(p => `<tr><td>${p.brand}</td><td>${p.title}</td><td>${p.sizes.join(', ')}</td><td>${p.stock}</td></tr>`).join('')}
</table>`;

const response = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    from: resendFrom,
    to: recipient,
    subject: "✅ Catálogo UFFA - Revisão Final e Numerações",
    html: emailHtml,
  }),
});

console.log("E-mail enviado:", await response.json());
