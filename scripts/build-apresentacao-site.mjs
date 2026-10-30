import pptxgen from "pptxgenjs";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "docs", "apresentacao-site-uffa.pptx");
const SHOTS = path.join(ROOT, "docs", "assets", "screenshots");
const CROPS = path.join(SHOTS, "crops");
const ASSETS = path.join(ROOT, "src", "assets");

const C = {
  ink: "0E0E0E",
  cream: "FDF6F3",
  white: "FFFFFF",
  primary: "C97899",
  primarySoft: "F4E2E9",
  primaryDark: "9E4E6A",
  muted: "7C6E6A",
  line: "E5D6D0",
  section: "F7EFEB",
  green: "0F9D76",
  greenSoft: "E7F6F0",
  red: "C62828",
  redSoft: "FBE9E7",
};

const DISPLAY = "Impact";
const BODY = "Segoe UI";
const W = 13.333;
const H = 7.5;
const MX = 0.7;
const CW = 11.93;
const TOTAL = 14;

const img = (name) => {
  const crop = path.join(CROPS, name);
  if (fs.existsSync(crop)) return crop;
  const shot = path.join(SHOTS, name);
  if (fs.existsSync(shot)) return shot;
  throw new Error(`Imagem em falta: ${crop}`);
};

const asset = (name) => {
  const file = path.join(ASSETS, name);
  if (!fs.existsSync(file)) throw new Error(`Imagem em falta: ${file}`);
  return file;
};

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "UFFA Store";
pptx.company = "UFFA Store";
pptx.subject = "O site UFFA Store";
pptx.title = "UFFA Store — O site";
pptx.lang = "pt-PT";
pptx.theme = { headFontFace: DISPLAY, bodyFontFace: BODY, lang: "pt-PT" };

function addFooter(slide, page) {
  slide.addShape(pptx.ShapeType.line, {
    x: MX,
    y: 6.94,
    w: CW,
    h: 0,
    line: { color: C.line, width: 0.75 },
  });
  slide.addText("UFFA Store  ·  O site", {
    x: MX,
    y: 7.0,
    w: 7,
    h: 0.22,
    fontFace: BODY,
    fontSize: 7.5,
    color: C.muted,
  });
  slide.addText(`${String(page).padStart(2, "0")} / ${TOTAL}`, {
    x: 11.2,
    y: 7.0,
    w: 1.43,
    h: 0.22,
    fontFace: BODY,
    fontSize: 7.5,
    color: C.muted,
    align: "right",
  });
}

function addHeader(slide, eyebrow, title, page) {
  slide.background = { color: C.cream };
  slide.addText(eyebrow, {
    x: MX,
    y: 0.38,
    w: 10.5,
    h: 0.22,
    fontFace: BODY,
    fontSize: 8.5,
    bold: true,
    color: C.primary,
    charSpacing: 2.2,
  });
  slide.addText(title, {
    x: MX,
    y: 0.62,
    w: CW,
    h: 0.78,
    fontFace: DISPLAY,
    fontSize: 30,
    color: C.ink,
    valign: "top",
    fit: "shrink",
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: MX,
    y: 1.43,
    w: 0.55,
    h: 0.05,
    fill: { color: C.primary },
    line: { color: C.primary, width: 0 },
  });
  addFooter(slide, page);
}

function card(slide, x, y, w, h, fill = C.white, line = C.line, radius = 0.05) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: radius,
    fill: { color: fill },
    line: { color: line, width: 0.75 },
  });
}

function imageFrame(slide, file, x, y, w, h, caption = null) {
  card(slide, x, y, w, h, C.white, C.line, 0.03);
  slide.addImage({
    path: file,
    x: x + 0.045,
    y: y + 0.045,
    w: w - 0.09,
    h: h - 0.09,
    sizing: {
      type: "cover",
      w: w - 0.09,
      h: h - 0.09,
    },
  });
  if (caption) {
    slide.addText(caption, {
      x,
      y: y + h + 0.06,
      w,
      h: 0.2,
      fontFace: BODY,
      fontSize: 8,
      color: C.muted,
    });
  }
}

function text(slide, value, x, y, w, h, opts = {}) {
  slide.addText(value, {
    x,
    y,
    w,
    h,
    fontFace: BODY,
    fontSize: 11,
    color: C.ink,
    valign: "top",
    ...opts,
  });
}

function display(slide, value, x, y, w, h, opts = {}) {
  slide.addText(value, {
    x,
    y,
    w,
    h,
    fontFace: DISPLAY,
    fontSize: 30,
    color: C.ink,
    valign: "top",
    fit: "shrink",
    ...opts,
  });
}

function pill(slide, value, x, y, w, h, fill = C.primarySoft, color = C.primaryDark) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: h / 2,
    fill: { color: fill },
    line: { color: fill, width: 0 },
  });
  slide.addText(value, {
    x,
    y,
    w,
    h,
    fontFace: BODY,
    fontSize: 8.5,
    bold: true,
    color,
    align: "center",
    valign: "middle",
  });
}

function bullets(slide, items, x, y, w, opts = {}) {
  const gap = opts.gap ?? 0.62;
  const fontSize = opts.fontSize ?? 10.5;
  items.forEach((item, index) => {
    const top = y + index * gap;
    slide.addShape(pptx.ShapeType.rect, {
      x,
      y: top + 0.08,
      w: 0.08,
      h: 0.08,
      fill: { color: opts.dotColor ?? C.primary },
      line: { color: opts.dotColor ?? C.primary, width: 0 },
    });
    text(slide, item, x + 0.22, top, w - 0.22, gap - 0.04, {
      fontSize,
      bold: opts.bold ?? false,
      color: opts.color ?? C.ink,
      lineSpacingMultiple: 0.95,
    });
  });
}

function stepRow(slide, number, title, description, x, y, w, opts = {}) {
  slide.addShape(pptx.ShapeType.ellipse, {
    x,
    y: y + 0.04,
    w: 0.42,
    h: 0.42,
    fill: { color: opts.fill ?? C.ink },
    line: { color: opts.fill ?? C.ink, width: 0 },
  });
  slide.addText(number, {
    x,
    y: y + 0.04,
    w: 0.42,
    h: 0.42,
    fontFace: BODY,
    fontSize: 10,
    bold: true,
    color: opts.numberColor ?? C.white,
    align: "center",
    valign: "middle",
  });
  text(slide, title, x + 0.6, y, w - 0.6, 0.3, { fontSize: 12, bold: true });
  text(slide, description, x + 0.6, y + 0.28, w - 0.6, 0.55, {
    fontSize: 9.2,
    color: C.muted,
    lineSpacingMultiple: 0.95,
  });
}

/* ------------------------------------------------------------------ */
/* 01 — Capa                                                           */
/* ------------------------------------------------------------------ */
{
  const slide = pptx.addSlide();
  slide.background = { color: C.ink };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 0.2,
    h: H,
    fill: { color: C.primary },
    line: { color: C.primary, width: 0 },
  });

  text(slide, "UFFA STORE  ·  PORTO  ·  SNEAKERS VERIFICADOS", 0.9, 0.95, 6.2, 0.3, {
    fontSize: 9,
    bold: true,
    color: C.primary,
    charSpacing: 2.4,
  });
  display(slide, "UFFA", 0.9, 1.3, 6.4, 0.95, {
    fontSize: 60,
    color: C.white,
    charSpacing: 1,
  });
  display(slide, "STORE.", 0.9, 2.12, 6.4, 1.0, {
    fontSize: 60,
    color: C.primary,
    charSpacing: 1,
  });
  text(slide, "O site.", 0.9, 3.2, 6.0, 0.45, {
    fontSize: 22,
    color: C.white,
    bold: true,
  });
  text(
    slide,
    "Da home ao checkout. Do par à prova de autenticidade. Uma experiência completa para quem compra e para quem opera.",
    0.9,
    3.75,
    5.7,
    0.95,
    { fontSize: 12.5, color: "E8DCD7", lineSpacingMultiple: 1.05 },
  );
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.9,
    y: 4.95,
    w: 0.75,
    h: 0.05,
    fill: { color: C.primary },
    line: { color: C.primary, width: 0 },
  });
  text(slide, "Documentação e demonstração  ·  2026", 0.9, 6.75, 5.8, 0.25, {
    fontSize: 9,
    color: "9A8C87",
  });

  slide.addShape(pptx.ShapeType.rect, {
    x: 7.9,
    y: 0.45,
    w: 4.95,
    h: 6.6,
    fill: { color: C.primary },
    line: { color: C.primary, width: 0 },
  });
  slide.addImage({
    path: asset("e44536b4-0486-4401-9327-8f300ee11714.jpg"),
    x: 8.02,
    y: 0.57,
    w: 4.71,
    h: 6.36,
    sizing: { type: "cover", w: 4.71, h: 6.36 },
  });
  pill(slide, "PORTO ROSE LOW  ·  129 €", 8.55, 6.2, 3.55, 0.34, C.white, C.ink);

  slide.addNotes(
    "Abertura. Este documento apresenta o site UFFA Store como experiência completa: marca, descoberta, compra, pós-compra e operação. A apresentação anterior aprofundou o portal; esta mostra o percurso inteiro.",
  );
}

/* ------------------------------------------------------------------ */
/* 02 — Posicionamento                                                 */
/* ------------------------------------------------------------------ */
{
  const slide = pptx.addSlide();
  addHeader(slide, "01 / POSICIONAMENTO", "Uma loja, não um catálogo.", 2);

  const pillars = [
    [
      "1",
      "Curadoria",
      "Oito pares, quatro linhas. Cada par é escolhido e verificado antes de entrar.",
    ],
    ["2", "Porto", "Recolha gratuita em mãos. A loja física faz parte da experiência digital."],
    [
      "3",
      "Pós-compra",
      "Portal, autenticidade e operação no mesmo sistema, sem depender de emails soltos.",
    ],
  ];
  pillars.forEach(([number, title, description], index) => {
    stepRow(slide, number, title, description, 0.7, 1.8 + index * 1.35, 5.6, {
      fill: C.primary,
    });
  });

  imageFrame(slide, img("23-home-hero.png"), 6.65, 1.75, 5.98, 3.16, "Home · hero");
  card(slide, 6.65, 5.25, 5.98, 1.35, C.ink, C.ink);
  text(slide, "SEM DÚVIDAS. SÓ ESTILO.", 6.95, 5.5, 5.4, 0.4, {
    fontFace: DISPLAY,
    fontSize: 20,
    color: C.white,
  });
  text(slide, "A promessa da marca em três palavras — e em cada ecrã.", 6.95, 5.95, 5.3, 0.35, {
    fontSize: 10,
    color: "D8CBC6",
  });

  slide.addNotes(
    "Enquadrar a loja: não é um catálogo infinito. É uma seleção curta, com verificação, recolha no Porto e uma camada de pós-compra que prolonga a relação. Os três pilares são curadoria, Porto e pós-compra.",
  );
}

/* ------------------------------------------------------------------ */
/* 03 — Home                                                           */
/* ------------------------------------------------------------------ */
{
  const slide = pptx.addSlide();
  addHeader(slide, "02 / HOME", "A marca em primeiro.", 3);

  imageFrame(slide, img("23-home-hero.png"), 0.7, 1.65, 6.0, 3.17, "Hero · promessa e CTA");
  card(slide, 0.7, 5.15, 6.0, 1.55, C.ink, C.ink);
  text(slide, "A home não mostra tudo.", 0.95, 5.38, 5.4, 0.35, {
    fontFace: DISPLAY,
    fontSize: 18,
    color: C.white,
  });
  text(slide, "Mostra o próximo passo.", 0.95, 5.72, 5.4, 0.35, {
    fontFace: DISPLAY,
    fontSize: 18,
    color: C.primary,
  });
  text(
    slide,
    "Hero → categorias → mais procurados → portal → newsletter. Cada bloco tem uma função.",
    0.95,
    6.15,
    5.45,
    0.4,
    { fontSize: 9.5, color: "D8CBC6" },
  );

  imageFrame(slide, img("24-home-categorias.png"), 7.0, 1.65, 5.62, 2.55, "Categorias");
  imageFrame(slide, img("25-home-picks.png"), 7.0, 4.45, 5.62, 2.15, "Mais procurados");

  slide.addNotes(
    "Percorrer a home: hero com promessa e CTA, faixa de confiança, quatro categorias, produtos em destaque, bloco do portal e newsletter. A hierarquia leva o visitante da marca à compra e da compra ao acompanhamento.",
  );
}

/* ------------------------------------------------------------------ */
/* 04 — Catálogo                                                       */
/* ------------------------------------------------------------------ */
{
  const slide = pptx.addSlide();
  addHeader(slide, "03 / CATÁLOGO", "Encontrar o par certo.", 4);

  imageFrame(slide, img("03-catalogo.png"), 0.7, 1.65, 4.25, 5.12);

  text(slide, "Filtros que ajudam a decidir.", 5.45, 1.75, 7.0, 0.35, {
    fontSize: 15,
    bold: true,
  });
  bullets(
    slide,
    [
      "Linha, tamanho e preço máximo no mesmo painel.",
      "Pesquisa instantânea por nome, sem recarregar a página.",
      "Cartões com preço, categoria e selo de verificação.",
      "No mobile, os filtros empilham e continuam ao alcance.",
    ],
    5.45,
    2.3,
    7.0,
    { gap: 0.78, fontSize: 11 },
  );

  card(slide, 5.45, 5.45, 6.95, 1.15, C.ink, C.ink);
  text(slide, "O cliente não procura um catálogo.", 5.7, 5.65, 6.5, 0.3, {
    fontSize: 14,
    bold: true,
    color: C.white,
  });
  text(slide, "Procura o par certo — e quer saber se está disponível.", 5.7, 5.98, 6.4, 0.3, {
    fontSize: 10,
    color: "D8CBC6",
  });

  slide.addNotes(
    "Mostrar o catálogo: filtros por linha, tamanho e preço, pesquisa e cartões com informação essencial. Destacar que o selo VERIFICADO aparece antes de abrir o produto e que o layout mobile mantém os filtros utilizáveis.",
  );
}

/* ------------------------------------------------------------------ */
/* 05 — Produto                                                        */
/* ------------------------------------------------------------------ */
{
  const slide = pptx.addSlide();
  addHeader(slide, "04 / PRODUTO", "A decisão acontece aqui.", 5);

  imageFrame(slide, img("04-produto.png"), 0.7, 1.65, 5.9, 5.08);

  text(slide, "Tudo o que decide a compra.", 6.95, 1.75, 5.5, 0.35, {
    fontSize: 15,
    bold: true,
  });
  bullets(
    slide,
    [
      "Galeria com rotação 360° e várias perspetivas.",
      "Tamanhos com stock em tempo real.",
      "Preço, descrição e selo de autenticidade.",
      "Recolha grátis no Porto e sem trocas nem devoluções.",
    ],
    6.95,
    2.3,
    5.5,
    { gap: 0.82, fontSize: 11 },
  );

  card(slide, 6.95, 5.55, 5.45, 1.05, C.primarySoft, C.primarySoft);
  text(slide, "Um produto. Todas as respostas.", 7.15, 5.78, 5.0, 0.3, {
    fontSize: 13,
    bold: true,
    color: C.primaryDark,
  });
  text(slide, "Adicionar ao carrinho sem sair da página.", 7.15, 6.08, 5.0, 0.25, {
    fontSize: 9.5,
    color: C.muted,
  });

  slide.addNotes(
    "Entrar no produto: galeria, rotação 360°, seleção de tamanho com stock, descrição, preço e garantias. O objetivo é responder às dúvidas todas antes do carrinho. A recolha gratuita e a política de trocas são visíveis sem abrir menus.",
  );
}

/* ------------------------------------------------------------------ */
/* 06 — Carrinho                                                       */
/* ------------------------------------------------------------------ */
{
  const slide = pptx.addSlide();
  addHeader(slide, "05 / CARRINHO", "O último empurrão.", 6);

  imageFrame(slide, img("22-cart-drawer.png"), 0.7, 1.72, 2.85, 4.84, "Carrinho lateral");

  const steps = [
    ["1", "Rever", "Produto, tamanho, quantidade e preço."],
    ["2", "Ajustar", "Alterar quantidades ou remover sem sair da loja."],
    ["3", "Finalizar", "Subtotal claro e um único CTA para o checkout."],
  ];
  steps.forEach(([number, title, description], index) => {
    stepRow(slide, number, title, description, 3.8, 1.85 + index * 1.2, 8.45, {
      fill: C.ink,
    });
  });

  card(slide, 3.8, 5.55, 8.45, 1.05, C.ink, C.ink);
  text(slide, "O carrinho não interrompe a navegação.", 4.05, 5.75, 7.9, 0.3, {
    fontSize: 14,
    bold: true,
    color: C.white,
  });
  text(slide, "Abre, ajusta e volta. Sem perder o contexto.", 4.05, 6.08, 7.8, 0.25, {
    fontSize: 9.5,
    color: "D8CBC6",
  });

  slide.addNotes(
    "Abrir o carrinho lateral: mostra itens, tamanhos, quantidades e subtotal. A alteração é imediata e o CTA leva ao checkout. O carrinho é uma camada, não uma página — o cliente não perde o contexto da loja.",
  );
}

/* ------------------------------------------------------------------ */
/* 07 — Checkout                                                       */
/* ------------------------------------------------------------------ */
{
  const slide = pptx.addSlide();
  addHeader(slide, "06 / CHECKOUT", "Três decisões. Zero fricção.", 7);

  imageFrame(slide, img("05-checkout.png"), 0.7, 1.65, 6.1, 4.93);

  const steps = [
    ["1", "Entrega", "Recolha grátis no Porto ou envio por 7 €."],
    ["2", "Dados", "Nome e email/telefone. Sem criar conta."],
    ["3", "Pagamento", "MB WAY simulado. Apple Pay marcado como em breve."],
  ];
  steps.forEach(([number, title, description], index) => {
    stepRow(slide, number, title, description, 7.15, 1.8 + index * 1.18, 5.3, {
      fill: C.primary,
    });
  });

  card(slide, 7.15, 5.55, 5.3, 1.05, C.primarySoft, C.primarySoft);
  text(slide, "Código exclusivo na confirmação.", 7.35, 5.75, 4.9, 0.3, {
    fontSize: 12.5,
    bold: true,
    color: C.primaryDark,
  });
  text(slide, "O pós-compra começa assim que o pagamento é validado.", 7.35, 6.08, 4.8, 0.25, {
    fontSize: 9.2,
    color: C.muted,
  });

  slide.addNotes(
    "Mostrar o checkout em três blocos: entrega, dados e pagamento. Recolha gratuita ou envio por sete euros. Não há criação de conta. O pagamento é simulado na demo, mas o fluxo e a confirmação são reais.",
  );
}

/* ------------------------------------------------------------------ */
/* 08 — Confirmação                                                    */
/* ------------------------------------------------------------------ */
{
  const slide = pptx.addSlide();
  addHeader(slide, "07 / CONFIRMAÇÃO", "O pós-compra começa aqui.", 8);

  imageFrame(slide, img("confirmacao-topo.png"), 0.7, 1.65, 6.0, 4.08);

  card(slide, 0.7, 5.95, 6.0, 0.72, C.primarySoft, C.primarySoft);
  text(slide, "CÓDIGO EXCLUSIVO", 0.95, 6.07, 1.9, 0.2, {
    fontSize: 7.5,
    bold: true,
    color: C.primaryDark,
    charSpacing: 1.2,
  });
  text(slide, "UFFA-7K3M-9QX2", 2.75, 6.02, 3.6, 0.35, {
    fontFace: "Consolas",
    fontSize: 15,
    bold: true,
    color: C.ink,
  });

  text(slide, "Tudo o que o cliente leva.", 7.05, 1.75, 5.4, 0.35, {
    fontSize: 15,
    bold: true,
  });
  bullets(
    slide,
    [
      "Número de encomenda para identificar o pedido.",
      "Código exclusivo para entrar no portal.",
      "Código de rastreio e transportador.",
      "Código de autenticidade por cada par.",
    ],
    7.05,
    2.3,
    5.4,
    { gap: 0.78, fontSize: 11 },
  );

  card(slide, 7.05, 5.55, 5.4, 1.05, C.ink, C.ink);
  text(slide, "Guarda o código.", 7.3, 5.75, 4.9, 0.3, {
    fontSize: 14,
    bold: true,
    color: C.white,
  });
  text(slide, "É a chave para acompanhar tudo.", 7.3, 6.08, 4.8, 0.25, {
    fontSize: 9.5,
    color: "D8CBC6",
  });

  slide.addNotes(
    "A confirmação é o início do pós-compra. Mostra o número, o código exclusivo, o rastreio e os códigos de autenticidade. O cliente não precisa de criar conta: guarda o código e entra no portal com três dados.",
  );
}

/* ------------------------------------------------------------------ */
/* 09 — Portal                                                         */
/* ------------------------------------------------------------------ */
{
  const slide = pptx.addSlide();
  addHeader(slide, "08 / PORTAL", "O par não desaparece.", 9);

  imageFrame(slide, img("rastreio-topo.png"), 0.7, 1.65, 6.2, 3.23, "Portal · envio");
  card(slide, 0.7, 5.15, 6.2, 1.35, C.primarySoft, C.primarySoft);
  text(slide, "TRÊS DADOS. SEM CONTA.", 0.95, 5.38, 5.7, 0.22, {
    fontSize: 8,
    bold: true,
    color: C.primaryDark,
    charSpacing: 1.5,
  });
  text(slide, "Encomenda  +  contacto  +  código exclusivo.", 0.95, 5.68, 5.7, 0.3, {
    fontSize: 13,
    bold: true,
  });
  text(slide, "Sessão de 30 minutos, com bloqueio após cinco tentativas.", 0.95, 6.08, 5.7, 0.25, {
    fontSize: 9.2,
    color: C.muted,
  });

  text(slide, "Acompanhar sem ansiedade.", 7.2, 1.75, 5.3, 0.35, {
    fontSize: 15,
    bold: true,
  });
  bullets(
    slide,
    [
      "Estado atual e linha temporal completa.",
      "Previsão, transportador e código de rastreio.",
      "Envio ao domicílio ou recolha na loja.",
      "Confirmação de receção ou recolha no fim.",
    ],
    7.2,
    2.3,
    5.3,
    { gap: 0.78, fontSize: 11 },
  );

  card(slide, 7.2, 5.55, 5.25, 1.05, C.ink, C.ink);
  text(slide, "Sem conta. Sem password.", 7.45, 5.75, 4.7, 0.3, {
    fontSize: 14,
    bold: true,
    color: C.white,
  });
  text(slide, "Só o que o comprador já tem.", 7.45, 6.08, 4.7, 0.25, {
    fontSize: 9.5,
    color: "D8CBC6",
  });

  slide.addNotes(
    "Mostrar o portal: acesso por três fatores, estado, timeline, previsão, transportador e confirmação final. A recolha tem um fluxo próprio, mais curto. O portal é a continuação natural da confirmação.",
  );
}

/* ------------------------------------------------------------------ */
/* 10 — Autenticidade                                                  */
/* ------------------------------------------------------------------ */
{
  const slide = pptx.addSlide();
  addHeader(slide, "09 / AUTENTICIDADE", "A prova de autenticidade.", 10);

  imageFrame(
    slide,
    img("verificar-resultado-v2.png"),
    0.7,
    1.65,
    6.3,
    3.05,
    "Certificado válido · /verificar",
  );
  imageFrame(slide, img("verificar-invalido-v2.png"), 0.7, 4.95, 6.3, 1.5, "Código inválido");

  text(slide, "Cada par tem uma identidade.", 7.3, 1.75, 5.2, 0.35, {
    fontSize: 15,
    bold: true,
  });
  bullets(
    slide,
    [
      "Código único por par, gerado no checkout.",
      "Formato UFFA-AUTH-XXXX-XXXX.",
      "Validação pública em /verificar.",
      "Sem revelar nome, contacto ou morada.",
    ],
    7.3,
    2.3,
    5.2,
    { gap: 0.78, fontSize: 11 },
  );

  card(slide, 7.3, 5.55, 5.15, 1.05, C.ink, C.ink);
  text(slide, "O par pode ser partilhado.", 7.55, 5.75, 4.6, 0.3, {
    fontSize: 14,
    bold: true,
    color: C.white,
  });
  text(slide, "A prova também.", 7.55, 6.08, 4.6, 0.25, {
    fontSize: 9.5,
    color: "D8CBC6",
  });

  slide.addNotes(
    "A autenticidade é a camada que transforma exclusividade em confiança. Cada par tem um código e um número de série. A verificação é pública, mas não expõe dados do comprador. O resultado inválido também é claro e útil.",
  );
}

/* ------------------------------------------------------------------ */
/* 11 — Operações                                                      */
/* ------------------------------------------------------------------ */
{
  const slide = pptx.addSlide();
  addHeader(slide, "10 / OPERAÇÕES", "Gerir sem folhas de cálculo.", 11);

  imageFrame(slide, img("operacoes-painel-foco-v2.png"), 0.7, 1.65, 6.2, 4.73, "Painel /operacoes");

  text(slide, "A equipa vê o mesmo que o cliente.", 7.2, 1.75, 5.3, 0.35, {
    fontSize: 15,
    bold: true,
  });
  bullets(
    slide,
    [
      "Indicadores, fila e pesquisa por encomenda ou contacto.",
      "Estado, previsão, rastreio, transportador e nota pública.",
      "Avançar para o estado seguinte sem saltos.",
      "Credenciais do cliente copiáveis para apoio.",
    ],
    7.2,
    2.3,
    5.3,
    { gap: 0.78, fontSize: 11 },
  );

  card(slide, 7.2, 5.55, 5.25, 1.05, C.primarySoft, C.primarySoft);
  text(slide, "Chave demo: UFFA-OPS-2026", 7.45, 5.75, 4.8, 0.3, {
    fontSize: 13,
    bold: true,
    color: C.primaryDark,
  });
  text(slide, "Cada alteração aparece no portal do cliente.", 7.45, 6.08, 4.7, 0.25, {
    fontSize: 9.2,
    color: C.muted,
  });

  slide.addNotes(
    "O painel de operações fecha o ciclo. A equipa vê indicadores, pesquisa, filtra e edita a encomenda. O botão de avançar mantém o fluxo correto. Tudo o que é alterado aparece no portal do cliente. A chave demo é UFFA-OPS-2026.",
  );
}

/* ------------------------------------------------------------------ */
/* 12 — Mobile                                                         */
/* ------------------------------------------------------------------ */
{
  const slide = pptx.addSlide();
  addHeader(slide, "11 / MOBILE", "A mesma experiência, no bolso.", 12);

  imageFrame(slide, img("mobile-home-top.png"), 0.7, 1.65, 2.05, 4.44, "Home");
  imageFrame(slide, img("mobile-catalogo-top.png"), 3.05, 1.65, 2.05, 4.44, "Catálogo");
  imageFrame(slide, img("mobile-produto-top.png"), 5.4, 1.65, 2.05, 4.44, "Produto");

  display(slide, "390 px", 7.95, 1.75, 4.5, 0.65, {
    fontSize: 40,
    color: C.primary,
  });
  text(slide, "Viewport mobile validado.", 7.95, 2.42, 4.4, 0.3, {
    fontSize: 11,
    color: C.muted,
  });
  bullets(
    slide,
    [
      "Header e menu mobile próprios.",
      "Filtros e grelha empilhados.",
      "Galeria e tamanhos ao alcance do polegar.",
      "Carrinho, checkout e portal responsivos.",
    ],
    7.95,
    3.05,
    4.5,
    { gap: 0.72, fontSize: 10.5 },
  );

  card(slide, 7.95, 5.65, 4.55, 0.9, C.ink, C.ink);
  text(slide, "A mesma experiência.", 8.15, 5.82, 4.1, 0.25, {
    fontSize: 12.5,
    bold: true,
    color: C.white,
  });
  text(slide, "Sem instalar nada.", 8.15, 6.12, 4.1, 0.22, {
    fontSize: 9.5,
    color: "D8CBC6",
  });

  slide.addNotes(
    "Mostrar as três capturas mobile: home, catálogo e produto. O site foi validado a 390 px. A navegação, os filtros, a galeria e o checkout adaptam-se sem perder a identidade. O portal e o painel também são responsivos.",
  );
}

/* ------------------------------------------------------------------ */
/* 13 — Tecnologia                                                     */
/* ------------------------------------------------------------------ */
{
  const slide = pptx.addSlide();
  addHeader(slide, "12 / TECNOLOGIA", "Simples na demo, pronto para produção.", 13);

  card(slide, 0.7, 1.65, 5.9, 4.4);
  text(slide, "DEMONSTRAÇÃO", 0.98, 1.9, 3.0, 0.22, {
    fontSize: 8,
    bold: true,
    color: C.primary,
    charSpacing: 2,
  });
  display(slide, "React + dados locais", 0.98, 2.2, 5.2, 0.55, { fontSize: 24 });
  bullets(
    slide,
    [
      "React 19 + TanStack Start.",
      "Tailwind e componentes acessíveis.",
      "localStorage / sessionStorage.",
      "Dados seed e reset no painel.",
      "Sem backend na demonstração.",
    ],
    0.98,
    3.0,
    5.2,
    { gap: 0.55, fontSize: 10.5 },
  );

  card(slide, 7.0, 1.65, 5.6, 4.4, C.ink, C.ink);
  text(slide, "PRODUÇÃO", 7.28, 1.9, 3.0, 0.22, {
    fontSize: 8,
    bold: true,
    color: C.primary,
    charSpacing: 2,
  });
  display(slide, "API + PostgreSQL", 7.28, 2.2, 5.0, 0.55, {
    fontSize: 24,
    color: C.white,
  });
  bullets(
    slide,
    [
      "Backend e base de dados.",
      "Row Level Security.",
      "Pagamentos reais e emails transacionais.",
      "Integração com transportador.",
      "Sessões assinadas e auditoria.",
    ],
    7.28,
    3.0,
    4.95,
    { gap: 0.55, fontSize: 10.5, color: "E8DCD7" },
  );

  card(slide, 0.7, 6.25, 11.93, 0.5, C.primarySoft, C.primarySoft);
  text(slide, "A experiência mantém-se. Muda a robustez por trás.", 0.9, 6.36, 11.5, 0.25, {
    fontSize: 12,
    bold: true,
    color: C.primaryDark,
    align: "center",
  });

  slide.addNotes(
    "Separar demonstração de produção. A demo corre no browser com dados locais e permitiu validar a experiência. Em produção, a mesma interface passa a falar com uma API e PostgreSQL, com RLS, pagamentos reais, emails, transportador e auditoria.",
  );
}

/* ------------------------------------------------------------------ */
/* 14 — Fecho                                                          */
/* ------------------------------------------------------------------ */
{
  const slide = pptx.addSlide();
  slide.background = { color: C.ink };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 0.2,
    h: H,
    fill: { color: C.primary },
    line: { color: C.primary, width: 0 },
  });

  text(slide, "DEMONSTRAÇÃO  ·  UFFA STORE", 0.9, 0.95, 6.2, 0.3, {
    fontSize: 9,
    bold: true,
    color: C.primary,
    charSpacing: 2.4,
  });
  display(slide, "OBRIGADO.", 0.9, 1.3, 6.4, 0.9, {
    fontSize: 52,
    color: C.white,
  });
  text(slide, "Sneakers verificados. Recolha em mãos no Porto.", 0.9, 2.4, 5.7, 0.5, {
    fontSize: 15,
    color: "E8DCD7",
  });
  text(
    slide,
    "Uma loja completa: marca, descoberta, compra, pós-compra e operação.",
    0.9,
    3.0,
    5.4,
    0.7,
    { fontSize: 11.5, color: "B9A9A3" },
  );

  text(slide, "atendimento@uffastore.pt", 0.9, 5.55, 5.0, 0.3, {
    fontSize: 11,
    bold: true,
    color: C.primary,
  });
  text(slide, "@uffastore.legit  ·  uffastore.pt  ·  Porto", 0.9, 5.9, 5.4, 0.3, {
    fontSize: 9.5,
    color: "B9A9A3",
  });

  card(slide, 7.35, 1.15, 5.25, 5.55, C.white, C.white);
  text(slide, "VER AO VIVO", 7.65, 1.42, 3.0, 0.22, {
    fontSize: 8,
    bold: true,
    color: C.primary,
    charSpacing: 2,
  });
  display(slide, "localhost:8080", 7.65, 1.72, 4.6, 0.55, { fontSize: 24 });
  text(slide, "Percurso sugerido", 7.65, 2.5, 4.4, 0.25, {
    fontSize: 9.5,
    color: C.muted,
    bold: true,
  });

  const routes = [
    ["/", "Home e categorias"],
    ["/catalogo", "Filtros e grelha"],
    ["/produto/porto-rose-low", "Detalhe e tamanhos"],
    ["/checkout", "Recolha ou envio"],
    ["/rastreio", "Portal do cliente"],
    ["/verificar", "Autenticidade"],
    ["/operacoes", "Painel interno"],
  ];
  routes.forEach(([route, label], index) => {
    const y = 2.85 + index * 0.47;
    text(slide, route, 7.65, y, 2.7, 0.25, {
      fontFace: "Consolas",
      fontSize: 9,
      bold: true,
      color: C.ink,
    });
    text(slide, label, 10.05, y, 2.2, 0.25, {
      fontSize: 9,
      color: C.muted,
    });
  });
  text(slide, "Chave demo do painel: UFFA-OPS-2026", 7.65, 6.28, 4.6, 0.25, {
    fontSize: 8.5,
    color: C.muted,
  });

  slide.addNotes(
    "Fecho. Repetir a mensagem: o site UFFA Store cobre a jornada completa, da marca à operação. Convidar a equipa a percorrer o percurso sugerido em localhost:8080. O painel usa a chave UFFA-OPS-2026.",
  );
}

await pptx.writeFile({ fileName: OUT });
console.log(`PPTX criado: ${OUT}`);
