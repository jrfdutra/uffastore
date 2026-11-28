import { NEWSLETTER_MAX_EMAIL, type NewsletterLanguage } from "./newsletter-constants.ts";

export type NewsletterRequest = {
  email: string;
  language: NewsletterLanguage;
  origin: "home" | "footer";
};

export type NewsletterParseResult =
  | { ok: true; request: NewsletterRequest }
  | { ok: true; ignored: true }
  | { ok: false; reason: string };

const LANGUAGES: NewsletterLanguage[] = ["pt", "en", "es"];

function cleanText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  let out = "";
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    if (code < 32 || code === 127) continue;
    out += char;
  }
  return out.trim().slice(0, max);
}

/**
 * Valida a subscrição no servidor. O campo `_honey` é um honeypot: bots que o
 * preencham recebem sucesso falso e não geram e-mail.
 */
export function parseNewsletterRequest(raw: string): NewsletterParseResult {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false, reason: "invalid_payload" };
    }
    const body = parsed as Record<string, unknown>;

    if (cleanText(body["_honey"], 200)) return { ok: true, ignored: true };

    const email = cleanText(body["email"], NEWSLETTER_MAX_EMAIL).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return { ok: false, reason: "invalid_email" };
    }

    const language = cleanText(body["language"], 2);
    const origin = cleanText(body["origin"], 10);

    return {
      ok: true,
      request: {
        email,
        language: LANGUAGES.includes(language as NewsletterLanguage)
          ? (language as NewsletterLanguage)
          : "pt",
        origin: origin === "footer" ? "footer" : "home",
      },
    };
  } catch {
    return { ok: false, reason: "invalid_payload" };
  }
}
