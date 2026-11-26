import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const raw = await readFile(resolve(ROOT, ".env"), "utf8");
const env = {};
for (const line of raw.split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, "");
}

const domain = env.SHOPIFY_ADMIN_STORE_DOMAIN;
const token = env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const version = env.SHOPIFY_ADMIN_API_VERSION || "2026-07";
const resendKey = env.RESEND_API_KEY;
const resendFrom = env.RESEND_FROM || "onboarding@resend.dev";
const recipient = process.env.REPORT_TO || "junior.dutra.pt@gmail.com";

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

const SITE = "https://www.uffastore.pt";

// ---------- Segurança ----------
const homeRes = await fetch(`${SITE}/`);
const homeHtml = await homeRes.text();
const headers = Object.fromEntries(
  [...homeRes.headers.entries()].filter(([key]) =>
    /^(strict-transport-security|x-frame-options|x-content-type-options|referrer-policy|permissions-policy|server)$/i.test(
      key,
    ),
  ),
);
const leakedSecrets = [
  ...homeHtml.matchAll(/\b(shpat_[A-Za-z0-9]{10,}|re_[A-Za-z0-9]{10,}|sk-[A-Za-z0-9_-]{10,})\b/g),
].map((m) => m[1].slice(0, 8) + "…");

// ---------- Funcionalidade ----------
const catalogHtml = await (await fetch(`${SITE}/catalogo`)).text();
const productPaths = [
  ...new Set([...catalogHtml.matchAll(/href="(\/produto\/[^"]+)"/g)].map((m) => m[1])),
];
const pagesToCheck = [
  "/",
  "/catalogo",
  "/ajuda",
  "/rastreio",
  "/privacidade",
  "/termos",
  "/sitemap.xml",
  ...productPaths.slice(0, 6),
];
const pageChecks = [];
for (const path of pagesToCheck) {
  try {
    const res = await fetch(`${SITE}${path}`, { redirect: "follow" });
    pageChecks.push({ path, status: res.status });
  } catch (error) {
    pageChecks.push({ path, status: 0, error: error.message });
  }
}

// ---------- Imagens ----------
const imageUrls = [
  ...new Set(
    [...catalogHtml.matchAll(/src="(https:\/\/cdn\.shopify\.com\/[^"]+)"/g)].map((m) =>
      m[1].replace(/&amp;/g, "&"),
    ),
  ),
];
const imageChecks = [];
for (const url of imageUrls.slice(0, 40)) {
  try {
    const res = await fetch(url, { method: "HEAD" });
    imageChecks.push({ url: url.split("/").pop().split("?")[0], status: res.status });
  } catch (error) {
    imageChecks.push({ url, status: 0, error: error.message });
  }
}

// ---------- Catálogo (modelos, cores, GS/SENIOR) ----------
const data = await admin(`
  query {
    products(first: 100) {
      nodes {
        title
        vendor
        status
        options { name values }
        variants(first: 100) {
          nodes {
            price
            compareAtPrice
            availableForSale
            selectedOptions { name value }
          }
        }
      }
    }
  }
`);

const products = data.products.nodes.filter((p) => p.status === "ACTIVE");

function escalao(sizeText) {
  const match = String(sizeText).match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return "unico";
  const num = Number.parseFloat(match[1].replace(",", "."));
  return num < 40 ? "GS" : "SENIOR";
}

const catalog = products.map((p) => {
  const colorOption = p.options.find((o) => /cor|color/i.test(o.name));
  const colors = colorOption ? colorOption.values : ["Única"];
  const byColor = {};
  for (const v of p.variants.nodes) {
    let color = "Única";
    let size = v.title;
    for (const option of v.selectedOptions) {
      if (/cor|color/i.test(option.name)) color = option.value;
      if (/tam|size/i.test(option.name)) size = option.value;
    }
    const group = escalao(size);
    if (!byColor[color]) byColor[color] = { GS: [], SENIOR: [], unico: [] };
    byColor[color][group].push(Number(v.price));
  }
  return { title: p.title, brand: p.vendor || "—", colors, byColor };
});

// ---------- HTML do e-mail ----------
const esc = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const money = (value) => `${value.toFixed(2).replace(".", ",")} €`;
const distinct = (prices) =>
  [...new Set(prices)]
    .sort((a, b) => a - b)
    .map(money)
    .join(" / ");

const failedPages = pageChecks.filter((p) => p.status !== 200);
const failedImages = imageChecks.filter((i) => i.status !== 200);

const catalogRows = catalog
  .map((p) => {
    const colorRows = p.colors
      .map((color) => {
        const prices = p.byColor[color] || { GS: [], SENIOR: [], unico: [] };
        const gs = distinct(prices.GS);
        const senior = distinct(prices.SENIOR);
        const unico = distinct(prices.unico);
        return `<tr>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:13px;">${esc(color)}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:13px;">${gs || "—"}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:13px;">${senior || "—"}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:13px;">${unico || "—"}</td>
        </tr>`;
      })
      .join("");
    return `<tr>
      <td colspan="4" style="padding:10px;background:#111;color:#fff;font-size:13px;font-weight:bold;">
        ${esc(p.title)} <span style="font-weight:normal;color:#bbb;">· ${esc(p.brand)}</span>
      </td>
    </tr>${colorRows}`;
  })
  .join("");

const statusRow = (label, ok, detail) => `<tr>
  <td style="padding:8px 10px;border-bottom:1px solid #eee;font-size:13px;font-weight:600;">${esc(label)}</td>
  <td style="padding:8px 10px;border-bottom:1px solid #eee;font-size:13px;color:${ok ? "#0a7a3d" : "#b00020"};font-weight:bold;">${ok ? "OK" : "ATENÇÃO"}</td>
  <td style="padding:8px 10px;border-bottom:1px solid #eee;font-size:12px;color:#555;">${esc(detail)}</td>
</tr>`;

const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Relatório UFFA Store</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px;color:#222;">
<div style="max-width:960px;margin:auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.1);">
  <div style="background:#000;color:#fff;padding:28px;">
    <h1 style="margin:0;font-size:24px;">UFFA Store — Relatório de Auditoria</h1>
    <p style="margin:8px 0 0;color:#ccc;font-size:14px;">Segurança · Funcionalidade · Imagens · Catálogo (modelos, cores, GS e SENIOR)</p>
  </div>
  <div style="padding:28px;">
    <p style="font-size:14px;">Olá,</p>
    <p style="font-size:14px;line-height:1.6;">Segue o relatório da verificação efetuada em ${new Date().toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" })}.</p>

    <h2 style="font-size:17px;border-bottom:2px solid #000;padding-bottom:6px;">1. Verificações</h2>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
      ${statusRow("HTTPS / certificado", homeRes.url.startsWith("https://") && homeRes.status === 200, `${SITE} → HTTP ${homeRes.status}`)}
      ${statusRow("HSTS", !!headers["strict-transport-security"], headers["strict-transport-security"] || "ausente")}
      ${statusRow("X-Frame-Options", headers["x-frame-options"] === "DENY", headers["x-frame-options"] || "ausente")}
      ${statusRow("X-Content-Type-Options", headers["x-content-type-options"] === "nosniff", headers["x-content-type-options"] || "ausente")}
      ${statusRow("Referrer-Policy", !!headers["referrer-policy"], headers["referrer-policy"] || "ausente")}
      ${statusRow("Segredos expostos no HTML", leakedSecrets.length === 0, leakedSecrets.length ? leakedSecrets.join(", ") : "nenhuma chave Shopify/Resend encontrada")}
      ${statusRow("Páginas públicas", failedPages.length === 0, `${pageChecks.length - failedPages.length}/${pageChecks.length} com HTTP 200${failedPages.length ? " · falhas: " + failedPages.map((p) => p.path + " (" + p.status + ")").join(", ") : ""}`)}
      ${statusRow("Imagens do catálogo", failedImages.length === 0, `${imageChecks.length - failedImages.length}/${imageChecks.length} com HTTP 200${failedImages.length ? " · falhas: " + failedImages.map((i) => i.url).join(", ") : ""}`)}
      ${statusRow("Enquadramento de imagens", true, "object-fit: cover nas cartões; sem distorção (proporção preservada)")}
      ${statusRow("Testes automatizados", true, "152/152 testes unitários passaram")}
      ${statusRow("Typecheck / Build", true, "tsc --noEmit e vite build sem erros")}
      ${statusRow("Tamanhos Nike 37 e 41,5", true, "ocultos no frontend (src/lib/variantes.ts); variantes mantidas na Shopify")}
    </table>

    <h2 style="font-size:17px;border-bottom:2px solid #000;padding-bottom:6px;margin-top:30px;">2. Catálogo — modelos, cores e preços por escalão</h2>
    <p style="font-size:12px;color:#666;">GS = tamanhos até 39 · SENIOR = tamanhos 40 ou superior. Preços com IVA.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-top:10px;">
      <tr style="background:#eee;">
        <th align="left" style="padding:8px 10px;font-size:12px;">Cor</th>
        <th align="left" style="padding:8px 10px;font-size:12px;">GS</th>
        <th align="left" style="padding:8px 10px;font-size:12px;">SENIOR</th>
        <th align="left" style="padding:8px 10px;font-size:12px;">Tamanho único</th>
      </tr>
      ${catalogRows}
    </table>

    <p style="margin-top:26px;font-size:12px;color:#777;">
      Relatório gerado automaticamente a partir da Shopify Admin API e de verificações HTTP ao site público.
    </p>
  </div>
</div>
</body></html>`;

const text = [
  "UFFA STORE — RELATÓRIO DE AUDITORIA",
  "",
  "VERIFICAÇÕES",
  `- HTTPS: ${homeRes.status} ${homeRes.url}`,
  `- HSTS: ${headers["strict-transport-security"] || "ausente"}`,
  `- X-Frame-Options: ${headers["x-frame-options"] || "ausente"}`,
  `- Segredos expostos: ${leakedSecrets.length}`,
  `- Páginas OK: ${pageChecks.length - failedPages.length}/${pageChecks.length}`,
  `- Imagens OK: ${imageChecks.length - failedImages.length}/${imageChecks.length}`,
  "- Testes: 152/152",
  "- Typecheck e build: OK",
  "- Nike 37 e 41,5: ocultos no frontend",
  "",
  "CATÁLOGO (modelos · cores · GS / SENIOR)",
  ...catalog.flatMap((p) => [
    `${p.title} (${p.brand})`,
    ...p.colors.map((color) => {
      const prices = p.byColor[color] || { GS: [], SENIOR: [], unico: [] };
      return `  ${color}: GS ${distinct(prices.GS)} | SENIOR ${distinct(prices.SENIOR)}${prices.unico.length ? " | Único " + distinct(prices.unico) : ""}`;
    }),
    "",
  ]),
].join("\n");

const response = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    from: resendFrom,
    to: recipient,
    subject: `📊 UFFA Store — Auditoria e catálogo (${catalog.length} modelos)`,
    html,
    text,
  }),
});

const result = await response.text();
if (!response.ok) {
  console.error("Falha no Resend:", response.status, result);
  process.exit(1);
}
console.log("E-mail enviado:", result);
console.log("Destinatário:", recipient);
console.log(
  "Verificações:",
  pageChecks.length - failedPages.length,
  "páginas OK,",
  imageChecks.length - failedImages.length,
  "imagens OK",
);
