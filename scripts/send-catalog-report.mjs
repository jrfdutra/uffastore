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
        options { name values }
        variants(first: 100) {
          nodes {
            price
            compareAtPrice
            inventoryQuantity
            selectedOptions { name value }
          }
        }
      }
    }
  }
`);

const products = data.products.nodes.map((p) => {
  const sizeOption = p.options.find((o) => /tamanho|size|escal/i.test(o.name));
  const sizes = [
    ...new Set(
      p.variants.nodes
        .map(
          (v) =>
            v.selectedOptions.find((o) => /tamanho|size|escal/i.test(o.name))?.value,
        )
        .filter(Boolean),
    ),
  ].sort((a, b) => Number.parseFloat(a) - Number.parseFloat(b));

  const prices = p.variants.nodes.map((v) => Number.parseFloat(v.price)).filter(Number.isFinite);
  const price = prices.length ? Math.min(...prices) : undefined;
  const saleVariant = p.variants.nodes
    .filter((v) => v.compareAtPrice && Number.parseFloat(v.compareAtPrice) !== Number.parseFloat(v.price))
    .sort((a, b) => Number.parseFloat(a.price) - Number.parseFloat(b.price))[0];
  const compareAt = saleVariant ? Number.parseFloat(saleVariant.compareAtPrice) : undefined;

  const stock = p.variants.nodes.reduce((sum, v) => sum + (v.inventoryQuantity ?? 0), 0);
  const hasBlackFriday = p.tags.some((tag) => /black\s*friday|blackfriday/i.test(tag));

  const categories = [
    p.productType?.trim() || "Sem categoria",
    ...(hasBlackFriday ? ["Promoções - Black Friday"] : []),
  ];

  return {
    title: p.title,
    brand: p.vendor?.trim() || "Sem marca",
    categories,
    tags: p.tags,
    sizes,
    hasSizeOption: Boolean(sizeOption),
    variants: p.variants.nodes.length,
    stock,
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

const totalVariants = products.reduce((sum, p) => sum + p.variants, 0);
const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
const totalSizes = new Set(products.flatMap((p) => p.sizes)).size;

// ---------- HTML ----------
const brandSections = brands
  .map(([brand, list]) => {
    const brandStock = list.reduce((sum, p) => sum + p.stock, 0);
    const rows = list
      .map((p) => {
        const sizes = p.sizes.length ? p.sizes.join(" · ") : "— (sem opção de tamanho)";
        const price = p.price !== undefined ? money(p.price) : "—";
        const compare =
          p.compareAt !== undefined && p.compareAt !== p.price ? money(p.compareAt) : "";
        return `
          <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #eee;font-weight:600;color:#111;">${escapeHtml(p.title)}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #eee;color:#444;">${escapeHtml(p.categories.join(" · "))}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #eee;color:#111;font-family:Consolas,monospace;font-size:13px;">${escapeHtml(sizes)}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:center;color:#444;">${p.variants}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;">
              ${compare ? `<span style="text-decoration:line-through;color:#999;font-size:12px;">${compare}</span><br>` : ""}
              <strong>${price}</strong>
            </td>
          </tr>`;
      })
      .join("");

    return `
      <tr>
        <td colspan="5" style="padding:14px 12px;background:#111;color:#fff;font-size:15px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">
          ${escapeHtml(brand)}
          <span style="float:right;font-weight:normal;font-size:13px;color:#bbb;">${list.length} produto${list.length === 1 ? "" : "s"} · ${brandStock} pares em stock</span>
        </td>
      </tr>
      ${rows}`;
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
  <title>Catálogo UFFA — Revisão de tamanhos</title>
</head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px;color:#333;">
  <div style="max-width:980px;margin:auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 4px 10px rgba(0,0,0,0.1);">
    <div style="background:#000;color:#fff;padding:30px;text-align:center;">
      <h1 style="margin:0;font-size:26px;">📋 Catálogo UFFA Store</h1>
      <p style="margin:10px 0 0;font-size:15px;color:#ccc;">Produtos por marca, categorias e tamanhos — para revisão dos números</p>
    </div>

    <div style="padding:30px;">
      <p style="font-size:15px;line-height:1.6;">Olá,</p>
      <p style="font-size:15px;line-height:1.6;">
        Segue o estado atual do catálogo publicado no site. Os produtos estão agrupados por marca,
        com a categoria, os tamanhos disponíveis e o stock. Serve para fazermos a revisão dos números dos calçados.
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
        <div style="flex:1;min-width:150px;border:2px solid #000;padding:14px;text-align:center;">
          <div style="font-size:28px;font-weight:bold;">${totalVariants}</div>
          <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#666;">Variantes</div>
        </div>
        <div style="flex:1;min-width:150px;border:2px solid #000;padding:14px;text-align:center;">
          <div style="font-size:28px;font-weight:bold;">${totalStock}</div>
          <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#666;">Pares em stock</div>
        </div>
      </div>

      <h2 style="border-bottom:2px solid #000;padding-bottom:8px;margin-top:30px;font-size:18px;">Produtos por marca</h2>
      <ul style="font-size:14px;line-height:1.7;padding-left:18px;">
        ${brandSummary}
      </ul>

      <h2 style="border-bottom:2px solid #000;padding-bottom:8px;margin-top:34px;font-size:18px;">Detalhe do catálogo</h2>
      <table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:14px;">
        <thead>
          <tr style="background:#f8f8f8;text-align:left;border-bottom:2px solid #ddd;">
            <th style="padding:10px 12px;">Produto</th>
            <th style="padding:10px 12px;">Categoria</th>
            <th style="padding:10px 12px;">Tamanhos (EU)</th>
            <th style="padding:10px 12px;text-align:center;">Var.</th>
            <th style="padding:10px 12px;text-align:right;">Preço</th>
          </tr>
        </thead>
        <tbody>
          ${brandSections}
        </tbody>
      </table>

      <div style="margin-top:34px;padding:15px;background:#fff9e6;border-left:4px solid #ffb900;font-size:13px;line-height:1.6;border-radius:4px;">
        <strong>Revisão dos números:</strong> cada variante tem 20 pares em stock. Confirma na coluna
        <em>Tamanhos (EU)</em> se os números de cada modelo estão corretos. Total de tamanhos distintos no catálogo: <strong>${totalSizes}</strong>.
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
  "CATÁLOGO UFFA STORE — PRODUTOS POR MARCA",
  "",
  `Produtos: ${products.length} | Marcas: ${brands.length} | Variantes: ${totalVariants} | Pares em stock: ${totalStock}`,
  "",
];
for (const [brand, list] of brands) {
  textLines.push(`=== ${brand.toUpperCase()} (${list.length}) ===`);
  for (const p of list) {
    const sizes = p.sizes.length ? p.sizes.join(", ") : "sem tamanho";
    const price = p.price !== undefined ? money(p.price) : "—";
    const compare = p.compareAt !== undefined && p.compareAt !== p.price ? ` (antes ${money(p.compareAt)})` : "";
    textLines.push(`- ${p.title}`);
    textLines.push(`  Categoria: ${p.categories.join(" · ")}`);
    textLines.push(`  Tamanhos: ${sizes}`);
    textLines.push(`  Variantes: ${p.variants} | Stock: ${p.stock} | Preço: ${price}${compare}`);
  }
  textLines.push("");
}

console.log(`Produtos: ${products.length} | Marcas: ${brands.length} | Variantes: ${totalVariants}`);
for (const [brand, list] of brands) console.log(`- ${brand}: ${list.length}`);

if (DRY) {
  console.log("\n--- ENSAIO (não enviado) ---");
  for (const [brand, list] of brands) {
    console.log(`\n${brand} (${list.length})`);
    for (const p of list) {
      console.log(
        `  • ${p.title} | ${p.categories.join(" · ")} | ${p.sizes.join(", ") || "sem tamanho"} | ${p.variants} var. | ${p.stock} pares | ${p.price !== undefined ? money(p.price) : "—"}${p.compareAt ? ` (antes ${money(p.compareAt)})` : ""}`,
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
    subject: `📋 Catálogo UFFA — ${products.length} produtos por marca, categorias e tamanhos`,
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
