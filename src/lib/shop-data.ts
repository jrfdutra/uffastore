import navy from "@/assets/78e737e0-4cab-4dee-b928-4e7e4d451907.jpg";
import white from "@/assets/7c2838ae-c293-4a40-946c-1a482d19369c.jpg";
import grey from "@/assets/Gemini_Generated_Image_f4688zf4688zf468.jpg";
import green from "@/assets/Gemini_Generated_Image_wmmzi1wmmzi1wmmz.jpg";
import greenAlt from "@/assets/b9d62cd4-00e2-45df-95df-701356309f59.jpg";
import tan from "@/assets/e44536b4-0486-4401-9327-8f300ee11714.jpg";

export const heroSneaker = grey;

export type Language = "pt" | "en" | "es";
export type Category = "running" | "casual" | "streetwear" | "limited";
export type Product = {
  id: string;
  name: string;
  category: Category;
  price: number;
  image: string;
  description: Record<Language, string>;
  sizes: { size: number; stock: number }[];
  featured?: boolean;
};

export const categoryNames: Record<Category, Record<Language, string>> = {
  running: { pt: "Running", en: "Running", es: "Running" },
  casual: { pt: "Casual", en: "Casual", es: "Casual" },
  streetwear: { pt: "Streetwear", en: "Streetwear", es: "Streetwear" },
  limited: { pt: "Edições limitadas", en: "Limited editions", es: "Ediciones limitadas" },
};

export const products: Product[] = [
  {
    id: "porto-rose-low",
    name: "Porto Rose Low",
    category: "streetwear",
    price: 129,
    image: tan,
    featured: true,
    description: {
      pt: "Camurça rosa envelhecida e pele preta numa silhueta baixa feita para a rua.",
      en: "Dusty rose suede and black leather in a low profile built for the street.",
      es: "Ante rosa envejecido y piel negra en una silueta baja hecha para la calle.",
    },
    sizes: [
      { size: 36, stock: 1 },
      { size: 37, stock: 2 },
      { size: 38, stock: 0 },
      { size: 39, stock: 3 },
      { size: 40, stock: 2 },
      { size: 41, stock: 0 },
      { size: 42, stock: 1 },
    ],
  },
  {
    id: "bolhao-runner",
    name: "Bolhão Runner",
    category: "running",
    price: 145,
    image: navy,
    featured: true,
    description: {
      pt: "Mesh respirável, amortecimento generoso e atitude urbana para dias longos.",
      en: "Breathable mesh, generous cushioning and urban attitude for long days.",
      es: "Malla transpirable, amortiguación generosa y actitud urbana para días largos.",
    },
    sizes: [
      { size: 37, stock: 2 },
      { size: 38, stock: 3 },
      { size: 39, stock: 1 },
      { size: 40, stock: 0 },
      { size: 41, stock: 2 },
      { size: 42, stock: 4 },
      { size: 43, stock: 1 },
    ],
  },
  {
    id: "cedofeita-court",
    name: "Cedofeita Court",
    category: "casual",
    price: 115,
    image: white,
    featured: true,
    description: {
      pt: "Um clássico de court em creme, preto e rosa para todos os dias.",
      en: "A cream, black and rose court classic made for every day.",
      es: "Un clásico court en crema, negro y rosa para todos los días.",
    },
    sizes: [
      { size: 36, stock: 3 },
      { size: 37, stock: 0 },
      { size: 38, stock: 2 },
      { size: 39, stock: 4 },
      { size: 40, stock: 2 },
      { size: 41, stock: 1 },
      { size: 42, stock: 0 },
    ],
  },
  {
    id: "invicta-01",
    name: "Invicta 01",
    category: "limited",
    price: 219,
    image: grey,
    featured: true,
    description: {
      pt: "High-top de edição curta com estrutura escultural e acabamento mate.",
      en: "Small-run high-top with sculptural structure and a matte finish.",
      es: "High-top de edición corta con estructura escultural y acabado mate.",
    },
    sizes: [
      { size: 38, stock: 0 },
      { size: 39, stock: 1 },
      { size: 40, stock: 1 },
      { size: 41, stock: 0 },
      { size: 42, stock: 2 },
      { size: 43, stock: 0 },
    ],
  },
  {
    id: "rosa-norte",
    name: "Rosa Norte",
    category: "casual",
    price: 119,
    image: green,
    description: {
      pt: "Perfil descontraído com contraste marcante e conforto diário.",
      en: "Relaxed profile with bold contrast and everyday comfort.",
      es: "Perfil relajado con contraste marcado y comodidad diaria.",
    },
    sizes: [
      { size: 36, stock: 1 },
      { size: 37, stock: 2 },
      { size: 38, stock: 2 },
      { size: 39, stock: 0 },
      { size: 40, stock: 2 },
    ],
  },
  {
    id: "trindade-flow",
    name: "Trindade Flow",
    category: "running",
    price: 139,
    image: greenAlt,
    description: {
      pt: "Volume técnico e apoio macio para um ritmo sempre em movimento.",
      en: "Technical volume and soft support for an always-moving pace.",
      es: "Volumen técnico y apoyo suave para un ritmo siempre en movimiento.",
    },
    sizes: [
      { size: 38, stock: 2 },
      { size: 39, stock: 1 },
      { size: 40, stock: 2 },
      { size: 41, stock: 3 },
      { size: 42, stock: 0 },
      { size: 43, stock: 1 },
    ],
  },
  {
    id: "galerias-low",
    name: "Galerias Low",
    category: "streetwear",
    price: 125,
    image: navy,
    description: {
      pt: "Linhas retro e construção limpa para combinar sem esforço.",
      en: "Retro lines and a clean build for effortless styling.",
      es: "Líneas retro y construcción limpia para combinar sin esfuerzo.",
    },
    sizes: [
      { size: 36, stock: 2 },
      { size: 37, stock: 3 },
      { size: 38, stock: 1 },
      { size: 39, stock: 1 },
      { size: 40, stock: 0 },
      { size: 41, stock: 2 },
    ],
  },
  {
    id: "afterdark-02",
    name: "Afterdark 02",
    category: "limited",
    price: 229,
    image: tan,
    description: {
      pt: "Uma peça numerada para quem não passa despercebido.",
      en: "A numbered piece for those who never go unnoticed.",
      es: "Una pieza numerada para quien nunca pasa desapercibido.",
    },
    sizes: [
      { size: 39, stock: 1 },
      { size: 40, stock: 0 },
      { size: 41, stock: 1 },
      { size: 42, stock: 0 },
      { size: 43, stock: 1 },
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
