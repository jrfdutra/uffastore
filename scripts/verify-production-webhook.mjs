import { createHmac } from "node:crypto";

const SITE = process.env.SITE_URL || "https://www.uffastore.pt";
const targets = process.env.WEBHOOK_URL
  ? [
      {
        url: process.env.WEBHOOK_URL,
        topics: process.env.WEBHOOK_URL.includes("fulfilled")
          ? ["orders/fulfilled", "orders/updated"]
          : ["orders/paid"],
      },
    ]
  : [
      { url: `${SITE}/api/webhooks/shopify/orders-paid`, topics: ["orders/paid"] },
      {
        url: `${SITE}/api/webhooks/shopify/orders-fulfilled`,
        topics: ["orders/fulfilled", "orders/updated"],
      },
    ];

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

for (const { url, topics } of targets) {
  console.log(`\nAlvo: ${url} (${topics.join(", ")})`);
  const body = JSON.stringify({ name: "#PROD-CHECK", line_items: [], fulfillments: [] });

  await check("GET é rejeitado (405)", 405, () => fetch(url, { method: "GET" }));
  await check("POST sem assinatura (401)", 401, () => fetch(url, { method: "POST", body }));

  for (const topic of topics) {
    await check(`Assinatura malformada (401) · ${topic}`, 401, () =>
      fetch(url, {
        method: "POST",
        body,
        headers: { "X-Shopify-Hmac-Sha256": "invalida", "X-Shopify-Topic": topic },
      }),
    );
    await check(`Assinatura com segredo errado (401) · ${topic}`, 401, () => {
      const hmac = createHmac("sha256", "segredo-errado").update(body, "utf8").digest("base64");
      return fetch(url, {
        method: "POST",
        body,
        headers: {
          "X-Shopify-Hmac-Sha256": hmac,
          "X-Shopify-Topic": topic,
          "X-Shopify-Shop-Domain": "uffastore.myshopify.com",
        },
      });
    });
  }

  const grande = await check("Corpo acima de 1 MB (413)", 413, () =>
    fetch(url, {
      method: "POST",
      body: JSON.stringify({ padding: "x".repeat(1_100_000) }),
      headers: {
        "X-Shopify-Hmac-Sha256": "A".repeat(43) + "=",
        "X-Shopify-Topic": topics[0],
      },
    }),
  );
  if (grande && grande.headers.get("x-content-type-options") !== "nosniff") {
    console.log("   aviso: 413 sem x-content-type-options (pode vir da Vercel antes do handler)");
  }
}

console.log(
  `\n${falhas === 0 ? "Produção: fail-closed confirmado." : `${falhas} teste(s) falharam.`}`,
);
process.exit(falhas === 0 ? 0 : 1);
