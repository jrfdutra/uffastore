export type Language = "pt" | "en" | "es";
export type Category =
  "promocoes" | "lifestyle" | "running" | "limited" | "personalizacao" | "blackfriday";
export type ProductStatus = "active" | "inactive" | "soldout" | "comingsoon";

export type ProductSize = {
  size: number;
  stock: number;
  /** Slug da cor da variante (quando o modelo tem opções de cor). */
  color?: string;
  /** Slug da opção Cute Cord da variante (quando o modelo tem essa opção). */
  cord?: string;
  /** Fotografia associada a esta variante na Shopify. */
  image?: string;
  sku?: string;
  variantId?: string;
  /** Preço unitário da variante já com IVA. */
  price?: number;
  /** Preço antes do desconto (compareAtPrice na Shopify), já com IVA. */
  compareAtPrice?: number;
  /**
   * Etiqueta a mostrar em vez do número. Usada nos modelos vendidos como
   * peça única ("Único"), que não têm escala de tamanhos na Shopify.
   */
  label?: string;
  /** Observação específica da variante (ex.: aviso de defeito). */
  note?: string;
};

export type ProductColor = {
  name: string;
  slug: string;
  images: string[];
};

export type Product = {
  id: string;
  sku?: string;
  name: string;
  /** Marca do produto (na Shopify, o campo vendor). Usada no filtro de marca. */
  brand?: string;
  category: Category;
  /**
   * Categorias adicionais. Permite que um produto apareça em mais do que uma
   * categoria (ex.: "lifestyle" + "promocoes" para entrar também nas Promoções).
   */
  categories?: Category[];
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  /** URL do vídeo do produto (quando existe na Shopify). */
  video?: string;
  /** Cor a que o vídeo pertence (só é mostrado nessa cor). */
  videoColor?: string;
  description: Record<Language, string>;
  sizes: ProductSize[];
  /** Cores disponíveis. Vazio ou ausente quando o modelo não tem opção de cor. */
  colors?: ProductColor[];
  /** Opções de Cute Cord. Vazio ou ausente quando o modelo não tem essa opção. */
  cords?: ProductColor[];
  /** Nome da opção de cordão na Shopify (ex.: "Cute Cord" ou "Rope Laces"). */
  cordLabel?: string;
  status?: ProductStatus;
  featured?: boolean;
};

export function getProductTotalStock(product: Product): number {
  return product.sizes.reduce((sum, s) => sum + (s.stock > 0 ? s.stock : 0), 0);
}

export function getProductEffectiveStatus(product: Product): ProductStatus {
  if (product.status === "inactive") return "inactive";
  if (product.status === "comingsoon") return "comingsoon";
  if (product.status === "soldout") return "soldout";
  const stock = getProductTotalStock(product);
  if (stock <= 0) return "soldout";
  return "active";
}

/** Todas as categorias de um produto, sem duplicados e com a principal primeiro. */
export function getProductCategories(
  product: Pick<Product, "category" | "categories">,
): Category[] {
  return Array.from(new Set<Category>([product.category, ...(product.categories ?? [])]));
}

/** Verdadeiro quando o produto pertence à categoria indicada (ou a "all"). */
export function isProductInCategory(
  product: Pick<Product, "category" | "categories"> & Partial<Pick<Product, "name" | "id">>,
  category: Category | "all",
): boolean {
  if (category === "all") return true;
  if (category === "personalizacao") {
    const nameLower = (product.name || "").toLowerCase();
    const idLower = (product.id || "").toLowerCase();
    const isCustomized =
      nameLower.includes("rope") ||
      nameLower.includes("cord") ||
      nameLower.includes("floral") ||
      nameLower.includes("perolas") ||
      nameLower.includes("pérolas") ||
      nameLower.includes("chapa") ||
      nameLower.includes("lanvin") ||
      idLower.includes("rope") ||
      idLower.includes("floral") ||
      idLower.includes("perolas") ||
      idLower.includes("chapa-dourada") ||
      idLower.includes("cute-cord") ||
      idLower.includes("lanvin");
    return getProductCategories(product).includes("personalizacao") || isCustomized;
  }
  return getProductCategories(product).includes(category);
}

export const categoryNames: Record<Category, Record<Language, string>> = {
  promocoes: { pt: "Promoções", en: "Sales", es: "Promociones" },
  lifestyle: { pt: "Lifestyle", en: "Lifestyle", es: "Lifestyle" },
  running: { pt: "Running", en: "Running", es: "Running" },
  limited: { pt: "Edições Limitadas", en: "Limited Editions", es: "Ediciones Limitadas" },
  personalizacao: { pt: "Personalização", en: "Customization", es: "Personalización" },
  blackfriday: {
    pt: "Promoções - Black Friday",
    en: "Sales - Black Friday",
    es: "Promociones - Black Friday",
  },
};

export const copy = {
  pt: {
    pickup: "Recolha grátis em NorteShopping, Maia Jardim ou MarShopping",
    shop: "Comprar",
    cart: "Carrinho",
    track: "Seguir a minha encomenda",
    add: "Adicionar ao carrinho",
    selectSize: "Seleciona um tamanho",
    subtotal: "Subtotal",
    checkout: "Finalizar compra",
    empty: "O teu carrinho está vazio.",
    newsletter: "Entra no radar",
    newsletterText: "Drops, restocks e novidades. Sem spam.",
    subscribe: "Subscrever",
    email: "O teu email",
    menu: "Menu",
    close: "Fechar",
    search: "Pesquisar sneakers",
    filters: "Filtros",
    all: "Todos",
    size: "Tamanho",
    price: "Preço máximo",
    results: "produtos",
    details: "Ver produto",
    soldOut: "Esgotado",
    quantity: "Quantidade",
    remove: "Remover",
  },
  en: {
    pickup: "Free pickup at NorteShopping, Maia Jardim or MarShopping",
    shop: "Shop",
    cart: "Cart",
    track: "Track my order",
    add: "Add to cart",
    selectSize: "Select a size",
    subtotal: "Subtotal",
    checkout: "Checkout",
    empty: "Your cart is empty.",
    newsletter: "Get on the radar",
    newsletterText: "Drops, restocks and news. No spam.",
    subscribe: "Subscribe",
    email: "Your email",
    menu: "Menu",
    close: "Close",
    search: "Search sneakers",
    filters: "Filters",
    all: "All",
    size: "Size",
    price: "Maximum price",
    results: "products",
    details: "View product",
    soldOut: "Sold out",
    quantity: "Quantity",
    remove: "Remove",
  },
  es: {
    pickup: "Recogida gratis en NorteShopping, Maia Jardim o MarShopping",
    shop: "Comprar",
    cart: "Carrito",
    track: "Seguir mi pedido",
    add: "Añadir al carrito",
    selectSize: "Selecciona una talla",
    subtotal: "Subtotal",
    checkout: "Finalizar compra",
    empty: "Tu carrito está vacío.",
    newsletter: "Entra en el radar",
    newsletterText: "Drops, reposiciones y novedades. Sin spam.",
    subscribe: "Suscribirme",
    email: "Tu email",
    menu: "Menú",
    close: "Cerrar",
    search: "Buscar sneakers",
    filters: "Filtros",
    all: "Todos",
    size: "Talla",
    price: "Precio máximo",
    results: "productos",
    details: "Ver producto",
    soldOut: "Agotado",
    quantity: "Cantidad",
    remove: "Eliminar",
  },
} as const;

export const money = (value: number) =>
  new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value);
