import { createHmac } from "node:crypto";

const url = process.env.WEBHOOK_URL || "https://www.uffastore.pt/api/webhooks/shopify/orders-paid";
const body = JSON.stringify({ name: "#PROD-CHECK", line_items: [] });

let falhas = 0;
async function check(nome, esperado, executar) {
  try {
    const res = await executar();
    const text = await res.text();
    const ok = res.status === esperado;
    if (!ok) falhas++;
    console.log(`${ok ? "✓" : "✗"} ${nome}: ${res.status}${ok ? "" : ` (esperado ${esperado})`}`);
    if (!ok) console.log(`   corpo: ${text.slice(0, 200)}`);
    return res;
  } catch (err) {
    falhas++;
    console.log(`✗ ${nome}: ${err.message}`);
    return null;
  }
}

console.log(`Alvo: ${url}\n`);

await check("GET é rejeitado (405)", 405, () => fetch(url, { method: "GET" }));
await check("POST sem assinatura (401)", 401, () => fetch(url, { method: "POST", body }));
await check("Assinatura malformada (401)", 401, () =>
  fetch(url, {
    method: "POST",
    body,
    headers: { "X-Shopify-Hmac-Sha256": "invalida", "X-Shopify-Topic": "orders/paid" },
  }),
);
await check("Assinatura com segredo errado (401)", 401, () => {
  const hmac = createHmac("sha256", "segredo-errado").update(body, "utf8").digest("base64");
  return fetch(url, {
    method: "POST",
    body,
    headers: {
      "X-Shopify-Hmac-Sha256": hmac,
      "X-Shopify-Topic": "orders/paid",
      "X-Shopify-Shop-Domain": "uffastore.myshopify.com",
    },
  });
});
const grande = await check("Corpo acima de 1 MB (413)", 413, () =>
  fetch(url, {
    method: "POST",
    body: JSON.stringify({ padding: "x".repeat(1_100_000) }),
    headers: {
      "X-Shopify-Hmac-Sha256": "A".repeat(43) + "=",
      "X-Shopify-Topic": "orders/paid",
    },
  }),
);
if (grande && grande.headers.get("x-content-type-options") !== "nosniff") {
  console.log("   aviso: 413 sem x-content-type-options (pode vir da Vercel antes do handler)");
}

console.log(
  `\n${falhas === 0 ? "Produção: fail-closed confirmado." : `${falhas} teste(s) falharam.`}`,
);
process.exit(falhas === 0 ? 0 : 1);
