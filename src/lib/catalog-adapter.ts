import { consolidatedProducts } from "./consolidated-catalog";
import { products as fallbackProducts, type Product } from "./shop-data";

export function getConsolidatedAsProducts(): Product[] {
  return consolidatedProducts.map((cp) => {
    const allPrices = cp.sizes.map((s) => s.price);
    const minPrice = Math.min(...allPrices);
    const primaryColor = cp.colors[0] ?? { images: ["/produtos/material-01.webp"] };
    const primaryImage = primaryColor.images[0] ?? "/produtos/material-01.webp";

    const product: Product = {
      id: cp.handle,
      sku: cp.sku,
      name: cp.name,
      category: cp.category,
      price: minPrice,
      status: cp.status,
      image: primaryImage,
      images: primaryColor.images,
      featured: cp.featured,
      description: cp.description,
      sizes: cp.sizes.map((s) => ({
        size: s.size,
        stock: s.stock,
        sku: s.sku,
        ...(s.variantId ? { variantId: s.variantId } : {}),
      })),
    };

    return product;
  });
}
