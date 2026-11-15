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

/** Tamanhos comercializados no escalão Criança (28-35). */
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

type ModeloBase = {
  /** Handle base na Shopify; cada escalão acrescenta -gs ou -senior. */
  handleBase: string;
  sku: string;
  name: string;
  modeloId: ModeloId;
  category: Category;
  featured: boolean;
  description: {
    pt: string;
    en: string;
    es: string;
  };
  colors: ProductColorOption[];
};

/**
 * Cada modelo é vendido em dois anúncios separados: GS (36–39) e Sénior (40–45).
 * A Shopify é a fonte de verdade; esta lista serve de fallback e define a ordem
 * em que os produtos aparecem no site.
 */
const modelos: ModeloBase[] = [
  {
    handleBase: "air-force-floral-w-rope-laces",
    sku: "AF1-FLORAL",
    name: "(FLORAL AIR FORCE W/ ROPE LACES)",
    modeloId: "air-force-floral-rope",
    category: "limited",
    featured: true,
    description: {
      pt: "Edição especial Air Force Floral com acabamento exclusivo e Rope Laces.",
      en: "Special edition Air Force Floral with an exclusive finish and Rope Laces.",
      es: "Edición especial Air Force Floral con acabado exclusivo y Rope Laces.",
    },
    colors: [cor("Pink", "pink"), cor("Orange", "orange")],
  },
  {
    handleBase: "nike-dunk-w-rope-laces",
    sku: "DUNK-ROPE",
    name: "Nike Dunk w/ Rope Laces",
    modeloId: "nike-dunk-rope",
    category: "streetwear",
    featured: true,
    description: {
      pt: "Nike Dunk com atacadores Rope Laces e o visual urbano mais procurado.",
      en: "Nike Dunk with Rope Laces and the most sought-after urban look.",
      es: "Nike Dunk con Rope Laces y el look urbano más buscado.",
    },
    colors: [cor("White", "white"), cor("Black", "black"), cor("Pink", "pink")],
  },
  {
    handleBase: "air-force-lanvin-w",
    sku: "AF1-LANVIN",
    name: "Air Force Lanvin W",
    modeloId: "air-force-lanvin",
    category: "limited",
    featured: true,
    description: {
      pt: "Air Force com inspiração Lanvin e design volumoso, num único acabamento.",
      en: "Air Force with Lanvin inspiration and a bulky design, in a single finish.",
      es: "Air Force con inspiración Lanvin y diseño voluminoso, en un único acabado.",
    },
    // Modelo de cor única: não são criadas variantes de cor adicionais.
    colors: [],
  },
  {
    handleBase: "floral-black",
    sku: "FLORAL-BLACK",
    name: "Floral Black",
    modeloId: "floral-black",
    category: "limited",
    featured: false,
    description: {
      pt: "Floral Black em acabamento totalmente preto, com o detalhe floral da coleção.",
      en: "Floral Black in an all-black finish, with the collection's floral detail.",
      es: "Floral Black en acabado totalmente negro, con el detalle floral de la colección.",
    },
    colors: [cor("Black", "black")],
  },
  {
    handleBase: "air-force-w-rope-laces",
    sku: "AF1-ROPE",
    name: "Air Force w/ Rope Laces",
    modeloId: "air-force-rope",
    category: "streetwear",
    featured: true,
    description: {
      pt: "Air Force clássico com atacadores Rope Laces de alta resistência e estilo distintivo.",
      en: "Classic Air Force with high-durability Rope Laces and a distinct style.",
      es: "Air Force clásico con Rope Laces de alta resistencia y estilo distintivo.",
    },
    colors: [cor("Gray", "gray"), cor("Pink", "pink"), cor("Black", "black")],
  },
];

/** Escalões comerciais: um anúncio para GS e outro para os tamanhos grandes. */
const escaloesComerciais = [
  { sufixo: "gs", etiqueta: "GS (36–39)", tamanhos: [36, 37, 38, 39], destaque: false },
  {
    sufixo: "senior",
    etiqueta: "Sénior (40–45)",
    tamanhos: [40, 41, 42, 43, 44, 45],
    destaque: true,
  },
];

export const consolidatedProducts: ConsolidatedProduct[] = [
  ...modelos.flatMap((modelo) =>
    escaloesComerciais.map((escalao) => {
      const handle = `${modelo.handleBase}-${escalao.sufixo}`;
      return {
        id: handle,
        handle,
        sku: modelo.sku,
        name: `${modelo.name} — ${escalao.etiqueta}`,
        modeloId: modelo.modeloId,
        category: modelo.category,
        status: "active" as ProductStatus,
        // Apenas a versão Sénior aparece em destaque, para não duplicar o mesmo par.
        featured: modelo.featured && escalao.destaque,
        description: modelo.description,
        colors: modelo.colors,
        sizes: gerarVariantes(handle, modelo.modeloId, modelo.sku, modelo.colors, escalao.tamanhos),
      } satisfies ConsolidatedProduct;
    }),
  ),
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
];

/** Devolve o stock total de uma cor específica. */
export function stockPorCor(produto: ConsolidatedProduct, colorSlug: string): number {
  return produto.sizes
    .filter((variante) => variante.color === colorSlug)
    .reduce((total, variante) => total + variante.stock, 0);
}
