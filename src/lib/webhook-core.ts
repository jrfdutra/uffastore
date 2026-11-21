import { createHmac, timingSafeEqual } from "node:crypto";

/** Tópico Shopify que este endpoint aceita. */
export const WEBHOOK_TOPIC = "orders/paid";

/** Limite defensivo do corpo (a Shopify envia pedidos bem abaixo disto). */
export const MAX_BODY_BYTES = 1_000_000;

const BASE64_SHA256 = /^[A-Za-z0-9+/]{43}=$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Lido em tempo de execução para funcionar com env vars da Vercel e com testes. */
export function getWebhookSecret(): string {
  return (process.env["SHOPIFY_WEBHOOK_SECRET"] ?? "").trim();
}

/**
 * Valida a assinatura X-Shopify-Hmac-Sha256: HMAC-SHA256 do corpo raw, em base64.
 * Fail-closed: sem segredo configurado, nenhuma assinatura é aceite.
 */
export function verifyShopifyHmac(rawBody: string, hmacHeader: string | null): boolean {
  const secret = getWebhookSecret();
  if (!secret) return false;
  if (!hmacHeader) return false;

  const header = hmacHeader.trim();
  if (!BASE64_SHA256.test(header)) return false;

  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest();
  const received = Buffer.from(header, "base64");
  if (received.length !== expected.length) return false;
  return timingSafeEqual(received, expected);
}

/** Só aceita o tópico orders/paid (evita reutilização do segredo por outros webhooks). */
export function isExpectedTopic(topic: string | null): boolean {
  return (topic ?? "").trim().toLowerCase() === WEBHOOK_TOPIC;
}

/** Se SHOPIFY_SHOP_DOMAIN estiver definido, exige que o webhook venha dessa loja. */
export function isExpectedShop(shopDomain: string | null): boolean {
  const expected = (process.env["SHOPIFY_SHOP_DOMAIN"] ?? "").trim().toLowerCase();
  if (!expected) return true;
  return (shopDomain ?? "").trim().toLowerCase() === expected;
}

export type ParsedOrderItem = {
  name: string;
  size: string;
  quantity: number;
  unitPrice: number;
};

export type ParsedOrder = {
  email: string;
  orderNumber: string;
  customerName: string;
  items: ParsedOrderItem[];
  total: number;
};

export type ParseResult =
  { ok: true; order: ParsedOrder } | { ok: false; reason: "invalid_payload" | "no_email" };

function stripControlChars(value: string): string {
  let out = "";
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    out += code < 0x20 || code === 0x7f ? " " : char;
  }
  return out;
}

function clean(value: unknown, maxLength: number): string {
  return stripControlChars(String(value ?? ""))
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function toPrice(value: unknown): number {
  const parsed = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function toQuantity(value: unknown): number {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(999, Math.max(1, parsed));
}

/** Interpreta o payload de orders/paid sem confiar em nada do conteúdo. */
export function parseOrderPaidPayload(bodyText: string): ParseResult {
  let payload: unknown;
  try {
    payload = JSON.parse(bodyText);
  } catch {
    return { ok: false, reason: "invalid_payload" };
  }

  const root = asRecord(payload);
  if (!root) return { ok: false, reason: "invalid_payload" };

  const customer = asRecord(root["customer"]);
  const billing = asRecord(root["billing_address"]);

  const emailCandidates = [root["email"], root["contact_email"], customer?.["email"]];
  const email = emailCandidates
    .map((value) => clean(value, 320).toLowerCase())
    .find((value) => value.length > 0);

  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, reason: "no_email" };
  }

  const orderNumberRaw = root["name"] ?? root["order_number"] ?? root["number"];
  const orderNumber = clean(orderNumberRaw, 40).replace(/^(\d)/, "#$1") || "#UFFA";

  const firstName = clean(customer?.["first_name"] ?? billing?.["first_name"], 80);
  const lastName = clean(customer?.["last_name"] ?? billing?.["last_name"], 80);
  const customerName = `${firstName} ${lastName}`.trim() || "Cliente UFFA";

  const rawItems = Array.isArray(root["line_items"]) ? root["line_items"] : [];
  const items: ParsedOrderItem[] = [];
  for (const rawItem of rawItems) {
    const line = asRecord(rawItem);
    if (!line) continue;

    const variantParts = clean(line["variant_title"], 120)
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean);
    const size = variantParts[variantParts.length - 1] ?? "EU";

    items.push({
      name: clean(line["title"] ?? line["name"], 200) || "Sneakers UFFA",
      size: size.slice(0, 20),
      quantity: toQuantity(line["quantity"]),
      unitPrice: toPrice(line["price"]),
    });
  }

  return {
    ok: true,
    order: {
      email,
      orderNumber,
      customerName,
      items,
      total: toPrice(root["total_price"]),
    },
  };
}

/**
 * Deduplicação em memória por X-Shopify-Webhook-Id.
 * Em serverless é por instância (não substitui idempotência numa base de dados),
 * mas evita reenvios no mesmo processo. Em caso de falha, release() permite o retry da Shopify.
 */
export class WebhookDeduplicator {
  private readonly seen = new Map<string, number>();
  private readonly ttlMs: number;
  private readonly maxEntries: number;

  constructor(ttlMs = 10 * 60_000, maxEntries = 5_000) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
  }

  /** Reserva o evento. true = pode processar; false = duplicado/em curso. */
  claim(id: string | null): boolean {
    if (!id) return true;
    const now = Date.now();
    this.purge(now);
    if (this.seen.has(id)) return false;
    if (this.seen.size >= this.maxEntries) {
      const oldest = this.seen.keys().next();
      if (!oldest.done) this.seen.delete(oldest.value);
    }
    this.seen.set(id, now);
    return true;
  }

  /** Liberta a reserva para permitir retry após falha de entrega. */
  release(id: string | null): void {
    if (id) this.seen.delete(id);
  }

  has(id: string): boolean {
    return this.seen.has(id);
  }

  clear(): void {
    this.seen.clear();
  }

  private purge(now: number): void {
    for (const [id, timestamp] of this.seen) {
      if (now - timestamp > this.ttlMs) this.seen.delete(id);
    }
  }
}
