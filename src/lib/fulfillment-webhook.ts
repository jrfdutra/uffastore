/**
 * Leitura segura dos payloads de cumprimento da Shopify.
 *
 * Trata `orders/fulfilled` e `orders/updated` — este último cobre o código
 * adicionado ou alterado depois de marcar a encomenda como cumprida. Extrai
 * apenas os dados mínimos para gerar o link mágico.
 */

const DEFAULT_CARRIER = "CTT Expresso";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TRACKING_RE = /^[A-Z0-9-]{6,40}$/;

export type FulfillmentNotification = {
  email: string;
  orderNumber: string;
  trackingCode: string;
  carrier: string;
  estimatedDelivery: string | null;
};

export type FulfillmentParseResult =
  | { ok: true; notification: FulfillmentNotification }
  | { ok: false; reason: "invalid_payload" | "no_email" | "no_tracking_code" };

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function clean(value: unknown, maxLength: number): string {
  const text = String(value ?? "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, maxLength);
}

function normalizeEmail(value: unknown): string {
  return clean(value, 320).toLowerCase();
}

function normalizeTrackingCode(value: unknown): string {
  return clean(value, 80).replace(/\s+/g, "").toUpperCase();
}

function normalizeDeliveryDate(value: unknown): string | null {
  const text = clean(value, 40);
  if (!text) return null;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

/** Escolhe a última entrega com código, para preferir a atualização mais recente. */
function latestTrackedFulfillment(root: Record<string, unknown>): Record<string, unknown> | null {
  const fulfillments = Array.isArray(root["fulfillments"]) ? root["fulfillments"] : [];
  for (let index = fulfillments.length - 1; index >= 0; index -= 1) {
    const fulfillment = asRecord(fulfillments[index]);
    if (fulfillment && normalizeTrackingCode(fulfillment["tracking_number"])) return fulfillment;
  }
  return null;
}

function carrierFrom(fulfillment: Record<string, unknown> | null): string {
  return (
    clean(fulfillment?.["tracking_company"] ?? fulfillment?.["tracking_company_name"], 60) ||
    DEFAULT_CARRIER
  );
}

function orderNumberFrom(value: unknown): string {
  return clean(value, 40).replace(/^(\d)/, "#$1") || "#UFFA";
}

export function parseFulfillmentPayload(bodyText: string): FulfillmentParseResult {
  let payload: unknown;
  try {
    payload = JSON.parse(bodyText);
  } catch {
    return { ok: false, reason: "invalid_payload" };
  }

  const root = asRecord(payload);
  if (!root) return { ok: false, reason: "invalid_payload" };

  const customer = asRecord(root["customer"]);
  const email = [root["email"], root["contact_email"], customer?.["email"]]
    .map(normalizeEmail)
    .find((candidate) => EMAIL_RE.test(candidate));
  if (!email) return { ok: false, reason: "no_email" };

  const fulfillment = latestTrackedFulfillment(root);
  const trackingCode = fulfillment ? normalizeTrackingCode(fulfillment["tracking_number"]) : "";
  if (!TRACKING_RE.test(trackingCode)) return { ok: false, reason: "no_tracking_code" };

  return {
    ok: true,
    notification: {
      email,
      orderNumber: orderNumberFrom(root["name"] ?? root["order_number"] ?? root["number"]),
      trackingCode,
      carrier: carrierFrom(fulfillment),
      estimatedDelivery: normalizeDeliveryDate(fulfillment?.["estimated_delivery_at"]),
    },
  };
}
