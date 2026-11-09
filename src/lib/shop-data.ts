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
      { size: 28, stock: 5, sku: "AF1-WHT-CR-28", variantId: "gid://shopify/ProductVariant/59816122810716" },
      { size: 29, stock: 5, sku: "AF1-WHT-CR-29", variantId: "gid://shopify/ProductVariant/59816122843484" },
      { size: 30, stock: 5, sku: "AF1-WHT-CR-30", variantId: "gid://shopify/ProductVariant/59816122876252" },
      { size: 31, stock: 5, sku: "AF1-WHT-CR-31", variantId: "gid://shopify/ProductVariant/59816122909020" },
      { size: 32, stock: 5, sku: "AF1-WHT-CR-32", variantId: "gid://shopify/ProductVariant/59816122941788" },
      { size: 33, stock: 5, sku: "AF1-WHT-CR-33", variantId: "gid://shopify/ProductVariant/59816122974556" },
      { size: 34, stock: 5, sku: "AF1-WHT-CR-34", variantId: "gid://shopify/ProductVariant/59816123007324" },
      { size: 35, stock: 5, sku: "AF1-WHT-CR-35", variantId: "gid://shopify/ProductVariant/59816123040092" },
      { size: 36, stock: 5, sku: "AF1-WHT-GS-36", variantId: "gid://shopify/ProductVariant/59816123072860" },
      { size: 37, stock: 5, sku: "AF1-WHT-GS-37", variantId: "gid://shopify/ProductVariant/59816123105628" },
      { size: 38, stock: 5, sku: "AF1-WHT-GS-38", variantId: "gid://shopify/ProductVariant/59816123138396" },
      { size: 39, stock: 5, sku: "AF1-WHT-GS-39", variantId: "gid://shopify/ProductVariant/59816123171164" },
      { size: 40, stock: 5, sku: "AF1-WHT-SR-40", variantId: "gid://shopify/ProductVariant/59816123203932" },
      { size: 41, stock: 5, sku: "AF1-WHT-SR-41", variantId: "gid://shopify/ProductVariant/59816123236700" },
      { size: 42, stock: 5, sku: "AF1-WHT-SR-42", variantId: "gid://shopify/ProductVariant/59816123269468" },
      { size: 43, stock: 5, sku: "AF1-WHT-SR-43", variantId: "gid://shopify/ProductVariant/59816123302236" },
      { size: 44, stock: 5, sku: "AF1-WHT-SR-44", variantId: "gid://shopify/ProductVariant/59816123335004" },
      { size: 45, stock: 5, sku: "AF1-WHT-SR-45", variantId: "gid://shopify/ProductVariant/59816123367772" },
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
      { size: 28, stock: 5, sku: "AF1-BLK-CR-28", variantId: "gid://shopify/ProductVariant/59816131035484" },
      { size: 29, stock: 5, sku: "AF1-BLK-CR-29", variantId: "gid://shopify/ProductVariant/59816131068252" },
      { size: 30, stock: 5, sku: "AF1-BLK-CR-30", variantId: "gid://shopify/ProductVariant/59816131101020" },
      { size: 31, stock: 5, sku: "AF1-BLK-CR-31", variantId: "gid://shopify/ProductVariant/59816131133788" },
      { size: 32, stock: 5, sku: "AF1-BLK-CR-32", variantId: "gid://shopify/ProductVariant/59816131166556" },
      { size: 33, stock: 5, sku: "AF1-BLK-CR-33", variantId: "gid://shopify/ProductVariant/59816131199324" },
      { size: 34, stock: 5, sku: "AF1-BLK-CR-34", variantId: "gid://shopify/ProductVariant/59816131232092" },
      { size: 35, stock: 5, sku: "AF1-BLK-CR-35", variantId: "gid://shopify/ProductVariant/59816131264860" },
      { size: 36, stock: 5, sku: "AF1-BLK-GS-36", variantId: "gid://shopify/ProductVariant/59816131297628" },
      { size: 37, stock: 5, sku: "AF1-BLK-GS-37", variantId: "gid://shopify/ProductVariant/59816131330396" },
      { size: 38, stock: 5, sku: "AF1-BLK-GS-38", variantId: "gid://shopify/ProductVariant/59816131363164" },
      { size: 39, stock: 5, sku: "AF1-BLK-GS-39", variantId: "gid://shopify/ProductVariant/59816131395932" },
      { size: 40, stock: 5, sku: "AF1-BLK-SR-40", variantId: "gid://shopify/ProductVariant/59816131428700" },
      { size: 41, stock: 5, sku: "AF1-BLK-SR-41", variantId: "gid://shopify/ProductVariant/59816131461468" },
      { size: 42, stock: 5, sku: "AF1-BLK-SR-42", variantId: "gid://shopify/ProductVariant/59816131494236" },
      { size: 43, stock: 5, sku: "AF1-BLK-SR-43", variantId: "gid://shopify/ProductVariant/59816131527004" },
      { size: 44, stock: 5, sku: "AF1-BLK-SR-44", variantId: "gid://shopify/ProductVariant/59816131559772" },
      { size: 45, stock: 5, sku: "AF1-BLK-SR-45", variantId: "gid://shopify/ProductVariant/59816131592540" },
    ],
  },
  {
    id: "nike-dunk-low-panda",
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
      { size: 28, stock: 5, sku: "DNK-PND-CR-28", variantId: "gid://shopify/ProductVariant/59816131625308" },
      { size: 29, stock: 5, sku: "DNK-PND-CR-29", variantId: "gid://shopify/ProductVariant/59816131658076" },
      { size: 30, stock: 5, sku: "DNK-PND-CR-30", variantId: "gid://shopify/ProductVariant/59816131690844" },
      { size: 31, stock: 5, sku: "DNK-PND-CR-31", variantId: "gid://shopify/ProductVariant/59816131723612" },
      { size: 32, stock: 5, sku: "DNK-PND-CR-32", variantId: "gid://shopify/ProductVariant/59816131756380" },
      { size: 33, stock: 5, sku: "DNK-PND-CR-33", variantId: "gid://shopify/ProductVariant/59816131789148" },
      { size: 34, stock: 5, sku: "DNK-PND-CR-34", variantId: "gid://shopify/ProductVariant/59816131821916" },
      { size: 35, stock: 5, sku: "DNK-PND-CR-35", variantId: "gid://shopify/ProductVariant/59816131854684" },
      { size: 36, stock: 5, sku: "DNK-PND-GS-36", variantId: "gid://shopify/ProductVariant/59816131887452" },
      { size: 37, stock: 5, sku: "DNK-PND-GS-37", variantId: "gid://shopify/ProductVariant/59816131920220" },
      { size: 38, stock: 5, sku: "DNK-PND-GS-38", variantId: "gid://shopify/ProductVariant/59816131952988" },
      { size: 39, stock: 5, sku: "DNK-PND-GS-39", variantId: "gid://shopify/ProductVariant/59816131985756" },
      { size: 40, stock: 5, sku: "DNK-PND-SR-40", variantId: "gid://shopify/ProductVariant/59816132018524" },
      { size: 41, stock: 5, sku: "DNK-PND-SR-41", variantId: "gid://shopify/ProductVariant/59816132051292" },
      { size: 42, stock: 5, sku: "DNK-PND-SR-42", variantId: "gid://shopify/ProductVariant/59816132084060" },
      { size: 43, stock: 5, sku: "DNK-PND-SR-43", variantId: "gid://shopify/ProductVariant/59816132116828" },
      { size: 44, stock: 5, sku: "DNK-PND-SR-44", variantId: "gid://shopify/ProductVariant/59816132149596" },
      { size: 45, stock: 5, sku: "DNK-PND-SR-45", variantId: "gid://shopify/ProductVariant/59816132182364" },
    ],
  },
  {
    id: "nike-dunk-low-grey-fog",
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
      { size: 28, stock: 5, sku: "DNK-FOG-CR-28", variantId: "gid://shopify/ProductVariant/59816132673884" },
      { size: 29, stock: 5, sku: "DNK-FOG-CR-29", variantId: "gid://shopify/ProductVariant/59816132706652" },
      { size: 30, stock: 5, sku: "DNK-FOG-CR-30", variantId: "gid://shopify/ProductVariant/59816132739420" },
      { size: 31, stock: 5, sku: "DNK-FOG-CR-31", variantId: "gid://shopify/ProductVariant/59816132772188" },
      { size: 32, stock: 5, sku: "DNK-FOG-CR-32", variantId: "gid://shopify/ProductVariant/59816132804956" },
      { size: 33, stock: 5, sku: "DNK-FOG-CR-33", variantId: "gid://shopify/ProductVariant/59816132837724" },
      { size: 34, stock: 5, sku: "DNK-FOG-CR-34", variantId: "gid://shopify/ProductVariant/59816132870492" },
      { size: 35, stock: 5, sku: "DNK-FOG-CR-35", variantId: "gid://shopify/ProductVariant/59816132903260" },
      { size: 36, stock: 5, sku: "DNK-FOG-GS-36", variantId: "gid://shopify/ProductVariant/59816132936028" },
      { size: 37, stock: 5, sku: "DNK-FOG-GS-37", variantId: "gid://shopify/ProductVariant/59816132968796" },
      { size: 38, stock: 5, sku: "DNK-FOG-GS-38", variantId: "gid://shopify/ProductVariant/59816133001564" },
      { size: 39, stock: 5, sku: "DNK-FOG-GS-39", variantId: "gid://shopify/ProductVariant/59816133034332" },
      { size: 40, stock: 5, sku: "DNK-FOG-SR-40", variantId: "gid://shopify/ProductVariant/59816133067100" },
      { size: 41, stock: 5, sku: "DNK-FOG-SR-41", variantId: "gid://shopify/ProductVariant/59816133099868" },
      { size: 42, stock: 5, sku: "DNK-FOG-SR-42", variantId: "gid://shopify/ProductVariant/59816133132636" },
      { size: 43, stock: 5, sku: "DNK-FOG-SR-43", variantId: "gid://shopify/ProductVariant/59816133165404" },
      { size: 44, stock: 5, sku: "DNK-FOG-SR-44", variantId: "gid://shopify/ProductVariant/59816133198172" },
      { size: 45, stock: 5, sku: "DNK-FOG-SR-45", variantId: "gid://shopify/ProductVariant/59816133230940" },
    ],
  },
  {
    id: "nike-dunk-low-photon-dust",
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
      { size: 28, stock: 5, sku: "DNK-PHT-CR-28", variantId: "gid://shopify/ProductVariant/59816133919068" },
      { size: 29, stock: 5, sku: "DNK-PHT-CR-29", variantId: "gid://shopify/ProductVariant/59816133951836" },
      { size: 30, stock: 5, sku: "DNK-PHT-CR-30", variantId: "gid://shopify/ProductVariant/59816133984604" },
      { size: 31, stock: 5, sku: "DNK-PHT-CR-31", variantId: "gid://shopify/ProductVariant/59816134017372" },
      { size: 32, stock: 5, sku: "DNK-PHT-CR-32", variantId: "gid://shopify/ProductVariant/59816134050140" },
      { size: 33, stock: 5, sku: "DNK-PHT-CR-33", variantId: "gid://shopify/ProductVariant/59816134082908" },
      { size: 34, stock: 5, sku: "DNK-PHT-CR-34", variantId: "gid://shopify/ProductVariant/59816134115676" },
      { size: 35, stock: 5, sku: "DNK-PHT-CR-35", variantId: "gid://shopify/ProductVariant/59816134148444" },
      { size: 36, stock: 5, sku: "DNK-PHT-GS-36", variantId: "gid://shopify/ProductVariant/59816134181212" },
      { size: 37, stock: 5, sku: "DNK-PHT-GS-37", variantId: "gid://shopify/ProductVariant/59816134213980" },
      { size: 38, stock: 5, sku: "DNK-PHT-GS-38", variantId: "gid://shopify/ProductVariant/59816134246748" },
      { size: 39, stock: 5, sku: "DNK-PHT-GS-39", variantId: "gid://shopify/ProductVariant/59816134279516" },
      { size: 40, stock: 5, sku: "DNK-PHT-SR-40", variantId: "gid://shopify/ProductVariant/59816134312284" },
      { size: 41, stock: 5, sku: "DNK-PHT-SR-41", variantId: "gid://shopify/ProductVariant/59816134345052" },
      { size: 42, stock: 5, sku: "DNK-PHT-SR-42", variantId: "gid://shopify/ProductVariant/59816134377820" },
      { size: 43, stock: 5, sku: "DNK-PHT-SR-43", variantId: "gid://shopify/ProductVariant/59816134410588" },
      { size: 44, stock: 5, sku: "DNK-PHT-SR-44", variantId: "gid://shopify/ProductVariant/59816134443356" },
      { size: 45, stock: 5, sku: "DNK-PHT-SR-45", variantId: "gid://shopify/ProductVariant/59816134476124" },
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