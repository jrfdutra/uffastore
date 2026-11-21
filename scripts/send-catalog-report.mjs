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
const DRY = process.argv.includes("--dry");

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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function money(value) {
  if (value === undefined || value === null || value === "") return "—";
  return `${Number(value).toFixed(2).replace(".", ",")} €`;
}

const data = await admin(`
  query {
    products(first: 100) {
      nodes {
        title
        vendor
        productType
        tags
        status
        featuredImage { url }
        variants(first: 100) {
          nodes {
            price
            compareAtPrice
          }
        }
      }
    }
  }
`);

const products = data.products.nodes.map((p) => {
  const prices = p.variants.nodes.map((v) => Number.parseFloat(v.price)).filter(Number.isFinite);
  const price = prices.length ? Math.min(...prices) : undefined;
  const saleVariant = p.variants.nodes
    .filter((v) => v.compareAtPrice && Number.parseFloat(v.compareAtPrice) !== Number.parseFloat(v.price))
    .sort((a, b) => Number.parseFloat(a.price) - Number.parseFloat(b.price))[0];
  const compareAt = saleVariant ? Number.parseFloat(saleVariant.compareAtPrice) : undefined;
  const hasBlackFriday = p.tags.some((tag) => /black\s*friday|blackfriday/i.test(tag));

  const categories = [
    p.productType?.trim() || "Sem categoria",
    ...(hasBlackFriday ? ["Promoções - Black Friday"] : []),
  ];

  return {
    title: p.title,
    brand: p.vendor?.trim() || "Sem marca",
    categories,
    image: p.featuredImage?.url ?? null,
    price,
    compareAt,
    status: p.status,
  };
});

const byBrand = new Map();
for (const product of products) {
  const list = byBrand.get(product.brand) ?? [];
  list.push(product);
  byBrand.set(product.brand, list);
}
for (const list of byBrand.values()) {
  list.sort((a, b) => a.title.localeCompare(b.title, "pt"));
}
const brands = [...byBrand.entries()].sort((a, b) => a[0].localeCompare(b[0], "pt"));

// ---------- HTML ----------
const brandSections = brands
  .map(([brand, list]) => {
    const cards = list
      .map((p) => {
        const price = p.price !== undefined ? money(p.price) : "—";
        const compare =
          p.compareAt !== undefined && p.compareAt !== p.price ? money(p.compareAt) : "";
        const thumb = p.image
          ? `<img src="${escapeHtml(p.image)}" alt="" width="110" height="110" style="width:110px;height:110px;object-fit:cover;border-radius:6px;display:block;">`
          : `<div style="width:110px;height:110px;border-radius:6px;background:#eee;color:#999;display:flex;align-items:center;justify-content:center;font-size:11px;">sem foto</div>`;
        return `
          <td style="padding:12px;width:240px;vertical-align:top;border-bottom:1px solid #eee;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="width:120px;vertical-align:top;">${thumb}</td>
                <td style="vertical-align:top;padding-left:12px;">
                  <div style="font-weight:600;color:#111;font-size:14px;line-height:1.3;">${escapeHtml(p.title)}</div>
                  <div style="color:#666;font-size:12px;margin-top:4px;">${escapeHtml(p.categories.join(" · "))}</div>
                  <div style="margin-top:6px;white-space:nowrap;">
                    ${compare ? `<span style="text-decoration:line-through;color:#999;font-size:12px;">${compare}</span> ` : ""}
                    <strong style="color:#111;">${price}</strong>
                  </div>
                </td>
              </tr>
            </table>
          </td>`;
      })
      .join("");

    return `
      <tr>
        <td colspan="1" style="padding:14px 12px;background:#111;color:#fff;font-size:15px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">
          ${escapeHtml(brand)}
          <span style="float:right;font-weight:normal;font-size:13px;color:#bbb;">${list.length} produto${list.length === 1 ? "" : "s"}</span>
        </td>
      </tr>
      <tr><td style="padding:0;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
          <tr>${cards}</tr>
        </table>
      </td></tr>`;
  })
  .join("");

const brandSummary = brands
  .map(
    ([brand, list]) =>
      `<li style="margin-bottom:4px;"><strong>${escapeHtml(brand)}</strong>: ${list.length} produto${list.length === 1 ? "" : "s"}</li>`,
  )
  .join("");

const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Catálogo UFFA — Relatório por marcas</title>
</head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px;color:#333;">
  <div style="max-width:980px;margin:auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 4px 10px rgba(0,0,0,0.1);">
    <div style="background:#000;color:#fff;padding:30px;text-align:center;">
      <h1 style="margin:0;font-size:26px;">📋 Catálogo UFFA Store</h1>
      <p style="margin:10px 0 0;font-size:15px;color:#ccc;">Produtos organizados por marca, com miniatura da foto</p>
    </div>

    <div style="padding:30px;">
      <p style="font-size:15px;line-height:1.6;">Olá,</p>
      <p style="font-size:15px;line-height:1.6;">
        Segue o relatório do catálogo publicado no site, com os produtos agrupados por marca
        e a miniatura da foto de cada anúncio.
      </p>

      <div style="margin:24px 0;display:flex;gap:12px;flex-wrap:wrap;">
        <div style="flex:1;min-width:150px;border:2px solid #000;padding:14px;text-align:center;">
          <div style="font-size:28px;font-weight:bold;">${products.length}</div>
          <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#666;">Produtos</div>
        </div>
        <div style="flex:1;min-width:150px;border:2px solid #000;padding:14px;text-align:center;">
          <div style="font-size:28px;font-weight:bold;">${brands.length}</div>
          <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#666;">Marcas</div>
        </div>
      </div>

      <h2 style="border-bottom:2px solid #000;padding-bottom:8px;margin-top:30px;font-size:18px;">Produtos por marca</h2>
      <ul style="font-size:14px;line-height:1.7;padding-left:18px;">
        ${brandSummary}
      </ul>

      <h2 style="border-bottom:2px solid #000;padding-bottom:8px;margin-top:34px;font-size:18px;">Catálogo</h2>
      <div style="margin-top:12px;">
        ${brandSections}
      </div>

      <p style="margin-top:30px;font-size:13px;color:#777;">
        <em>E-mail gerado automaticamente a partir da Shopify e enviado via Resend.</em>
      </p>
    </div>
  </div>
</body>
</html>`;

// ---------- Texto simples ----------
const textLines = [
  "CATÁLOGO UFFA STORE — RELATÓRIO POR MARCA",
  "",
  `Produtos: ${products.length} | Marcas: ${brands.length}`,
  "",
];
for (const [brand, list] of brands) {
  textLines.push(`=== ${brand.toUpperCase()} (${list.length}) ===`);
  for (const p of list) {
    const price = p.price !== undefined ? money(p.price) : "—";
    const compare = p.compareAt !== undefined && p.compareAt !== p.price ? ` (antes ${money(p.compareAt)})` : "";
    textLines.push(`- ${p.title} | ${p.categories.join(" · ")} | ${price}${compare}`);
    if (p.image) textLines.push(`  Foto: ${p.image}`);
  }
  textLines.push("");
}

console.log(`Produtos: ${products.length} | Marcas: ${brands.length}`);
for (const [brand, list] of brands) console.log(`- ${brand}: ${list.length}`);

if (DRY) {
  console.log("\n--- ENSAIO (não enviado) ---");
  for (const [brand, list] of brands) {
    console.log(`\n${brand} (${list.length})`);
    for (const p of list) {
      console.log(
        `  • ${p.title} | ${p.categories.join(" · ")} | ${p.price !== undefined ? money(p.price) : "—"}${p.compareAt ? ` (antes ${money(p.compareAt)})` : ""} | ${p.image ? "foto: " + p.image.split("/").pop().split("?")[0] : "sem foto"}`,
      );
    }
  }
  process.exit(0);
}

const response = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${resendKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from: resendFrom,
    to: recipient,
    subject: `📋 Catálogo UFFA — ${products.length} produtos por marca`,
    html: emailHtml,
    text: textLines.join("\n"),
  }),
});

const resText = await response.text();
if (response.ok) {
  console.log("E-mail enviado com sucesso:", resText);
} else {
  console.error("Erro ao enviar e-mail pelo Resend:", resText);
  process.exit(1);
}
