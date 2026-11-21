import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";

import {
  MAX_BODY_BYTES,
  WebhookDeduplicator,
  isExpectedShop,
  isExpectedTopic,
  parseOrderPaidPayload,
  verifyShopifyHmac,
} from "./webhook-core.ts";

const SECRET = "test-secret-uffa-2026";

function sign(body: string, secret = SECRET): string {
  return createHmac("sha256", secret).update(body, "utf8").digest("base64");
}

function withSecret<T>(secret: string | undefined, fn: () => T): T {
  const previous = process.env["SHOPIFY_WEBHOOK_SECRET"];
  if (secret === undefined) delete process.env["SHOPIFY_WEBHOOK_SECRET"];
  else process.env["SHOPIFY_WEBHOOK_SECRET"] = secret;
  try {
    return fn();
  } finally {
    if (previous === undefined) delete process.env["SHOPIFY_WEBHOOK_SECRET"];
    else process.env["SHOPIFY_WEBHOOK_SECRET"] = previous;
  }
}

// ---------------- HMAC ----------------

test("HMAC: assinatura correta é aceite", () => {
  const body = JSON.stringify({ name: "#1001" });
  withSecret(SECRET, () => {
    assert.equal(verifyShopifyHmac(body, sign(body)), true);
  });
});

test("HMAC: assinatura com um byte alterado é rejeitada", () => {
  const body = JSON.stringify({ name: "#1001" });
  const good = sign(body);
  const tampered = `${good.slice(0, -2)}${good.endsWith("A=") ? "B=" : "A="}`;
  withSecret(SECRET, () => {
    assert.equal(verifyShopifyHmac(body, tampered), false);
  });
});

test("HMAC: corpo adulterado depois de assinado é rejeitado", () => {
  const original = JSON.stringify({ name: "#1001", total_price: "10.00" });
  const changed = JSON.stringify({ name: "#1001", total_price: "0.01" });
  withSecret(SECRET, () => {
    assert.equal(verifyShopifyHmac(changed, sign(original)), false);
  });
});

test("HMAC: assinatura ausente é rejeitada", () => {
  withSecret(SECRET, () => {
    assert.equal(verifyShopifyHmac("{}", null), false);
    assert.equal(verifyShopifyHmac("{}", ""), false);
  });
});

test("HMAC: assinatura feita com outro segredo é rejeitada", () => {
  const body = JSON.stringify({ name: "#1001" });
  withSecret(SECRET, () => {
    assert.equal(verifyShopifyHmac(body, sign(body, "segredo-do-atacante")), false);
  });
});

test("HMAC: fail-closed quando o segredo não está configurado", () => {
  const body = JSON.stringify({ name: "#1001" });
  withSecret(undefined, () => {
    assert.equal(verifyShopifyHmac(body, sign(body)), false);
  });
});

test("HMAC: segredo vazio/whitespace é tratado como não configurado", () => {
  const body = JSON.stringify({ name: "#1001" });
  withSecret("   ", () => {
    assert.equal(verifyShopifyHmac(body, sign(body, "   ")), false);
  });
});

test("HMAC: cabeçalho malformado não lança e é rejeitado", () => {
  withSecret(SECRET, () => {
    for (const bad of ["abc", "!!!", "x".repeat(44), "A".repeat(100)]) {
      assert.doesNotThrow(() => verifyShopifyHmac("{}", bad));
      assert.equal(verifyShopifyHmac("{}", bad), false);
    }
  });
});

test("HMAC: assinatura válida de outro corpo (replay de assinatura) é rejeitada", () => {
  const bodyA = JSON.stringify({ name: "#A" });
  const bodyB = JSON.stringify({ name: "#B" });
  withSecret(SECRET, () => {
    assert.equal(verifyShopifyHmac(bodyB, sign(bodyA)), false);
  });
});

test("HMAC: aceita o cabeçalho com espaços à volta", () => {
  const body = JSON.stringify({ name: "#1001" });
  withSecret(SECRET, () => {
    assert.equal(verifyShopifyHmac(body, `  ${sign(body)}  `), true);
  });
});

// ---------------- Tópico / loja ----------------

test("Tópico: só orders/paid é aceite", () => {
  assert.equal(isExpectedTopic("orders/paid"), true);
  assert.equal(isExpectedTopic("ORDERS/PAID"), true);
  assert.equal(isExpectedTopic(" orders/paid "), true);
  assert.equal(isExpectedTopic("orders/create"), false);
  assert.equal(isExpectedTopic("orders/cancelled"), false);
  assert.equal(isExpectedTopic(null), false);
  assert.equal(isExpectedTopic(""), false);
});

test("Loja: só a loja configurada é aceite", () => {
  const previous = process.env["SHOPIFY_SHOP_DOMAIN"];
  try {
    delete process.env["SHOPIFY_SHOP_DOMAIN"];
    assert.equal(isExpectedShop("outra-loja.myshopify.com"), true, "sem env, não bloqueia");

    process.env["SHOPIFY_SHOP_DOMAIN"] = "uffastore.myshopify.com";
    assert.equal(isExpectedShop("uffastore.myshopify.com"), true);
    assert.equal(isExpectedShop("UFFASTORE.myshopify.com"), true);
    assert.equal(isExpectedShop("outra-loja.myshopify.com"), false);
    assert.equal(isExpectedShop(null), false);
  } finally {
    if (previous === undefined) delete process.env["SHOPIFY_SHOP_DOMAIN"];
    else process.env["SHOPIFY_SHOP_DOMAIN"] = previous;
  }
});

// ---------------- Parsing ----------------

function validPayload(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    name: "#UFFA-1001",
    email: "cliente@exemplo.pt",
    customer: { first_name: "Maria", last_name: "Silva" },
    line_items: [
      { title: "Nike Dunk Low", variant_title: "Panda / 42", quantity: 2, price: "119.99" },
    ],
    total_price: "239.98",
    ...overrides,
  });
}

test("Payload: pedido válido é interpretado corretamente", () => {
  const result = parseOrderPaidPayload(validPayload());
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.order.email, "cliente@exemplo.pt");
  assert.equal(result.order.orderNumber, "#UFFA-1001");
  assert.equal(result.order.customerName, "Maria Silva");
  assert.equal(result.order.total, 239.98);
  assert.equal(result.order.items.length, 1);
  assert.deepEqual(result.order.items[0], {
    name: "Nike Dunk Low",
    size: "42",
    quantity: 2,
    unitPrice: 119.99,
  });
});

test("Payload: usa contact_email/customer.email como fallback", () => {
  const a = parseOrderPaidPayload(validPayload({ email: undefined, contact_email: "a@b.pt" }));
  assert.equal(a.ok && a.order.email, "a@b.pt");

  const b = parseOrderPaidPayload(
    validPayload({ email: undefined, customer: { email: "c@d.pt", first_name: "X" } }),
  );
  assert.equal(b.ok && b.order.email, "c@d.pt");
});

test("Payload: sem e-mail devolve no_email", () => {
  const result = parseOrderPaidPayload(validPayload({ email: undefined, customer: {} }));
  assert.deepEqual(result, { ok: false, reason: "no_email" });
});

test("Payload: e-mail inválido devolve no_email", () => {
  for (const email of ["sem-arroba", "a@b", "@x.pt", "a b@c.pt"]) {
    assert.deepEqual(parseOrderPaidPayload(validPayload({ email })), {
      ok: false,
      reason: "no_email",
    });
  }
});

test("Payload: JSON inválido devolve invalid_payload", () => {
  for (const body of ["", "{", "null", "[]", '"texto"', "42"]) {
    assert.deepEqual(parseOrderPaidPayload(body), { ok: false, reason: "invalid_payload" });
  }
});

test("Payload: injeção de CRLF no e-mail é neutralizada", () => {
  const result = parseOrderPaidPayload(
    validPayload({ email: "cliente@exemplo.pt\r\nBcc: atacante@exemplo.pt" }),
  );
  // O e-mail deixa de ser válido após a limpeza de caracteres de controlo.
  assert.equal(result.ok, false);
});

test("Payload: strings gigantes são truncadas", () => {
  const result = parseOrderPaidPayload(
    validPayload({
      customer: { first_name: "A".repeat(5000), last_name: "B" },
      line_items: [{ title: "T".repeat(5000), variant_title: "C".repeat(500), price: "10" }],
    }),
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.ok(result.order.customerName.length <= 161);
  assert.ok((result.order.items[0]?.name.length ?? 0) <= 200);
  assert.ok((result.order.items[0]?.size.length ?? 0) <= 20);
});

test("Payload: preços e quantidades inválidos são normalizados", () => {
  const result = parseOrderPaidPayload(
    validPayload({
      total_price: "abc",
      line_items: [
        { title: "X", price: "-5", quantity: -3 },
        { title: "Y", price: "NaN", quantity: "2.9" },
        { title: "Z", price: "Infinity", quantity: 999999 },
      ],
    }),
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.order.total, 0);
  assert.deepEqual(
    result.order.items.map((i) => ({ price: i.unitPrice, qty: i.quantity })),
    [
      { price: 0, qty: 1 },
      { price: 0, qty: 2 },
      { price: 0, qty: 999 },
    ],
  );
});

test("Payload: itens malformados são ignorados, sem rebentar", () => {
  const result = parseOrderPaidPayload(
    validPayload({ line_items: [null, "x", 42, { title: "Válido", price: "10" }] }),
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.order.items.length, 1);
  assert.equal(result.order.items[0]?.name, "Válido");
});

test("Payload: sem line_items gera lista vazia", () => {
  const result = parseOrderPaidPayload(validPayload({ line_items: undefined }));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.order.items, []);
});

test("Payload: limite de corpo definido de forma sensata", () => {
  assert.equal(MAX_BODY_BYTES, 1_000_000);
});

// ---------------- Idempotência ----------------

test("Deduplicador: o mesmo evento só é processado uma vez", () => {
  const dedupe = new WebhookDeduplicator();
  assert.equal(dedupe.claim("evt-1"), true);
  assert.equal(dedupe.claim("evt-1"), false);
  assert.equal(dedupe.claim("evt-2"), true);
});

test("Deduplicador: release permite o retry da Shopify", () => {
  const dedupe = new WebhookDeduplicator();
  assert.equal(dedupe.claim("evt-1"), true);
  dedupe.release("evt-1");
  assert.equal(dedupe.claim("evt-1"), true);
});

test("Deduplicador: sem id não bloqueia", () => {
  const dedupe = new WebhookDeduplicator();
  assert.equal(dedupe.claim(null), true);
  assert.equal(dedupe.claim(null), true);
});

test("Deduplicador: TTL expira entradas antigas", async () => {
  const dedupe = new WebhookDeduplicator(5);
  assert.equal(dedupe.claim("evt-1"), true);
  await new Promise((resolve) => setTimeout(resolve, 15));
  assert.equal(dedupe.claim("evt-1"), true);
});

test("Deduplicador: respeita o limite de entradas", () => {
  const dedupe = new WebhookDeduplicator(60_000, 2);
  assert.equal(dedupe.claim("a"), true);
  assert.equal(dedupe.claim("b"), true);
  assert.equal(dedupe.claim("c"), true);
  assert.equal(dedupe.has("a"), false, "a entrada mais antiga deve sair");
});
