import type { Language } from "./shop-data";

/** Tradução inline: mantém PT/EN/ES junto do texto que o usa. */
export function tr(language: Language, pt: string, en: string, es: string) {
  if (language === "pt") return pt;
  if (language === "es") return es;
  return en;
}

export const localeByLanguage: Record<Language, string> = {
  pt: "pt-PT",
  en: "en-GB",
  es: "es-ES",
};
