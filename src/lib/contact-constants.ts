/** Constantes partilhadas entre o formulário de contacto e o servidor. */

export const CONTACT_PATH = "/api/contacto";

/** Uma fotografia chega para mostrar o defeito; mantém o pedido dentro do limite da Vercel. */
export const CONTACT_MAX_IMAGES = 1;
export const CONTACT_MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const CONTACT_BODY_LIMIT = 4 * 1024 * 1024;

export const CONTACT_MAX_NAME = 120;
export const CONTACT_MAX_EMAIL = 160;
export const CONTACT_MAX_ORDER = 40;
export const CONTACT_MAX_SUBJECT = 120;
export const CONTACT_MAX_MESSAGE = 4000;
export const CONTACT_MAX_FILENAME = 120;

export const CONTACT_REASONS = ["geral", "troca_defeito", "encomenda", "outro"] as const;
export type ContactReason = (typeof CONTACT_REASONS)[number];

export const CONTACT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type ContactImageType = (typeof CONTACT_IMAGE_TYPES)[number];
