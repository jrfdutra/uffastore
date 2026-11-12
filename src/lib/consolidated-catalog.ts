import type { Category, ProductStatus } from "./shop-data";
import { precoPorTamanho, type ModeloId } from "./precos.ts";
import shopifyVariants from "../data/shopify-variants.json" with { type: "json" };

export type ProductSizeVariant = {
  size: number;
  stock: number;
  sku: string;
  /** Slug da cor a que esta variante pertence. Ausente em modelos de cor única sem opção. */
  color?: string;
  variantId?: string;
  price: number;
};

export type ProductColorOption = {
  colorName: string;
  colorSlug: string;
  images: string[];
};

export type ConsolidatedProduct = {
  id: string;
  handle: string;
  sku: string;
  name: string;
  modeloId: ModeloId;
  category: Category;
  status: ProductStatus;
  featured: boolean;
  description: {
    pt: string;
    en: string;
    es: string;
  };
  colors: ProductColorOption[];
  sizes: ProductSizeVariant[];
};

/** Fotografia padrão fornecida pela UFFA para todos os novos modelos. */
export const FOTO_PADRAO = "/produtos/uffa-modelo-padrao.webp";

/** Tamanhos comercializados nos escalões GS (36–39) e Senior 40+ (40–45). */
const TAMANHOS_GS_SENIOR = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45];

/** Tamanhos comercializados no escalão Criança (28–35). */
const TAMANHOS_CRIANCA = [28, 29, 30, 31, 32, 33, 34, 35];

/** Stock inicial de cada variante comercializável (cor + tamanho). */
const STOCK_INICIAL = 5;

type VariantMap = Record<string, Record<string, Record<string, string>>>;

const variantIds = shopifyVariants as VariantMap;

function cor(nome: string, slug: string): ProductColorOption {
  return { colorName: nome, colorSlug: slug, images: [FOTO_PADRAO] };
}

/**
 * Gera as variantes cor × tamanho de um modelo, com o preço do escalão
 * correspondente e o variantId da Shopify quando já sincronizado.
 */
function gerarVariantes(
  handle: string,
  modeloId: ModeloId,
  prefixoSku: string,
  cores: ProductColorOption[],
  tamanhos: number[],
): ProductSizeVariant[] {
  const coresEfetivas = cores.length > 0 ? cores : [null];

  return coresEfetivas.flatMap((corOpcao) =>
    tamanhos.map((size) => {
      const slug = corOpcao?.colorSlug;
      const variantId = slug ? variantIds[handle]?.[slug]?.[String(size)] : undefined;
      const sufixo = slug ? `-${slug.toUpperCase()}` : "";

      return {
        size,
        stock: STOCK_INICIAL,
        sku: `${prefixoSku}${sufixo}-${size}`,
        ...(slug ? { color: slug } : {}),
        ...(variantId ? { variantId } : {}),
        price: precoPorTamanho(modeloId, size),
      } satisfies ProductSizeVariant;
    }),
  );
}

export const consolidatedProducts: ConsolidatedProduct[] = [
  {
    id: "nike-dunk-rope-laces",
    handle: "nike-dunk-w-rope-laces",
    sku: "DUNK-ROPE",
    name: "Nike Dunk w/ Rope Laces",
    modeloId: "nike-dunk-rope",
    category: "streetwear",
    status: "active",
    featured: true,
    description: {
      pt: "Nike Dunk com atacadores Rope Laces e o visual urbano mais procurado.",
      en: "Nike Dunk with Rope Laces and the most sought-after urban look.",
      es: "Nike Dunk con Rope Laces y el look urbano más buscado.",
    },
    colors: [cor("White", "white"), cor("Black", "black"), cor("Pink", "pink")],
    sizes: gerarVariantes(
      "nike-dunk-w-rope-laces",
      "nike-dunk-rope",
      "DUNK-ROPE",
      [cor("White", "white"), cor("Black", "black"), cor("Pink", "pink")],
      TAMANHOS_GS_SENIOR,
    ),
  },
  {
    id: "air-force-lanvin-w",
    handle: "air-force-lanvin-w",
    sku: "AF1-LANVIN",
    name: "Air Force Lanvin W",
    modeloId: "air-force-lanvin",
    category: "limited",
    status: "active",
    featured: true,
    description: {
      pt: "Air Force com inspiração Lanvin e design volumoso, num único acabamento.",
      en: "Air Force with Lanvin inspiration and a bulky design, in a single finish.",
      es: "Air Force con inspiración Lanvin y diseño voluminoso, en un único acabado.",
    },
    // Modelo de cor única: não são criadas variantes de cor adicionais.
    colors: [],
    sizes: gerarVariantes(
      "air-force-lanvin-w",
      "air-force-lanvin",
      "AF1-LANVIN",
      [],
      TAMANHOS_GS_SENIOR,
    ),
  },
  {
    id: "air-force-floral-rope-laces",
    handle: "air-force-floral-w-rope-laces",
    sku: "AF1-FLORAL",
    name: "Floral Air Force w/ Rope Laces",
    modeloId: "air-force-floral-rope",
    category: "limited",
    status: "active",
    featured: true,
    description: {
      pt: "Edição especial Air Force Floral com acabamento exclusivo e Rope Laces.",
      en: "Special edition Air Force Floral with an exclusive finish and Rope Laces.",
      es: "Edición especial Air Force Floral con acabado exclusivo y Rope Laces.",
    },
    colors: [cor("Pink", "pink"), cor("Orange", "orange")],
    sizes: gerarVariantes(
      "air-force-floral-w-rope-laces",
      "air-force-floral-rope",
      "AF1-FLORAL",
      [cor("Pink", "pink"), cor("Orange", "orange")],
      TAMANHOS_GS_SENIOR,
    ),
  },
  {
    id: "floral-black",
    handle: "floral-black",
    sku: "FLORAL-BLACK",
    name: "Floral Black",
    modeloId: "floral-black",
    category: "limited",
    status: "active",
    featured: false,
    description: {
      pt: "Floral Black em acabamento totalmente preto, com o detalhe floral da coleção.",
      en: "Floral Black in an all-black finish, with the collection's floral detail.",
      es: "Floral Black en acabado totalmente negro, con el detalle floral de la colección.",
    },
    colors: [cor("Black", "black")],
    sizes: gerarVariantes(
      "floral-black",
      "floral-black",
      "FLORAL-BLACK",
      [cor("Black", "black")],
      TAMANHOS_GS_SENIOR,
    ),
  },
  {
    id: "air-force-crianca",
    handle: "air-force-crianca",
    sku: "AF1-CRIANCA",
    name: "Air Force Criança",
    modeloId: "air-force-crianca",
    category: "casual",
    status: "active",
    featured: false,
    description: {
      pt: "Air Force para criança, dos tamanhos 28 a 35, em pele premium.",
      en: "Air Force for kids, sizes 28 to 35, in premium leather.",
      es: "Air Force para niño, tallas 28 a 35, en piel premium.",
    },
    colors: [cor("White", "white"), cor("Black", "black")],
    sizes: gerarVariantes(
      "air-force-crianca",
      "air-force-crianca",
      "AF1-CRIANCA",
      [cor("White", "white"), cor("Black", "black")],
      TAMANHOS_CRIANCA,
    ),
  },
  {
    id: "air-force-rope-laces",
    handle: "air-force-w-rope-laces",
    sku: "AF1-ROPE",
    name: "Air Force w/ Rope Laces",
    modeloId: "air-force-rope",
    category: "streetwear",
    status: "active",
    featured: true,
    description: {
      pt: "Air Force clássico com atacadores Rope Laces de alta resistência e estilo distintivo.",
      en: "Classic Air Force with high-durability Rope Laces and a distinct style.",
      es: "Air Force clásico con Rope Laces de alta resistencia y estilo distintivo.",
    },
    colors: [cor("Gray", "gray"), cor("Pink", "pink"), cor("Black", "black")],
    sizes: gerarVariantes(
      "air-force-w-rope-laces",
      "air-force-rope",
      "AF1-ROPE",
      [cor("Gray", "gray"), cor("Pink", "pink"), cor("Black", "black")],
      TAMANHOS_GS_SENIOR,
    ),
  },
];

/** Devolve o stock total de uma cor específica. */
export function stockPorCor(produto: ConsolidatedProduct, colorSlug: string): number {
  return produto.sizes
    .filter((variante) => variante.color === colorSlug)
    .reduce((total, variante) => total + variante.stock, 0);
}
