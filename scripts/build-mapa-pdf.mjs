import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const HTML = path.join(ROOT, "docs", "mapa-site.html");
const PDF = path.join(ROOT, "docs", "mapa-site.pdf");
const CHROME =
  process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

if (!existsSync(HTML)) throw new Error(`HTML em falta: ${HTML}`);
if (!existsSync(CHROME)) throw new Error(`Chrome não encontrado: ${CHROME}`);

const result = spawnSync(
  CHROME,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-pdf-header-footer",
    `--print-to-pdf=${PDF}`,
    `file:///${HTML.replace(/\\/g, "/")}`,
  ],
  { stdio: "inherit" },
);

if (result.status !== 0) process.exit(result.status ?? 1);
console.log(`PDF gerado: ${PDF}`);
