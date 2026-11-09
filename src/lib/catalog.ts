import navy from "@/assets/78e737e0-4cab-4dee-b928-4e7e4d451907.jpg";
import white from "@/assets/7c2838ae-c293-4a40-946c-1a482d19369c.jpg";
import grey from "@/assets/Gemini_Generated_Image_f4688zf4688zf468.jpg";
import green from "@/assets/Gemini_Generated_Image_wmmzi1wmmzi1wmmz.jpg";
import greenAlt from "@/assets/b9d62cd4-00e2-45df-95df-701356309f59.jpg";
import tan from "@/assets/e44536b4-0486-4401-9327-8f300ee11714.jpg";
import { products as fallbackProducts, type Category, type Product, type ProductStatus } from "./shop-data";
import { readStorage, removeStorage, writeStorage } from "./storage";
import {
  fetchShopifyProductByHandle,
  fetchShopifyProducts,
  isShopifyConfigured,
  type ShopifyProductNode,
} from "./shopify";

export const CATALOG_STORAGE_KEY = "uffa-custom-catalog-v2";

/**
 * A Shopify não guarda imagens no catálogo de demonstração, por isso usamos
 * a arte local indexada pelo handle do produto.
 */
export const imageByHandle: Record<string, string> = {
  "air-force-1-07-white": white,
  "air-force-1-07-black": navy,
  "nike-dunk-low-panda": green,
  "nike-dunk-low-grey-fog": greenAlt,
  "nike-dunk-low-photon-dust": tan,
};

const categories: Category[] = ["sales", "casual", "streetwear", "limited"];

function toCategory(value: string): Category {
  const normalized = value.trim().toLowerCase();
  return categories.includes(normalized as Category) ? (normalized as Category) : "casual";
}

function toProduct(node: ShopifyProductNode): Product {
  const fallback = fallbackProducts.find((item) => item.id === node.handle);
  const description = node.description.replace(/<[^>]*>/g, "").trim();

  const sizes = node.variants.nodes
    .map((variant) => ({
      size: Number.parseInt(variant.selectedOptions[0]?.value ?? variant.title, 10),
      stock: variant.quantityAvailable ?? (variant.availableForSale ? 1 : 0),
      variantId: variant.id,
      sku: `${fallback?.sku ?? `UFFA-${node.handle.toUpperCase()}`}-${variant.selectedOptions[0]?.value ?? variant.title}`,
    }))
    .filter((variant) => Number.isFinite(variant.size))
    .sort((a, b) => a.size - b.size);

  return {
    id: node.handle,
    sku: fallback?.sku ?? `UFFA-${node.handle.toUpperCase()}`,
    name: node.title,
    // O catálogo local é a referência da taxonomia do site; a Shopify só
    // define a categoria de produtos que ainda não existam localmente.
    category: fallback?.category ?? toCategory(node.productType),
    price: Number.parseFloat(node.priceRange.minVariantPrice.amount),
    status: fallback?.status ?? "active",
    image: node.featuredImage?.url ?? imageByHandle[node.handle] ?? fallback?.image ?? grey,
    description: { pt: description, en: description, es: description },
    sizes: sizes.length ? sizes : (fallback?.sizes ?? []),
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
  return fallbackProducts;
}

/**
 * Resolve um único produto pelo handle.
 */
export async function loadProduct(handle: string): Promise<Product | undefined> {
  const stored = getStoredCatalog();
  if (stored) {
    const match = stored.find((item) => item.id === handle);
    if (match) return match;
  }

  const local = fallbackProducts.find((item) => item.id === handle);
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
 * Devolve o catálogo de produtos da loja.
 * Prioridade:
 * 1. Alterações personalizadas guardadas no painel de operações (localStorage)
 * 2. Catálogo sincronizado da Shopify
 * 3. Catálogo base local (fallback)
 */
export async function loadCatalog(): Promise<Product[]> {
  const stored = getStoredCatalog();
  if (stored && stored.length > 0) {
    return stored;
  }

  if (!isShopifyConfigured()) return fallbackProducts;

  try {
    const nodes = await fetchShopifyProducts(50);
    if (!nodes.length) return fallbackProducts;

    const mapped = nodes.map(toProduct);
    return mapped.sort((a, b) => {
      const indexA = fallbackProducts.findIndex((item) => item.id === a.id);
      const indexB = fallbackProducts.findIndex((item) => item.id === b.id);
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  } catch (error) {
    console.warn("[shopify] catálogo indisponível, a usar dados locais:", error);
    return fallbackProducts;
  }
}
