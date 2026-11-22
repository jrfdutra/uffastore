import { readFile } from "node:fs/promises";
import { createHmac } from "node:crypto";

const SITE = process.env.SITE_URL || "https://www.uffastore.pt";
const WEBHOOKS = [
  { topic: "ORDERS_PAID", path: "/api/webhooks/shopify/orders-paid" },
  { topic: "ORDERS_FULFILLED", path: "/api/webhooks/shopify/orders-fulfilled" },
  { topic: "ORDERS_UPDATED", path: "/api/webhooks/shopify/orders-fulfilled" },
].map((webhook) => ({ ...webhook, url: `${SITE}${webhook.path}` }));
const ENDPOINTS = [...new Set(WEBHOOKS.map((webhook) => webhook.url))];
const WEBHOOK_URL = WEBHOOKS[0].url;
const SEND_REAL = process.argv.includes("--send");

let envRaw = "";
try {
  envRaw = await readFile(new URL("../.env", import.meta.url), "utf8");
} catch {
  // sem .env: usa apenas process.env
}
const get = (key) =>
  process.env[key] ?? envRaw.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim();

const results = [];
const ok = (nome, detalhe = "") => results.push({ ok: true, nome, detalhe });
const fail = (nome, detalhe = "") => results.push({ ok: false, nome, detalhe });

// 1) Shopify: webhook registado
const shopDomain = get("SHOPIFY_ADMIN_STORE_DOMAIN") || "uffastore.myshopify.com";
const shopToken = get("SHOPIFY_ADMIN_ACCESS_TOKEN") || get("SHOPIFY_ADMIN_TOKEN");
try {
  const res = await fetch(`https://${shopDomain}/admin/api/2025-01/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": shopToken },
    body: JSON.stringify({
      query: `{ webhookSubscriptions(first: 50) { nodes { id topic uri format } } }`,
    }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  const hooks = json.data.webhookSubscriptions.nodes;
  for (const webhook of WEBHOOKS) {
    const match = hooks.find((h) => h.topic === webhook.topic && h.uri === webhook.url);
    if (match) ok(`Shopify: webhook ${webhook.topic.toLowerCase()} registado`, match.uri);
    else fail(`Shopify: webhook ${webhook.topic.toLowerCase()} em falta`, webhook.url);
  }
} catch (err) {
  fail("Shopify: não foi possível verificar", err.message);
}

// 2) Resend: domínio verificado
const resendKey = get("RESEND_API_KEY");
if (!resendKey) {
  fail("Resend: RESEND_API_KEY em falta");
} else {
  try {
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${resendKey}` },
    });
    const json = await res.json();
    const verified = (json.data ?? []).filter((d) => d.status === "verified");
    if (verified.length) {
      ok("Resend: domínio verificado", verified.map((d) => d.name).join(", "));
    } else {
      fail("Resend: nenhum domínio verificado", "só entrega ao teu próprio e-mail");
    }
  } catch (err) {
    fail("Resend: não foi possível verificar", err.message);
  }
}

// 3) Produção: endpoints protegidos
for (const url of ENDPOINTS) {
  const path = new URL(url).pathname;
  try {
    const getRes = await fetch(url, { method: "GET" });
    if (getRes.status === 405) ok(`Produção: ${path} ativo (GET 405)`);
    else fail(`Produção: ${path} GET inesperado`, String(getRes.status));

    const postRes = await fetch(url, { method: "POST", body: "{}" });
    if (postRes.status === 401) ok(`Produção: ${path} rejeita sem assinatura (401)`);
    else fail(`Produção: ${path} devia devolver 401`, String(postRes.status));
  } catch (err) {
    fail(`Produção: ${path} inacessível`, err.message);
  }
}

// 4) Segredo real configurado em produção?
const prodSecret = process.env.WEBHOOK_SECRET;
if (!prodSecret) {
  fail(
    "Produção: segredo não testado",
    "define WEBHOOK_SECRET=... (o Signing secret da Shopify) para validar o fluxo",
  );
} else {
  const payload = JSON.stringify({
    name: `#STATUS-${Date.now()}`,
    email: SEND_REAL ? "junior.dutra.pt@gmail.com" : undefined,
    customer: { first_name: "Teste", last_name: "Status" },
    line_items: [
      { title: "Nike Dunk Low", variant_title: "Panda / 42", quantity: 1, price: "119.99" },
    ],
    total_price: "119.99",
  });
  const hmac = createHmac("sha256", prodSecret).update(payload, "utf8").digest("base64");
  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    body: payload,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Hmac-Sha256": hmac,
      "X-Shopify-Topic": "orders/paid",
      "X-Shopify-Shop-Domain": "uffastore.myshopify.com",
      "X-Shopify-Webhook-Id": `status-${Date.now()}`,
    },
  });
  const text = await res.text();
  if (res.status === 200 && !text.includes('"duplicate"')) {
    ok("Produção: assinatura aceite", SEND_REAL ? "e-mail real enviado" : "sem e-mail (teste)");
  } else if (res.status === 401) {
    fail("Produção: segredo errado (401)", "o SHOPIFY_WEBHOOK_SECRET no Vercel não corresponde");
  } else {
    fail("Produção: resposta inesperada", `${res.status} ${text.slice(0, 160)}`);
  }

  // O fulfillment não envia nada sem código; serve só para provar a assinatura.
  const fulfillmentPayload = JSON.stringify({ name: "#STATUS", fulfillments: [] });
  const fulfillmentHmac = createHmac("sha256", prodSecret)
    .update(fulfillmentPayload, "utf8")
    .digest("base64");
  const fulfillmentRes = await fetch(WEBHOOKS[1].url, {
    method: "POST",
    body: fulfillmentPayload,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Hmac-Sha256": fulfillmentHmac,
      "X-Shopify-Topic": "orders/fulfilled",
      "X-Shopify-Shop-Domain": "uffastore.myshopify.com",
      "X-Shopify-Webhook-Id": `status-fulfillment-${Date.now()}`,
    },
  });
  const fulfillmentText = await fulfillmentRes.text();
  if (fulfillmentRes.status === 200) ok("Produção: assinatura do fulfillment aceite");
  else if (fulfillmentRes.status === 401) fail("Produção: fulfillment com segredo errado (401)");
  else
    fail(
      "Produção: fulfillment inesperado",
      `${fulfillmentRes.status} ${fulfillmentText.slice(0, 160)}`,
    );
}

// 5) Vercel: não verificável sem token
if (!get("VERCEL_TOKEN")) {
  results.push({
    ok: false,
    nome: "Vercel: não verificável daqui",
    detalhe: "sem VERCEL_TOKEN local — confirmar no painel",
  });
}

console.log("\n=== Estado da integração UFFA ===\n");
for (const r of results) {
  console.log(`${r.ok ? "✅" : "❌"} ${r.nome}${r.detalhe ? ` — ${r.detalhe}` : ""}`);
}
const falhas = results.filter((r) => !r.ok).length;
console.log(`\n${falhas === 0 ? "Tudo pronto." : `${falhas} ponto(s) a resolver.`}\n`);
process.exit(falhas === 0 ? 0 : 1);
