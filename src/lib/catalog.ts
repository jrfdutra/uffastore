import navy from "@/assets/78e737e0-4cab-4dee-b928-4e7e4d451907.jpg";
import white from "@/assets/7c2838ae-c293-4a40-946c-1a482d19369c.jpg";
import grey from "@/assets/Gemini_Generated_Image_f4688zf4688zf468.jpg";
import green from "@/assets/Gemini_Generated_Image_wmmzi1wmmzi1wmmz.jpg";
import greenAlt from "@/assets/b9d62cd4-00e2-45df-95df-701356309f59.jpg";
import tan from "@/assets/e44536b4-0486-4401-9327-8f300ee11714.jpg";
import { products as fallbackProducts, type Category, type Product } from "./shop-data";
import {
  fetchShopifyProductByHandle,
  fetchShopifyProducts,
  isShopifyConfigured,
  type ShopifyProductNode,
} from "./shopify";

/**
 * A Shopify não guarda imagens no catálogo de demonstração, por isso usamos
 * a arte local indexada pelo handle do produto.
 */
const imageByHandle: Record<string, string> = {
  "porto-rose-low": tan,
  "bolhao-runner": navy,
  "cedofeita-court": white,
  "invicta-01": grey,
  "rosa-norte": green,
  "trindade-flow": greenAlt,
  "galerias-low": navy,
  "afterdark-02": tan,
};

const categories: Category[] = ["running", "casual", "streetwear", "limited"];

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
    }))
    .filter((variant) => Number.isFinite(variant.size))
    .sort((a, b) => a.size - b.size);

  return {
    id: node.handle,
    name: node.title,
    category: toCategory(node.productType),
    price: Number.parseFloat(node.priceRange.minVariantPrice.amount),
    image: node.featuredImage?.url ?? imageByHandle[node.handle] ?? fallback?.image ?? grey,
    description: { pt: description, en: description, es: description },
    sizes: sizes.length ? sizes : (fallback?.sizes ?? []),
    ...(fallback?.featured ? { featured: true } : {}),
  };
}

/**
 * Resolve um único produto pelo handle. Tenta a Shopify primeiro e recorre
 * ao catálogo local quando a loja não está configurada ou não conhece o handle.
 */
export async function loadProduct(handle: string): Promise<Product | undefined> {
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
 * Devolve o catálogo da Shopify. Se a loja não estiver configurada ou a
 * chamada falhar, devolve o catálogo local para o site nunca ficar vazio.
 */
export async function loadCatalog(): Promise<Product[]> {
  if (!isShopifyConfigured()) return fallbackProducts;

  try {
    const nodes = await fetchShopifyProducts(50);
    if (!nodes.length) return fallbackProducts;

    const mapped = nodes.map(toProduct);
    // Mantém a ordem editorial do site quando os handles coincidem.
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
