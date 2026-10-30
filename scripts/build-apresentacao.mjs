import pptxgen from "pptxgenjs";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "docs", "apresentacao-uffa.pptx");
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
  indigo: "4F46E5",
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
pptx.subject = "Portal de Encomendas UFFA";
pptx.title = "UFFA Store — Portal de Encomendas";
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
  slide.addText("UFFA Store  ·  Portal de Encomendas", {
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
  slide.addImage({ path: file, x: x + 0.045, y: y + 0.045, w: w - 0.09, h: h - 0.09 });
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
    w: 0.14,
    h: H,
    fill: { color: C.primary },
    line: { color: C.primary, width: 0 },
  });

  text(slide, "UFFA STORE  ·  PORTO  ·  PÓS-COMPRA", 0.9, 0.95, 6.2, 0.3, {
    fontSize: 9,
    bold: true,
    color: C.primary,
    charSpacing: 2.4,
  });
  display(slide, "PORTAL DE", 0.9, 1.3, 6.4, 0.95, {
    fontSize: 46,
    color: C.white,
    lineSpacingMultiple: 0.88,
  });
  display(slide, "ENCOMENDAS.", 0.9, 2.05, 6.4, 1.0, {
    fontSize: 46,
    color: C.primary,
    lineSpacingMultiple: 0.88,
  });
  text(slide, "Do checkout à recolha, com exclusividade verificável.", 0.9, 3.3, 5.9, 0.65, {
    fontSize: 17,
    color: C.cream,
    lineSpacingMultiple: 1.0,
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.9,
    y: 4.15,
    w: 1.1,
    h: 0.05,
    fill: { color: C.primary },
    line: { color: C.primary, width: 0 },
  });
  text(
    slide,
    "Uma área de cliente para acompanhar envio ou recolha, confirmar a receção e validar a autenticidade de cada par.",
    0.9,
    4.4,
    5.7,
    0.9,
    { fontSize: 10.5, color: "C9BFBB", lineSpacingMultiple: 1.1 },
  );
  text(slide, "Documentação e demonstração  ·  2026", 0.9, 6.78, 5.8, 0.25, {
    fontSize: 8.5,
    color: "7E7471",
  });

  slide.addShape(pptx.ShapeType.rect, {
    x: 8.0,
    y: 0.95,
    w: 4.55,
    h: 5.95,
    fill: { color: C.primary },
    line: { color: C.primary, width: 0 },
  });
  slide.addImage({
    path: asset("e44536b4-0486-4401-9327-8f300ee11714.jpg"),
    x: 8.18,
    y: 1.13,
    w: 4.2,
    h: 5.6,
  });
  pill(slide, "PORTO ROSE LOW  ·  129 €", 9.1, 6.25, 2.4, 0.32, C.white, C.ink);
  slide.addNotes(
    "Abertura. Apresentar o portal como extensão da experiência de compra, não como uma página de tracking genérica. Referir que o foco é o cliente que já comprou e a equipa que acompanha a encomenda.",
  );
}

/* ------------------------------------------------------------------ */
/* 02 — Problema                                                       */
/* ------------------------------------------------------------------ */
{
  const slide = pptx.addSlide();
  addHeader(slide, "01 / CONTEXTO", "O cliente compra. E depois?", 2);

  const items = [
    ["01", "Falta de visibilidade", "O cliente não sabe se o par saiu, onde está ou quando chega."],
    [
      "02",
      "Contacto disperso",
      "Dúvidas divididas entre email, DM e telefone, sem histórico comum.",
    ],
    [
      "03",
      "Autenticidade percebida",
      "O par é exclusivo, mas não existe uma prova verificável para partilhar.",
    ],
    [
      "04",
      "Operação manual",
      "Estados atualizados sem registo central nem visão do que o cliente vê.",
    ],
  ];
  items.forEach(([number, title, description], index) => {
    const y = 1.85 + index * 1.02;
    card(slide, 0.7, y, 6.05, 0.9);
    text(slide, number, 0.92, y + 0.18, 0.4, 0.25, {
      fontSize: 10,
      bold: true,
      color: C.primary,
    });
    text(slide, title, 1.4, y + 0.13, 4.9, 0.26, { fontSize: 12.5, bold: true });
    text(slide, description, 1.4, y + 0.42, 4.9, 0.4, {
      fontSize: 9.2,
      color: C.muted,
      lineSpacingMultiple: 0.95,
    });
  });

  imageFrame(
    slide,
    img("02-home-portal-promo.png"),
    7.0,
    1.9,
    5.65,
    1.7,
    "Bloco de portal na home",
  );

  card(slide, 7.0, 3.95, 5.65, 2.35, C.primarySoft, C.primarySoft);
  text(slide, "DIAGNÓSTICO", 7.3, 4.18, 2.5, 0.22, {
    fontSize: 8,
    bold: true,
    color: C.primaryDark,
    charSpacing: 1.6,
  });
  text(slide, "O momento de maior ansiedade é entre o pagamento e a entrega.", 7.3, 4.5, 5.0, 0.8, {
    fontSize: 15,
    bold: true,
    lineSpacingMultiple: 0.98,
  });
  text(
    slide,
    "O portal responde antes de o cliente perguntar — e dá à equipa uma fonte única de verdade.",
    7.3,
    5.35,
    5.0,
    0.6,
    { fontSize: 10, color: C.muted, lineSpacingMultiple: 1.05 },
  );
  slide.addNotes(
    "Enquadrar a dor: o pós-compra é o momento de maior ansiedade. Hoje há contacto disperso e pouca visibilidade. A autenticidade é percebida, mas não verificável. A operação atualiza estados sem histórico central.",
  );
}

/* ------------------------------------------------------------------ */
/* 03 — Solução                                                        */
/* ------------------------------------------------------------------ */
{
  const slide = pptx.addSlide();
  addHeader(slide, "02 / SOLUÇÃO", "Um portal. Três garantias.", 3);

  const rows = [
    [
      "1",
      "Portal do cliente",
      "Estado, rastreio, previsão, histórico e confirmação de receção ou recolha.",
    ],
    [
      "2",
      "Prova de autenticidade",
      "Um código único por par, verificável publicamente sem expor o comprador.",
    ],
    [
      "3",
      "Painel de operações",
      "A equipa atualiza estados, rastreio e notas; cada alteração fica registada.",
    ],
  ];
  rows.forEach(([number, title, description], index) => {
    const y = 1.85 + index * 1.28;
    card(slide, 0.7, y, 6.1, 1.12);
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.7,
      y,
      w: 0.1,
      h: 1.12,
      fill: { color: C.primary },
      line: { color: C.primary, width: 0 },
    });
    display(slide, number, 1.02, y + 0.16, 0.55, 0.55, { fontSize: 26, color: C.primary });
    text(slide, title, 1.65, y + 0.15, 4.8, 0.3, { fontSize: 14, bold: true });
    text(slide, description, 1.65, y + 0.48, 4.9, 0.5, {
      fontSize: 9.5,
      color: C.muted,
      lineSpacingMultiple: 0.95,
    });
  });

  imageFrame(slide, img("rastreio-detalhes.png"), 7.0, 1.85, 5.6, 3.28, "Dashboard do cliente");

  card(slide, 0.7, 5.65, 11.93, 0.92, C.ink, C.ink);
  text(
    slide,
    "As três camadas partilham o mesmo modelo de dados — e a mesma linguagem UFFA.",
    0.95,
    5.88,
    11.4,
    0.45,
    { fontSize: 13, bold: true, color: C.white, align: "center" },
  );
  slide.addNotes(
    "Apresentar as três camadas: portal do cliente, prova de autenticidade e painel de operações. A ideia-chave é que partilham o mesmo modelo de dados, por isso o cliente e a equipa veem a mesma verdade.",
  );
}

/* ------------------------------------------------------------------ */
/* 04 — Jornada                                                        */
/* ------------------------------------------------------------------ */
{
  const slide = pptx.addSlide();
  addHeader(slide, "03 / JORNADA", "O código nasce no checkout.", 4);

  const steps = [
    ["1", "Compra", "Envio para casa ou recolha gratuita no Porto."],
    ["2", "Geração", "Número, código exclusivo, autenticidade e rastreio."],
    ["3", "Confirmação", "Próximos passos claros e código para guardar."],
    ["4", "Acesso", "Três dados. Sem conta, sem password."],
    ["5", "Acompanhamento", "Estado, histórico e confirmação final."],
  ];
  steps.forEach(([number, title, description], index) => {
    stepRow(slide, number, title, description, 0.7, 1.82 + index * 0.93, 5.5);
  });

  imageFrame(
    slide,
    img("confirmacao-codigo-final.png"),
    6.5,
    1.9,
    6.1,
    2.39,
    "Confirmação com código exclusivo",
  );

  card(slide, 6.5, 5.15, 6.1, 0.72, C.primarySoft, C.primarySoft);
  text(slide, "CÓDIGO EXCLUSIVO", 6.75, 5.26, 1.9, 0.2, {
    fontSize: 7.5,
    bold: true,
    color: C.primaryDark,
    charSpacing: 1.2,
  });
  text(slide, "UFFA-7K3M-9QX2", 8.55, 5.22, 3.8, 0.35, {
    fontFace: "Consolas",
    fontSize: 16,
    bold: true,
    color: C.ink,
  });
  text(slide, "Gerado no checkout e associado à encomenda.", 6.5, 6.05, 6.1, 0.25, {
    fontSize: 8.5,
    color: C.muted,
  });
  slide.addNotes(
    "Percorrer a jornada: compra, geração de códigos, confirmação, acesso e acompanhamento. Destacar que o código exclusivo é gerado no checkout e que a confirmação explica exatamente o que guardar.",
  );
}

/* ------------------------------------------------------------------ */
/* 05 — Acesso                                                         */
/* ------------------------------------------------------------------ */
{
  const slide = pptx.addSlide();
  addHeader(slide, "04 / ACESSO", "Três dados. Zero contas.", 5);

  const factors = [
    ["1", "Número da encomenda", "UFFA-48217  ·  aceita 48217"],
    ["2", "Contacto da compra", "demo@uffa.pt  ·  email ou telefone"],
    ["3", "Código exclusivo", "UFFA-7K3M-9QX2"],
  ];
  factors.forEach(([number, title, example], index) => {
    const y = 1.85 + index * 1.08;
    card(slide, 0.7, y, 5.9, 0.95);
    text(slide, number, 0.95, y + 0.2, 0.35, 0.3, {
      fontSize: 15,
      bold: true,
      color: C.primary,
    });
    text(slide, title, 1.35, y + 0.13, 4.9, 0.28, { fontSize: 12.5, bold: true });
    text(slide, example, 1.35, y + 0.43, 4.9, 0.3, {
      fontFace: "Consolas",
      fontSize: 9.5,
      color: C.muted,
    });
  });

  const stats = [
    ["5", "tentativas"],
    ["60 s", "de bloqueio"],
    ["30 min", "de sessão"],
  ];
  stats.forEach(([value, label], index) => {
    const x = 0.7 + index * 2.0;
    card(slide, x, 5.3, 1.85, 1.05, C.section, C.section);
    display(slide, value, x + 0.12, 5.38, 1.6, 0.45, { fontSize: 22, color: C.primaryDark });
    text(slide, label, x + 0.12, 5.87, 1.6, 0.22, { fontSize: 8.5, color: C.muted });
  });

  imageFrame(
    slide,
    img("rastreio-acesso-topo.png"),
    6.95,
    1.85,
    5.7,
    3.56,
    "Formulário em /rastreio",
  );
  card(slide, 6.95, 5.65, 5.7, 0.72, C.ink, C.ink);
  text(slide, "Sem conta. Sem password. Só o que o comprador já tem.", 7.2, 5.86, 5.2, 0.3, {
    fontSize: 11,
    bold: true,
    color: C.white,
    align: "center",
  });
  slide.addNotes(
    "Explicar os três fatores e as regras: cinco tentativas, bloqueio de 60 segundos e sessão de 30 minutos. O número pode ser escrito apenas com os cinco dígitos. O código exclusivo é a chave, mas não chega sozinho.",
  );
}

/* ------------------------------------------------------------------ */
/* 06 — Dashboard de envio                                             */
/* ------------------------------------------------------------------ */
{
  const slide = pptx.addSlide();
  addHeader(slide, "05 / ENVIO", "Tudo o que o cliente precisa de saber.", 6);

  imageFrame(
    slide,
    img("rastreio-topo.png"),
    0.7,
    1.85,
    7.35,
    3.83,
    "Dashboard de envio · /rastreio",
  );

  const items = [
    "Estado atual e linha temporal",
    "Previsão e transportador",
    "Código de rastreio copiável",
    "Resumo, data e pagamento",
    "Itens com autenticidade",
  ];
  bullets(slide, items, 8.45, 1.95, 4.2, { gap: 0.62, fontSize: 10.5 });

  card(slide, 8.45, 5.25, 4.2, 1.25, C.primarySoft, C.primarySoft);
  text(slide, "CONFIRMAR RECEÇÃO", 8.7, 5.42, 3.7, 0.22, {
    fontSize: 8,
    bold: true,
    color: C.primaryDark,
    charSpacing: 1.4,
  });
  text(
    slide,
    "Disponível até ao estado final. Fecha a encomenda e atualiza o histórico.",
    8.7,
    5.7,
    3.7,
    0.6,
    { fontSize: 9.5, color: C.ink, lineSpacingMultiple: 0.95 },
  );
  slide.addNotes(
    "Mostrar o dashboard: estado, histórico, previsão, transportador, rastreio, resumo e itens. Sublinhar a ação de confirmar receção e o facto de o histórico ser visível ao cliente.",
  );
}

/* ------------------------------------------------------------------ */
/* 07 — Fluxo de envio                                                 */
/* ------------------------------------------------------------------ */
{
  const slide = pptx.addSlide();
  addHeader(slide, "06 / FLUXO", "Confirmada  →  Entregue.", 7);

  const nodes = [
    ["CONFIRMADA", "Pagamento validado", C.primary, C.white],
    ["EM PREPARAÇÃO", "Equipa UFFA", C.primary, C.white],
    ["ENVIADA", "Entregue ao transportador", C.primary, C.white],
    ["EM TRÂNSITO", "Centro de distribuição", C.indigo, C.white],
    ["ENTREGUE", "Confirmação do cliente", C.white, C.ink],
  ];
  const startX = 0.85;
  const gap = 2.34;
  nodes.forEach(([label, description, fill, color], index) => {
    const x = startX + index * gap;
    if (index < nodes.length - 1) {
      slide.addShape(pptx.ShapeType.line, {
        x: x + 1.7,
        y: 2.8,
        w: gap - 1.7,
        h: 0,
        line: { color: C.line, width: 2.2 },
      });
    }
    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y: 2.45,
      w: 1.7,
      h: 0.62,
      rectRadius: 0.31,
      fill: { color: fill },
      line: { color: index === 4 ? C.primary : fill, width: index === 4 ? 1.5 : 0 },
    });
    slide.addText(label, {
      x,
      y: 2.45,
      w: 1.7,
      h: 0.62,
      fontFace: BODY,
      fontSize: 7.6,
      bold: true,
      color,
      align: "center",
      valign: "middle",
    });
    text(slide, description, x, 3.25, 1.7, 0.5, {
      fontSize: 8.5,
      color: C.muted,
      align: "center",
      lineSpacingMultiple: 0.95,
    });
  });

  const cards = [
    ["Evento automático", "Cada transição acrescenta data/hora ao histórico."],
    ["Histórico visível", "O cliente vê o percurso completo, não só o estado atual."],
    ["Cancelada à parte", "Estado independente, aplicável pela equipa em qualquer momento."],
  ];
  cards.forEach(([title, description], index) => {
    const x = 0.7 + index * 4.0;
    card(slide, x, 4.45, 3.85, 1.35, C.section, C.section);
    text(slide, title, x + 0.25, 4.65, 3.3, 0.3, { fontSize: 12.5, bold: true });
    text(slide, description, x + 0.25, 5.0, 3.3, 0.55, {
      fontSize: 9.2,
      color: C.muted,
      lineSpacingMultiple: 0.95,
    });
  });

  text(
    slide,
    "O estado final desativa a confirmação de receção. O histórico mantém-se disponível.",
    0.7,
    6.2,
    11.93,
    0.35,
    { fontSize: 9.5, color: C.muted, align: "center" },
  );
  slide.addNotes(
    "Percorrer os cinco estados do envio. Explicar que cada transição gera um evento com data/hora e que o histórico é visível. O estado Cancelada existe à parte e não faz parte do fluxo linear.",
  );
}

/* ------------------------------------------------------------------ */
/* 08 — Recolha                                                        */
/* ------------------------------------------------------------------ */
{
  const slide = pptx.addSlide();
  addHeader(slide, "07 / RECOLHA", "Pronta para recolha.", 8);

  imageFrame(
    slide,
    img("rastreio-recolha-topo.png"),
    0.7,
    1.85,
    6.5,
    3.3,
    "Dashboard de recolha · UFFA-73104",
  );

  card(slide, 0.7, 5.55, 6.5, 0.95, C.section, C.section);
  text(
    slide,
    "Sem portes. O par fica reservado na loja até à data indicada.",
    0.95,
    5.75,
    6.0,
    0.55,
    { fontSize: 10.5, color: C.ink, lineSpacingMultiple: 0.95 },
  );

  const steps = [
    ["1", "Confirmada", "Pagamento e encomenda registados."],
    ["2", "Em preparação", "O par é separado e verificado."],
    ["3", "Pronta para recolha", "Reservado na loja do Porto."],
    ["4", "Recolhida", "Cliente confirma a recolha."],
  ];
  steps.forEach(([number, title, description], index) => {
    const y = 1.85 + index * 0.98;
    slide.addShape(pptx.ShapeType.ellipse, {
      x: 7.55,
      y: y + 0.05,
      w: 0.38,
      h: 0.38,
      fill: { color: index === 2 ? C.primary : C.ink },
      line: { color: index === 2 ? C.primary : C.ink, width: 0 },
    });
    slide.addText(number, {
      x: 7.55,
      y: y + 0.05,
      w: 0.38,
      h: 0.38,
      fontFace: BODY,
      fontSize: 9,
      bold: true,
      color: C.white,
      align: "center",
      valign: "middle",
    });
    text(slide, title, 8.12, y, 3.9, 0.28, { fontSize: 12, bold: true });
    text(slide, description, 8.12, y + 0.28, 3.9, 0.35, { fontSize: 9.2, color: C.muted });
  });

  card(slide, 7.55, 5.75, 4.85, 0.85, C.ink, C.ink);
  text(slide, "UFFA STORE  ·  PORTO", 7.8, 5.88, 4.3, 0.2, {
    fontSize: 7.5,
    bold: true,
    color: C.primary,
    charSpacing: 1.4,
  });
  text(slide, "Rua de Santa Catarina 112, 4000-447 Porto", 7.8, 6.12, 4.3, 0.3, {
    fontSize: 9,
    color: C.white,
  });
  slide.addNotes(
    "Mostrar o fluxo de recolha, mais curto do que o envio. Destacar a morada, a data limite, a nota da loja e a confirmação de recolha. Não há rastreio nem portes.",
  );
}

/* ------------------------------------------------------------------ */
/* 09 — Autenticidade                                                  */
/* ------------------------------------------------------------------ */
{
  const slide = pptx.addSlide();
  addHeader(slide, "08 / AUTENTICIDADE", "A prova de autenticidade.", 9);

  imageFrame(
    slide,
    img("verificar-resultado.png"),
    0.7,
    1.85,
    7.15,
    3.12,
    "Certificado válido · /verificar",
  );
  text(
    slide,
    "A verificação nunca revela nome, contacto ou morada do comprador.",
    0.7,
    5.25,
    7.15,
    0.3,
    { fontSize: 9, color: C.muted },
  );

  const items = [
    "Código gerado no checkout, único por linha",
    "Formato UFFA-AUTH-XXXX-XXXX",
    "Validação pública em /verificar",
    "Produto, tamanho, série, edição e data",
  ];
  bullets(slide, items, 8.15, 1.95, 4.5, { gap: 0.66, fontSize: 10 });

  imageFrame(slide, img("verificar-invalido.png"), 8.15, 5.25, 4.5, 0.96);
  slide.addNotes(
    "Explicar que cada par tem um código e um número de série. A verificação é pública e não revela dados pessoais. Mostrar o resultado válido e o inválido. É a mesma lógica de certificação do OrbitTrack, adaptada a sneakers.",
  );
}

/* ------------------------------------------------------------------ */
/* 10 — Operações                                                      */
/* ------------------------------------------------------------------ */
{
  const slide = pptx.addSlide();
  addHeader(slide, "09 / OPERAÇÕES", "Gerir sem folhas de cálculo.", 10);

  imageFrame(
    slide,
    img("operacoes-painel-foco.png"),
    0.7,
    1.85,
    6.2,
    4.61,
    "Painel /operacoes · fila e editor",
  );
  imageFrame(slide, img("operacoes-editor-limpo.png"), 7.5, 1.85, 2.1, 3.83);

  const items = [
    "Pesquisa e filtro por estado",
    "Estado, previsão e nota pública",
    "Rastreio e transportador",
    "Avançar para o estado seguinte",
    "Credenciais do cliente copiáveis",
  ];
  bullets(slide, items, 9.9, 1.95, 2.7, { gap: 0.64, fontSize: 9.2 });

  card(slide, 7.5, 5.85, 5.1, 0.52, C.primarySoft, C.primarySoft);
  text(slide, "Chave demo: UFFA-OPS-2026", 7.7, 5.96, 4.7, 0.3, {
    fontFace: "Consolas",
    fontSize: 10,
    bold: true,
    color: C.primaryDark,
  });
  text(slide, "Cada alteração aparece no portal do cliente.", 7.5, 6.48, 5.1, 0.25, {
    fontSize: 8.5,
    color: C.muted,
  });
  slide.addNotes(
    "Mostrar o painel: indicadores, pesquisa, filtro, fila e editor. Explicar o botão Avançar para, a nota pública e o histórico. Referir que a chave é de demonstração e que em produção há autenticação real.",
  );
}

/* ------------------------------------------------------------------ */
/* 11 — Mobile                                                         */
/* ------------------------------------------------------------------ */
{
  const slide = pptx.addSlide();
  addHeader(slide, "10 / MOBILE", "A mesma experiência, no bolso.", 11);

  imageFrame(slide, img("rastreio-mobile-topo.png"), 0.8, 1.8, 2.55, 5.1);
  imageFrame(slide, img("rastreio-mobile-itens.png"), 3.55, 1.8, 2.25, 5.1);

  display(slide, "390 px", 6.5, 1.95, 3.0, 0.65, { fontSize: 38, color: C.primary });
  text(slide, "viewport mobile validado", 6.5, 2.62, 4.0, 0.25, { fontSize: 9, color: C.muted });

  const items = [
    "Header e menu mobile próprios",
    "Linha temporal vertical",
    "Cartões empilhados e legíveis",
    "Ações ao alcance do polegar",
    "Tema claro e escuro",
  ];
  bullets(slide, items, 6.5, 3.1, 6.0, { gap: 0.6, fontSize: 10.5 });

  card(slide, 6.5, 5.55, 6.0, 0.95, C.ink, C.ink);
  text(slide, "A mesma experiência. Sem instalar nada.", 6.75, 5.78, 5.5, 0.4, {
    fontSize: 13,
    bold: true,
    color: C.white,
    align: "center",
  });
  slide.addNotes(
    "Mostrar as duas capturas mobile: topo e itens. Explicar que a linha temporal passa a vertical, os cartões empilham e as ações ficam ao alcance do polegar. O portal foi desenhado mobile-first.",
  );
}

/* ------------------------------------------------------------------ */
/* 12 — Arquitetura                                                    */
/* ------------------------------------------------------------------ */
{
  const slide = pptx.addSlide();
  addHeader(slide, "11 / ARQUITETURA", "Simples na demo, pronto para produção.", 12);

  card(slide, 0.7, 1.85, 5.35, 3.95);
  text(slide, "DEMONSTRAÇÃO", 0.95, 2.05, 3.5, 0.22, {
    fontSize: 8.5,
    bold: true,
    color: C.primary,
    charSpacing: 1.6,
  });
  display(slide, "React + dados locais", 0.95, 2.32, 4.8, 0.45, { fontSize: 20 });
  const demoItems = [
    "React 19 + TanStack Start",
    "localStorage / sessionStorage",
    "Dados seed e reset",
    "Sessão de 30 minutos",
    "Sem backend",
  ];
  bullets(slide, demoItems, 0.95, 3.0, 4.8, { gap: 0.5, fontSize: 10 });

  card(slide, 7.3, 1.85, 5.35, 3.95, C.ink, C.ink);
  text(slide, "PRODUÇÃO", 7.55, 2.05, 3.5, 0.22, {
    fontSize: 8.5,
    bold: true,
    color: C.primary,
    charSpacing: 1.6,
  });
  display(slide, "API + PostgreSQL", 7.55, 2.32, 4.8, 0.45, { fontSize: 20, color: C.white });
  const prodItems = [
    "Backend e base de dados",
    "Row Level Security",
    "Códigos em hash",
    "Sessões assinadas",
    "Emails e transportador",
  ];
  bullets(slide, prodItems, 7.55, 3.0, 4.8, {
    gap: 0.5,
    fontSize: 10,
    color: C.white,
    dotColor: C.primary,
  });

  slide.addShape(pptx.ShapeType.ellipse, {
    x: 6.12,
    y: 3.45,
    w: 1.05,
    h: 1.05,
    fill: { color: C.primary },
    line: { color: C.primary, width: 0 },
  });
  slide.addText("→", {
    x: 6.12,
    y: 3.45,
    w: 1.05,
    h: 1.05,
    fontFace: BODY,
    fontSize: 20,
    bold: true,
    color: C.white,
    align: "center",
    valign: "middle",
  });

  card(slide, 0.7, 6.0, 11.93, 0.65, C.primarySoft, C.primarySoft);
  text(slide, "A experiência mantém-se. Muda a robustez por trás.", 0.95, 6.15, 11.4, 0.35, {
    fontSize: 12.5,
    bold: true,
    color: C.primaryDark,
    align: "center",
  });
  slide.addNotes(
    "Explicar a diferença entre demo e produção. A demo corre no browser com dados locais. Em produção, o modelo passa para API e PostgreSQL com RLS, códigos em hash, sessões assinadas, emails e integração com o transportador.",
  );
}

/* ------------------------------------------------------------------ */
/* 13 — Segurança                                                      */
/* ------------------------------------------------------------------ */
{
  const slide = pptx.addSlide();
  addHeader(slide, "12 / SEGURANÇA", "Do protótipo ao serviço.", 13);

  const items = [
    "Backend e base de dados",
    "Códigos em hash e rate limiting",
    "Autenticação da equipa com roles e MFA",
    "Auditoria imutável",
    "Emails transacionais",
    "Integração com transportador",
    "RGPD e retenção",
  ];
  items.forEach((item, index) => {
    const y = 1.85 + index * 0.59;
    slide.addShape(pptx.ShapeType.ellipse, {
      x: 0.7,
      y: y + 0.02,
      w: 0.28,
      h: 0.28,
      fill: { color: C.greenSoft },
      line: { color: C.greenSoft, width: 0 },
    });
    slide.addText("✓", {
      x: 0.7,
      y: y,
      w: 0.28,
      h: 0.28,
      fontFace: BODY,
      fontSize: 9,
      bold: true,
      color: C.green,
      align: "center",
      valign: "middle",
    });
    text(slide, item, 1.15, y, 5.4, 0.3, { fontSize: 10.5 });
  });

  imageFrame(slide, img("verificar-invalido.png"), 6.95, 1.85, 5.6, 1.2);
  imageFrame(slide, img("verificar-resultado.png"), 6.95, 3.55, 5.6, 2.45);

  card(slide, 0.7, 6.05, 5.9, 0.58, C.ink, C.ink);
  text(slide, "Segurança não muda a experiência. Muda a confiança.", 0.95, 6.18, 5.4, 0.3, {
    fontSize: 10.5,
    bold: true,
    color: C.white,
    align: "center",
  });
  slide.addNotes(
    "Percorrer o checklist de produção. A demo prova a experiência; o trabalho crítico é segurança: validação no servidor, códigos em hash, limites de tentativas, autenticação da equipa, auditoria e RGPD.",
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
    w: 0.14,
    h: H,
    fill: { color: C.primary },
    line: { color: C.primary, width: 0 },
  });

  text(slide, "DEMONSTRAÇÃO  ·  ACESSOS", 0.9, 0.95, 5.5, 0.3, {
    fontSize: 9,
    bold: true,
    color: C.primary,
    charSpacing: 2.4,
  });
  display(slide, "O PAR NÃO", 0.9, 1.35, 5.7, 0.95, {
    fontSize: 44,
    color: C.white,
    lineSpacingMultiple: 0.88,
  });
  display(slide, "DESAPARECE.", 0.9, 2.1, 5.7, 1.0, {
    fontSize: 44,
    color: C.primary,
    lineSpacingMultiple: 0.88,
  });
  text(
    slide,
    "Um portal próprio. Uma prova de autenticidade. Uma operação mais próxima.",
    0.9,
    3.45,
    5.3,
    0.9,
    { fontSize: 14, color: "D8CECA", lineSpacingMultiple: 1.05 },
  );

  card(slide, 7.4, 1.1, 5.2, 4.55, C.white, C.white);
  text(slide, "ACESSO DEMO", 7.7, 1.35, 3.0, 0.22, {
    fontSize: 8.5,
    bold: true,
    color: C.primary,
    charSpacing: 1.6,
  });
  text(slide, "Envio", 7.7, 1.78, 4.6, 0.25, { fontSize: 9, bold: true, color: C.muted });
  text(slide, "UFFA-48217", 7.7, 2.02, 4.6, 0.35, {
    fontFace: "Consolas",
    fontSize: 15,
    bold: true,
  });
  text(slide, "demo@uffa.pt  ·  UFFA-7K3M-9QX2", 7.7, 2.38, 4.6, 0.3, {
    fontFace: "Consolas",
    fontSize: 10.5,
    color: C.ink,
  });
  slide.addShape(pptx.ShapeType.line, {
    x: 7.7,
    y: 2.85,
    w: 4.5,
    h: 0,
    line: { color: C.line, width: 1 },
  });
  text(slide, "Recolha", 7.7, 3.0, 4.6, 0.25, { fontSize: 9, bold: true, color: C.muted });
  text(slide, "UFFA-73104", 7.7, 3.24, 4.6, 0.35, {
    fontFace: "Consolas",
    fontSize: 15,
    bold: true,
  });
  text(slide, "demo@uffa.pt  ·  UFFA-2P8N-5RV6", 7.7, 3.6, 4.6, 0.3, {
    fontFace: "Consolas",
    fontSize: 10.5,
    color: C.ink,
  });
  slide.addShape(pptx.ShapeType.line, {
    x: 7.7,
    y: 4.07,
    w: 4.5,
    h: 0,
    line: { color: C.line, width: 1 },
  });
  text(slide, "Operações", 7.7, 4.22, 4.6, 0.25, { fontSize: 9, bold: true, color: C.muted });
  text(slide, "UFFA-OPS-2026", 7.7, 4.46, 4.6, 0.35, {
    fontFace: "Consolas",
    fontSize: 15,
    bold: true,
    color: C.primaryDark,
  });
  text(slide, "Chave de demonstração", 7.7, 4.82, 4.6, 0.25, {
    fontSize: 8.5,
    color: C.muted,
  });

  text(slide, "Obrigado.", 0.9, 5.55, 4.0, 0.55, {
    fontFace: DISPLAY,
    fontSize: 30,
    color: C.white,
  });
  text(slide, "atendimento@uffastore.pt", 0.9, 6.15, 4.0, 0.3, {
    fontSize: 11,
    color: C.primary,
  });
  text(slide, "UFFA STORE  ·  PORTO", 10.4, 6.85, 2.2, 0.25, {
    fontSize: 8,
    color: "7E7471",
    align: "right",
  });
  slide.addNotes(
    "Fecho. Repetir a mensagem central: o par não desaparece depois do checkout. Deixar as credenciais no ecrã e passar à demonstração ao vivo. Agradecer.",
  );
}

await pptx.writeFile({ fileName: OUT });
console.log(`PPTX criado: ${OUT}`);
