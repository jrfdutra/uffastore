/**
 * Gera docs/manual-site.html a partir de docs/manual-site.md
 * com a mesma identidade visual de docs/apresentacao-site-uffa.pptx.
 *
 *   node scripts/build-manual.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "docs", "manual-site.md");
const OUT = path.join(ROOT, "docs", "manual-site.html");
const COVER_IMG = "assets/manual/cover.jpg";

const source = fs.readFileSync(SRC, "utf8").replace(/\r\n/g, "\n");

/* ------------------------------------------------------------------ */
/* Capa                                                                */
/* ------------------------------------------------------------------ */

const bodyStart = source.indexOf('<a id="indice"></a>');
const coverSource = source.slice(0, bodyStart);
const bodySource = source.slice(bodyStart);

function coverTable(block) {
  const rows = block
    .split("\n")
    .filter((line) => line.trim().startsWith("|"))
    .map((line) =>
      line
        .trim()
        .replace(/^\||\|$/g, "")
        .split("|")
        .map((cell) => cell.trim()),
    )
    .filter((cells) => !cells.every((cell) => /^:?-{2,}:?$/.test(cell)));
  const [, ...items] = rows;
  return items;
}

const coverMeta = coverTable(coverSource);
const coverCallout = coverSource
  .split("\n")
  .filter((line) => line.trim().startsWith("> "))
  .map((line) => line.replace(/^\s*>\s?/, ""))
  .join(" ")
  .replace(/^\*\*(.+?)\.\*\*\s*/, "$1|");

function coverNote() {
  if (!coverCallout) return "";
  const [label, text] = coverCallout.split("|");
  return `<aside class="intro-note"><span>${esc(label)}</span><p>${inline(text)}</p></aside>`;
}

/* ------------------------------------------------------------------ */
/* Markdown mínimo                                                     */
/* ------------------------------------------------------------------ */

function esc(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inline(value) {
  let out = esc(value);
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return out;
}

const CALLOUTS = {
  nota: { label: "Nota", cls: "nota" },
  dica: { label: "Dica", cls: "dica" },
  demo: { label: "Demo", cls: "demo" },
  atenção: { label: "Atenção", cls: "atencao" },
  atencao: { label: "Atenção", cls: "atencao" },
  "checklist de demonstração": { label: "Checklist de demonstração", cls: "check" },
};

function callout(raw) {
  const text = raw.replace(/^\s*>\s?/, "").trim();
  const match = text.match(/^\*\*(.+?)\.\*\*\s*(.*)$/);
  if (!match) {
    return `<aside class="callout callout--nota"><p>${inline(text.replace(/^>\s?/, ""))}</p></aside>`;
  }
  const rawLabel = match[1].trim();
  const key = rawLabel.toLowerCase();
  const config = CALLOUTS[key] ?? { label: rawLabel, cls: "nota" };
  return `<aside class="callout callout--${config.cls}"><span class="callout__label">${esc(
    config.label,
  )}</span><p>${inline(match[2])}</p></aside>`;
}

function table(block) {
  const lines = block.split("\n").filter((line) => line.trim().startsWith("|"));
  const rows = lines
    .map((line) =>
      line
        .trim()
        .replace(/^\||\|$/g, "")
        .split("|")
        .map((cell) => cell.trim()),
    )
    .filter((cells) => !cells.every((cell) => /^:?-{2,}:?$/.test(cell)));
  if (!rows.length) return "";
  const [head, ...rest] = rows;
  const headHtml = head.map((cell) => `<th>${inline(cell)}</th>`).join("");
  const bodyHtml = rest
    .map((cells) => `<tr>${cells.map((cell) => `<td>${inline(cell)}</td>`).join("")}</tr>`)
    .join("");
  return `<div class="table-wrap"><table><thead><tr>${headHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></div>`;
}

function list(block) {
  const lines = block.split("\n").filter((line) => line.trim());
  const ordered = /^\s*\d+\.\s/.test(lines[0]);
  const items = lines.map((line) => line.replace(/^\s*(?:[-*]|\d+\.)\s+/, ""));
  const tag = ordered ? "ol" : "ul";
  return `<${tag}>${items.map((item) => `<li>${inline(item)}</li>`).join("")}</${tag}>`;
}

const CHAPTER_RE = /^## (.+)$/;

/* ------------------------------------------------------------------ */
/* Render do corpo                                                     */
/* ------------------------------------------------------------------ */

const lines = bodySource.split("\n");
const chapters = [];
const TOTAL = (bodySource.match(/^## /gm) || []).length;
let page = 1;

function chapterMeta(heading) {
  const indexMatch = heading.match(/^(\d{1,2})\s*\/\s*(.+)$/);
  if (indexMatch) {
    return {
      code: indexMatch[1].padStart(2, "0"),
      title: indexMatch[2].trim(),
      label: `${indexMatch[1].padStart(2, "0")} / ${indexMatch[2].trim()}`,
      kind: "chapter",
    };
  }
  const annexMatch = heading.match(/^ANEXO\s+([A-Z])\s*[—-]\s*(.+)$/i);
  if (annexMatch) {
    return {
      code: annexMatch[1].toUpperCase(),
      title: annexMatch[2].trim(),
      label: `ANEXO ${annexMatch[1].toUpperCase()} · ${annexMatch[2].trim()}`,
      kind: "annex",
    };
  }
  return { code: "00", title: heading, label: heading.toUpperCase(), kind: "front" };
}

function renderBody() {
  let html = "";
  let i = 0;
  let current = null;
  let pendingAnchor = null;
  let claimUsed = false;
  let buffer = [];

  const flushParagraph = () => {
    if (!buffer.length) return;
    const text = buffer.join(" ").trim();
    buffer = [];
    if (!text) return;
    const image = text.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (image) {
      const phone = /mobile/i.test(image[1]) || /mobile/i.test(image[2]);
      html += `<figure class="${phone ? "figure--phone" : "figure--screen"}"><img src="${image[2]}" alt="${esc(
        image[1],
      )}" loading="lazy"><figcaption>${inline(image[1])}${
        phone
          ? ""
          : ` <a class="figure-link" href="${image[2]}" target="_blank" rel="noopener">Ver captura completa ↗</a>`
      }</figcaption></figure>`;
      return;
    }
    html += `<p>${inline(text)}</p>`;
  };

  const closeChapter = () => {
    if (!current) return;
    flushParagraph();
    html += `<footer class="chapter-foot"><span>UFFA Store · Manual do Site · v2.0</span><span>${String(
      page,
    ).padStart(2, "0")} / ${String(TOTAL).padStart(2, "0")}</span></footer></section>`;
    page += 1;
    current = null;
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      i += 1;
      continue;
    }

    const anchor = trimmed.match(/^<a id="([^"]+)"><\/a>$/);
    if (anchor) {
      pendingAnchor = anchor[1];
      i += 1;
      continue;
    }

    if (trimmed === "---") {
      flushParagraph();
      i += 1;
      continue;
    }

    const heading = line.match(CHAPTER_RE);
    if (heading) {
      flushParagraph();
      closeChapter();
      const meta = chapterMeta(heading[1]);
      const id = pendingAnchor ?? `cap-${meta.code}`;
      pendingAnchor = null;
      claimUsed = false;
      current = meta;
      chapters.push({ ...meta, id });
      html += `<section class="chapter chapter--${meta.kind}" id="${id}">`;
      html += `<header class="chapter-head"><p class="eyebrow">${
        meta.kind === "chapter" ? `${meta.code} / ${esc(meta.title)}` : esc(meta.label)
      }</p><h2>${esc(meta.title)}</h2><span class="rule"></span></header>`;
      i += 1;
      continue;
    }

    const sub = line.match(/^### (.+)$/);
    if (sub) {
      flushParagraph();
      if (!claimUsed) {
        claimUsed = true;
        html += `<p class="chapter-claim">${inline(sub[1])}</p>`;
      } else {
        html += `<h3>${inline(sub[1])}</h3>`;
      }
      i += 1;
      continue;
    }

    if (line.startsWith("```")) {
      flushParagraph();
      const lang = line.slice(3).trim();
      const code = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith("```")) {
        code.push(lines[i]);
        i += 1;
      }
      i += 1;
      html += `<pre class="code"${lang ? ` data-lang="${esc(lang)}"` : ""}><code>${esc(
        code.join("\n"),
      )}</code></pre>`;
      continue;
    }

    if (trimmed.startsWith(">")) {
      flushParagraph();
      const quote = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quote.push(lines[i]);
        i += 1;
      }
      html += callout(quote.join(" "));
      continue;
    }

    if (
      trimmed.startsWith("|") &&
      i + 1 < lines.length &&
      /^\|[\s:|-]+\|$/.test(lines[i + 1].trim())
    ) {
      flushParagraph();
      const block = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        block.push(lines[i]);
        i += 1;
      }
      html += table(block.join("\n"));
      continue;
    }

    if (/^\s*(?:[-*]|\d+\.)\s+/.test(line)) {
      flushParagraph();
      const block = [];
      while (i < lines.length && /^\s*(?:[-*]|\d+\.)\s+/.test(lines[i])) {
        block.push(lines[i]);
        i += 1;
      }
      html += list(block.join("\n"));
      continue;
    }

    buffer.push(trimmed);
    i += 1;
  }

  flushParagraph();
  closeChapter();
  return html;
}

const bodyHtml = renderBody();

/* ------------------------------------------------------------------ */
/* Navegação                                                           */
/* ------------------------------------------------------------------ */

function navLabel(chapter) {
  if (chapter.kind === "chapter") {
    const short = chapter.title.toLowerCase().replace(/^\w/, (char) => char.toUpperCase());
    return `<b>${chapter.code}</b><span>${esc(short)}</span>`;
  }
  if (chapter.kind === "annex") {
    return `<b>${chapter.code}</b><span>${esc(
      chapter.title.charAt(0) + chapter.title.slice(1).toLowerCase(),
    )}</span>`;
  }
  return `<b>·</b><span>Índice</span>`;
}

const nav = chapters.map((chapter) => `<a href="#${chapter.id}">${navLabel(chapter)}</a>`).join("");

/* ------------------------------------------------------------------ */
/* Documento                                                           */
/* ------------------------------------------------------------------ */

const metaHtml = coverMeta
  .map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${inline(value)}</dd></div>`)
  .join("");

const document = `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>UFFA Store — Manual do Site</title>
<meta name="description" content="Manual funcional e operacional do site UFFA Store: catálogo, checkout, portal de encomendas, autenticidade e operações.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  :root {
    --ink: #0e0e0e;
    --cream: #fdf6f3;
    --white: #ffffff;
    --primary: #c97899;
    --primary-soft: #f4e2e9;
    --primary-dark: #9e4e6a;
    --muted: #7c6e6a;
    --line: #e5d6d0;
    --section: #f7efeb;
    --green: #0f9d76;
    --red: #c62828;
    --display: Impact, Anton, "Arial Black", sans-serif;
    --body: "Segoe UI", Inter, system-ui, -apple-system, sans-serif;
  }

  * { box-sizing: border-box; }

  html { scroll-behavior: smooth; }

  body {
    margin: 0;
    background: var(--section);
    color: var(--ink);
    font-family: var(--body);
    font-size: 15px;
    line-height: 1.65;
    -webkit-font-smoothing: antialiased;
  }

  a { color: var(--primary-dark); text-decoration-color: var(--primary); text-underline-offset: 3px; }
  a:hover { color: var(--ink); }

  /* ---------- Capa ---------- */
  .cover {
    position: relative;
    min-height: 100vh;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 420px;
    gap: 56px;
    align-items: center;
    padding: 64px clamp(28px, 5vw, 72px);
    background: var(--ink);
    color: var(--white);
    overflow: hidden;
  }
  .cover::before {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: 14px;
    background: var(--primary);
  }
  .cover__text { position: relative; z-index: 1; max-width: 640px; }
  .eyebrow {
    margin: 0 0 14px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--primary);
  }
  .cover h1 {
    margin: 0;
    font-family: var(--display);
    font-weight: 400;
    font-size: clamp(64px, 8vw, 108px);
    line-height: 0.88;
    letter-spacing: 0.01em;
    text-transform: uppercase;
  }
  .cover h1 span { display: block; }
  .cover h1 .pink { color: var(--primary); }
  .cover__sub {
    margin: 22px 0 0;
    font-size: clamp(20px, 2.4vw, 30px);
    font-weight: 700;
    letter-spacing: -0.01em;
  }
  .cover__tagline {
    margin: 14px 0 0;
    font-size: 17px;
    font-weight: 600;
    color: var(--primary-soft);
    max-width: 34ch;
  }
  .cover__desc {
    margin: 12px 0 0;
    font-size: 14px;
    line-height: 1.6;
    color: #d9cbc6;
    max-width: 52ch;
  }
  .cover__rule { display: block; width: 78px; height: 5px; margin: 26px 0 22px; background: var(--primary); }
  .cover__meta {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px 26px;
    margin: 0;
  }
  .cover__meta div { border-top: 1px solid #332b29; padding-top: 8px; }
  .cover__meta dt {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: #9a8c87;
  }
  .cover__meta dd { margin: 2px 0 0; font-size: 12.5px; color: #f0e5e1; }
  .cover__foot {
    margin: 30px 0 0;
    font-size: 11px;
    letter-spacing: 0.08em;
    color: #8d7f7a;
  }
  .cover__media {
    position: relative;
    align-self: stretch;
    max-height: 78vh;
    border: 6px solid var(--primary);
    background: var(--primary);
  }
  .cover__media img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .cover__pill {
    position: absolute;
    left: 50%;
    bottom: 18px;
    transform: translateX(-50%);
    white-space: nowrap;
    background: var(--white);
    color: var(--ink);
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.08em;
    padding: 8px 16px;
    border-radius: 999px;
  }

  /* ---------- Estrutura ---------- */
  .shell {
    display: grid;
    grid-template-columns: 272px minmax(0, 1fr);
    align-items: start;
    max-width: 1320px;
    margin: 0 auto;
  }
  .sidebar {
    position: sticky;
    top: 0;
    align-self: start;
    height: 100vh;
    overflow-y: auto;
    background: var(--ink);
    color: var(--cream);
    padding: 34px 26px 30px;
  }
  .sidebar__mark {
    font-family: var(--display);
    font-size: 26px;
    line-height: 0.9;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }
  .sidebar__mark span { color: var(--primary); }
  .sidebar__sub {
    margin: 8px 0 22px;
    font-size: 9.5px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #9a8c87;
  }
  .sidebar nav { display: flex; flex-direction: column; gap: 2px; }
  .sidebar nav a {
    display: flex;
    gap: 10px;
    align-items: baseline;
    padding: 6px 8px;
    color: #d9cbc6;
    text-decoration: none;
    font-size: 12.5px;
    border-left: 2px solid transparent;
  }
  .sidebar nav a b {
    font-size: 9.5px;
    letter-spacing: 0.1em;
    color: var(--primary);
    min-width: 20px;
  }
  .sidebar nav a:hover { background: #1c1817; color: var(--white); border-left-color: var(--primary); }
  .sidebar__print {
    margin-top: 24px;
    width: 100%;
    padding: 10px 12px;
    background: var(--primary);
    color: var(--ink);
    border: 0;
    font-family: var(--body);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    cursor: pointer;
  }
  .sidebar__print:hover { background: var(--primary-soft); }

  main { padding: 0 clamp(22px, 4vw, 56px) 80px; min-width: 0; }

  .chapter {
    max-width: 860px;
    padding: 64px 0 0;
    scroll-margin-top: 20px;
  }
  .chapter + .chapter { border-top: 1px solid var(--line); margin-top: 64px; }

  .chapter-head { margin-bottom: 26px; }
  .chapter-head h2 {
    margin: 0;
    font-family: var(--display);
    font-weight: 400;
    font-size: clamp(34px, 4.2vw, 52px);
    line-height: 0.95;
    letter-spacing: 0.01em;
    text-transform: uppercase;
  }
  .rule { display: block; width: 46px; height: 4px; margin-top: 14px; background: var(--primary); }

  .chapter-claim {
    margin: 0 0 22px;
    font-size: clamp(19px, 2.2vw, 25px);
    font-weight: 700;
    line-height: 1.3;
    color: var(--primary-dark);
    letter-spacing: -0.01em;
    max-width: 40ch;
  }

  h3 {
    margin: 38px 0 10px;
    font-size: 18px;
    font-weight: 800;
    letter-spacing: -0.01em;
  }
  h3::before {
    content: "";
    display: inline-block;
    width: 8px;
    height: 8px;
    margin-right: 10px;
    background: var(--primary);
    vertical-align: 2px;
  }

  p { margin: 0 0 14px; }
  strong { font-weight: 700; }
  em { font-style: italic; }

  ul, ol { margin: 0 0 18px; padding-left: 0; list-style: none; }
  ul li, ol li { position: relative; padding-left: 24px; margin-bottom: 8px; }
  ul li::before {
    content: "";
    position: absolute;
    left: 2px;
    top: 10px;
    width: 7px;
    height: 7px;
    background: var(--primary);
  }
  ol { counter-reset: step; }
  ol li { counter-increment: step; }
  ol li::before {
    content: counter(step, decimal-leading-zero);
    position: absolute;
    left: 0;
    top: 0;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: var(--primary-dark);
  }

  code {
    font-family: "Cascadia Mono", Consolas, monospace;
    font-size: 0.86em;
    background: var(--primary-soft);
    color: var(--primary-dark);
    padding: 2px 6px;
    border-radius: 3px;
    white-space: nowrap;
  }

  .code {
    margin: 0 0 20px;
    padding: 18px 20px;
    background: var(--ink);
    color: #f0e5e1;
    border-left: 4px solid var(--primary);
    overflow-x: auto;
    font-size: 12.5px;
    line-height: 1.7;
  }
  .code code { background: none; color: inherit; padding: 0; white-space: pre; font-size: inherit; }

  .table-wrap { margin: 0 0 22px; overflow-x: auto; border: 1px solid var(--line); background: var(--white); }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  thead th {
    background: var(--section);
    text-align: left;
    font-size: 9.5px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--primary-dark);
    padding: 10px 14px;
    border-bottom: 2px solid var(--primary);
    white-space: nowrap;
  }
  tbody td { padding: 10px 14px; border-bottom: 1px solid var(--line); vertical-align: top; }
  tbody tr:last-child td { border-bottom: 0; }
  tbody tr:nth-child(even) { background: #fdfaf8; }

  figure { margin: 22px 0 26px; }
  figure img {
    display: block;
    width: 100%;
    height: auto;
    max-height: 820px;
    object-fit: cover;
    object-position: top center;
    background: var(--white);
    border: 1px solid var(--line);
    padding: 6px;
  }
  figure.figure--phone img {
    width: auto;
    max-width: 300px;
    max-height: none;
    object-fit: contain;
    margin: 0 auto;
  }
  figcaption {
    margin-top: 8px;
    font-size: 11.5px;
    color: var(--muted);
    letter-spacing: 0.01em;
  }
  .figure-link {
    display: inline-block;
    margin-left: 6px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--primary-dark);
    text-decoration: none;
    border-bottom: 1px solid var(--primary);
  }

  .callout {
    position: relative;
    margin: 24px 0;
    padding: 16px 20px 16px 22px;
    background: var(--white);
    border: 1px solid var(--line);
    border-left: 4px solid var(--primary);
  }
  .callout__label {
    display: block;
    margin-bottom: 4px;
    font-size: 9.5px;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--primary-dark);
  }
  .callout p { margin: 0; font-size: 13.5px; }
  .callout--dica { border-left-color: var(--green); }
  .callout--dica .callout__label { color: var(--green); }
  .callout--atencao { border-left-color: var(--red); }
  .callout--atencao .callout__label { color: var(--red); }
  .callout--check {
    background: var(--ink);
    border-color: var(--ink);
    border-left-color: var(--primary);
    color: var(--cream);
  }
  .callout--check .callout__label { color: var(--primary); }
  .callout--check p { color: #e8dcd7; }

  .intro-note {
    display: grid;
    grid-template-columns: 150px minmax(0, 1fr);
    gap: 20px;
    margin: 0 0 34px;
    padding: 18px 22px;
    background: var(--primary-soft);
    border-left: 4px solid var(--primary);
  }
  .intro-note span {
    font-size: 9.5px;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--primary-dark);
    padding-top: 3px;
  }
  .intro-note p { margin: 0; font-size: 13.5px; }

  .chapter-foot {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    margin-top: 52px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
    font-size: 10px;
    letter-spacing: 0.06em;
    color: var(--muted);
  }

  .chapter--front .chapter-head h2 { font-size: clamp(30px, 3.4vw, 42px); }

  @media (max-width: 980px) {
    .cover { grid-template-columns: 1fr; min-height: auto; padding: 52px 26px; gap: 32px; }
    .cover__media { max-height: 380px; order: -1; }
    .shell { grid-template-columns: 1fr; }
    .sidebar { position: static; height: auto; }
    .sidebar nav { flex-direction: row; flex-wrap: wrap; }
    .sidebar nav a { border-left: 0; border-bottom: 2px solid transparent; }
    .sidebar nav a:hover { border-left: 0; border-bottom-color: var(--primary); }
    .sidebar__print { width: auto; }
    main { padding: 0 22px 60px; }
    .chapter { padding-top: 46px; }
    .chapter + .chapter { margin-top: 46px; }
    .intro-note { grid-template-columns: 1fr; gap: 6px; }
    figure img { max-height: none; }
  }

  @media print {
    @page { size: A4; margin: 16mm 14mm; }
    body { background: var(--white); font-size: 10.5pt; }
    .sidebar { display: none; }
    .shell { display: block; max-width: none; }
    main { padding: 0; }
    .cover {
      min-height: 0;
      height: 100vh;
      page-break-after: always;
      grid-template-columns: 1fr 300px;
      gap: 30px;
      padding: 24mm 16mm;
    }
    .cover h1 { font-size: 76pt; }
    .cover__meta { grid-template-columns: 1fr 1fr; }
    .chapter { max-width: none; padding-top: 0; margin: 0; border: 0; page-break-before: always; }
    .chapter-head h2 { font-size: 30pt; }
    .chapter-claim { font-size: 15pt; }
    h3 { font-size: 12pt; }
    .table-wrap, figure, .callout { page-break-inside: avoid; }
    figure img { max-height: 170mm; object-fit: contain; }
    figure.figure--phone img { max-width: 66mm; }
    .callout--check { background: var(--white); color: var(--ink); border: 1px solid var(--line); border-left: 4px solid var(--primary); }
    .callout--check p { color: var(--ink); }
    a { color: var(--ink); text-decoration: none; }
  }
</style>
</head>
<body>

<header class="cover" id="topo">
  <div class="cover__text">
    <p class="eyebrow">UFFA Store · Porto · Sneakers verificados</p>
    <h1><span>UFFA</span><span class="pink">STORE.</span></h1>
    <p class="cover__sub">Manual do Site</p>
    <p class="cover__tagline">Da descoberta à autenticidade — tudo o que o site faz, ecrã a ecrã.</p>
    <p class="cover__desc">Manual funcional e operacional da loja online UFFA Store. Segue a mesma estrutura, identidade e numeração da apresentação <strong>apresentacao-site-uffa.pptx</strong>: doze capítulos e quatro anexos.</p>
    <span class="cover__rule"></span>
    <dl class="cover__meta">${metaHtml}</dl>
    <p class="cover__foot">Documentação e demonstração · 2026 · versão 2.0</p>
  </div>
  <div class="cover__media">
    <img src="${COVER_IMG}" alt="Porto Rose Low">
    <span class="cover__pill">PORTO ROSE LOW · 0,20 €</span>
  </div>
</header>

<div class="shell">
  <aside class="sidebar">
    <div class="sidebar__mark">UFFA <span>Store.</span></div>
    <p class="sidebar__sub">Manual do Site · v2.0</p>
    <nav>${nav}</nav>
    <button class="sidebar__print" onclick="window.print()">Imprimir / PDF</button>
  </aside>
  <main>
    ${coverNote()}
    ${bodyHtml}
  </main>
</div>

</body>
</html>
`;

fs.writeFileSync(OUT, document, "utf8");
console.log(`Manual criado: ${OUT}`);
console.log(`Capítulos: ${chapters.length} · ${(document.length / 1024).toFixed(0)} KB`);
