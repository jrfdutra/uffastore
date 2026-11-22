import assert from "node:assert/strict";
import test from "node:test";
import {
  NPS_NAMESPACE,
  cleanNpsComment,
  customerFirstName,
  findNpsCandidates,
  isNpsEligible,
  markNpsInvited,
  npsWindow,
  parseNpsScore,
  saveNpsResponse,
  type NpsOrder,
} from "./nps-core.ts";
import type { AdminGraphql } from "./shopify-admin.ts";

const NOW = Date.parse("2026-11-22T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

function order(overrides: Partial<NpsOrder> = {}): NpsOrder {
  return {
    id: "gid://shopify/Order/1002",
    name: "#1002",
    email: "cliente@exemplo.pt",
    processedAt: new Date(NOW - 10 * DAY).toISOString(),
    cancelledAt: null,
    displayFinancialStatus: "PAID",
    billingAddress: { firstName: "Ana" },
    shippingAddress: null,
    metafields: { nodes: [] },
    ...overrides,
  };
}

function fakeGraphql(responses: unknown[], calls: { query: string; variables?: unknown }[] = []) {
  let index = 0;
  const graphql: AdminGraphql = async <T>(
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<T> => {
    calls.push({ query, variables });
    const response = responses[index] ?? {};
    index += 1;
    return response as T;
  };
  return graphql;
}

test("npsWindow só inclui encomendas pagas entre 8 e 30 dias atrás", () => {
  assert.deepEqual(npsWindow(NOW), {
    start: NOW - 30 * DAY,
    end: NOW - 8 * DAY,
  });
});

test("isNpsEligible rejeita reembolsos, canceladas, já convidadas e já respondidas", () => {
  const window = npsWindow(NOW);
  const base = order();

  assert.equal(isNpsEligible(base, window), true);
  assert.equal(isNpsEligible(order({ displayFinancialStatus: "REFUNDED" }), window), false);
  assert.equal(isNpsEligible(order({ cancelledAt: new Date(NOW).toISOString() }), window), false);
  assert.equal(isNpsEligible(order({ email: "sem-email" }), window), false);
  assert.equal(
    isNpsEligible(order({ processedAt: new Date(NOW - 5 * DAY).toISOString() }), window),
    false,
  );
  assert.equal(
    isNpsEligible(order({ processedAt: new Date(NOW - 40 * DAY).toISOString() }), window),
    false,
  );
  assert.equal(
    isNpsEligible(
      order({ metafields: { nodes: [{ key: "invited_at", value: "2026-11-12" }] } }),
      window,
    ),
    false,
  );
  assert.equal(
    isNpsEligible(order({ metafields: { nodes: [{ key: "score", value: "5" }] } }), window),
    false,
  );
});

test("findNpsCandidates pagina e ignora encomendas já marcadas ou fora da janela", async () => {
  const page1 = {
    orders: {
      nodes: [
        order(),
        order({
          id: "gid://shopify/Order/1003",
          name: "#1003",
          displayFinancialStatus: "REFUNDED",
        }),
        order({
          id: "gid://shopify/Order/1004",
          name: "#1004",
          metafields: { nodes: [{ key: "invited_at", value: "2026-11-12" }] },
        }),
      ],
      pageInfo: { hasNextPage: true, endCursor: "cursor-2" },
    },
  };
  const page2 = {
    orders: {
      nodes: [order({ processedAt: new Date(NOW - 35 * DAY).toISOString() })],
      pageInfo: { hasNextPage: false, endCursor: null },
    },
  };
  const graphql = fakeGraphql([page1, page2]);

  const candidates = await findNpsCandidates(graphql, NOW);
  assert.deepEqual(
    candidates.map((entry) => entry.name),
    ["#1002"],
  );
});

test("customerFirstName usa os endereços sem exigir read_customers", () => {
  assert.equal(customerFirstName(order()), "Ana");
  assert.equal(
    customerFirstName(order({ billingAddress: null, shippingAddress: { firstName: "Rui" } })),
    "Rui",
  );
  assert.equal(
    customerFirstName(order({ billingAddress: null, shippingAddress: null })),
    "Cliente",
  );
});

test("parseNpsScore aceita apenas inteiros de 0 a 5", () => {
  assert.equal(parseNpsScore(0), 0);
  assert.equal(parseNpsScore("5"), 5);
  assert.equal(parseNpsScore(" 3 "), 3);
  assert.equal(parseNpsScore(6), null);
  assert.equal(parseNpsScore(-1), null);
  assert.equal(parseNpsScore("3.5"), null);
  assert.equal(parseNpsScore(undefined), null);
});

test("cleanNpsComment remove caracteres de controlo e limita o tamanho", () => {
  assert.equal(cleanNpsComment("  Boa\u0007 experiência  "), "Boa experiência");
  assert.equal(cleanNpsComment("x".repeat(2000)).length, 1000);
  assert.equal(cleanNpsComment(undefined), "");
});

test("markNpsInvited e saveNpsResponse escrevem metafields na encomenda certa", async () => {
  const calls: { query: string; variables?: unknown }[] = [];
  const graphql = fakeGraphql([{}, {}], calls);

  await markNpsInvited(graphql, "gid://shopify/Order/1002", NOW);
  await saveNpsResponse(graphql, {
    orderId: "gid://shopify/Order/1002",
    score: 4,
    comment: "Gostei muito",
    now: NOW,
  });

  assert.equal(calls.length, 2);
  const first = calls[0]?.variables as {
    metafields: { key: string; value: string; ownerId: string; namespace: string }[];
  };
  assert.equal(first.metafields[0]?.key, "invited_at");
  assert.equal(first.metafields[0]?.ownerId, "gid://shopify/Order/1002");
  assert.equal(first.metafields[0]?.namespace, NPS_NAMESPACE);

  const second = calls[1]?.variables as { metafields: { key: string; value: string }[] };
  assert.deepEqual(
    second.metafields.map((entry) => entry.key),
    ["score", "answered_at", "comment"],
  );
  assert.equal(second.metafields[0]?.value, "4");
  assert.equal(second.metafields[2]?.value, "Gostei muito");
});

test("saveNpsResponse não apaga comentário anterior quando o novo está vazio", async () => {
  const calls: { query: string; variables?: unknown }[] = [];
  const graphql = fakeGraphql([{}], calls);

  await saveNpsResponse(graphql, {
    orderId: "gid://shopify/Order/1002",
    score: 3,
    comment: "",
    now: NOW,
  });

  const variables = calls[0]?.variables as { metafields: { key: string }[] };
  assert.deepEqual(
    variables.metafields.map((entry) => entry.key),
    ["score", "answered_at"],
  );
});
