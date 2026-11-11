import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const CHROME =
  process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT = resolve("docs/assets/logo-instagram");
const PORT = 9338;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForHttp(url, timeoutMs = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await sleep(200);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.events = new Map();
    ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(message.error.message));
        else resolve(message.result);
        return;
      }
      const listeners = this.events.get(message.method) ?? [];
      for (const listener of listeners) listener(message.params);
    });
  }

  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  once(method, timeoutMs = 20000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timed out: ${method}`)), timeoutMs);
      const listener = (params) => {
        clearTimeout(timer);
        const listeners = this.events.get(method) ?? [];
        this.events.set(
          method,
          listeners.filter((item) => item !== listener),
        );
        resolve(params);
      };
      const listeners = this.events.get(method) ?? [];
      this.events.set(method, [...listeners, listener]);
    });
  }
}

async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text ?? "Evaluation failed");
  }
  return result.result.value;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const profile = await mkdtemp(join(tmpdir(), "uffa-logo-"));
  const chrome = spawn(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      `--user-data-dir=${profile}`,
      `--remote-debugging-port=${PORT}`,
      "--window-size=1280,1000",
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  try {
    await waitForHttp(`http://127.0.0.1:${PORT}/json/version`);
    const target = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, {
      method: "PUT",
    }).then((res) => res.json());

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener("open", resolve, { once: true });
      ws.addEventListener("error", reject, { once: true });
    });

    const cdp = new Cdp(ws);
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");

    console.log("A navegar para https://www.instagram.com/uffastore.legit/ ...");
    const loaded = cdp.once("Page.loadEventFired");
    await cdp.send("Page.navigate", { url: "https://www.instagram.com/uffastore.legit/" });
    await loaded.catch(() => {});
    await sleep(4000);

    // Avaliar elementos e meta tags
    const info = await evaluate(
      cdp,
      `
      (() => {
        const ogImage = document.querySelector('meta[property="og:image"]')?.content || null;
        const ogTitle = document.querySelector('meta[property="og:title"]')?.content || null;
        
        // Procurar tags <img> que possam ser o avatar/logo
        const imgs = Array.from(document.querySelectorAll('img')).map(img => ({
          src: img.src,
          alt: img.alt,
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
          rect: (() => {
            const r = img.getBoundingClientRect();
            return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height };
          })()
        }));

        return { ogImage, ogTitle, imgs, title: document.title, url: location.href };
      })()
    `,
    );

    console.log("Informações obtidas da página:", JSON.stringify(info, null, 2));

    // Se temos ogImage
    if (info.ogImage) {
      console.log("Encontrado og:image:", info.ogImage);
      try {
        const res = await fetch(info.ogImage);
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          await writeFile(join(OUT, "uffastore-logo.jpg"), buf);
          console.log("Gravado logo via og:image em:", join(OUT, "uffastore-logo.jpg"));
        }
      } catch (e) {
        console.error("Erro ao descarregar ogImage:", e);
      }
    }

    // Se não ou além disso, tirar um screenshot da página
    const ss = await cdp.send("Page.captureScreenshot", { format: "png" });
    await writeFile(join(OUT, "instagram-page-preview.png"), Buffer.from(ss.data, "base64"));
    console.log("Screenshot completo gravado em:", join(OUT, "instagram-page-preview.png"));

    ws.close();
  } finally {
    chrome.kill();
    await rm(profile, { recursive: true, force: true }).catch(() => {});
  }
}

main().catch((err) => {
  console.error("Erro no script:", err);
  process.exit(1);
});
