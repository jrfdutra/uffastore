import { brandFromText, brandNames } from "./brands";
import { consolidatedProducts } from "./consolidated-catalog";
import { type Product } from "./shop-data";

export function getConsolidatedAsProducts(): Product[] {
  return consolidatedProducts.map((cp) => {
    const allPrices = cp.sizes.map((s) => s.price);
    const minPrice = Math.min(...allPrices);
    const primaryColor = cp.colors[0];
    const primaryImage = primaryColor?.images[0] ?? "/produtos/uffa-modelo-padrao.webp";
    // A Shopify é a fonte de verdade; este valor só serve quando o catálogo
    // local é usado (sem rede / fallback).
    const brand = brandFromText(cp.name, cp.handle);

    const product: Product = {
      id: cp.handle,
      sku: cp.sku,
      name: cp.name,
      ...(brand ? { brand: brandNames[brand].pt } : {}),
      category: cp.category,
      price: minPrice,
      status: cp.status,
      image: primaryImage,
      images: primaryColor?.images ?? [primaryImage],
      ...(cp.videoColor ? { videoColor: cp.videoColor } : {}),
      featured: cp.featured,
      description: cp.description,
      colors: cp.colors.map((color) => ({
        name: color.colorName,
        slug: color.colorSlug,
        images: color.images,
      })),
      sizes: cp.sizes.map((s) => ({
        size: s.size,
        stock: s.stock,
        sku: s.sku,
        ...(s.color ? { color: s.color } : {}),
        ...(s.variantId ? { variantId: s.variantId } : {}),
        price: s.price,
      })),
    };

    return product;
  });
}
