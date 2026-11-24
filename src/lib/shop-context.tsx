import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { copy, products as fallbackProducts, type Language, type Product } from "./shop-data";
import { getConsolidatedAsProducts } from "./catalog-adapter";
import { loadCatalog, resetCatalogToDefault } from "./catalog";
import { tr } from "./i18n";
import { readStorage, removeStorage, writeStorage } from "./storage";
import { sanitizeCart } from "./cart";
import { mesmaPersonalizacao, type Personalizacao } from "./personalizacao";

export type CartItem = {
  productId: string;
  size: number;
  /** Slug da cor escolhida (quando o produto tem opções de cor). */
  color?: string;
  /** Slug da opção Cute Cord escolhida (quando o produto tem essa opção). */
  cord?: string;
  /** Corda e fio escolhidos para personalizar a encomenda. */
  personalizacao?: Personalizacao;
  quantity: number;
  /** Preço unitário da variante no momento da compra. */
  unitPrice?: number;
  /** ID da variante na Shopify, usado no checkout. */
  variantId?: string;
};
export type Coupon = { code: string; discountPercent: number };

type ShopContextValue = {
  catalog: Product[];
  language: Language;
  setLanguage: (language: Language) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  cart: CartItem[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (
    productId: string,
    size: number,
    color?: string,
    cord?: string,
    personalizacao?: Personalizacao,
  ) => void;
  removeFromCart: (
    productId: string,
    size: number,
    color?: string,
    cord?: string,
    personalizacao?: Personalizacao,
  ) => void;
  updateQuantity: (
    productId: string,
    size: number,
    quantity: number,
    color?: string,
    cord?: string,
    personalizacao?: Personalizacao,
  ) => void;
  clearCart: () => void;
  count: number;
  subtotal: number;
  // Wishlist
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  // Coupon
  coupon: Coupon | null;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  discountAmount: number;
  finalTotal: number;
  // Catalog / Model Management
  saveProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  updateStock: (productId: string, size: number, newStock: number) => void;
  resetCatalog: () => void;
};

const LANGUAGE_KEY = "uffa-language";
const CART_KEY = "uffa-cart";
const WISHLIST_KEY = "uffa-wishlist";
const LANGUAGES: Language[] = ["pt", "en", "es"];

const VALID_COUPONS: Record<string, number> = {
  UFFA10: 10,
  PORTO20: 20,
  VIP15: 15,
};

const ShopContext = createContext<ShopContextValue | null>(null);

function isLanguage(value: string | null): value is Language {
  return value !== null && LANGUAGES.includes(value as Language);
}

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CartItem>;
  return (
    typeof item.productId === "string" &&
    typeof item.size === "number" &&
    typeof item.quantity === "number" &&
    item.quantity > 0 &&
    (item.color === undefined || typeof item.color === "string") &&
    (item.cord === undefined || typeof item.cord === "string") &&
    (item.personalizacao === undefined ||
      (typeof item.personalizacao === "object" &&
        (item.personalizacao.corda === undefined ||
          typeof item.personalizacao.corda === "string") &&
        (item.personalizacao.fio === undefined || typeof item.personalizacao.fio === "string"))) &&
    (item.unitPrice === undefined || typeof item.unitPrice === "number") &&
    (item.variantId === undefined || typeof item.variantId === "string")
  );
}

function readCart(): CartItem[] {
  const raw = readStorage("local", CART_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter(isCartItem);
  } catch {
    // Cart corrompido
  }
  removeStorage("local", CART_KEY);
  return [];
}

function readWishlist(): string[] {
  const raw = readStorage("local", WISHLIST_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    // Wishlist corrompida
  }
  removeStorage("local", WISHLIST_KEY);
  return [];
}

export function ShopProvider({
  children,
  initialCatalog,
}: {
  children: ReactNode;
  /** Catálogo carregado no servidor (SSR) para evitar troca de imagens após a hidratação. */
  initialCatalog?: Product[];
}) {
  const [language, setLanguageState] = useState<Language>("pt");
  // Black Friday 2026: a loja abre sempre escura, independentemente de uma
  // preferência antiga guardada no browser. O botão do cabeçalho continua a
  // permitir alternar durante a sessão.
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [catalog, setCatalog] = useState<Product[]>(
    initialCatalog?.length ? initialCatalog : getConsolidatedAsProducts(),
  );
  const hasServerCatalog = Boolean(initialCatalog?.length);
  // Só limpamos o carrinho quando o catálogo é de confiança (SSR ou Shopify),
  // nunca com o catálogo de fallback, que tem handles diferentes.
  const [catalogReady, setCatalogReady] = useState(hasServerCatalog);

  useEffect(() => {
    if (hasServerCatalog) return;
    let active = true;
    loadCatalog().then((loaded) => {
      if (!active) return;
      if (loaded.length) setCatalog(loaded);
      setCatalogReady(true);
    });
    return () => {
      active = false;
    };
  }, [hasServerCatalog]);

  useEffect(() => {
    const savedLanguage = readStorage("local", LANGUAGE_KEY);
    if (isLanguage(savedLanguage)) setLanguageState(savedLanguage);
    setCart(readCart());
    setWishlist(readWishlist());
    setReady(true);
  }, []);

  // Remove itens guardados no localStorage cujo produto já não existe. Sem
  // isto, o painel escondia o item mas o badge continuava a mostrar 1 unidade.
  useEffect(() => {
    if (!ready || !catalogReady) return;
    const ids = new Set(catalog.map((product) => product.id));
    setCart((items) => {
      const valid = sanitizeCart(items, ids);
      return valid.length === items.length ? items : valid;
    });
  }, [catalog, catalogReady, ready]);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  }, [theme, ready]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    if (!ready) return;
    writeStorage("local", CART_KEY, JSON.stringify(cart));
  }, [cart, ready]);

  useEffect(() => {
    if (!ready) return;
    writeStorage("local", WISHLIST_KEY, JSON.stringify(wishlist));
  }, [wishlist, ready]);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    writeStorage("local", LANGUAGE_KEY, nextLanguage);
  }, []);

  const addToCart = useCallback(
    (
      productId: string,
      size: number,
      color?: string,
      cord?: string,
      personalizacao?: Personalizacao,
    ) => {
      const product = catalog.find((p) => p.id === productId);
      if (!product) return;

      if (product.status === "inactive" || product.status === "comingsoon") {
        toast.error(
          language === "pt"
            ? "Este modelo não está disponível para encomenda."
            : "This model is not available for order.",
        );
        return;
      }

      const variant = product.sizes.find(
        (s) =>
          s.size === size && (color ? s.color === color : true) && (cord ? s.cord === cord : true),
      );
      if (!variant || variant.stock <= 0) {
        toast.error(
          language === "pt"
            ? `O tamanho ${size} deste modelo está esgotado.`
            : `Size ${size} of this model is sold out.`,
        );
        return;
      }

      const variantColor = variant.color;
      const variantCord = variant.cord;
      const unitPrice = variant.price ?? product.price;
      const matches = (item: CartItem) =>
        item.productId === productId &&
        item.size === size &&
        item.color === variantColor &&
        item.cord === variantCord &&
        mesmaPersonalizacao(item.personalizacao, personalizacao);

      const existingItem = cart.find(matches);
      const currentQty = existingItem?.quantity ?? 0;

      if (currentQty + 1 > variant.stock) {
        toast.error(
          language === "pt"
            ? `Apenas existem ${variant.stock} unidades disponíveis no tamanho ${size}.`
            : `Only ${variant.stock} units available in size ${size}.`,
        );
        return;
      }

      setCart((items) => {
        const hit = items.find(matches);
        return hit
          ? items.map((item) => (item === hit ? { ...item, quantity: item.quantity + 1 } : item))
          : [
              ...items,
              {
                productId,
                size,
                ...(variantColor ? { color: variantColor } : {}),
                ...(variantCord ? { cord: variantCord } : {}),
                ...(personalizacao ? { personalizacao } : {}),
                quantity: 1,
                unitPrice,
                ...(variant.variantId ? { variantId: variant.variantId } : {}),
              },
            ];
      });
      toast.success(tr(language, "Adicionado ao carrinho", "Added to cart", "Añadido al carrito"), {
        action: {
          label: tr(language, "Ver carrinho", "View cart", "Ver carrito"),
          onClick: () => setCartOpen(true),
        },
      });
    },
    [catalog, cart, language],
  );

  const removeFromCart = useCallback(
    (
      productId: string,
      size: number,
      color?: string,
      cord?: string,
      personalizacao?: Personalizacao,
    ) => {
      setCart((items) =>
        items.filter(
          (item) =>
            !(
              item.productId === productId &&
              item.size === size &&
              item.color === color &&
              item.cord === cord &&
              mesmaPersonalizacao(item.personalizacao, personalizacao)
            ),
        ),
      );
    },
    [],
  );

  const updateQuantity = useCallback(
    (
      productId: string,
      size: number,
      quantity: number,
      color?: string,
      cord?: string,
      personalizacao?: Personalizacao,
    ) => {
      if (quantity < 1) {
        removeFromCart(productId, size, color, cord, personalizacao);
        return;
      }

      const product = catalog.find((p) => p.id === productId);
      const variant = product?.sizes.find(
        (s) =>
          s.size === size && (color ? s.color === color : true) && (cord ? s.cord === cord : true),
      );
      let targetQty = quantity;

      if (variant && quantity > variant.stock) {
        toast.error(
          language === "pt"
            ? `Stock máximo atingido (${variant.stock} unidades disponíveis).`
            : `Maximum stock reached (${variant.stock} units available).`,
        );
        targetQty = variant.stock;
      }

      setCart((items) =>
        items.map((item) =>
          item.productId === productId &&
          item.size === size &&
          item.color === color &&
          item.cord === cord &&
          mesmaPersonalizacao(item.personalizacao, personalizacao)
            ? { ...item, quantity: targetQty }
            : item,
        ),
      );
    },
    [catalog, language, removeFromCart],
  );

  const clearCart = useCallback(() => setCart([]), []);

  const saveProduct = useCallback(
    (product: Product) => {
      setCatalog((prev) => {
        const index = prev.findIndex((p) => p.id === product.id);
        if (index >= 0) {
          const next = [...prev];
          next[index] = product;
          return next;
        }
        return [product, ...prev];
      });
      toast.success(
        language === "pt"
          ? `Modelo "${product.name}" guardado com sucesso.`
          : `Model "${product.name}" saved successfully.`,
      );
    },
    [language],
  );

  const deleteProduct = useCallback(
    (productId: string) => {
      setCatalog((prev) => prev.filter((p) => p.id !== productId));
      toast.success(
        language === "pt" ? "Modelo removido do catálogo." : "Model removed from catalog.",
      );
    },
    [language],
  );

  const updateStock = useCallback((productId: string, size: number, newStock: number) => {
    setCatalog((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        return {
          ...p,
          sizes: p.sizes.map((s) => (s.size === size ? { ...s, stock: Math.max(0, newStock) } : s)),
        };
      }),
    );
  }, []);

  const resetCatalog = useCallback(() => {
    const defaults = resetCatalogToDefault();
    setCatalog(defaults);
    toast.success(
      language === "pt"
        ? "Catálogo reposto para os valores originais."
        : "Catalog reset to defaults.",
    );
  }, [language]);

  const toggleWishlist = useCallback((productId: string) => {
    setWishlist((current) => {
      const exists = current.includes(productId);
      const next = exists ? current.filter((id) => id !== productId) : [...current, productId];
      if (exists) {
        toast.info("Removido dos favoritos");
      } else {
        toast.success("Adicionado aos favoritos ❤️");
      }
      return next;
    });
  }, []);

  const isInWishlist = useCallback((productId: string) => wishlist.includes(productId), [wishlist]);

  const applyCoupon = useCallback((code: string) => {
    const clean = code.trim().toUpperCase();
    const percent = VALID_COUPONS[clean];
    if (percent) {
      setCoupon({ code: clean, discountPercent: percent });
      toast.success(`Cupão ${clean} aplicado (${percent}% desc.)!`);
      return true;
    } else {
      toast.error("Cupão inválido ou expirado.");
      return false;
    }
  }, []);

  const removeCoupon = useCallback(() => {
    setCoupon(null);
    toast.info("Cupão removido.");
  }, []);

  const toggleTheme = useCallback(
    () => setTheme((current) => (current === "light" ? "dark" : "light")),
    [],
  );

  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => {
    const product = catalog.find((p) => p.id === item.productId);
    const variantPrice = product?.sizes.find(
      (s) =>
        s.size === item.size &&
        (item.color ? s.color === item.color : true) &&
        (item.cord ? s.cord === item.cord : true),
    )?.price;
    const unitPrice = item.unitPrice ?? variantPrice ?? product?.price ?? 0;
    return sum + unitPrice * item.quantity;
  }, 0);

  const discountAmount = coupon ? (subtotal * coupon.discountPercent) / 100 : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const value = useMemo(
    () => ({
      catalog,
      language,
      setLanguage,
      theme,
      toggleTheme,
      cart,
      cartOpen,
      setCartOpen,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      count,
      subtotal,
      wishlist,
      toggleWishlist,
      isInWishlist,
      coupon,
      applyCoupon,
      removeCoupon,
      discountAmount,
      finalTotal,
      saveProduct,
      deleteProduct,
      updateStock,
      resetCatalog,
    }),
    [
      catalog,
      language,
      setLanguage,
      theme,
      toggleTheme,
      cart,
      cartOpen,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      count,
      subtotal,
      wishlist,
      toggleWishlist,
      isInWishlist,
      coupon,
      applyCoupon,
      removeCoupon,
      discountAmount,
      finalTotal,
      saveProduct,
      deleteProduct,
      updateStock,
      resetCatalog,
    ],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const value = useContext(ShopContext);
  if (!value) throw new Error("useShop must be used inside ShopProvider");
  return value;
}
