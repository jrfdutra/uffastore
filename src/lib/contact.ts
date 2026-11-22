import {
  CONTACT_IMAGE_TYPES,
  CONTACT_MAX_EMAIL,
  CONTACT_MAX_FILENAME,
  CONTACT_MAX_IMAGE_BYTES,
  CONTACT_MAX_MESSAGE,
  CONTACT_MAX_NAME,
  CONTACT_MAX_ORDER,
  CONTACT_MAX_SUBJECT,
  CONTACT_REASONS,
  type ContactImageType,
  type ContactReason,
} from "./contact-constants.ts";

export type ContactImage = { name: string; type: ContactImageType; data: string };

export type ContactRequest = {
  name: string;
  email: string;
  orderNo: string;
  reason: ContactReason;
  subject: string;
  message: string;
  image: ContactImage | null;
};

export type ContactParseResult =
  { ok: true; request: ContactRequest } | { ok: false; reason: string };

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

/** Remove CRLF e caracteres de controlo para não contaminar o e-mail. */
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

function decodeBase64(data: string): Uint8Array | null {
  if (!data || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) return null;
  const bytes = Buffer.from(data, "base64");
  return bytes.length > 0 ? new Uint8Array(bytes) : null;
}

/** Confia nos bytes, não no MIME enviado pelo browser. */
function detectImageType(bytes: Uint8Array): ContactImageType | null {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length > 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (bytes.length >= 12) {
    const head = String.fromCharCode(...bytes.slice(0, 4));
    const format = String.fromCharCode(...bytes.slice(8, 12));
    if (head === "RIFF" && format === "WEBP") return "image/webp";
  }
  return null;
}

function safeFilename(name: string, type: ContactImageType): string {
  const base = name.split(/[\\/]/).pop() ?? "foto";
  const cleaned =
    base
      .replace(/[^A-Za-z0-9._ -]+/g, "_")
      .replace(/^\.+/, "")
      .slice(0, 80) || "foto";
  const extension = type === "image/jpeg" ? ".jpg" : type === "image/png" ? ".png" : ".webp";
  return `${cleaned.replace(/\.[^.]+$/, "")}${extension}`;
}

/** Valida e normaliza o pedido antes de qualquer envio. Nunca confia no cliente. */
export function parseContactRequest(raw: string): ContactParseResult {
  try {
    const parsed: unknown = JSON.parse(raw);
    const body = asRecord(parsed);
    if (!body) return { ok: false, reason: "invalid_payload" };

    const name = cleanText(body["name"], CONTACT_MAX_NAME, false);
    const email = cleanText(body["email"], CONTACT_MAX_EMAIL, false).toLowerCase();
    const message = cleanText(body["message"], CONTACT_MAX_MESSAGE, true);
    const subject = cleanText(body["subject"], CONTACT_MAX_SUBJECT, false);
    const orderNo = cleanText(body["orderNo"], CONTACT_MAX_ORDER, false);
    const reasonRaw = cleanText(body["reason"], 24, false);
    const reason = CONTACT_REASONS.includes(reasonRaw as ContactReason)
      ? (reasonRaw as ContactReason)
      : "geral";

    if (!name || !email || !message) return { ok: false, reason: "missing_fields" };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, reason: "invalid_email" };

    let image: ContactImage | null = null;
    if (body["image"] !== undefined && body["image"] !== null) {
      const uploaded = asRecord(body["image"]);
      if (!uploaded) return { ok: false, reason: "invalid_image" };

      const declaredType = cleanText(uploaded["type"], 40, false);
      if (!CONTACT_IMAGE_TYPES.includes(declaredType as ContactImageType)) {
        return { ok: false, reason: "invalid_image_type" };
      }

      const data = typeof uploaded["data"] === "string" ? uploaded["data"].trim() : "";
      const maxEncoded = Math.ceil((CONTACT_MAX_IMAGE_BYTES * 4) / 3) + 8;
      if (!data || data.length > maxEncoded) return { ok: false, reason: "image_too_large" };

      const bytes = decodeBase64(data);
      if (!bytes) return { ok: false, reason: "invalid_image" };
      if (bytes.length > CONTACT_MAX_IMAGE_BYTES) return { ok: false, reason: "image_too_large" };

      const actualType = detectImageType(bytes);
      if (!actualType || actualType !== declaredType) {
        return { ok: false, reason: "invalid_image_type" };
      }

      image = {
        name: safeFilename(cleanText(uploaded["name"], CONTACT_MAX_FILENAME, false), actualType),
        type: actualType,
        data: Buffer.from(bytes).toString("base64"),
      };
    }

    if (reason === "troca_defeito" && !image) return { ok: false, reason: "image_required" };

    return { ok: true, request: { name, email, orderNo, reason, subject, message, image } };
  } catch {
    return { ok: false, reason: "invalid_payload" };
  }
}
