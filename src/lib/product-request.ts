import { PRODUCT_REQUEST_LIMITS } from "./product-request-constants.ts";

export type ProductRequest = {
  /** O que a pessoa procura (texto livre). */
  description: string;
  /** Nome do produto/modelo. */
  product: string;
  /** Marca pretendida. */
  brand: string;
  email: string;
  phone: string;
};

export type ProductRequestParseResult =
  { ok: true; request: ProductRequest } | { ok: false; reason: string };

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

/** Remove CRLF e controlos para não contaminar o corpo do e-mail. */
function cleanText(value: unknown, max: number, allowNewlines: boolean): string {
  if (typeof value !== "string") return "";
  let out = "";
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    if (code < 32 && !((allowNewlines && char === "\n") || char === "\t")) continue;
    out += char;
  }
  return out.trim().slice(0, max);
}

/** Aceita formatos nacionais e internacionais; exige pelo menos 9 dígitos. */
function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 15 && /^[+()\d\s.-]+$/.test(phone);
}

/** Valida e normaliza o pedido antes de qualquer envio. Nunca confia no cliente. */
export function parseProductRequest(raw: string): ProductRequestParseResult {
  try {
    const parsed: unknown = JSON.parse(raw);
    const body = asRecord(parsed);
    if (!body) return { ok: false, reason: "invalid_payload" };

    const description = cleanText(body["description"], PRODUCT_REQUEST_LIMITS.description, true);
    const product = cleanText(body["product"], PRODUCT_REQUEST_LIMITS.product, false);
    const brand = cleanText(body["brand"], PRODUCT_REQUEST_LIMITS.brand, false);
    const email = cleanText(body["email"], PRODUCT_REQUEST_LIMITS.email, false).toLowerCase();
    const phone = cleanText(body["phone"], PRODUCT_REQUEST_LIMITS.phone, false);

    if (!description || !product || !brand || !email || !phone) {
      return { ok: false, reason: "missing_fields" };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, reason: "invalid_email" };
    if (!isValidPhone(phone)) return { ok: false, reason: "invalid_phone" };

    return { ok: true, request: { description, product, brand, email, phone } };
  } catch {
    return { ok: false, reason: "invalid_payload" };
  }
}
