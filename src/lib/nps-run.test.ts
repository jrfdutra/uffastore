import assert from "node:assert/strict";
import test from "node:test";
import { runNps } from "./nps-run.ts";
import type { AdminGraphql } from "./shopify-admin.ts";

const NOW = Date.parse("2026-11-22T12:00:00.000Z");
const SECRET = "segredo-de-teste-com-mais-de-16-caracteres";

const eligiblePage = {
  orders: {
    nodes: [
      {
        id: "gid://shopify/Order/1002",
        name: "#1002",
        email: "cliente@exemplo.pt",
        processedAt: new Date(NOW - 10 * 24 * 60 * 60 * 1000).toISOString(),
        cancelledAt: null,
        displayFinancialStatus: "PAID",
        billingAddress: { firstName: "Ana" },
        shippingAddress: null,
        metafields: { nodes: [] },
      },
    ],
    pageInfo: { hasNextPage: false, endCursor: null },
  },
};

function graphqlFor(calls: string[]): AdminGraphql {
  return async <T>(query: string): Promise<T> => {
    calls.push(query);
    return (query.includes("NpsEligibleOrders") ? eligiblePage : {}) as T;
  };
}

test("dryRun não escreve metafields nem envia e-mail", async () => {
  const calls: string[] = [];
  const sent: string[] = [];
  const result = await runNps({
    graphql: graphqlFor(calls),
    send: async (_order, url) => {
      sent.push(url);
      return { success: true };
    },
    origin: "https://www.uffastore.pt",
    secret: SECRET,
    now: NOW,
    dryRun: true,
  });

  assert.equal(result.dryRun, true);
  assert.deepEqual(result.orderNumbers, ["#1002"]);
  assert.equal(result.sent, 0);
  assert.equal(sent.length, 0);
  assert.equal(calls.length, 1);
});

test("execução real marca o convite e envia o link assinado", async () => {
  const calls: string[] = [];
  const sent: { email: string; url: string }[] = [];
  const result = await runNps({
    graphql: graphqlFor(calls),
    send: async (order, url) => {
      sent.push({ email: order.email, url });
      return { success: true };
    },
    origin: "https://www.uffastore.pt",
    secret: SECRET,
    now: NOW,
    dryRun: false,
  });

  assert.equal(result.success, true);
  assert.equal(result.invited, 1);
  assert.equal(result.sent, 1);
  assert.deepEqual(result.orderNumbers, ["#1002"]);
  assert.equal(sent[0]?.email, "cliente@exemplo.pt");
  assert.match(
    sent[0]?.url ?? "",
    /^https:\/\/www\.uffastore\.pt\/avaliar\?token=[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
  );
  assert.equal(calls.length, 2);
});

test("falha no envio é contabilizada sem quebrar o resto do disparo", async () => {
  const calls: string[] = [];
  const result = await runNps({
    graphql: graphqlFor(calls),
    send: async () => ({ success: false }),
    origin: "https://www.uffastore.pt",
    secret: SECRET,
    now: NOW,
    dryRun: false,
  });

  assert.equal(result.success, false);
  assert.equal(result.failed, 1);
  assert.equal(result.invited, 1);
});
