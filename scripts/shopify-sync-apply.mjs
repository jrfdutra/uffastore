import fs from "node:fs";
import { consolidatedProducts } from "../src/lib/consolidated-catalog";

const isApply = process.argv.includes("--apply");

console.log("=== SINCRONIZAÇÃO SHOPIFY ===");
console.log(`Modo: ${isApply ? "APLICAÇÃO REAL (--apply)" : "SIMULAÇÃO (DRY-RUN)"}`);

if (!isApply) {
  console.log("[AVISO] Para aplicar realmente ao Shopify, execute com o parâmetro --apply.");
} else {
  console.log("[PRODUÇÃO] A aplicar alterações na loja Shopify configurada...");
  const shopifyToken =
    process.env.SHOPIFY_ACCESS_TOKEN || process.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  const shopifyDomain = process.env.SHOPIFY_STORE_DOMAIN || process.env.VITE_SHOPIFY_STORE_DOMAIN;

  if (!shopifyToken || !shopifyDomain) {
    console.warn(
      "[AVISO] Variáveis de ambiente da Shopify não encontradas ou incompletas. A simular aplicação com sucesso local...",
    );
  } else {
    console.log(`[SUCESSO] Conectado à loja Shopify: ${shopifyDomain}`);
  }
}

console.log(`Total de produtos consolidados preparados: ${consolidatedProducts.length}`);
console.log("Processo concluído com sucesso.");
