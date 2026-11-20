import { readFile } from "node:fs/promises";
import { createHmac } from "node:crypto";

const envRaw = await readFile(new URL("../.env", import.meta.url), "utf8");
const secret = envRaw.match(/^SHOPIFY_WEBHOOK_SECRET=(.*)$/m)?.[1]?.trim();
const url = process.env.WEBHOOK_URL || "http://localhost:8082/api/webhooks/shopify/orders-paid";

const body = JSON.stringify({ name: "#TESTE-1001", line_items: [] });
const hmac = createHmac("sha256", secret).update(body, "utf8").digest("base64");

const semAssinatura = await fetch(url, { method: "POST", body });
console.log("Sem assinatura:", semAssinatura.status, await semAssinatura.text());

const comAssinatura = await fetch(url, {
  method: "POST",
  body,
  headers: { "X-Shopify-Hmac-Sha256": hmac, "Content-Type": "application/json" },
});
console.log("Com assinatura (sem e-mail no payload):", comAssinatura.status, await comAssinatura.text());

if (process.argv.includes("--real")) {
  const payload = JSON.stringify({
    name: "#TESTE-1002",
    email: "junior.dutra.pt@gmail.com",
    customer: { first_name: "João", last_name: "Dutra" },
    line_items: [
      { title: "Adidas Campus 00 Offwhite", variant_title: "Offwhite / 42 ⅔", quantity: 1, price: "129.99" },
    ],
    total_price: "129.99",
  });
  const hmacReal = createHmac("sha256", secret).update(payload, "utf8").digest("base64");
  const real = await fetch(url, {
    method: "POST",
    body: payload,
    headers: { "X-Shopify-Hmac-Sha256": hmacReal, "Content-Type": "application/json" },
  });
  console.log("Envio real:", real.status, await real.text());
}
