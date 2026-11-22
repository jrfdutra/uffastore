import type { Product } from "./shop-data";

/** Cores oferecidas pelo filtro do catálogo. */
export const COLOR_FILTERS = ["white", "black", "pink", "orange", "gray"] as const;

export type ColorFilter = (typeof COLOR_FILTERS)[number];

/**
 * A Shopify guarda cores como texto livre ("Preta", "All Black", "Branco e
 * Laranja", "Cinza Verde"). Estes padrões convertem esse texto nos slugs
 * canónicos usados pelos botões do filtro, em português e inglês.
 */
const COLOR_TERMS: Record<ColorFilter, readonly RegExp[]> = {
  white: [/\bbranc[oa]s?\b/, /\boff[\s-]?white\b/, /\bwhite\b/],
  black: [/\bpret[oa]s?\b/, /\bblack\b/],
  pink: [/\brosa(?:s|do|da)?\b/, /\bpink\b/],
  orange: [/\blaranja\w*\b/, /\borange\b/],
  gray: [/\bcinz(?:a|ent[oa]s?)\b/, /\bgr[ae]y\b/],
};

/**
 * Verdadeiro quando o produto contém a cor procurada, mesmo que a etiqueta da
 * Shopify descreva uma combinação (ex.: "Branco e Laranja" responde a branco
 * e a laranja).
 */
export function matchesColorFilter(product: Product, filter: ColorFilter): boolean {
  const patterns = COLOR_TERMS[filter];
  const candidates = [
    ...(product.colors ?? []).flatMap((color) => [color.name, color.slug]),
    ...product.sizes.flatMap((size) => (size.color ? [size.color] : [])),
  ];

  return candidates.some((candidate) => {
    const normalized = candidate.replace(/[-_/]+/g, " ").trim();
    return patterns.some((pattern) => pattern.test(normalized));
  });
}
