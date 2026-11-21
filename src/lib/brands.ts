import type { Language, Product } from "./shop-data";

/** Marcas visíveis na loja, na ordem apresentada ao cliente.
 * A Nike aparece primeiro por ser a marca com mais volume de vendas. */
export const BRANDS = ["nike", "adidas", "puma", "new-balance", "vans"] as const;
export type Brand = (typeof BRANDS)[number];

export const brandNames: Record<Brand, Record<Language, string>> = {
  adidas: { pt: "Adidas", en: "Adidas", es: "Adidas" },
  nike: { pt: "Nike", en: "Nike", es: "Nike" },
  puma: { pt: "Puma", en: "Puma", es: "Puma" },
  "new-balance": { pt: "New Balance", en: "New Balance", es: "New Balance" },
  vans: { pt: "Vans", en: "Vans", es: "Vans" },
};

const brandPatterns: Record<Brand, RegExp> = {
  adidas: /\badidas\b/,
  nike: /\bnike\b/,
  puma: /\bpuma\b/,
  "new-balance": /\bnew[\s-]*balance\b/,
  vans: /\bvans\b/,
};

/** Normaliza texto para pesquisa: sem acentos, minúsculas e espaços simples. */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ");
}

/**
 * Verdadeiro quando o modelo é vendido COM rope laces.
 * "W/ Rope Laces" e "With Rope Laces" contam; "S/ Rope Laces" (sem) não.
 */
export function hasRopeLaces(product: Pick<Product, "name" | "id">): boolean {
  const text = normalizeText(`${product.name} ${product.id}`);
  if (/\b(?:s|sem)\s+rope\s*lace?s?\b/.test(text)) return false;
  return /\brope\s*lace?s?\b/.test(text);
}

/** Comparador para mostrar primeiro os modelos com rope laces. */
export function compareRopeLacesFirst<T extends Pick<Product, "name" | "id">>(a: T, b: T): number {
  return Number(hasRopeLaces(b)) - Number(hasRopeLaces(a));
}

/** Reconhece uma marca num texto livre (vendor, nome ou handle da Shopify). */
export function brandFromText(...texts: (string | undefined)[]): Brand | undefined {
  const text = normalizeText(texts.filter(Boolean).join(" "));
  if (!text) return undefined;
  return BRANDS.find((brand) => brandPatterns[brand].test(text));
}

type ProductIdentity = Pick<Product, "name" | "id"> & { brand?: string | undefined };

/** Marca do produto: primeiro o vendor da Shopify, depois nome/handle. */
export function getProductBrand(product: ProductIdentity): Brand | undefined {
  return brandFromText(product.brand, product.name, product.id);
}

/** Nome da marca já traduzido (as marcas não variam entre idiomas). */
export function brandLabel(brand: Brand, language: Language): string {
  return brandNames[brand][language];
}

export function brandLabelFor(product: ProductIdentity, language: Language): string | undefined {
  const brand = getProductBrand(product);
  return brand ? brandLabel(brand, language) : undefined;
}

export function isProductInBrand(product: ProductIdentity, brand: Brand | "all"): boolean {
  return brand === "all" || getProductBrand(product) === brand;
}

/**
 * Verdadeiro quando todas as palavras pesquisadas aparecem no nome, marca,
 * cor, handle ou SKU do modelo. Aceita acentos e pesquisa multi-palavra.
 */
export function matchesModel(
  product: Pick<Product, "name" | "id"> & {
    brand?: string | undefined;
    sku?: string | undefined;
    colors?: { name: string }[] | undefined;
  },
  query: string,
): boolean {
  const needles = normalizeText(query).split(" ").filter(Boolean);
  if (!needles.length) return true;
  const haystack = normalizeText(
    [
      product.name,
      product.brand,
      ...(product.colors?.map((color) => color.name) ?? []),
      product.id,
      product.sku,
    ]
      .filter(Boolean)
      .join(" "),
  );
  return needles.every((needle) => haystack.includes(needle));
}

/**
 * Modelos que correspondem à pesquisa e à marca, com os melhores resultados
 * primeiro. Usado na home e no catálogo.
 */
export function searchModels(
  catalog: Product[],
  query: string,
  brand: Brand | "all" = "all",
): Product[] {
  const needles = normalizeText(query).split(" ").filter(Boolean);

  return catalog
    .filter((product) => product.status !== "inactive")
    .filter((product) => isProductInBrand(product, brand))
    .filter((product) => matchesModel(product, query))
    .map((product) => {
      const name = normalizeText(product.name);
      const score = !needles.length
        ? 0
        : needles.every((needle) => name.startsWith(needle))
          ? 0
          : needles.every((needle) => name.includes(needle))
            ? 1
            : 2;
      return { product, score };
    })
    .sort(
      (a, b) =>
        compareRopeLacesFirst(a.product, b.product) ||
        a.score - b.score ||
        a.product.name.localeCompare(b.product.name),
    )
    .map(({ product }) => product);
}
