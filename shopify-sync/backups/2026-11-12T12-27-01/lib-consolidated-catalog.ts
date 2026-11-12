import { type Category, type ProductStatus } from "./shop-data";
import { precoPorTamanho, type ModeloId } from "./precos";

export type ProductSizeVariant = {
  size: number;
  stock: number;
  sku: string;
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

export const consolidatedProducts: ConsolidatedProduct[] = [
  {
    id: "air-force-base",
    handle: "air-force",
    sku: "AF1-BASE",
    name: "Air Force",
    modeloId: "air-force",
    category: "streetwear",
    status: "active",
    featured: true,
    description: {
      pt: "O ícone intemporal do basquetebol e da cultura urbana em pele premium.",
      en: "The timeless basketball icon and urban culture in premium leather.",
      es: "El ícono atemporal del baloncesto y la cultura urbana en piel premium.",
    },
    colors: [
      {
        colorName: "Branco",
        colorSlug: "branco",
        images: ["/produtos/material-01.webp", "/produtos/material-02.webp"],
      },
      {
        colorName: "Preto",
        colorSlug: "preto",
        images: ["/produtos/material-03.webp", "/produtos/material-04.webp"],
      },
    ],
    sizes: [28, 29, 30, 31, 32, 33, 34, 35].map((size) => ({
      size,
      stock: 5,
      sku: `AF1-CR-${size}`,
      price: precoPorTamanho("air-force", size),
    })),
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
      en: "Classic Air Force with high-durability Rope Laces and distinct style.",
      es: "Air Force clásico con cordones Rope Laces de alta resistencia y estilo distintivo.",
    },
    colors: [
      {
        colorName: "Branco",
        colorSlug: "branco",
        images: ["/produtos/material-heic-01.webp", "/produtos/material-heic-02.webp"],
      },
      {
        colorName: "Preto",
        colorSlug: "preto",
        images: ["/produtos/material-heic-03.webp", "/produtos/material-heic-04.webp"],
      },
    ],
    sizes: [36, 37, 38, 39, 40, 41, 42, 43, 44, 45].map((size) => {
      const escalao = size <= 39 ? "GS" : "SR";
      return {
        size,
        stock: 5,
        sku: `AF1-ROPE-${escalao}-${size}`,
        price: precoPorTamanho("air-force-rope", size),
      };
    }),
  },
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
    colors: [
      {
        colorName: "Panda",
        colorSlug: "panda",
        images: ["/produtos/material-heic-05.webp", "/produtos/material-heic-06.webp"],
      },
      {
        colorName: "Grey Fog",
        colorSlug: "grey-fog",
        images: ["/produtos/material-heic-07.webp", "/produtos/material-05.webp"],
      },
    ],
    sizes: [36, 37, 38, 39, 40, 41, 42, 43, 44, 45].map((size) => {
      const escalao = size <= 39 ? "GS" : "SR";
      return {
        size,
        stock: 5,
        sku: `DUNK-ROPE-${escalao}-${size}`,
        price: precoPorTamanho("nike-dunk-rope", size),
      };
    }),
  },
  {
    id: "air-force-floral-rope",
    handle: "air-force-floral-w-rope-laces",
    sku: "AF1-FLORAL",
    name: "Air Force Floral w/ Rope Laces",
    modeloId: "air-force-floral-rope",
    category: "limited",
    status: "active",
    featured: true,
    description: {
      pt: "Edição especial Air Force Floral com acabamento exclusivo e Rope Laces.",
      en: "Special edition Air Force Floral with exclusive finish and Rope Laces.",
      es: "Edición especial Air Force Floral con acabado exclusivo y Rope Laces.",
    },
    colors: [
      {
        colorName: "Floral White",
        colorSlug: "floral",
        images: ["/produtos/material-01.webp", "/produtos/material-heic-01.webp"],
      },
    ],
    sizes: [36, 37, 38, 39, 40, 41, 42, 43, 44, 45].map((size) => {
      const escalao = size <= 39 ? "GS" : "SR";
      return {
        size,
        stock: 5,
        sku: `AF1-FLORAL-${escalao}-${size}`,
        price: precoPorTamanho("air-force-floral-rope", size),
      };
    }),
  },
  {
    id: "air-force-shine-rope",
    handle: "air-force-shine-w-rope-laces",
    sku: "AF1-SHINE",
    name: "Air Force Shine w/ Rope Laces",
    modeloId: "air-force-shine-rope",
    category: "limited",
    status: "active",
    featured: false,
    description: {
      pt: "Air Force Shine com pormenores metalizados de destaque e Rope Laces.",
      en: "Air Force Shine with prominent metallic details and Rope Laces.",
      es: "Air Force Shine con detalles metálicos destacados y Rope Laces.",
    },
    colors: [
      {
        colorName: "Shine Metallic",
        colorSlug: "shine",
        images: ["/produtos/material-02.webp", "/produtos/material-heic-02.webp"],
      },
    ],
    sizes: [36, 37, 38, 39, 40, 41, 42, 43, 44, 45].map((size) => {
      const escalao = size <= 39 ? "GS" : "SR";
      return {
        size,
        stock: 5,
        sku: `AF1-SHINE-${escalao}-${size}`,
        price: precoPorTamanho("air-force-shine-rope", size),
      };
    }),
  },
  {
    id: "air-force-lanvin-rope",
    handle: "air-force-lanvin-w-rope-laces",
    sku: "AF1-LANVIN",
    name: "Air Force Lanvin w/ Rope Laces",
    modeloId: "air-force-lanvin-rope",
    category: "limited",
    status: "active",
    featured: true,
    description: {
      pt: "Air Force com inspiração Lanvin, design volumoso e Rope Laces.",
      en: "Air Force with Lanvin inspiration, bulky design and Rope Laces.",
      es: "Air Force con inspiración Lanvin, diseño voluminoso y Rope Laces.",
    },
    colors: [
      {
        colorName: "Lanvin Edition",
        colorSlug: "lanvin",
        images: ["/produtos/material-03.webp", "/produtos/material-heic-03.webp"],
      },
    ],
    sizes: [36, 37, 38, 39, 40, 41, 42, 43, 44, 45].map((size) => {
      const escalao = size <= 39 ? "GS" : "SR";
      return {
        size,
        stock: 5,
        sku: `AF1-LANVIN-${escalao}-${size}`,
        price: precoPorTamanho("air-force-lanvin-rope", size),
      };
    }),
  },
];
