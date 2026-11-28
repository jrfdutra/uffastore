/** Constantes partilhadas entre o formulário de newsletter e o servidor. */

export const NEWSLETTER_PATH = "/api/newsletter";
export const NEWSLETTER_BODY_LIMIT = 4 * 1024;
export const NEWSLETTER_MAX_EMAIL = 160;

export type NewsletterLanguage = "pt" | "en" | "es";
