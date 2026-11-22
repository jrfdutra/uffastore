import { createHmac, timingSafeEqual } from "node:crypto";
import type { TrackingLinkData } from "./tracking";

const DEFAULT_TTL_DAYS = 14;
const MAX_TTL_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

function secretFromEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value && value.length >= 16 ? value : null;
}

/** Segredo usado para assinar os links enviados por e-mail. */
export function getTrackingLinkSecret(): string | null {
  return secretFromEnv("ORDER_PORTAL_SECRET");
}

/** Segredo partilhado com a página interna de expedição. */
export function getTrackingAdminToken(): string | null {
  return secretFromEnv("TRACKING_ADMIN_TOKEN");
}

export function trackingLinkTtlMs(): number {
  const parsed = Number.parseInt(process.env["TRACKING_LINK_TTL_DAYS"] ?? "", 10);
  const days = Number.isFinite(parsed)
    ? Math.min(Math.max(parsed, 1), MAX_TTL_DAYS)
    : DEFAULT_TTL_DAYS;
  return days * DAY_MS;
}

export function safeEqualStrings(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function isTrackingLinkData(value: unknown): value is TrackingLinkData {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  return (
    typeof data["orderNumber"] === "string" &&
    data["orderNumber"].length > 0 &&
    typeof data["trackingCode"] === "string" &&
    data["trackingCode"].length > 0 &&
    typeof data["carrier"] === "string" &&
    data["carrier"].length > 0 &&
    (data["estimatedDelivery"] === null || typeof data["estimatedDelivery"] === "string") &&
    typeof data["issuedAt"] === "number" &&
    Number.isFinite(data["issuedAt"]) &&
    typeof data["expiresAt"] === "number" &&
    Number.isFinite(data["expiresAt"])
  );
}

/** Cria um token `payload.assinatura` assinado com HMAC-SHA256. */
export function createTrackingLink(
  input: Omit<TrackingLinkData, "issuedAt" | "expiresAt">,
  secret: string,
  now = Date.now(),
): string {
  const payload: TrackingLinkData = {
    orderNumber: input.orderNumber.trim().toUpperCase(),
    trackingCode: input.trackingCode.trim().toUpperCase(),
    carrier: input.carrier.trim(),
    estimatedDelivery: input.estimatedDelivery,
    issuedAt: now,
    expiresAt: now + trackingLinkTtlMs(),
  };

  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

/** Valida assinatura, formato e validade. Nunca confia no payload sem esta função. */
export function verifyTrackingLink(
  token: string,
  secret: string,
  now = Date.now(),
): TrackingLinkData | null {
  const [body, signature, extra] = token.split(".");
  if (!body || !signature || extra !== undefined) return null;

  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  if (!safeEqualStrings(signature, expected)) return null;

  try {
    const parsed: unknown = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!isTrackingLinkData(parsed)) return null;
    if (parsed.expiresAt <= now || parsed.issuedAt > now + 60_000) return null;
    if (parsed.expiresAt - parsed.issuedAt > trackingLinkTtlMs() + 60_000) return null;
    return parsed;
  } catch {
    return null;
  }
}
