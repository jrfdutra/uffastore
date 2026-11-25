import {
  products as fallbackProducts,
  type Category,
  type Product,
  type ProductColor,
  type ProductSize,
} from "./shop-data";
import { brandFromText } from "./brands.ts";
import { FOTO_PADRAO } from "./consolidated-catalog";
import { getConsolidatedAsProducts } from "./catalog-adapter";
import { ocultarTamanhosNike } from "./variantes.ts";
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

const categories: Category[] = ["lifestyle", "running", "limited", "personalizacao", "blackfriday"];

/** Aviso mostrado quando a variante seleccionada tem defeito (SKU terminado em -DEFEITO). */
const NOTA_DEFEITO = "Atenção: este par tem um defeito.";

function toCategory(value: string): Category {
  const normalized = value.trim().toLowerCase();
  if (normalized.includes("person") || normalized.includes("custom")) return "personalizacao";
  if (normalized.includes("promo") || normalized.includes("sale")) return "blackfriday";
  if (normalized.includes("run") || normalized.includes("vomero")) return "running";
  if (normalized.includes("limit")) return "limited";
  return categories.includes(normalized as Category) ? (normalized as Category) : "lifestyle";
}

/** Reconhece uma tag da Shopify como categoria (ex.: tag "promocoes" ou "sales"). */
function asCategory(value: string): Category | undefined {
  const normalized = value.trim().toLowerCase();
  if (normalized.includes("person") || normalized.includes("custom")) return "personalizacao";
  if (normalized === "sales" || normalized.includes("promo")) return "blackfriday";
  if (normalized.includes("black friday") || normalized.includes("blackfriday"))
    return "blackfriday";
  if (normalized === "casual" || normalized === "streetwear") return "lifestyle";
  if (normalized.includes("run")) return "running";
  if (normalized.includes("limit")) return "limited";
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

/**
 * Converte a etiqueta de tamanho da Shopify num número, preservando as frações
 * que algumas marcas usam (ex.: Adidas "36 ⅔" = 36,666…; "36 2/3" idem).
 *
 * O número é usado para ordenar e agrupar por escalão; a etiqueta original
 * fica guardada em `label` para ser mostrada ao cliente tal como a marca a escreve.
 */
export function parseTamanho(value?: string): { size: number; label?: string } | undefined {
  if (!value) return undefined;
  const raw = value.trim();
  if (!raw) return undefined;

  // Frações Unicode: 36 ⅓, 36 ⅔
  const unicode = raw.match(/^(\d+)\s*([⅓⅔])$/);
  if (unicode) {
    const whole = Number.parseInt(unicode[1] ?? "0", 10);
    const fraction = unicode[2] === "⅓" ? 1 / 3 : 2 / 3;
    return { size: whole + fraction, label: raw };
  }

  // Frações textuais: 36 1/3, 36 2/3
  const slash = raw.match(/^(\d+)\s+(\d)\/(\d)$/);
  if (slash) {
    const whole = Number.parseInt(slash[1] ?? "0", 10);
    const numerator = Number.parseInt(slash[2] ?? "0", 10);
    const denominator = Number.parseInt(slash[3] ?? "1", 10);
    const fraction = numerator / denominator;
    return { size: whole + fraction, label: raw };
  }

  const size = Number.parseFloat(raw);
  if (!Number.isFinite(size)) return undefined;
  return { size, ...(raw !== String(size) ? { label: raw } : {}) };
}

function toProduct(node: ShopifyProductNode): Product {
  const fallback = getConsolidatedAsProducts().find((item) => item.id === node.handle);
  const description = node.description.replace(/<[^>]*>/g, "").trim();
  const images = node.images?.nodes?.length
    ? node.images.nodes.map((img) => img.url)
    : [FOTO_PADRAO];
  const primaryImage = images[0] || FOTO_PADRAO;

  // Vídeo do produto (Shopify), quando existe. Usa a primeira fonte mp4.
  const video = node.media?.nodes
    ?.find((item) => item.mediaContentType === "VIDEO")
    ?.sources?.find((source) => source.mimeType === "video/mp4")?.url;

  // Cores reais da Shopify (opção "Cor"/"Color"), sem inventar valores.
  // Regex ancorado para não confundir "Cor" com a opção "Cute Cord".
  const colorValues =
    node.options?.find((option) => /^cor(es)?$|^colou?r$/i.test(option.name.trim()))?.values ?? [];

  // Opção de cordão: "Cute Cord" ou "Rope Laces" (ex.: "Com Rope Laces" / "Sem Rope Laces").
  const cordOption = node.options?.find((option) =>
    /cute\s*cord|^cord(ão|ao|ões|oes)?$|^rope\s*laces?$/i.test(option.name.trim()),
  );
  const cordValues = cordOption?.values ?? [];

  // Fotografia própria de cada variante (na Shopify, a imagem é associada à variante).
  // Isto permite que o seletor de cor troque a fotografia para o par certo.
  const variantImagesByColor = new Map<string, string[]>();
  for (const variant of node.variants?.nodes ?? []) {
    const colorValue = optionValue(variant.selectedOptions, /^cor(es)?$|^colou?r$/i);
    const url = variant.image?.url;
    if (!colorValue || !url) continue;
    const slug = colorSlug(colorValue);
    const list = variantImagesByColor.get(slug) ?? [];
    if (!list.includes(url)) list.push(url);
    variantImagesByColor.set(slug, list);
  }

  const colors: ProductColor[] = colorValues.map((value) => {
    const slug = colorSlug(value);
    const ownImages = variantImagesByColor.get(slug);
    return {
      name: value,
      slug,
      // Sem fotografia própria da cor, usa a galeria do produto.
      images: ownImages?.length ? ownImages : images,
    };
  });

  // Opções de Cute Cord (sem imagem própria).
  const cords: ProductColor[] = cordValues.map((value) => ({
    name: value,
    slug: colorSlug(value),
    images,
  }));

  const todasAsVariantes: ProductSize[] = (node.variants?.nodes ?? []).flatMap((variant) => {
    const sizeValue = optionValue(variant.selectedOptions, /tamanho|size|escal/i);
    const parsed = parseTamanho(sizeValue);
    // Sem tamanho numérico na Shopify, a variante não entra no catálogo.
    if (!parsed) return [];

    const colorValue = optionValue(variant.selectedOptions, /^cor(es)?$|^colou?r$/i);
    const slug = colorValue ? colorSlug(colorValue) : undefined;

    const cordValue = optionValue(
      variant.selectedOptions,
      /cute\s*cord|^cord(ão|ao|ões|oes)?$|^rope\s*laces?$/i,
    );
    const cordSlug = cordValue ? colorSlug(cordValue) : undefined;

    return [
      {
        size: parsed.size,
        stock: variant.quantityAvailable ?? 0,
        ...(parsed.label ? { label: parsed.label } : {}),
        ...(slug ? { color: slug } : {}),
        ...(cordSlug ? { cord: cordSlug } : {}),
        ...(variant.sku ? { sku: variant.sku } : {}),
        ...(variant.sku && /-DEFEITO$/i.test(variant.sku) ? { note: NOTA_DEFEITO } : {}),
        variantId: variant.id,
        price: Number.parseFloat(variant.price.amount),
        ...(variant.compareAtPrice
          ? { compareAtPrice: Number.parseFloat(variant.compareAtPrice.amount) }
          : {}),
      },
    ];
  });

  // A escala comercial da Nike exclui 37 e 41,5 em todos os modelos.
  const sizes = ocultarTamanhosNike(
    todasAsVariantes,
    brandFromText(node.vendor, node.title, node.handle),
  );

  const priceValues = sizes.map((size) => size.price ?? 0).filter((price) => price > 0);

  // Preço antigo a riscar: o compareAtPrice da variante mais barata que tenha
  // um valor diferente do atual. Inclui casos excecionais em que o valor antigo
  // é inferior (ex.: Nike Jordan 1º Par Da Loja) — nesses não há percentagem.
  const saleVariant = sizes
    .filter(
      (size) => size.compareAtPrice !== undefined && size.compareAtPrice !== (size.price ?? 0),
    )
    .sort((a, b) => (a.price ?? 0) - (b.price ?? 0))[0];
  const originalPrice = saleVariant?.compareAtPrice ?? fallback?.originalPrice;

  // Categoria principal = productType; categorias extra = tags da Shopify
  // (ex.: um produto "lifestyle" com a tag "Black Friday" aparece também nas Promoções).
  // O handle ajuda a classificar modelos de running conhecidos (ex.: Vomero).
  const isRunningHandle = /vomero|pegasus|running/i.test(node.handle);
  const rawPrimaryCategory: Category = isRunningHandle
    ? "running"
    : node.productType
      ? toCategory(node.productType)
      : (fallback?.category ?? "lifestyle");
  const primaryCategory: Category =
    rawPrimaryCategory === "promocoes" ? "blackfriday" : rawPrimaryCategory;
  const extraCategories = Array.from(
    new Set<Category>([
      ...(fallback?.categories ?? []),
      ...(node.tags ?? []).map(asCategory).filter((tag): tag is Category => Boolean(tag)),
    ]),
  )
    // "Promoções" foi fundida na categoria única "Promoções - Black Friday".
    .map((category) => (category === "promocoes" ? "blackfriday" : category))
    .filter((category) => category !== primaryCategory);

  return {
    id: node.handle,
    sku: fallback?.sku ?? `UFFA-${node.handle.toUpperCase()}`,
    name: node.title,
    ...(node.vendor?.trim()
      ? { brand: node.vendor.trim() }
      : fallback?.brand
        ? { brand: fallback.brand }
        : {}),
    category: primaryCategory,
    ...(extraCategories.length ? { categories: extraCategories } : {}),
    price: priceValues.length
      ? Math.min(...priceValues)
      : Number.parseFloat(node.priceRange.minVariantPrice.amount),
    ...(originalPrice ? { originalPrice } : {}),
    status: fallback?.status ?? "active",
    image: primaryImage,
    ...(images.length ? { images } : {}),
    ...(video ? { video } : {}),
    ...(fallback?.videoColor ? { videoColor: fallback.videoColor } : {}),
    description: { pt: description, en: description, es: description },
    colors,
    ...(cords.length ? { cords } : {}),
    ...(cordOption?.name ? { cordLabel: cordOption.name } : {}),
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
