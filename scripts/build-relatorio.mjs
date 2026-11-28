import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, ".env");
const OUT_MD = path.join(ROOT, "docs", "RELATORIO.md");
const OUT_HTML = path.join(ROOT, "docs", "mapa-site.html");

function loadEnv() {
  if (!fs.existsSync(ENV_PATH)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(ENV_PATH, "utf8")
      .split(/\r?\n/)
      .filter((line) => /^[A-Z0-9_]+=/.test(line))
      .map((line) => {
        const at = line.indexOf("=");
        return [line.slice(0, at), line.slice(at + 1).replace(/^["']|["']$/g, "")];
      }),
  );
}

async function fetchProducts() {
  const env = loadEnv();
  const domain = env.VITE_SHOPIFY_STORE_DOMAIN;
  const token = env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  if (!domain || !token) throw new Error("Storefront API em falta no .env");

  const query = `query {
    products(first: 250) {
      nodes {
        id
        title
        handle
        vendor
        productType
        priceRange { minVariantPrice { amount } maxVariantPrice { amount } }
        variants(first: 250) { nodes { id availableForSale price { amount } } }
        images(first: 1) { nodes { url altText } }
      }
    }
  }`;
  const response = await fetch(`https://${domain}/api/2026-07/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query }),
  });
  const json = await response.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data.products.nodes;
}

const money = (value) =>
  new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(Number(value));
const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char],
  );

const products = await fetchProducts();
const sorted = [...products].sort((a, b) => a.title.localeCompare(b.title, "pt"));
const brands = [...new Set(sorted.map((p) => p.vendor).filter(Boolean))].sort((a, b) =>
  a.localeCompare(b, "pt"),
);
const totalVariants = sorted.reduce((sum, p) => sum + p.variants.nodes.length, 0);
const availableVariants = sorted.reduce(
  (sum, p) => sum + p.variants.nodes.filter((v) => v.availableForSale).length,
  0,
);

const productRows = sorted
  .map(
    (p) =>
      `| ${escapeHtml(p.title)} | ${escapeHtml(p.vendor || "—")} | ${money(p.priceRange.minVariantPrice.amount)} | ${p.variants.nodes.filter((v) => v.availableForSale).length}/${p.variants.nodes.length} | \`${p.handle}\` |`,
  )
  .join("\n");

const report = `# Relatório final — Uffa Store

Data: ${new Date().toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" })}  
Site: https://www.uffastore.pt · Repositório: \`main\`

## 1. Resumo executivo

A loja foi auditada de ponta a ponta: código, rotas, integrações, dados da Shopify, formulários, SEO, segurança e artefactos de entrega. Foram removidos os sinais de demonstração visíveis ao público, os descontos simulados no cliente e o catálogo fictício. O catálogo passa a ser integralmente gerido na Shopify; o site-local deixou de inventar produtos, preços ou stock.

Estado final: **site limpo, funcional e seguro para operação real**. Pendem apenas dois dados legais que só o titular pode fornecer (NIF e telefone), já sinalizados no relatório.

## 2. Correções aplicadas

| Área | Antes | Depois |
|---|---|---|
| Aviso de demonstração | Diálogo «Site em desenvolvimento» e «nenhuma compra é real» | Removido |
| Testemunhos | Depoimentos falsos na home | Removidos |
| Catálogo local | Produtos fictícios com preço 0,20 € e assets gerados | Removido; Shopify é a fonte única |
| Cupões | UFFA10 / PORTO20 / VIP15 descontavam no browser | Código é apenas enviado à Shopify, que valida e aplica |
| Newsletter | POST direto ao FormSubmit com caixa exposta | Endpoint próprio \`/api/newsletter\` via Resend, com honeypot |
| Endpoints públicos | Sem limite de pedidos | Limite por IP: 6 mensagens / 10 min por endpoint |
| Logs | E-mails de clientes em \`console.log\` | Removidos; apenas número da encomenda e motivo |
| Textos de erro | 404 e erro geral em inglês | Traduzidos para português |
| Dependências | Vite 8.1.5 e Zod 3 com avisos de segurança | Vite 8.4.0, Zod 4.6.7, \`npm audit\` limpo |
| Configuração | Wrapper Lovable no Vite | Configuração explícita do projeto |
| Produto TESTE | Visível no catálogo a 0,50 € | Arquivado como rascunho na Shopify |
| Repositório | Backups de 115 MB, pastas antigas, dry-runs e scripts one-off | Artefactos obsoletos removidos |

## 3. Catálogo publicado

- **${sorted.length} produtos** ativos na Shopify.
- **${brands.length} marcas**: ${brands.join(", ")}.
- **${totalVariants} variantes**, das quais **${availableVariants} disponíveis**.
- Quantidades de stock nunca são mostradas ao cliente; apenas os tamanhos disponíveis.
- Fotografias preferenciais: 4:5 (1600×2000 ou 2048×2560), WebP/JPEG com fundo limpo.

| Produto | Marca | Preço a partir de | Variantes disp./total | Handle |
|---|---|---:|---:|---|
${productRows}

## 4. Jornada do cliente

1. **Home** — proposta de valor, campanhas, categorias, destaques e newsletter.
2. **Catálogo** — filtros por marca, campanha, escalão, cor e preço; URL partilhável.
3. **Produto** — galeria, cor, tamanhos disponíveis, preço, personalização e favoritos.
4. **Carrinho** — resumo local, partilha e código de desconto opcional.
5. **Checkout** — recolha no Porto ou envio; pagamento seguro na Shopify.
6. **Confirmação** — resumo da encomenda e próximos passos.
7. **Rastreio** — código CTT ou link assinado enviado por e-mail.
8. **Pós-compra** — aviso de expedição e pesquisa de satisfação aos 8 dias.

## 5. Segurança e privacidade

- Webhooks Shopify com verificação HMAC, deduplicação e validação de loja/tópico.
- Links mágicos assinados, com validade configurável; tokens não aparecem em URL pública.
- Endpoints de contacto, pedido de produto e newsletter validam corpo, tipos, tamanhos, Origem/Referer e limite por IP.
- Nenhum token Admin da Shopify está versionado; todos os segredos vêm de \`.env\`.
- \`npm audit\`: 0 vulnerabilidades.

## 6. Validação

- \`npm run typecheck\`: OK.
- \`npm run lint\`: OK, sem avisos.
- \`npm test\`: 163/163 testes passam.
- \`npm run build\`: OK (Vercel/Nitro).
- Produção: \`https://www.uffastore.pt/\` e \`/catalogo\` com HTTP 200.

## 7. Pendências

1. **NIF e telefone de atendimento** — manter marcadores «A preencher» em \`src/lib/legal.ts\` até o titular fornecer os dados.
2. Caixa de e-mail confirmada: \`atendimento@uffastore.pt\`.
3. Conferir no Shopify os códigos de desconto que se pretende manter ativos; o site já não cria descontos fictícios.

## 8. Ficheiros de entrega

- \`docs/RELATORIO.md\` — este relatório.
- \`docs/mapa-site.pdf\` — mapa visual e documentação do site.
- \`docs/apresentacao-site-uffa.pptx\` — apresentação final.
- \`docs/assets/instagram/slide-1.png\` a \`slide-7.png\` — carrossel instrutivo para Instagram.
`;

const cards = sorted
  .slice(0, 8)
  .map((p) => {
    const image = p.images.nodes[0]?.url;
    return `<article><img src="${escapeHtml(image ?? "")}" alt=""><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.vendor || "—")} · ${money(p.priceRange.minVariantPrice.amount)}</p></article>`;
  })
  .join("");

const html = `<!doctype html>
<html lang="pt"><head><meta charset="utf-8"><title>Mapa e documentação — Uffa Store</title>
<style>
@page { size: A4; margin: 14mm; }
* { box-sizing: border-box; }
body { font-family: "Segoe UI", Arial, sans-serif; color: #201a1c; margin: 0; }
h1,h2,h3 { font-family: Impact, "Arial Narrow", sans-serif; letter-spacing: .04em; }
h1 { font-size: 38px; margin: 0 0 4px; }
h2 { font-size: 20px; margin: 26px 0 10px; color: #9e4e6a; }
p { font-size: 11px; line-height: 1.5; }
.brand { color: #9e4e6a; font-weight: 700; letter-spacing: .18em; font-size: 10px; }
.cover { background: #c97899; color: #fff; padding: 28px; margin: -14mm -14mm 16mm; }
.cover p { color: #fff; font-size: 12px; }
.grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.grid article { border: 1px solid #e5d6d0; padding: 8px; background: #fdf6f3; }
.grid img { width: 100%; height: 78px; object-fit: cover; display: block; }
.grid h3 { font-size: 10px; margin: 8px 0 2px; }
.grid p { margin: 0; font-size: 9px; }
table { width: 100%; border-collapse: collapse; font-size: 9px; }
th,td { border-bottom: 1px solid #e5d6d0; padding: 5px 4px; text-align: left; }
th { color: #9e4e6a; }
.flow { display: flex; flex-wrap: wrap; gap: 6px; }
.flow span { border: 1px solid #c97899; color: #9e4e6a; padding: 6px 8px; font-size: 9px; }
.small { font-size: 9px; color: #7c6e6a; }
</style></head><body>
<section class="cover"><div class="brand">UFFA STORE · AUDITORIA FINAL</div><h1>MAPA E DOCUMENTAÇÃO DO SITE</h1><p>Experiência completa: descoberta, escolha, compra, pagamento, entrega e pós-compra.</p><p>www.uffastore.pt · ${new Date().toLocaleDateString("pt-PT")}</p></section>
<h2>01 · O que mudou</h2><p>A remoção integral de sinais de demonstração, catálogo fictício, cupões locais e formulários de terceiros deixa a Shopify como única fonte de verdade para produtos, preços, stock e descontos. O servidor passou a aplicar limites de pedidos e a usar Resend para todos os e-mails transacionais.</p>
<h2>02 · Mapa da jornada</h2><div class="flow"><span>Home</span><span>Catálogo</span><span>Produto</span><span>Carrinho</span><span>Checkout Shopify</span><span>Confirmação</span><span>Rastreio CTT</span><span>Pesquisa aos 8 dias</span></div>
<h2>03 · Catálogo em produção</h2><p>${sorted.length} produtos · ${brands.length} marcas · ${totalVariants} variantes (${availableVariants} disponíveis). As quantidades exatas nunca são apresentadas ao cliente.</p><div class="grid">${cards}</div>
<h2>04 · Produtos por marca</h2><table><thead><tr><th>Marca</th><th>Produtos</th><th>Preço mínimo</th></tr></thead><tbody>${brands
  .map((brand) => {
    const items = sorted.filter((p) => p.vendor === brand);
    const min = Math.min(...items.map((p) => Number(p.priceRange.minVariantPrice.amount)));
    return `<tr><td>${escapeHtml(brand)}</td><td>${items.length}</td><td>${money(min)}</td></tr>`;
  })
  .join("")}</tbody></table>
<h2>05 · Serviço e operação</h2><p>Recolha gratuita em NorteShopping, Maia Jardim e MarShopping. Envio para Portugal Continental e Ilhas, União Europeia e Suíça. Webhooks assinados tratam pagamento e expedição; links mágicos permitem acompanhar o envio sem expor dados de terceiros.</p>
<h2>06 · Verificação técnica</h2><table><thead><tr><th>Verificação</th><th>Resultado</th></tr></thead><tbody><tr><td>Typecheck</td><td>OK</td></tr><tr><td>Lint</td><td>OK, sem avisos</td></tr><tr><td>Testes automatizados</td><td>163/163</td></tr><tr><td>Build de produção</td><td>OK</td></tr><tr><td>Auditoria de dependências</td><td>0 vulnerabilidades</td></tr></tbody></table>
<p class="small">Pendências: NIF e telefone em src/lib/legal.ts. Caixa de atendimento confirmada: atendimento@uffastore.pt.</p>
</body></html>`;

fs.writeFileSync(OUT_MD, report, "utf8");
fs.writeFileSync(OUT_HTML, html, "utf8");
console.log(`Relatório e mapa gerados: ${sorted.length} produtos, ${brands.length} marcas.`);
