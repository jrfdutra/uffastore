import type { Product } from "./shop-data.ts";

/**
 * Verdadeiro quando o produto está em oferta: campanha Black Friday ou
 * preço anterior superior ao preço atual (compareAtPrice da Shopify).
 *
 * Fica num módulo próprio para poder ser testado sem carregar o catálogo
 * estático, que usa aliases de build.
 */
export function isProductOnSale(
  product: Pick<Product, "category" | "categories" | "price"> &
    Partial<Pick<Product, "originalPrice">>,
): boolean {
  const categories = new Set([product.category, ...(product.categories ?? [])]);
  return (
    categories.has("blackfriday") ||
    categories.has("promocoes") ||
    Boolean(product.originalPrice && product.originalPrice > product.price)
  );
}
