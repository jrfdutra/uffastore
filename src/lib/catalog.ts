import {
  products as fallbackProducts,
  type Category,
  type Product,
  type ProductColor,
  type ProductSize,
} from "./shop-data";
import { FOTO_PADRAO } from "./consolidated-catalog";
import { getConsolidatedAsProducts } from "./catalog-adapter";
import { removeStorage } from "./storage";
import {
  fetchShopifyProductByHandle,
  fetchShopifyProducts,
  isShopifyConfigured,
  type ShopifyProductNode,
} from "./shopify";

/**
 * Chave antiga onde o painel guardava uma cópia local do catálogo.
 * Foi descontinuada: a Shopify é a única fonte de verdade. Mantém-se apenas
 * para limpar dados obsoletos que provocavam imagens antigas no primeiro load.
 */
export const LEGACY_CATALOG_STORAGE_KEY = "uffa-custom-catalog-v3";

const categories: Category[] = ["sales", "casual", "streetwear", "limited"];

function toCategory(value: string): Category {
  const normalized = value.trim().toLowerCase();
  return categories.includes(normalized as Category) ? (normalized as Category) : "casual";
}

/** Reconhece uma tag da Shopify como categoria (ex.: tag "sales"). */
function asCategory(value: string): Category | undefined {
  const normalized = value.trim().toLowerCase();
  return categories.includes(normalized as Category) ? (normalized as Category) : undefined;
}

/** Converte "Grey Fog" / "Azul Marinho" num slug estável. */
export function colorSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function optionValue(
  options: { name: string; value: string }[],
  pattern: RegExp,
): string | undefined {
  return options.find((option) => pattern.test(option.name))?.value;
}

function toProduct(node: ShopifyProductNode): Product {
  const fallback = getConsolidatedAsProducts().find((item) => item.id === node.handle);
  const description = node.description.replace(/<[^>]*>/g, "").trim();
  const images = node.images?.nodes?.length
    ? node.images.nodes.map((img) => img.url)
    : [FOTO_PADRAO];
  const primaryImage = images[0] || FOTO_PADRAO;

  // Cores reais da Shopify (opção "Cor"/"Color"), sem inventar valores.
  const colorValues = node.options?.find((option) => /cor|color/i.test(option.name))?.values ?? [];
  const colors: ProductColor[] = colorValues.map((value) => ({
    name: value,
    slug: colorSlug(value),
    images: images,
  }));

  const sizes: ProductSize[] = (node.variants?.nodes ?? []).flatMap((variant) => {
    const sizeValue = optionValue(variant.selectedOptions, /tamanho|size|escal/i);
    const size = Number.parseInt(sizeValue ?? "", 10);
    if (!Number.isFinite(size)) return [];

    const colorValue = optionValue(variant.selectedOptions, /cor|color/i);
    const slug = colorValue ? colorSlug(colorValue) : undefined;

    return [
      {
        size,
        stock: variant.quantityAvailable ?? 0,
        ...(slug ? { color: slug } : {}),
        ...(variant.sku ? { sku: variant.sku } : {}),
        variantId: variant.id,
        price: Number.parseFloat(variant.price.amount),
      },
    ];
  });

  const priceValues = sizes.map((size) => size.price ?? 0).filter((price) => price > 0);

  // Categoria principal = productType; categorias extra = tags da Shopify
  // (ex.: um produto "casual" com a tag "sales" aparece também nas Promoções).
  const primaryCategory: Category = node.productType
    ? toCategory(node.productType)
    : (fallback?.category ?? "streetwear");
  const extraCategories = Array.from(
    new Set<Category>([
      ...(fallback?.categories ?? []),
      ...(node.tags ?? []).map(asCategory).filter((tag): tag is Category => Boolean(tag)),
    ]),
  ).filter((category) => category !== primaryCategory);

  return {
    id: node.handle,
    sku: fallback?.sku ?? `UFFA-${node.handle.toUpperCase()}`,
    name: node.title,
    category: primaryCategory,
    ...(extraCategories.length ? { categories: extraCategories } : {}),
    price: priceValues.length
      ? Math.min(...priceValues)
      : Number.parseFloat(node.priceRange.minVariantPrice.amount),
    status: fallback?.status ?? "active",
    image: primaryImage,
    ...(images.length ? { images } : {}),
    description: { pt: description, en: description, es: description },
    colors,
    sizes: sizes.length ? sizes : (fallback?.sizes ?? []),
    ...(fallback?.featured ? { featured: true } : {}),
  };
}

/** Remove a cópia local obsoleta do catálogo (causa de imagens antigas). */
export function purgeLegacyCatalogCache(): void {
  removeStorage("local", LEGACY_CATALOG_STORAGE_KEY);
}

export function resetCatalogToDefault(): Product[] {
  purgeLegacyCatalogCache();
  return getConsolidatedAsProducts();
}

export async function loadProduct(handle: string): Promise<Product | undefined> {
  const consolidatedList = getConsolidatedAsProducts();
  const local = consolidatedList.find((item) => item.id === handle);
  if (!isShopifyConfigured()) return local;

  try {
    const node = await fetchShopifyProductByHandle(handle);
    if (node) return toProduct(node);
    return local;
  } catch (error) {
    console.warn("[shopify] produto indisponível, a usar dados locais:", error);
    return local;
  }
}

/**
 * Carrega o catálogo a partir da Shopify. Esta função corre também no servidor,
 * pelo que o primeiro render (SSR) e a hidratação usam exatamente os mesmos
 * dados — sem troca de imagens depois do primeiro paint.
 */
export async function loadCatalog(): Promise<Product[]> {
  const consolidatedList = getConsolidatedAsProducts();
  if (!isShopifyConfigured()) return consolidatedList;

  try {
    const nodes = await fetchShopifyProducts(50);
    if (!nodes.length) return consolidatedList;

    const mapped = nodes.map(toProduct);
    return mapped.sort((a, b) => {
      const indexA = consolidatedList.findIndex((item) => item.id === a.id);
      const indexB = consolidatedList.findIndex((item) => item.id === b.id);
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  } catch (error) {
    console.warn("[shopify] catálogo indisponível, a usar dados locais:", error);
    return consolidatedList;
  }
}

export { fallbackProducts };
