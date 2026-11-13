import { fetchShopifyProductByHandle } from "../src/lib/shopify.ts";
try {
  const p = await fetchShopifyProductByHandle("teste");
  console.log("Produto obtido da Storefront API:", p);
} catch (e) {
  console.error("Erro:", e);
}
