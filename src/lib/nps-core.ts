import type { AdminGraphql } from "./shopify-admin";

export const NPS_NAMESPACE = "uffa_nps";
export const NPS_DELAY_DAYS = 8;
export const NPS_LOOKBACK_DAYS = 30;
export const NPS_MIN_SCORE = 0;
export const NPS_MAX_SCORE = 5;
export const NPS_MAX_COMMENT = 1000;

const DAY_MS = 24 * 60 * 60 * 1000;
const PAGE_SIZE = 50;
const MAX_PAGES = 20;

export type NpsWindow = { start: number; end: number };

export type NpsOrder = {
  id: string;
  name: string;
  email: string;
  processedAt: string;
  cancelledAt: string | null;
  displayFinancialStatus: string;
  billingAddress: { firstName: string | null } | null;
  shippingAddress: { firstName: string | null } | null;
  metafields: { nodes: { key: string; value: string }[] };
};

export const ELIGIBLE_ORDERS_QUERY = `
  query NpsEligibleOrders($first: Int!, $after: String) {
    orders(first: $first, after: $after, sortKey: PROCESSED_AT, reverse: true) {
      nodes {
        id
        name
        email
        processedAt
        cancelledAt
        displayFinancialStatus
        billingAddress { firstName }
        shippingAddress { firstName }
        metafields(first: 20, namespace: "${NPS_NAMESPACE}") { nodes { key value } }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

export const ORDER_BY_ID_QUERY = `
  query NpsOrderById($id: ID!) {
    node(id: $id) {
      ... on Order {
        id
        name
        email
        processedAt
        cancelledAt
        displayFinancialStatus
        billingAddress { firstName }
        shippingAddress { firstName }
        metafields(first: 20, namespace: "${NPS_NAMESPACE}") { nodes { key value } }
      }
    }
  }
`;

const SET_METAFIELDS_MUTATION = `
  mutation NpsSetMetafields($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      userErrors { field message code }
    }
  }
`;

/** Inclui encomendas dos últimos 30 dias que já passaram os 8 dias de espera. */
export function npsWindow(now: number): NpsWindow {
  return {
    start: now - NPS_LOOKBACK_DAYS * DAY_MS,
    end: now - NPS_DELAY_DAYS * DAY_MS,
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function isNpsOrder(value: unknown): value is NpsOrder {
  const order = asRecord(value);
  if (!order) return false;
  return (
    typeof order["id"] === "string" &&
    /^gid:\/\/shopify\/Order\/\d+$/.test(order["id"]) &&
    typeof order["name"] === "string" &&
    typeof order["processedAt"] === "string"
  );
}

export function metafieldValue(order: NpsOrder, key: string): string | null {
  const value = order.metafields?.nodes?.find((entry) => entry?.key === key)?.value;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** O campo `customer` exige read_customers; os endereços bastam para personalizar. */
export function customerFirstName(order: NpsOrder): string {
  return (
    (order.billingAddress?.firstName || order.shippingAddress?.firstName || "").trim() || "Cliente"
  );
}

/** PAID e não cancelada, dentro da janela, com e-mail e sem convite/resposta anterior. */
export function isNpsEligible(order: NpsOrder, window: NpsWindow): boolean {
  const paidAt = Date.parse(order.processedAt);
  if (!Number.isFinite(paidAt) || paidAt >= window.end || paidAt < window.start) return false;
  if (order.displayFinancialStatus !== "PAID" || order.cancelledAt) return false;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.email ?? "")) return false;
  if (metafieldValue(order, "invited_at")) return false;
  if (metafieldValue(order, "score")) return false;
  return true;
}

export function parseEligibleOrders(data: unknown): NpsOrder[] {
  const root = asRecord(data);
  const orders = asRecord(root?.["orders"]);
  const nodes = orders?.["nodes"];
  return Array.isArray(nodes) ? nodes.filter(isNpsOrder) : [];
}

export function parseOrderById(data: unknown): NpsOrder | null {
  const node = asRecord(asRecord(data)?.["node"]);
  return isNpsOrder(node) ? node : null;
}

/** Percorre as páginas até encontrar encomendas mais antigas que a janela (ordem decrescente). */
export async function findNpsCandidates(graphql: AdminGraphql, now: number): Promise<NpsOrder[]> {
  const window = npsWindow(now);
  const candidates: NpsOrder[] = [];
  let after: string | null = null;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const data = await graphql<unknown>(ELIGIBLE_ORDERS_QUERY, { first: PAGE_SIZE, after });
    const orders = parseEligibleOrders(data);
    if (orders.length === 0) break;

    let reachedOlderOrders = false;
    for (const order of orders) {
      const paidAt = Date.parse(order.processedAt);
      if (Number.isFinite(paidAt) && paidAt < window.start) {
        reachedOlderOrders = true;
        break;
      }
      if (isNpsEligible(order, window)) candidates.push(order);
    }
    if (reachedOlderOrders) break;

    const root = asRecord(data);
    const connection = asRecord(root?.["orders"]);
    const pageInfo = asRecord(connection?.["pageInfo"]);
    const endCursor = pageInfo?.["endCursor"];
    if (pageInfo?.["hasNextPage"] !== true || typeof endCursor !== "string") break;
    after = endCursor;
  }

  return candidates;
}

async function setMetafields(
  graphql: AdminGraphql,
  metafields: Record<string, unknown>[],
): Promise<void> {
  const data = await graphql<unknown>(SET_METAFIELDS_MUTATION, { metafields });
  const root = asRecord(data);
  const result = asRecord(root?.["metafieldsSet"]);
  const errors = result?.["userErrors"];
  if (Array.isArray(errors) && errors.length > 0) {
    const message = errors
      .map((error) => asRecord(error)?.["message"])
      .filter((value): value is string => typeof value === "string")
      .join("; ");
    throw new Error(message || "A Shopify rejeitou os metafields");
  }
}

/** Marca o convite antes do envio para que uma segunda execução não duplique e-mails. */
export async function markNpsInvited(graphql: AdminGraphql, orderId: string, now: number) {
  await setMetafields(graphql, [
    {
      ownerId: orderId,
      namespace: NPS_NAMESPACE,
      key: "invited_at",
      type: "date_time",
      value: new Date(now).toISOString(),
    },
  ]);
}

export function parseNpsScore(value: unknown): number | null {
  const text =
    typeof value === "number" ? String(value) : typeof value === "string" ? value.trim() : "";
  if (!/^\d$/.test(text)) return null;
  const score = Number.parseInt(text, 10);
  return score >= NPS_MIN_SCORE && score <= NPS_MAX_SCORE ? score : null;
}

export function cleanNpsComment(value: unknown): string {
  if (typeof value !== "string") return "";
  let out = "";
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    if (code >= 0x20 && code !== 0x7f) out += char;
  }
  return out.trim().slice(0, NPS_MAX_COMMENT);
}

/** Guarda a resposta na encomenda; comentário vazio não apaga uma resposta anterior. */
export async function saveNpsResponse(
  graphql: AdminGraphql,
  input: { orderId: string; score: number; comment: string; now: number },
): Promise<void> {
  const metafields: Record<string, unknown>[] = [
    {
      ownerId: input.orderId,
      namespace: NPS_NAMESPACE,
      key: "score",
      type: "number_integer",
      value: String(input.score),
    },
    {
      ownerId: input.orderId,
      namespace: NPS_NAMESPACE,
      key: "answered_at",
      type: "date_time",
      value: new Date(input.now).toISOString(),
    },
  ];
  if (input.comment) {
    metafields.push({
      ownerId: input.orderId,
      namespace: NPS_NAMESPACE,
      key: "comment",
      type: "multi_line_text_field",
      value: input.comment,
    });
  }
  await setMetafields(graphql, metafields);
}

export async function getNpsOrder(
  graphql: AdminGraphql,
  orderId: string,
): Promise<NpsOrder | null> {
  const data = await graphql<unknown>(ORDER_BY_ID_QUERY, { id: orderId });
  return parseOrderById(data);
}
