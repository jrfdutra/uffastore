import { createHmac } from "node:crypto";
import { safeEqualStrings } from "./tracking-link.ts";

const DEFAULT_TTL_DAYS = 30;
const MAX_TTL_DAYS = 60;
const DAY_MS = 24 * 60 * 60 * 1000;
const ORDER_ID_RE = /^gid:\/\/shopify\/Order\/\d+$/;

/** Segredo exclusivo dos links de pesquisa; pode usar ORDER_PORTAL_SECRET em modo simples. */
export function getNpsSecret(): string | null {
  const dedicated = process.env["NPS_SECRET"]?.trim();
  if (dedicated && dedicated.length >= 16) return dedicated;
  const fallback = process.env["ORDER_PORTAL_SECRET"]?.trim();
  return fallback && fallback.length >= 16 ? fallback : null;
}

export function npsLinkTtlMs(): number {
  const parsed = Number.parseInt(process.env["NPS_LINK_TTL_DAYS"] ?? "", 10);
  const days = Number.isFinite(parsed)
    ? Math.min(Math.max(parsed, 1), MAX_TTL_DAYS)
    : DEFAULT_TTL_DAYS;
  return days * DAY_MS;
}

export type NpsLinkData = {
  orderId: string;
  orderNumber: string;
  issuedAt: number;
  expiresAt: number;
};

function isNpsLinkData(value: unknown): value is NpsLinkData {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  return (
    typeof data["orderId"] === "string" &&
    ORDER_ID_RE.test(data["orderId"]) &&
    typeof data["orderNumber"] === "string" &&
    data["orderNumber"].length > 0 &&
    data["orderNumber"].length <= 40 &&
    typeof data["issuedAt"] === "number" &&
    Number.isFinite(data["issuedAt"]) &&
    typeof data["expiresAt"] === "number" &&
    Number.isFinite(data["expiresAt"])
  );
}

/** Token `payload.assinatura` assinado com HMAC-SHA256, igual ao padrão de rastreio. */
export function createNpsLink(
  input: Pick<NpsLinkData, "orderId" | "orderNumber">,
  secret: string,
  now = Date.now(),
): string {
  const payload: NpsLinkData = {
    orderId: input.orderId.trim(),
    orderNumber: input.orderNumber.trim().slice(0, 40),
    issuedAt: now,
    expiresAt: now + npsLinkTtlMs(),
  };

  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

/** Nunca confiar no payload sem validar assinatura, formato e validade. */
export function verifyNpsLink(token: string, secret: string, now = Date.now()): NpsLinkData | null {
  const [body, signature, extra] = token.split(".");
  if (!body || !signature || extra !== undefined) return null;

  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  if (!safeEqualStrings(signature, expected)) return null;

  try {
    const parsed: unknown = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!isNpsLinkData(parsed)) return null;
    if (parsed.expiresAt <= now || parsed.issuedAt > now + 60_000) return null;
    if (parsed.expiresAt - parsed.issuedAt > npsLinkTtlMs() + 60_000) return null;
    return parsed;
  } catch {
    return null;
  }
}
