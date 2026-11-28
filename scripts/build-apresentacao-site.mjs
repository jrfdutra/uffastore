import pptxgen from "pptxgenjs";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "docs", "apresentacao-site-uffa.pptx");
const SHOTS = path.join(ROOT, "docs", "assets", "screenshots");

const C = {
  ink: "0E0E0E",
  cream: "FDF6F3",
  white: "FFFFFF",
  pink: "C97899",
  pinkDark: "9E4E6A",
  pinkSoft: "F4E2E9",
  muted: "7C6E6A",
  line: "E5D6D0",
  green: "0F9D76",
};
const FONT = "Segoe UI";
const DISPLAY = "Impact";

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "UFFA Store";
pptx.company = "UFFA Store";
pptx.subject = "Auditoria final e apresentação do site";
pptx.title = "UFFA Store — Apresentação final";
pptx.lang = "pt-PT";

const shot = (name) => path.join(SHOTS, name);
const exists = (name) => fs.existsSync(shot(name));

function base(title, eyebrow) {
  const slide = pptx.addSlide();
  slide.background = { color: C.cream };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 0.16,
    h: 7.5,
    fill: { color: C.pink },
    line: { color: C.pink, transparency: 100 },
  });
  slide.addText(eyebrow.toUpperCase(), {
    x: 0.7,
    y: 0.35,
    w: 11.8,
    h: 0.25,
    fontSize: 9,
    bold: true,
    color: C.pinkDark,
    charSpacing: 3,
    fontFace: FONT,
  });
  slide.addText(title, {
    x: 0.7,
    y: 0.7,
    w: 11.9,
    h: 0.75,
    fontSize: 30,
    bold: true,
    color: C.ink,
    fontFace: DISPLAY,
    charSpacing: 1,
  });
  slide.addShape(pptx.ShapeType.line, {
    x: 0.7,
    y: 1.5,
    w: 11.9,
    h: 0,
    line: { color: C.line, width: 1 },
  });
  return slide;
}

function bullets(slide, items, x, y, w, h, size = 13) {
  slide.addText(
    items.map((item, i) => ({
      text: item,
      options: { bullet: { code: "2022" }, breakLine: i < items.length - 1 },
    })),
    { x, y, w, h, fontSize: size, color: C.ink, fontFace: FONT, paraSpaceAfter: 8, margin: 0 },
  );
}

function picture(slide, name, x, y, w, h, caption) {
  if (!exists(name)) return;
  slide.addImage({
    path: shot(name),
    x,
    y,
    w,
    h,
    sizing: { type: "cover", w, h },
  });
  if (caption) {
    slide.addText(caption.toUpperCase(), {
      x,
      y: y + h + 0.08,
      w,
      h: 0.2,
      fontSize: 8,
      color: C.muted,
      charSpacing: 2,
      fontFace: FONT,
    });
  }
}

function stat(slide, value, label, x) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y: 1.85,
    w: 2.65,
    h: 1.35,
    rectRadius: 0.05,
    fill: { color: C.white },
    line: { color: C.line, width: 1 },
  });
  slide.addText(value, {
    x,
    y: 2.02,
    w: 2.65,
    h: 0.65,
    align: "center",
    fontSize: 32,
    bold: true,
    color: C.pinkDark,
    fontFace: DISPLAY,
  });
  slide.addText(label, {
    x,
    y: 2.72,
    w: 2.65,
    h: 0.3,
    align: "center",
    fontSize: 9,
    color: C.muted,
    fontFace: FONT,
  });
}

/* 01 — Capa */
{
  const slide = pptx.addSlide();
  slide.background = { color: C.cream };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 6.2,
    h: 7.5,
    fill: { color: C.pink },
    line: { color: C.pink, transparency: 100 },
  });
  slide.addText("UFFA STORE", {
    x: 0.8,
    y: 0.75,
    w: 4.8,
    h: 0.4,
    fontSize: 13,
    bold: true,
    color: C.white,
    charSpacing: 5,
    fontFace: FONT,
  });
  slide.addText("SITE LIMPO,\nPRONTO PARA\nVENDER.", {
    x: 0.8,
    y: 1.7,
    w: 5.0,
    h: 2.7,
    fontSize: 44,
    bold: true,
    color: C.white,
    fontFace: DISPLAY,
    breakLine: false,
  });
  slide.addText("Auditoria completa · Catálogo real · Compra segura", {
    x: 0.8,
    y: 4.75,
    w: 5.0,
    h: 0.5,
    fontSize: 13,
    color: C.white,
    fontFace: FONT,
  });
  slide.addText("28 de novembro de 2026", {
    x: 0.8,
    y: 6.65,
    w: 4.8,
    h: 0.3,
    fontSize: 10,
    color: C.white,
    fontFace: FONT,
  });
  picture(slide, "23-home-hero.png", 6.55, 0.6, 6.0, 6.2);
}

/* 02 — Números */
{
  const slide = base("Uma loja real, não uma demonstração", "Resumo executivo");
  stat(slide, "30", "produtos ativos", 0.7);
  stat(slide, "5", "marcas", 3.55);
  stat(slide, "791", "variantes", 6.4);
  stat(slide, "324", "variantes disponíveis", 9.25);
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.7,
    y: 3.65,
    w: 11.9,
    h: 2.7,
    rectRadius: 0.05,
    fill: { color: C.white },
    line: { color: C.line, width: 1 },
  });
  bullets(
    slide,
    [
      "Shopify é a única fonte de verdade para produtos, preços, stock e descontos.",
      "O catálogo local, os testemunhos, o aviso de demo e os cupões simulados foram removidos.",
      "Todos os e-mails passam pelo servidor com validação, Origem/Referer, limite de pedidos e Resend.",
      "Build, tipos, lint e 163 testes passam; auditoria de dependências sem vulnerabilidades.",
    ],
    1.05,
    4.0,
    11.2,
    2.0,
    13,
  );
}

/* 03 — Mapa */
{
  const slide = base("Mapa da jornada", "Experiência de ponta a ponta");
  const steps = [
    "Home",
    "Catálogo",
    "Produto",
    "Carrinho",
    "Checkout Shopify",
    "Confirmação",
    "Rastreio CTT",
    "Pós-compra",
  ];
  steps.forEach((step, i) => {
    const x = 0.7 + (i % 4) * 3.05;
    const y = 1.9 + Math.floor(i / 4) * 2.15;
    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y,
      w: 2.75,
      h: 1.45,
      rectRadius: 0.06,
      fill: { color: i === 4 ? C.pinkDark : C.white },
      line: { color: C.line, width: 1 },
    });
    slide.addText(String(i + 1).padStart(2, "0"), {
      x: x + 0.18,
      y: y + 0.15,
      w: 0.6,
      h: 0.25,
      fontSize: 9,
      bold: true,
      color: i === 4 ? C.white : C.pinkDark,
      fontFace: FONT,
    });
    slide.addText(step, {
      x: x + 0.18,
      y: y + 0.55,
      w: 2.4,
      h: 0.5,
      fontSize: 15,
      bold: true,
      color: i === 4 ? C.white : C.ink,
      fontFace: DISPLAY,
    });
  });
  slide.addText(
    "O único salto fora do domínio é o pagamento, feito no checkout seguro da Shopify.",
    { x: 0.7, y: 6.45, w: 11.9, h: 0.35, fontSize: 11, color: C.muted, fontFace: FONT },
  );
}

/* 04 — Antes/depois */
{
  const slide = base("O que foi limpo", "Sinais de vibecode removidos");
  const rows = [
    ["Diálogo «Site em desenvolvimento»", "Removido da raiz do site"],
    ["Testemunhos falsos", "Removidos da home"],
    ["Catálogo fictício e preço 0,20 €", "Shopify como fonte única"],
    ["Cupões UFFA10 / PORTO20 / VIP15", "Descontos validados apenas na Shopify"],
    ["Newsletter via FormSubmit", "Endpoint próprio com Resend e honeypot"],
    ["Produto TESTE a 0,50 €", "Arquivado como rascunho"],
    ["Wrapper Lovable e assets órfãos", "Configuração explícita e árvore limpa"],
  ];
  slide.addTable(rows, {
    x: 0.7,
    y: 1.85,
    w: 11.9,
    h: 4.6,
    colW: [5.6, 6.3],
    fontSize: 12,
    fontFace: FONT,
    color: C.ink,
    border: { type: "solid", color: C.line, pt: 1 },
    fill: { color: C.white },
    rowH: 0.6,
    margin: 0.12,
  });
}

/* 05 — Catálogo */
{
  const slide = base("Descoberta com filtros reais", "Catálogo");
  picture(slide, "03-catalogo.png", 0.7, 1.8, 6.0, 4.75);
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 7.05,
    y: 1.8,
    w: 5.55,
    h: 4.75,
    rectRadius: 0.05,
    fill: { color: C.white },
    line: { color: C.line, width: 1 },
  });
  bullets(
    slide,
    [
      "Filtros combináveis por marca, campanha, escalão, cor e preço.",
      "URL partilhável: o filtro sobrevive ao back do browser.",
      "Nike, Adidas, Puma, New Balance e Vans.",
      "Apenas tamanhos disponíveis; nunca quantidades de stock.",
      "Fotografias preferenciais em 4:5, com fundo limpo.",
    ],
    7.45,
    2.15,
    4.75,
    4.0,
    13,
  );
}

/* 06 — Produto e carrinho */
{
  const slide = base("Escolha curta, sem ambiguidade", "Produto e carrinho");
  picture(slide, "04-produto.png", 0.7, 1.8, 6.0, 4.75, "Produto");
  picture(slide, "22-cart-drawer.png", 7.0, 1.8, 5.6, 4.75, "Carrinho lateral");
}

/* 07 — Checkout e confirmação */
{
  const slide = base("Checkout seguro, confirmação clara", "Compra");
  picture(slide, "05-checkout.png", 0.7, 1.8, 6.0, 4.75, "Entrega e pagamento");
  picture(slide, "06-confirmacao.png", 7.0, 1.8, 5.6, 4.75, "Confirmação");
}

/* 08 — Pós-compra */
{
  const slide = base("O par não desaparece depois do checkout", "Pós-compra");
  picture(slide, "09-rastreio-topo.png", 0.7, 1.8, 6.0, 4.75, "Rastreio");
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 7.05,
    y: 1.8,
    w: 5.55,
    h: 4.75,
    rectRadius: 0.05,
    fill: { color: C.white },
    line: { color: C.line, width: 1 },
  });
  bullets(
    slide,
    [
      "Código CTT abre diretamente a pesquisa oficial.",
      "Link assinado por e-mail mostra transportador e previsão.",
      "Webhooks orders/paid e orders/fulfilled com HMAC e deduplicação.",
      "Pesquisa de satisfação aos 8 dias, guardada como metafields.",
    ],
    7.45,
    2.2,
    4.75,
    3.8,
    13,
  );
}

/* 09 — Segurança */
{
  const slide = base("Segurança por desenho", "Servidor e dados");
  const items = [
    ["Webhooks", "HMAC, loja e tópico validados"],
    ["Links", "Assinados, com validade e sem dados sensíveis"],
    ["Formulários", "Limite de corpo, honeypot e rate limit por IP"],
    ["E-mails", "Resend no servidor; sem PII nos logs"],
    ["Segredos", "Apenas em .env; nenhum token versionado"],
    ["Dependências", "Vite 8.4.0, Zod 4.6.7, npm audit limpo"],
  ];
  items.forEach(([label, text], i) => {
    const x = 0.7 + (i % 2) * 6.05;
    const y = 1.9 + Math.floor(i / 2) * 1.65;
    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y,
      w: 5.85,
      h: 1.35,
      rectRadius: 0.05,
      fill: { color: C.white },
      line: { color: C.line, width: 1 },
    });
    slide.addText(label.toUpperCase(), {
      x: x + 0.2,
      y: y + 0.15,
      w: 5.45,
      h: 0.25,
      fontSize: 9,
      bold: true,
      color: C.pinkDark,
      charSpacing: 2,
      fontFace: FONT,
    });
    slide.addText(text, {
      x: x + 0.2,
      y: y + 0.5,
      w: 5.45,
      h: 0.6,
      fontSize: 12,
      color: C.ink,
      fontFace: FONT,
    });
  });
}

/* 10 — Validação e pendências */
{
  const slide = base("Validação e próximos passos", "Encerramento");
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.7,
    y: 1.85,
    w: 5.85,
    h: 4.4,
    rectRadius: 0.05,
    fill: { color: C.white },
    line: { color: C.line, width: 1 },
  });
  slide.addText("VALIDADO", {
    x: 1.0,
    y: 2.1,
    w: 5.2,
    h: 0.3,
    fontSize: 10,
    bold: true,
    color: C.green,
    charSpacing: 3,
    fontFace: FONT,
  });
  bullets(
    slide,
    [
      "Typecheck",
      "Lint sem avisos",
      "163/163 testes",
      "Build de produção",
      "npm audit: 0 falhas",
      "Home e catálogo em produção: HTTP 200",
    ],
    1.0,
    2.6,
    5.2,
    3.3,
    13,
  );
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 6.8,
    y: 1.85,
    w: 5.8,
    h: 4.4,
    rectRadius: 0.05,
    fill: { color: C.pinkSoft },
    line: { color: C.pink, width: 1 },
  });
  slide.addText("PENDENTE", {
    x: 7.1,
    y: 2.1,
    w: 5.2,
    h: 0.3,
    fontSize: 10,
    bold: true,
    color: C.pinkDark,
    charSpacing: 3,
    fontFace: FONT,
  });
  bullets(
    slide,
    [
      "NIF e telefone em src/lib/legal.ts",
      "Caixa confirmada: atendimento@uffastore.pt",
      "Confirmar códigos de desconto ativos na Shopify",
    ],
    7.1,
    2.6,
    5.2,
    3.3,
    13,
  );
  slide.addText("UFFA Store · Porto · www.uffastore.pt", {
    x: 0.7,
    y: 6.55,
    w: 11.9,
    h: 0.3,
    align: "center",
    fontSize: 10,
    color: C.muted,
    fontFace: FONT,
  });
}

await pptx.writeFile({ fileName: OUT });
console.log(`Apresentação gerada: ${OUT}`);
