import { readFile } from "node:fs/promises";
import { createHmac } from "node:crypto";

const envRaw = await readFile(new URL("../.env", import.meta.url), "utf8");
const fromEnvFile = (key) => envRaw.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim();

const secret = process.env.WEBHOOK_SECRET || fromEnvFile("SHOPIFY_WEBHOOK_SECRET");
const url = process.env.WEBHOOK_URL || "http://localhost:8082/api/webhooks/shopify/orders-paid";
const shopDomain =
  process.env.SHOPIFY_SHOP_DOMAIN ||
  fromEnvFile("SHOPIFY_SHOP_DOMAIN") ||
  "uffastore.myshopify.com";
const REAL = process.argv.includes("--real");

if (!secret) {
  console.error("Falta SHOPIFY_WEBHOOK_SECRET (ou WEBHOOK_SECRET).");
  process.exit(1);
}

const sign = (body) => createHmac("sha256", secret).update(body, "utf8").digest("base64");

let falhas = 0;
async function check(nome, esperado, executar) {
  let status;
  let body;
  let headers;
  try {
    const res = await executar();
    status = res.status;
    body = await res.text();
    headers = res.headers;
  } catch (err) {
    console.log(`✗ ${nome}: erro de rede — ${err.message}`);
    falhas++;
    return;
  }
  const ok = status === esperado;
  if (!ok) falhas++;
  console.log(`${ok ? "✓" : "✗"} ${nome}: ${status}${ok ? "" : ` (esperado ${esperado})`}`);
  if (!ok) console.log(`   corpo: ${body.slice(0, 300)}`);
  if (
    ok &&
    headers?.get("x-content-type-options") !== "nosniff" &&
    status !== 401 &&
    status !== 405
  ) {
    console.log("   aviso: falta x-content-type-options: nosniff");
  }
}

function post(body, headers = {}) {
  return fetch(url, {
    method: "POST",
    body,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Shop-Domain": shopDomain,
      ...headers,
    },
  });
}

function assinado(body, extra = {}) {
  return post(body, {
    "X-Shopify-Hmac-Sha256": sign(body),
    "X-Shopify-Topic": "orders/paid",
    "X-Shopify-Webhook-Id": `teste-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    ...extra,
  });
}

const bodyValido = JSON.stringify({
  name: "#SEGURANCA-1",
  email: "cliente@exemplo.pt",
  customer: { first_name: "Teste", last_name: "Segurança" },
  line_items: [
    { title: "Nike Dunk Low", variant_title: "Panda / 42", quantity: 1, price: "119.99" },
  ],
  total_price: "119.99",
});

console.log(`Alvo: ${url}\n`);

await check("GET é rejeitado (405)", 405, () => fetch(url, { method: "GET" }));
await check("POST sem assinatura (401)", 401, () => post(bodyValido));
await check("Assinatura inválida (401)", 401, () =>
  post(bodyValido, {
    "X-Shopify-Hmac-Sha256": "A".repeat(43) + "=",
    "X-Shopify-Topic": "orders/paid",
  }),
);
await check("Assinatura de outro corpo (401)", 401, () =>
  post(JSON.stringify({ name: "#OUTRO" }), {
    "X-Shopify-Hmac-Sha256": sign(bodyValido),
    "X-Shopify-Topic": "orders/paid",
  }),
);
await check("Tópico errado (400)", 400, () =>
  assinado(bodyValido, { "X-Shopify-Topic": "orders/cancelled" }),
);
await check("Sem tópico (400)", 400, () => {
  const body = bodyValido;
  return post(body, {
    "X-Shopify-Hmac-Sha256": sign(body),
    "X-Shopify-Webhook-Id": `teste-${Date.now()}`,
  });
});
await check("Payload inválido (400)", 400, () => assinado("{ isto não é json"));
await check("Pedido sem e-mail (200, no_email)", 200, () =>
  assinado(JSON.stringify({ name: "#SEM-EMAIL", line_items: [] })),
);
await check("Corpo acima de 1 MB (413)", 413, () =>
  assinado(JSON.stringify({ name: "#GRANDE", padding: "x".repeat(1_100_000) })),
);

if (REAL) {
  const eventId = `real-${Date.now()}`;
  const payload = JSON.stringify({
    name: `#TESTE-${Date.now()}`,
    email: "junior.dutra.pt@gmail.com",
    customer: { first_name: "João", last_name: "Dutra" },
    line_items: [
      {
        title: "Adidas Campus 00 Offwhite",
        variant_title: "Offwhite / 42 ⅔",
        quantity: 1,
        price: "129.99",
      },
    ],
    total_price: "129.99",
  });

  await check("Pedido real com e-mail (200)", 200, () =>
    assinado(payload, { "X-Shopify-Webhook-Id": eventId }),
  );

  // Replay do mesmo evento: não pode gerar um segundo e-mail.
  const replay = await assinado(payload, { "X-Shopify-Webhook-Id": eventId });
  const replayBody = await replay.text();
  const replayOk = replay.status === 200 && replayBody.includes('"duplicate":true');
  if (!replayOk) falhas++;
  console.log(`${replayOk ? "✓" : "✗"} Replay do mesmo evento não reenvia (200, duplicate)`);
  if (!replayOk) console.log(`   corpo: ${replayBody.slice(0, 300)}`);
}

console.log(
  `\n${falhas === 0 ? "Todos os testes de segurança passaram." : `${falhas} teste(s) falharam.`}`,
);
process.exit(falhas === 0 ? 0 : 1);
