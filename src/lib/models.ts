import { brandNames, getProductBrand, normalizeText, type Brand } from "./brands.ts";
import type { Product } from "./shop-data";

/** Família de modelo (Air Force, Dunk, Campus 00, ...). */
export type Model = { id: string; label: string };
export type ModelOption = Model & { count: number };

type ModelRule = Model & { brand: Brand; patterns: RegExp[] };

/**
 * Modelos reconhecidos, pela ordem em que devem aparecer no catálogo.
 * A ordem dentro da Nike começa pelos modelos com mais volume (Air Force,
 * Dunk e Vomero 5, conforme definido pela loja).
 */
const MODEL_RULES: ModelRule[] = [
  // Nike
  {
    brand: "nike",
    id: "air-force",
    label: "Air Force",
    // "Pearl Force" é o nome comercial de um Air Force personalizado.
    patterns: [/\bair\s+force\b/, /\bpearl\s+force\b/],
  },
  { brand: "nike", id: "dunk", label: "Dunk", patterns: [/\bdunk\b/] },
  { brand: "nike", id: "vomero-5", label: "Vomero 5", patterns: [/\bvomero\s*5\b/] },
  { brand: "nike", id: "p6000", label: "P-6000", patterns: [/\bp\s*-?\s*6000\b/] },
  { brand: "nike", id: "jordan", label: "Jordan", patterns: [/\bjordan\b/] },
  {
    brand: "nike",
    id: "air-more-uptempo",
    label: "Air More Uptempo",
    patterns: [/\bair\s+more\s+uptempo\b/],
  },
  // Adidas
  { brand: "adidas", id: "campus-00", label: "Campus 00", patterns: [/\bcampus\b/] },
  { brand: "adidas", id: "superstar", label: "Superstar", patterns: [/\bsuperstar\b/] },
  // Puma
  { brand: "puma", id: "ca-pro", label: "Ca PRO", patterns: [/\bca\s+pro\b/] },
  { brand: "puma", id: "carina-street", label: "Carina Street", patterns: [/\bcarina\b/] },
  // New Balance
  { brand: "new-balance", id: "530", label: "530", patterns: [/\b530\b/] },
  // Vans
  { brand: "vans", id: "knu-skool", label: "Knu Skool", patterns: [/\bknu\s+skool\b/] },
];

const RULE_ORDER = new Map(MODEL_RULES.map((rule, index) => [rule.id, index]));

/** Palavras decorativas que não identificam o modelo. */
const STOP_WORDS = new Set([
  "w",
  "with",
  "rope",
  "laces",
  "crianca",
  "limitadas",
  "offwhite",
  "ultimate",
  "s",
  "nr",
  "par",
  "da",
  "loja",
  "the",
]);

function slugify(value: string): string {
  return (
    normalizeText(value)
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "") || "outros"
  );
}

/** Modelo derivado do nome quando ainda não existe uma regra específica. */
function fallbackModel(product: Product, brand: Brand | undefined): Model {
  const brandWords = brand ? normalizeText(brandNames[brand].pt).split(" ") : [];
  const words = normalizeText(product.name)
    .split(" ")
    .filter((word) => word && !brandWords.includes(word) && !STOP_WORDS.has(word))
    .slice(0, 3);
  const label = words.map((word) => word[0]!.toUpperCase() + word.slice(1)).join(" ") || "Outros";
  return { id: slugify(label), label };
}

/** Família de modelo de um produto, derivada do nome e da marca da Shopify. */
export function getProductModel(product: Product): Model {
  const brand = getProductBrand(product);
  const text = normalizeText(product.name);
  const rule = MODEL_RULES.find(
    (candidate) =>
      (!brand || candidate.brand === brand) &&
      candidate.patterns.some((pattern) => pattern.test(text)),
  );
  return rule ? { id: rule.id, label: rule.label } : fallbackModel(product, brand);
}

export function isProductInModel(product: Product, model: string | "all"): boolean {
  return model === "all" || getProductModel(product).id === model;
}

/** Modelos disponíveis para uma marca, com contagem e ordem de negócio. */
export function modelsForBrand(catalog: Product[], brand: Brand | "all"): ModelOption[] {
  const counts = new Map<string, ModelOption>();
  for (const product of catalog) {
    if (product.status === "inactive") continue;
    if (brand !== "all" && getProductBrand(product) !== brand) continue;
    const model = getProductModel(product);
    const existing = counts.get(model.id);
    if (existing) existing.count += 1;
    else counts.set(model.id, { ...model, count: 1 });
  }

  return [...counts.values()].sort(
    (a, b) =>
      (RULE_ORDER.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
        (RULE_ORDER.get(b.id) ?? Number.MAX_SAFE_INTEGER) || a.label.localeCompare(b.label),
  );
}
