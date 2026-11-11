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
import { loadCatalog, saveCatalog, resetCatalogToDefault } from "./catalog";
import { tr } from "./i18n";
import { readStorage, removeStorage, writeStorage } from "./storage";

export type CartItem = { productId: string; size: number; quantity: number };
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
  addToCart: (productId: string, size: number) => void;
  removeFromCart: (productId: string, size: number) => void;
  updateQuantity: (productId: string, size: number, quantity: number) => void;
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
const THEME_KEY = "uffa-theme";
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

function isTheme(value: string | null): value is "light" | "dark" {
  return value === "light" || value === "dark";
}

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CartItem>;
  return (
    typeof item.productId === "string" &&
    typeof item.size === "number" &&
    typeof item.quantity === "number" &&
    item.quantity > 0
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

export function ShopProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("pt");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [catalog, setCatalog] = useState<Product[]>(fallbackProducts);

  useEffect(() => {
    let active = true;
    loadCatalog().then((loaded) => {
      if (active && loaded.length) setCatalog(loaded);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const savedLanguage = readStorage("local", LANGUAGE_KEY);
    const savedTheme = readStorage("local", THEME_KEY);
    if (isLanguage(savedLanguage)) setLanguageState(savedLanguage);
    if (isTheme(savedTheme)) setTheme(savedTheme);
    setCart(readCart());
    setWishlist(readWishlist());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    writeStorage("local", THEME_KEY, theme);
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
    (productId: string, size: number) => {
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

      const variant = product.sizes.find((s) => s.size === size);
      if (!variant || variant.stock <= 0) {
        toast.error(
          language === "pt"
            ? `O tamanho ${size} deste modelo está esgotado.`
            : `Size ${size} of this model is sold out.`,
        );
        return;
      }

      const existingItem = cart.find((item) => item.productId === productId && item.size === size);
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
        const hit = items.find((item) => item.productId === productId && item.size === size);
        return hit
          ? items.map((item) => (item === hit ? { ...item, quantity: item.quantity + 1 } : item))
          : [...items, { productId, size, quantity: 1 }];
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

  const removeFromCart = useCallback((productId: string, size: number) => {
    setCart((items) =>
      items.filter((item) => !(item.productId === productId && item.size === size)),
    );
  }, []);

  const updateQuantity = useCallback(
    (productId: string, size: number, quantity: number) => {
      if (quantity < 1) {
        removeFromCart(productId, size);
        return;
      }

      const product = catalog.find((p) => p.id === productId);
      const variant = product?.sizes.find((s) => s.size === size);
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
          item.productId === productId && item.size === size
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
        let next: Product[];
        if (index >= 0) {
          next = [...prev];
          next[index] = product;
        } else {
          next = [product, ...prev];
        }
        saveCatalog(next);
        return next;
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
      setCatalog((prev) => {
        const next = prev.filter((p) => p.id !== productId);
        saveCatalog(next);
        return next;
      });
      toast.success(
        language === "pt" ? "Modelo removido do catálogo." : "Model removed from catalog.",
      );
    },
    [language],
  );

  const updateStock = useCallback((productId: string, size: number, newStock: number) => {
    setCatalog((prev) => {
      const next = prev.map((p) => {
        if (p.id !== productId) return p;
        return {
          ...p,
          sizes: p.sizes.map((s) => (s.size === size ? { ...s, stock: Math.max(0, newStock) } : s)),
        };
      });
      saveCatalog(next);
      return next;
    });
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
  const subtotal = cart.reduce(
    (sum, item) =>
      sum + (catalog.find((product) => product.id === item.productId)?.price ?? 0) * item.quantity,
    0,
  );

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
