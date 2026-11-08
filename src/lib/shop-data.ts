import navy from "@/assets/78e737e0-4cab-4dee-b928-4e7e4d451907.jpg";
import white from "@/assets/7c2838ae-c293-4a40-946c-1a482d19369c.jpg";
import grey from "@/assets/Gemini_Generated_Image_f4688zf4688zf468.jpg";
import green from "@/assets/Gemini_Generated_Image_wmmzi1wmmzi1wmmz.jpg";
import greenAlt from "@/assets/b9d62cd4-00e2-45df-95df-701356309f59.jpg";
import tan from "@/assets/e44536b4-0486-4401-9327-8f300ee11714.jpg";

export const heroSneaker = grey;

export type Language = "pt" | "en" | "es";
export type Category = "casual" | "streetwear" | "limited" | "sales";
export type ProductStatus = "active" | "inactive" | "soldout" | "comingsoon";

export type ProductSize = {
  size: number;
  stock: number;
  color?: string;
  sku?: string;
  variantId?: string;
};

export type Product = {
  id: string;
  sku?: string;
  name: string;
  category: Category;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  description: Record<Language, string>;
  sizes: ProductSize[];
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

export const categoryNames: Record<Category, Record<Language, string>> = {
  casual: { pt: "Casual", en: "Casual", es: "Casual" },
  streetwear: { pt: "Streetwear", en: "Streetwear", es: "Streetwear" },
  limited: { pt: "Edições limitadas", en: "Limited editions", es: "Ediciones limitadas" },
  sales: { pt: "Promoções", en: "Sales", es: "Promocões" },
};

export const products: Product[] = [
  {
    id: "air-force-1-07-white",
    sku: "AF1-WHT",
    name: "Nike Air Force 1 '07 White",
    category: "streetwear",
    price: 0.20,
    status: "active",
    image: white,
    featured: true,
    description: {
      pt: "O ícone intemporal do basquetebol e da cultura urbana em pele premium branca.",
      en: "The timeless basketball icon and urban culture in premium white leather.",
      es: "El ícono atemporal del baloncesto y la cultura urbana en piel blanca premium.",
    },
    sizes: [
      { size: 28, stock: 5, sku: "AF1-WHT-CR-28", variantId: "gid://shopify/ProductVariant/59800441815388" },
      { size: 29, stock: 5, sku: "AF1-WHT-CR-29", variantId: "gid://shopify/ProductVariant/59800441848156" },
      { size: 30, stock: 5, sku: "AF1-WHT-CR-30", variantId: "gid://shopify/ProductVariant/59800441880924" },
      { size: 31, stock: 5, sku: "AF1-WHT-CR-31", variantId: "gid://shopify/ProductVariant/59800441913692" },
      { size: 32, stock: 5, sku: "AF1-WHT-CR-32", variantId: "gid://shopify/ProductVariant/59800441946460" },
      { size: 33, stock: 5, sku: "AF1-WHT-CR-33", variantId: "gid://shopify/ProductVariant/59800441979228" },
      { size: 34, stock: 5, sku: "AF1-WHT-CR-34", variantId: "gid://shopify/ProductVariant/59800442011996" },
      { size: 35, stock: 5, sku: "AF1-WHT-CR-35", variantId: "gid://shopify/ProductVariant/59800442044764" },
      { size: 36, stock: 5, sku: "AF1-WHT-GS-36", variantId: "gid://shopify/ProductVariant/59800442077532" },
      { size: 37, stock: 5, sku: "AF1-WHT-GS-37", variantId: "gid://shopify/ProductVariant/59800442110300" },
      { size: 38, stock: 5, sku: "AF1-WHT-GS-38", variantId: "gid://shopify/ProductVariant/59800442143068" },
      { size: 39, stock: 5, sku: "AF1-WHT-GS-39", variantId: "gid://shopify/ProductVariant/59800442175836" },
      { size: 40, stock: 5, sku: "AF1-WHT-SR-40", variantId: "gid://shopify/ProductVariant/59800442175836" },
      { size: 41, stock: 5, sku: "AF1-WHT-SR-41", variantId: "gid://shopify/ProductVariant/59800442208604" },
      { size: 42, stock: 5, sku: "AF1-WHT-SR-42", variantId: "gid://shopify/ProductVariant/59800442241372" },
      { size: 43, stock: 5, sku: "AF1-WHT-SR-43", variantId: "gid://shopify/ProductVariant/59800442274140" },
      { size: 44, stock: 5, sku: "AF1-WHT-SR-44", variantId: "gid://shopify/ProductVariant/59800442306908" },
      { size: 45, stock: 5, sku: "AF1-WHT-SR-45", variantId: "gid://shopify/ProductVariant/59800442339676" },
    ],
  },
  {
    id: "air-force-1-07-black",
    sku: "AF1-BLK",
    name: "Nike Air Force 1 '07 Black",
    category: "streetwear",
    price: 0.20,
    status: "active",
    image: navy,
    featured: true,
    description: {
      pt: "Silhueta clássica em cabedal preto integral com acabamento discreto e duradouro.",
      en: "Classic silhouette in all-black upper with discreet and durable finish.",
      es: "Silueta clásica enUpper negro integral con acabado discreto y duradero.",
    },
    sizes: [
      { size: 28, stock: 5, sku: "AF1-BLK-CR-28", variantId: "gid://shopify/ProductVariant/59800442372644" },
      { size: 29, stock: 5, sku: "AF1-BLK-CR-29", variantId: "gid://shopify/ProductVariant/59800442405412" },
      { size: 30, stock: 5, sku: "AF1-BLK-CR-30", variantId: "gid://shopify/ProductVariant/59800442438180" },
      { size: 31, stock: 5, sku: "AF1-BLK-CR-31", variantId: "gid://shopify/ProductVariant/59800442470948" },
      { size: 32, stock: 5, sku: "AF1-BLK-CR-32", variantId: "gid://shopify/ProductVariant/59800442503756" },
      { size: 33, stock: 5, sku: "AF1-BLK-CR-33", variantId: "gid://shopify/ProductVariant/59800442536524" },
      { size: 34, stock: 5, sku: "AF1-BLK-CR-34", variantId: "gid://shopify/ProductVariant/59800442569304" },
      { size: 35, stock: 5, sku: "AF1-BLK-CR-35", variantId: "gid://shopify/ProductVariant/59800442602072" },
      { size: 36, stock: 5, sku: "AF1-BLK-GS-36", variantId: "gid://shopify/ProductVariant/59800442634872" },
      { size: 37, stock: 5, sku: "AF1-BLK-GS-37", variantId: "gid://shopify/ProductVariant/59800442667640" },
      { size: 38, stock: 5, sku: "AF1-BLK-GS-38", variantId: "gid://shopify/ProductVariant/59800442700408" },
      { size: 39, stock: 5, sku: "AF1-BLK-GS-39", variantId: "gid://shopify/ProductVariant/59800442733176" },
      { size: 40, stock: 5, sku: "AF1-BLK-SR-40", variantId: "gid://shopify/ProductVariant/59800442765944" },
      { size: 41, stock: 5, sku: "AF1-BLK-SR-41", variantId: "gid://shopify/ProductVariant/59800442798712" },
      { size: 42, stock: 5, sku: "AF1-BLK-SR-42", variantId: "gid://shopify/ProductVariant/59800442831480" },
      { size: 43, stock: 5, sku: "AF1-BLK-SR-43", variantId: "gid://shopify/ProductVariant/59800442864248" },
      { size: 44, stock: 5, sku: "AF1-BLK-SR-44", variantId: "gid://shopify/ProductVariant/59800442897016" },
      { size: 45, stock: 5, sku: "AF1-BLK-SR-45", variantId: "gid://shopify/ProductVariant/59800442929784" },
    ],
  },
  {
    id: "dunk-low-panda",
    sku: "DNK-PND",
    name: "Nike Dunk Low Panda",
    category: "casual",
    price: 0.20,
    status: "active",
    image: green,
    featured: true,
    description: {
      pt: "O contraste preto e branco mais procurado das ruas. Visual intemporal e versátil.",
      en: "The most sought-after black-and-white street contrast. Timeless and versatile visual.",
      es: "El contraste negro y blanco más buscado en la calle. Visual atemporal y versátil.",
    },
    sizes: [
      { size: 28, stock: 5, sku: "DNK-PND-CR-28", variantId: "gid://shopify/ProductVariant/59800442995424" },
      { size: 29, stock: 5, sku: "DNK-PND-CR-29", variantId: "gid://shopify/ProductVariant/59800443028192" },
      { size: 30, stock: 5, sku: "DNK-PND-CR-30", variantId: "gid://shopify/ProductVariant/59800430609872" },
      { size: 31, stock: 5, sku: "DNK-PND-CR-31", variantId: "gid://shopify/ProductVariant/59800430642640" },
      { size: 32, stock: 5, sku: "DNK-PND-CR-32", variantId: "gid://shopify/ProductVariant/59800430675408" },
      { size: 33, stock: 5, sku: "DNK-PND-CR-33", variantId: "gid://shopify/ProductVariant/59800430708176" },
      { size: 34, stock: 5, sku: "DNK-PND-CR-34", variantId: "gid://shopify/ProductVariant/59800430740944" },
      { size: 35, stock: 5, sku: "DNK-PND-CR-35", variantId: "gid://shopify/ProductVariant/59800430773712" },
      { size: 36, stock: 5, sku: "DNK-PND-GS-36", variantId: "gid://shopify/ProductVariant/59800430806484" },
      { size: 37, stock: 5, sku: "DNK-PND-GS-37", variantId: "gid://shopify/ProductVariant/59800430839252" },
      { size: 38, stock: 5, sku: "DNK-PND-GS-38", variantId: "gid://shopify/ProductVariant/59800430872020" },
      { size: 39, stock: 5, sku: "DNK-PND-GS-39", variantId: "gid://shopify/ProductVariant/59800430904788" },
      { size: 40, stock: 5, sku: "DNK-PND-SR-40", variantId: "gid://shopify/ProductVariant/59800430937556" },
      { size: 41, stock: 5, sku: "DNK-PND-SR-41", variantId: "gid://shopify/ProductVariant/59800430970324" },
      { size: 42, stock: 5, sku: "DNK-PND-SR-42", variantId: "gid://shopify/ProductVariant/59800431003092" },
      { size: 43, stock: 5, sku: "DNK-PND-SR-43", variantId: "gid://shopify/ProductVariant/59800431035860" },
      { size: 44, stock: 5, sku: "DNK-PND-SR-44", variantId: "gid://shopify/ProductVariant/59800431068628" },
      { size: 45, stock: 5, sku: "DNK-PND-SR-45", variantId: "gid://shopify/ProductVariant/59800431101396" },
    ],
  },
  {
    id: "dunk-low-grey-fog",
    sku: "DNK-FOG",
    name: "Nike Dunk Low Grey Fog",
    category: "casual",
    price: 0.20,
    status: "active",
    image: greenAlt,
    featured: true,
    description: {
      pt: "Tons neutros de cinza e branco com pele suave, inspirados no estilo colegial clássico.",
      en: "Neutral gray and white tones with soft leather, inspired by classic collegiate style.",
      es: "Tonos neutros de gris y blanco con piel suave, inspirado en estilo colegial clásico.",
    },
    sizes: [
      { size: 28, stock: 5, sku: "DNK-FOG-CR-28", variantId: "gid://shopify/ProductVariant/59800431163804" },
      { size: 29, stock: 5, sku: "DNK-FOG-CR-29", variantId: "gid://shopify/ProductVariant/59800431196572" },
      { size: 30, stock: 5, sku: "DNK-FOG-CR-30", variantId: "gid://shopify/ProductVariant/59800431229340" },
      { size: 31, stock: 5, sku: "DNK-FOG-CR-31", variantId: "gid://shopify/ProductVariant/59800431262108" },
      { size: 32, stock: 5, sku: "DNK-FOG-CR-32", variantId: "gid://shopify/ProductVariant/59800431294876" },
      { size: 33, stock: 5, sku: "DNK-FOG-CR-33", variantId: "gid://shopify/ProductVariant/59800431327644" },
      { size: 34, stock: 5, sku: "DNK-FOG-CR-34", variantId: "gid://shopify/ProductVariant/59800431360412" },
      { size: 35, stock: 5, sku: "DNK-FOG-CR-35", variantId: "gid://shopify/ProductVariant/59800431393180" },
      { size: 36, stock: 5, sku: "DNK-FOG-GS-36", variantId: "gid://shopify/ProductVariant/59800431425972" },
      { size: 37, stock: 5, sku: "DNK-FOG-GS-37", variantId: "gid://shopify/ProductVariant/59800431458740" },
      { size: 38, stock: 5, sku: "DNK-FOG-GS-38", variantId: "gid://shopify/ProductVariant/59800431491508" },
      { size: 39, stock: 5, sku: "DNK-FOG-GS-39", variantId: "gid://shopify/ProductVariant/59800431524276" },
      { size: 40, stock: 5, sku: "DNK-FOG-SR-40", variantId: "gid://shopify/ProductVariant/59800431557044" },
      { size: 41, stock: 5, sku: "DNK-FOG-SR-41", variantId: "gid://shopify/ProductVariant/59800431589812" },
      { size: 42, stock: 5, sku: "DNK-FOG-SR-42", variantId: "gid://shopify/ProductVariant/59800431622580" },
      { size: 43, stock: 5, sku: "DNK-FOG-SR-43", variantId: "gid://shopify/ProductVariant/59800431655348" },
      { size: 44, stock: 5, sku: "DNK-FOG-SR-44", variantId: "gid://shopify/ProductVariant/59800431688116" },
      { size: 45, stock: 5, sku: "DNK-FOG-SR-45", variantId: "gid://shopify/ProductVariant/59800431720884" },
    ],
  },
  {
    id: "dunk-low-photon-dust",
    sku: "DNK-PHT",
    name: "Nike Dunk Low Photon Dust",
    category: "limited",
    price: 0.20,
    status: "active",
    image: tan,
    featured: true,
    description: {
      pt: "Estética minimalista com sobreposições subtis em cinzento claro e acabamento mate de alta precisão.",
      en: "Minimalist aesthetic with subtle light gray overlays and high-precision matte finish.",
      es: "Estética minimalista con superposiciones sutiles en gris claro y acabado mate de alta precisión.",
    },
    sizes: [
      { size: 28, stock: 5, sku: "DNK-PHT-CR-28", variantId: "gid://shopify/ProductVariant/59800431785556" },
      { size: 29, stock: 5, sku: "DNK-PHT-CR-29", variantId: "gid://shopify/ProductVariant/59800431818324" },
      { size: 30, stock: 5, sku: "DNK-PHT-CR-30", variantId: "gid://shopify/ProductVariant/59800431851092" },
      { size: 31, stock: 5, sku: "DNK-PHT-CR-31", variantId: "gid://shopify/ProductVariant/59800431883860" },
      { size: 32, stock: 5, sku: "DNK-PHT-CR-32", variantId: "gid://shopify/ProductVariant/59800431916628" },
      { size: 33, stock: 5, sku: "DNK-PHT-CR-33", variantId: "gid://shopify/ProductVariant/59800431949396" },
      { size: 34, stock: 5, sku: "DNK-PHT-CR-34", variantId: "gid://shopify/ProductVariant/59800431982164" },
      { size: 35, stock: 5, sku: "DNK-PHT-CR-35", variantId: "gid://shopify/ProductVariant/59800432014932" },
      { size: 36, stock: 5, sku: "DNK-PHT-GS-36", variantId: "gid://shopify/ProductVariant/59800432071900" },
      { size: 37, stock: 5, sku: "DNK-PHT-GS-37", variantId: "gid://shopify/ProductVariant/59800432104668" },
      { size: 38, stock: 5, sku: "DNK-PHT-GS-38", variantId: "gid://shopify/ProductVariant/59800432137436" },
      { size: 39, stock: 5, sku: "DNK-PHT-GS-39", variantId: "gid://shopify/ProductVariant/59800432170204" },
      { size: 40, stock: 5, sku: "DNK-PHT-SR-40", variantId: "gid://shopify/ProductVariant/59800432238184" },
      { size: 41, stock: 5, sku: "DNK-PHT-SR-41", variantId: "gid://shopify/ProductVariant/59800432270952" },
      { size: 42, stock: 5, sku: "DNK-PHT-SR-42", variantId: "gid://shopify/ProductVariant/59800432303720" },
      { size: 43, stock: 5, sku: "DNK-PHT-SR-43", variantId: "gid://shopify/ProductVariant/59800432336488" },
      { size: 44, stock: 5, sku: "DNK-PHT-SR-44", variantId: "gid://shopify/ProductVariant/59800432369256" },
      { size: 45, stock: 5, sku: "DNK-PHT-SR-45", variantId: "gid://shopify/ProductVariant/59800432402024" },
    ],
  },
];

export const copy = {
  pt: {
    pickup: "Recolha em mãos grátis no Porto",
    shop: "Comprar",
    cart: "Carrinho",
    track: "Seguir a minha encomenda",
    verified: "Verificado",
    add: "Adicionar ao carrinho",
    selectSize: "Seleciona um tamanho",
    subtotal: "Subtotal",
    checkout: "Finalizar compra",
    empty: "O teu carrinho está vazio.",
    newsletter: "Entra no radar",
    newsletterText: "Drops, restocks e novidades. Sem spam.",
    subscribe: "Subscrever",
    email: "O teu email",
    noReturns: "Sem trocas nem devoluções",
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
    pickup: "Free hand pickup in Porto",
    shop: "Shop",
    cart: "Cart",
    track: "Track my order",
    verified: "Verified",
    add: "Add to cart",
    selectSize: "Select a size",
    subtotal: "Subtotal",
    checkout: "Checkout",
    empty: "Your cart is empty.",
    newsletter: "Get on the radar",
    newsletterText: "Drops, restocks and news. No spam.",
    subscribe: "Subscribe",
    email: "Your email",
    noReturns: "No exchanges or returns",
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
    pickup: "Recogida en mano gratis en Oporto",
    shop: "Comprar",
    cart: "Carrito",
    track: "Seguir mi pedido",
    verified: "Verificado",
    add: "Añadir al carrito",
    selectSize: "Selecciona una talla",
    subtotal: "Subtotal",
    checkout: "Finalizar compra",
    empty: "Tu carrito está vacío.",
    newsletter: "Entra en el radar",
    newsletterText: "Drops, reposiciones y novedades. Sin spam.",
    subscribe: "Suscribirme",
    email: "Tu email",
    noReturns: "Sin cambios ni devoluciones",
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