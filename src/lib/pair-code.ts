/**
 * Código único por par (ex.: UFFA-7K2M9Q).
 *
 * Regras:
 * - Prefixo UFFA, para o cliente reconhecer imediatamente a origem.
 * - Seis caracteres do alfabeto sem letras/números ambíguos (I, O, 0, 1),
 *   para poder ser ditado ao telefone ou escrito numa etiqueta.
 * - A comparação ignora maiúsculas, espaços e separadores.
 */

export const PAIR_CODE_PREFIX = "UFFA";
export const PAIR_CODE_LENGTH = 6;
export const PAIR_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomToken(length: number) {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, (byte) =>
    PAIR_CODE_ALPHABET.charAt(byte % PAIR_CODE_ALPHABET.length),
  ).join("");
}

/** Gera um código de par no formato UFFA-XXXXXX. */
export function generatePairCode() {
  return `${PAIR_CODE_PREFIX}-${randomToken(PAIR_CODE_LENGTH)}`;
}

/** Normaliza um código para comparação (sem espaços, hífenes nem minúsculas). */
export function normalizePairCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

/** Verdadeiro quando o texto já está no formato UFFA-XXXXXX. */
export function isPairCode(value: string) {
  return new RegExp(`^${PAIR_CODE_PREFIX}-[A-Z0-9]{${PAIR_CODE_LENGTH}}$`).test(
    value.trim().toUpperCase(),
  );
}

/**
 * Quantos pares físicos existem numa linha do carrinho.
 * Cada par recebe o seu próprio código, por isso a quantidade é expandida.
 */
export function pairCount(quantity: number) {
  if (!Number.isFinite(quantity)) return 1;
  return Math.max(1, Math.floor(quantity));
}
