import {
  products as fallbackProducts,
  type Category,
  type Product,
  type ProductStatus,
} from "./shop-data";
import { getConsolidatedAsProducts } from "./catalog-adapter";
import { readStorage, removeStorage, writeStorage } from "./storage";
import {
  fetchShopifyProductByHandle,
  fetchShopifyProducts,
  isShopifyConfigured,
  type ShopifyProductNode,
} from "./shopify";

export const CATALOG_STORAGE_KEY = "uffa-custom-catalog-v3";
export const productImagesByHandle: Record<string, string[]> = {};
export const imageByHandle: Record<string, string> = {};
const categories: Category[] = ["sales", "casual", "streetwear", "limited"];

function toCategory(value: string): Category {
  const normalized = value.trim().toLowerCase();
  return categories.includes(normalized as Category) ? (normalized as Category) : "casual";
}

function toProduct(node: ShopifyProductNode): Product {
  const fallback =
    getConsolidatedAsProducts().find((item) => item.id === node.handle) ?? fallbackProducts[0];
  const description = node.description.replace(/<[^>]*>/g, "").trim();
  const shopifyImages = (node.images?.nodes ?? [])
    .map((image) => image.url)
    .filter((url): url is string => Boolean(url));
  const images = shopifyImages.length
    ? shopifyImages
    : (fallback?.images ?? [fallback?.image ?? "/produtos/material-01.webp"]);

  return {
    id: node.handle,
    sku: fallback?.sku ?? `UFFA-${node.handle.toUpperCase()}`,
    name: node.title,
    category: node.productType
      ? toCategory(node.productType)
      : (fallback?.category ?? "streetwear"),
    price: Number.parseFloat(node.priceRange.minVariantPrice.amount),
    status: fallback?.status ?? "active",
    image: images[0] ?? "/produtos/material-01.webp",
    ...(images.length ? { images } : {}),
    description: { pt: description, en: description, es: description },
    sizes: fallback?.sizes ?? [],
    ...(fallback?.featured ? { featured: true } : {}),
  };
}

export function getStoredCatalog(): Product[] | null {
  const raw = readStorage("local", CATALOG_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // corrompido
  }
  return null;
}

export function saveCatalog(items: Product[]): void {
  writeStorage("local", CATALOG_STORAGE_KEY, JSON.stringify(items));
}

export function resetCatalogToDefault(): Product[] {
  removeStorage("local", CATALOG_STORAGE_KEY);
  return getConsolidatedAsProducts();
}

export async function loadProduct(handle: string): Promise<Product | undefined> {
  const stored = getStoredCatalog();
  if (stored) {
    const match = stored.find((item) => item.id === handle);
    if (match) return match;
  }

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

export async function loadCatalog(): Promise<Product[]> {
  const stored = getStoredCatalog();
  if (stored && stored.length > 0) {
    return stored;
  }

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
