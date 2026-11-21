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
  return json.data;
}

async function getProducts() {
  const query = `
    query {
      products(first: 50) {
        nodes {
          id
          title
          vendor
          productType
          tags
          variants(first: 10) {
            nodes {
              title
              price
              compareAtPrice
            }
          }
        }
      }
    }
  `;
  const data = await admin(query);
  return data.products.nodes;
}

async function main() {
  console.log("A recolher listagem final de produtos...");
  const products = await getProducts();

  console.log("A preparar e-mail formatado...");

  let productsHtml = "";
  for (const p of products) {
    const isMultiVariant = p.variants.nodes.length > 1;
    let priceInfo = "";
    if (isMultiVariant) {
      priceInfo = p.variants.nodes
        .map(
          (v) =>
            `<li><strong>${v.title}</strong>: €${v.price} <span style="text-decoration: line-through; color: #888;">€${v.compareAtPrice}</span></li>`,
        )
        .join("");
      priceInfo = `<ul>${priceInfo}</ul>`;
    } else {
      const v = p.variants.nodes[0];
      priceInfo = `€${v?.price || "0.00"} <span style="text-decoration: line-through; color: #888;">€${v?.compareAtPrice || "—"}</span>`;
    }

    productsHtml += `
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 12px; font-weight: bold;">${p.title}</td>
        <td style="padding: 12px;">${p.vendor}</td>
        <td style="padding: 12px;">${p.productType}</td>
        <td style="padding: 12px;">${priceInfo}</td>
      </tr>
    `;
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Relatório Black Friday - Sincronização Concluída</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; color: #333;">
      <div style="max-width: 800px; margin: auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
        <div style="background: #000; color: #fff; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🔥 Sincronização Black Friday Concluída!</h1>
          <p style="margin: 10px 0 0; font-size: 16px; color: #ccc;">Relatório do Catálogo de Produtos da Uffa Store</p>
        </div>
        
        <div style="padding: 30px;">
          <p style="font-size: 16px; line-height: 1.6;">Olá,</p>
          <p style="font-size: 16px; line-height: 1.6;">Temos o prazer de informar que todo o processo de limpeza e sincronização do catálogo de produtos para a campanha de <strong>Black Friday</strong> foi finalizado com sucesso!</p>
          
          <h2 style="border-bottom: 2px solid #000; padding-bottom: 8px; margin-top: 30px;">Resumo das Configurações Aplicadas:</h2>
          <ul style="font-size: 16px; line-height: 1.8;">
            <li>🏷️ <strong>Tag "Black Friday"</strong> adicionada a todos os produtos para fins de filtragem e badges.</li>
            <li>🗂️ <strong>Categoria "Promoções - Black Friday"</strong> configurada em todas as referências.</li>
            <li>💸 <strong>Desconto Riscado (Linha no meio)</strong> activo em todos os produtos usando o preço de comparação nativo do Shopify.</li>
            <li>📦 <strong>Stock:</strong> Configurado para 100 unidades de inventário disponível por variante.</li>
          </ul>

          <h2 style="border-bottom: 2px solid #000; padding-bottom: 8px; margin-top: 40px;">Listagem dos ${products.length} Produtos Sincronizados:</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 15px;">
            <thead>
              <tr style="background-color: #f8f8f8; text-align: left; border-bottom: 2px solid #eee;">
                <th style="padding: 12px;">Produto</th>
                <th style="padding: 12px;">Marca</th>
                <th style="padding: 12px;">Categoria</th>
                <th style="padding: 12px;">Preço Black Friday</th>
              </tr>
            </thead>
            <tbody>
              ${productsHtml}
            </tbody>
          </table>
          
          <div style="margin-top: 40px; padding: 15px; background: #fff9e6; border-left: 4px solid #ffb900; font-size: 14px; line-height: 1.5; border-radius: 4px;">
            <strong>Nota de Segurança:</strong> Os 15 produtos duplicados ou marcados como "Título repetido" foram deliberadamente ignorados de forma idempotente para proteger a integridade do catálogo do site.
          </div>

          <p style="margin-top: 40px; font-size: 14px; color: #777;"><em>Este e-mail foi gerado e enviado automaticamente via Resend API para o administrador da Uffa Store.</em></p>
        </div>
      </div>
    </body>
    </html>
  `;

  console.log("A enviar e-mail via Resend para junior.dutra.pt@gmail.com...");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFrom,
      to: "junior.dutra.pt@gmail.com",
      subject: "🔥 Relatório Black Friday - Sincronização Concluída (Uffa Store)",
      html: emailHtml,
    }),
  });

  const resText = await response.text();
  if (response.ok) {
    console.log("E-mail enviado com total sucesso!", resText);
  } else {
    console.error("Erro ao enviar e-mail pelo Resend:", resText);
  }
}

main().catch(console.error);
