import assert from "node:assert/strict";
import test from "node:test";
import { parseFulfillmentPayload } from "./fulfillment-webhook.ts";

function fulfilledPayload(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    id: 987654321,
    name: "#1001",
    email: "Cliente@Exemplo.pt",
    customer: { email: "cliente@exemplo.pt" },
    fulfillments: [
      {
        id: 1,
        status: "success",
        tracking_number: "RR 123456789 PT",
        tracking_company: "CTT Expresso",
        estimated_delivery_at: "2026-11-25T18:00:00+00:00",
      },
    ],
    ...overrides,
  });
}

test("extrai o código, o transportador e a data de um fulfillment", () => {
  const result = parseFulfillmentPayload(fulfilledPayload());

  assert.deepEqual(result, {
    ok: true,
    notification: {
      email: "cliente@exemplo.pt",
      orderNumber: "#1001",
      trackingCode: "RR123456789PT",
      carrier: "CTT Expresso",
      estimatedDelivery: "2026-11-25",
    },
  });
});

test("prefere a última entrega com código de rastreio", () => {
  const result = parseFulfillmentPayload(
    fulfilledPayload({
      fulfillments: [
        { tracking_number: "RR111111111PT", tracking_company: "CTT" },
        { tracking_number: "  ", tracking_company: "CTT" },
        { tracking_number: "RR222222222PT", tracking_company: "DPD" },
      ],
    }),
  );

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.notification.trackingCode, "RR222222222PT");
    assert.equal(result.notification.carrier, "DPD");
  }
});

test("usa o e-mail do cliente quando o root não traz um", () => {
  const result = parseFulfillmentPayload(
    fulfilledPayload({ email: undefined, customer: { email: "outro@exemplo.pt" } }),
  );

  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.notification.email, "outro@exemplo.pt");
});

test("rejeita payload sem e-mail válido", () => {
  assert.deepEqual(
    parseFulfillmentPayload(fulfilledPayload({ email: "invalido", customer: undefined })),
    { ok: false, reason: "no_email" },
  );
});

test("rejeita fulfillment sem código de rastreio", () => {
  assert.deepEqual(
    parseFulfillmentPayload(
      fulfilledPayload({ fulfillments: [{ status: "success", tracking_number: "" }] }),
    ),
    { ok: false, reason: "no_tracking_code" },
  );
});

test("rejeita JSON inválido e código com caracteres suspeitos", () => {
  assert.deepEqual(parseFulfillmentPayload("{"), { ok: false, reason: "invalid_payload" });
  assert.deepEqual(
    parseFulfillmentPayload(
      fulfilledPayload({ fulfillments: [{ tracking_number: "RR123<script>PT" }] }),
    ),
    { ok: false, reason: "no_tracking_code" },
  );
});

test("data de entrega inválida não é propagada", () => {
  const result = parseFulfillmentPayload(
    fulfilledPayload({
      fulfillments: [{ tracking_number: "RR123456789PT", estimated_delivery_at: "amanhã" }],
    }),
  );

  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.notification.estimatedDelivery, null);
});

test("orders/updated com código adicionado depois é interpretado", () => {
  const result = parseFulfillmentPayload(
    fulfilledPayload({
      name: "#1002",
      fulfillments: [{ tracking_number: "RR987654321PT", tracking_company: "CTT" }],
    }),
  );

  assert.deepEqual(result, {
    ok: true,
    notification: {
      email: "cliente@exemplo.pt",
      orderNumber: "#1002",
      trackingCode: "RR987654321PT",
      carrier: "CTT",
      estimatedDelivery: null,
    },
  });
});
