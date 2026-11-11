import fs from "node:fs";
import path from "node:path";
import { consolidatedProducts } from "../src/lib/consolidated-catalog";

// Garante diretório de saída
const outputDir = "shopify-sync";
fs.mkdirSync(outputDir, { recursive: true });

/**
 * Gera o CSV no formato padrão do Shopify Products Importer
 * Referência: https://help.shopify.com/en/manual/products/import-export/import-products
 */
function generateShopifyCsv() {
  const headers = [
    "Handle",
    "Title",
    "Body (HTML)",
    "Vendor",
    "Product Type",
    "Tags",
    "Published",
    "Option1 Name",
    "Option1 Value",
    "Option2 Name",
    "Option2 Value",
    "Option3 Name",
    "Option3 Value",
    "Variant SKU",
    "Variant Grams",
    "Variant Inventory Tracker",
    "Variant Inventory Qty",
    "Variant Inventory Policy",
    "Variant Fulfillment Service",
    "Variant Price",
    "Variant Compare At Price",
    "Variant Requires Shipping",
    "Variant Taxable",
    "Variant Barcode",
    "Image Src",
    "Image Position",
    "Image Alt Text",
    "Gift Card",
    "SEO Title",
    "SEO Description",
    "Google Shopping / Google Product Category",
    "Google Shopping / Gender",
    "Google Shopping / Age Group",
    "Google Shopping / MPN",
    "Google Shopping / AdWords Grouping",
    "Google Shopping / AdWords Labels",
    "Google Shopping / Condition",
    "Google Shopping / Custom Product",
    "Google Shopping / Custom Label 0",
    "Google Shopping / Custom Label 1",
    "Google Shopping / Custom Label 2",
    "Google Shopping / Custom Label 3",
    "Google Shopping / Custom Label 4",
    "Variant Image",
    "Variant Weight Unit",
    "Variant Tax Code",
    "Cost per item",
    "Price / International",
    "Compare At Price / International",
  ];

  const rows = [headers.join(",")];

  for (const cp of consolidatedProducts) {
    const handle = cp.handle;
    const title = cp.name;
    const bodyHtml = `<p>${cp.description.pt}</p>`;
    const vendor = "Uffa Store";
    const productType = cp.category;
    const tags = `UffaCatalog, ${cp.category}, ${cp.modeloId}`;
    const published = "TRUE";

    let isFirstRowForProduct = true;

    for (const color of cp.colors) {
      for (const sizeVariant of cp.sizes) {
        const option1Name = "Color";
        const option1Value = color.colorName;
        const option2Name = "Size";
        const option2Value = sizeVariant.size.toString();
        const variantSku = `${cp.sku}-${color.colorSlug.toUpperCase()}-${sizeVariant.size}`;
        const variantPrice = sizeVariant.price.toFixed(2);
        const variantInventoryQty = sizeVariant.stock.toString();
        const primaryImage = color.images[0]
          ? `https://raw.githubusercontent.com/jrfdutra/uffastore/main/public${color.images[0]}`
          : "";

        const row = [
          isFirstRowForProduct ? handle : "",
          isFirstRowForProduct ? `"${title}"` : "",
          isFirstRowForProduct ? `"${bodyHtml}"` : "",
          isFirstRowForProduct ? `"${vendor}"` : "",
          isFirstRowForProduct ? `"${productType}"` : "",
          isFirstRowForProduct ? `"${tags}"` : "",
          isFirstRowForProduct ? published : "",
          option1Name,
          `"${option1Value}"`,
          option2Name,
          option2Value,
          "",
          "",
          variantSku,
          "500",
          "shopify",
          variantInventoryQty,
          "deny",
          "manual",
          variantPrice,
          "",
          "TRUE",
          "TRUE",
          "",
          isFirstRowForProduct ? primaryImage : "",
          isFirstRowForProduct ? "1" : "",
          isFirstRowForProduct ? `"${title} - ${color.colorName}"` : "",
          "FALSE",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "new",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "kg",
          "",
          "",
          "",
          "",
        ];

        rows.push(row.join(","));
        isFirstRowForProduct = false;
      }
    }
  }

  const csvPath = path.join(outputDir, "shopify-import-consolidado-v2.csv");
  fs.writeFileSync(csvPath, rows.join("\n"), "utf8");
  console.log(`[DRY-RUN] CSV gerado com sucesso em: ${csvPath}`);
}

function generateRedirects() {
  const redirects = [
    { from: "/products/air-force-1-07-white", to: "/products/air-force" },
    { from: "/products/air-force-1-07-black", to: "/products/air-force" },
    { from: "/products/nike-dunk-low-panda", to: "/products/nike-dunk-w-rope-laces" },
    { from: "/products/nike-dunk-low-grey-fog", to: "/products/nike-dunk-w-rope-laces" },
    { from: "/products/nike-dunk-low-photon-dust", to: "/products/nike-dunk-w-rope-laces" },
    { from: "/products/air-force-floral", to: "/products/air-force-floral-w-rope-laces" },
    { from: "/products/air-force-shine", to: "/products/air-force-shine-w-rope-laces" },
    { from: "/products/air-force-lanvin", to: "/products/air-force-lanvin-w-rope-laces" },
  ];

  const lines = ["Redirect from,Redirect to"];
  for (const r of redirects) {
    lines.push(`${r.from},${r.to}`);
  }

  const redPath = path.join(outputDir, "shopify-redirecionamentos-301.csv");
  fs.writeFileSync(redPath, lines.join("\n"), "utf8");
  console.log(`[DRY-RUN] CSV de Redirecionamentos 301 gerado em: ${redPath}`);
}

function runDryRun() {
  console.log("=== MODO DRY-RUN SHOPIFY SYNCHRONIZATION ===");
  console.log("A simular exportação de estado atual e planeamento de sincronização...");

  // Simula backup
  const backupMeta = {
    timestamp: new Date().toISOString(),
    status: "simulated_backup_ok",
    message: "Nenhuma alteração escrita em produção. Modo seguro ativo.",
  };
  fs.writeFileSync(
    path.join(outputDir, "shopify-backup-meta.json"),
    JSON.stringify(backupMeta, null, 2),
  );

  generateShopifyCsv();
  generateRedirects();

  console.log("==============================================");
  console.log("Simulação concluída com sucesso!");
  console.log("Ficheiros gerados na pasta `shopify-sync/` para validação.");
  console.log(
    "Para avançar para aplicação real, será necessário comando explícito com --apply e palavra 'aprovado'.",
  );
}

runDryRun();
