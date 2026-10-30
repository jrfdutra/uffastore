import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME =
  process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = process.env.BASE_URL ?? "http://localhost:8080";
const OUT = "docs/assets/screenshots";
const PORT = 9333;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForHttp(url, timeoutMs = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // not ready yet
    }
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

  once(method, timeoutMs = 15000) {
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

async function waitForText(cdp, text, timeoutMs = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const found = await evaluate(
      cdp,
      `document.body?.innerText?.toLowerCase().includes(${JSON.stringify(text.toLowerCase())})`,
    );
    if (found) return;
    await sleep(250);
  }
  throw new Error(`Timed out waiting for text: ${text}`);
}

async function navigate(cdp, url, text) {
  const loaded = cdp.once("Page.loadEventFired").catch(() => null);
  await cdp.send("Page.navigate", { url });
  await loaded;
  await sleep(900);
  if (text) await waitForText(cdp, text);
  await sleep(400);
}

async function screenshot(cdp, name, { fullPage = true, selector } = {}) {
  let clip;
  if (selector) {
    const rect = await evaluate(
      cdp,
      `(() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height };
      })()`,
    );
    if (!rect) throw new Error(`Selector not found: ${selector}`);
    clip = { ...rect, scale: 1 };
  } else if (fullPage) {
    const metrics = await cdp.send("Page.getLayoutMetrics");
    const size = metrics.cssContentSize ?? metrics.contentSize;
    clip = { x: 0, y: 0, width: size.width, height: size.height, scale: 1 };
  }
  const result = await cdp.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: true,
    ...(clip ? { clip } : {}),
  });
  const path = join(OUT, `${name}.png`);
  await writeFile(path, Buffer.from(result.data, "base64"));
  console.log(`saved ${path}`);
  return path;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const profile = await mkdtemp(join(tmpdir(), "uffa-shot-"));
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
      "--window-size=1440,1000",
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  try {
    await waitForHttp(`http://127.0.0.1:${PORT}/json/version`);
    const target = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, {
      method: "PUT",
    }).then((response) => response.json());

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener("open", resolve, { once: true });
      ws.addEventListener("error", reject, { once: true });
    });
    const cdp = new Cdp(ws);
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await cdp.send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-color-scheme", value: "light" }],
    });

    await navigate(cdp, `${BASE}/`, "UFFA");
    await evaluate(cdp, `localStorage.setItem("uffa-theme", "light")`);
    await evaluate(cdp, `sessionStorage.clear()`);

    // 01 — Home hero
    await navigate(cdp, `${BASE}/`, "Recolha em mãos");
    await screenshot(cdp, "01-home", { fullPage: true });

    // 02 — Home portal promo (element crop, no sticky header)
    await evaluate(
      cdp,
      `(() => {
        const heading = [...document.querySelectorAll("h2")].find((el) =>
          el.textContent?.includes("não desaparece"),
        );
        const section = heading?.closest("section");
        if (section) section.id = "portal-promo";
      })()`,
    );
    await screenshot(cdp, "02-home-portal-promo", { selector: "#portal-promo" });

    // 03 — Catalog
    await navigate(cdp, `${BASE}/catalogo`, "Todos");
    await screenshot(cdp, "03-catalogo", { fullPage: true });

    // 04 — Product
    await navigate(cdp, `${BASE}/produto/porto-rose-low`, "Porto Rose Low");
    await screenshot(cdp, "04-produto", { fullPage: true });

    // 05 — Checkout
    await evaluate(
      cdp,
      `localStorage.setItem("uffa-cart", JSON.stringify([
        { productId: "porto-rose-low", size: 39, quantity: 1 },
        { productId: "cedofeita-court", size: 40, quantity: 1 }
      ]))`,
    );
    await navigate(cdp, `${BASE}/checkout`, "Secure checkout");
    await screenshot(cdp, "05-checkout", { fullPage: true });

    // 06 — Confirmation
    await navigate(cdp, `${BASE}/confirmacao?order=UFFA-48217`, "Código de exclusividade");
    await screenshot(cdp, "06-confirmacao", { fullPage: true });

    // 07 — Tracking access gate
    await navigate(cdp, `${BASE}/rastreio`, "Desbloquear encomenda");
    await screenshot(cdp, "07-rastreio-acesso", { fullPage: true });

    // 08 — Tracking dashboard
    await evaluate(
      cdp,
      `sessionStorage.setItem("uffa-order-session-v1", JSON.stringify({
        number: "UFFA-48217",
        expiresAt: Date.now() + 30 * 60 * 1000
      }))`,
    );
    await navigate(cdp, `${BASE}/rastreio`, "Estado do envio");
    await screenshot(cdp, "08-rastreio-dashboard", { fullPage: true });
    await evaluate(cdp, `window.scrollTo(0, 0)`);
    await sleep(400);
    await screenshot(cdp, "09-rastreio-topo", { fullPage: false });

    // 10 — Authenticity gate
    await navigate(cdp, `${BASE}/verificar`, "Código de autenticidade");
    await screenshot(cdp, "10-verificar", { fullPage: true });

    // 11 — Authenticity result
    await navigate(cdp, `${BASE}/verificar?codigo=UFFA-AUTH-4K7P-2M9Q`, "Certificado autêntico");
    await screenshot(cdp, "11-verificar-valido", { fullPage: true });

    // 12 — Operations gate
    await navigate(cdp, `${BASE}/operacoes`, "Chave de acesso");
    await screenshot(cdp, "12-operacoes-acesso", { fullPage: true });

    // 13 — Operations panel with selected order
    await evaluate(cdp, `sessionStorage.setItem("uffa-ops-session-v1", "1")`);
    await navigate(cdp, `${BASE}/operacoes`, "Fila de encomendas");
    await evaluate(
      cdp,
      `(() => {
        const button = [...document.querySelectorAll("button")].find((el) =>
          el.textContent?.includes("UFFA-48217"),
        );
        button?.click();
      })()`,
    );
    await waitForText(cdp, "Acesso do cliente");
    await sleep(500);
    await screenshot(cdp, "13-operacoes-painel", { fullPage: true });

    // 15 — Pickup order dashboard
    await evaluate(
      cdp,
      `sessionStorage.setItem("uffa-order-session-v1", JSON.stringify({
        number: "UFFA-73104",
        expiresAt: Date.now() + 30 * 60 * 1000
      }))`,
    );
    await navigate(cdp, `${BASE}/rastreio`, "Pronta para recolha");
    await screenshot(cdp, "15-rastreio-recolha", { fullPage: true });

    // 16 — Invalid authenticity code
    await navigate(cdp, `${BASE}/verificar?codigo=UFFA-AUTH-0000-0000`, "Código inválido");
    await screenshot(cdp, "16-verificar-invalido", { fullPage: true });

    // 17 — Operations panel with pickup order selected
    await evaluate(cdp, `sessionStorage.setItem("uffa-ops-session-v1", "1")`);
    await navigate(cdp, `${BASE}/operacoes`, "Fila de encomendas");
    await evaluate(
      cdp,
      `(() => {
        const button = [...document.querySelectorAll("button")].find((el) =>
          el.textContent?.includes("UFFA-73104"),
        );
        button?.click();
      })()`,
    );
    await waitForText(cdp, "Acesso do cliente");
    await sleep(500);
    await screenshot(cdp, "17-operacoes-recolha", { fullPage: true });

    // 18 — Mobile tracking dashboard
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await evaluate(
      cdp,
      `sessionStorage.setItem("uffa-order-session-v1", JSON.stringify({
        number: "UFFA-48217",
        expiresAt: Date.now() + 30 * 60 * 1000
      }))`,
    );
    await navigate(cdp, `${BASE}/rastreio`, "Estado do envio");
    await screenshot(cdp, "18-rastreio-mobile", { fullPage: true });

    // 19-21 — Mobile store pages
    await navigate(cdp, `${BASE}/`, "Recolha em mãos");
    await screenshot(cdp, "19-home-mobile", { fullPage: false });

    await navigate(cdp, `${BASE}/catalogo`, "Catálogo");
    await screenshot(cdp, "20-catalogo-mobile", { fullPage: false });

    await navigate(cdp, `${BASE}/produto/porto-rose-low`, "Porto Rose Low");
    await screenshot(cdp, "21-produto-mobile", { fullPage: false });

    // 22 — Cart drawer
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 760,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await evaluate(
      cdp,
      `localStorage.setItem("uffa-cart", JSON.stringify([
        { productId: "porto-rose-low", size: 39, quantity: 1 },
        { productId: "cedofeita-court", size: 40, quantity: 1 },
        { productId: "bolhao-runner", size: 41, quantity: 1 },
        { productId: "invicta-01", size: 42, quantity: 1 }
      ]))`,
    );
    await navigate(cdp, `${BASE}/`, "Recolha em mãos");
    await evaluate(
      cdp,
      `(() => {
        const button = [...document.querySelectorAll("button")].find((el) =>
          (el.getAttribute("aria-label") ?? "").toLowerCase().includes("carrinho"),
        );
        button?.click();
      })()`,
    );
    await waitForText(cdp, "Subtotal");
    await sleep(500);
    await screenshot(cdp, "22-cart-drawer", { selector: '[role="dialog"]' });

    // 23-25 — Home section crops
    await navigate(cdp, `${BASE}/`, "Recolha em mãos");
    await evaluate(
      cdp,
      `(() => {
        const hero = document.querySelector("h1")?.closest("section");
        if (hero) hero.id = "home-hero";
        const categories = [...document.querySelectorAll("h2")].find((el) =>
          el.textContent?.includes("Escolhe a tua linha"),
        )?.closest("section");
        if (categories) categories.id = "home-categorias";
        const picks = [...document.querySelectorAll("h2")].find((el) =>
          el.textContent?.includes("Mais procurados"),
        )?.closest("section");
        if (picks) picks.id = "home-picks";
      })()`,
    );
    await screenshot(cdp, "23-home-hero", { selector: "#home-hero" });
    await screenshot(cdp, "24-home-categorias", { selector: "#home-categorias" });
    await screenshot(cdp, "25-home-picks", { selector: "#home-picks" });

    ws.close();
  } finally {
    chrome.kill();
    await sleep(800);
    await rm(profile, { recursive: true, force: true }).catch(() => {});
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
