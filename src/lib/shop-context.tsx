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
import { copy, products, type Language } from "./shop-data";
import { readStorage, removeStorage, writeStorage } from "./storage";

export type CartItem = { productId: string; size: number; quantity: number };

type ShopContextValue = {
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
};

const LANGUAGE_KEY = "uffa-language";
const THEME_KEY = "uffa-theme";
const CART_KEY = "uffa-cart";
const LANGUAGES: Language[] = ["pt", "en", "es"];

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
    // Cart corrompido: limpar e começar vazio.
  }
  removeStorage("local", CART_KEY);
  return [];
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("pt");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const savedLanguage = readStorage("local", LANGUAGE_KEY);
    const savedTheme = readStorage("local", THEME_KEY);
    if (isLanguage(savedLanguage)) setLanguageState(savedLanguage);
    if (isTheme(savedTheme)) setTheme(savedTheme);
    setCart(readCart());
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

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    writeStorage("local", LANGUAGE_KEY, nextLanguage);
  }, []);

  const addToCart = useCallback(
    (productId: string, size: number) => {
      setCart((items) => {
        const hit = items.find((item) => item.productId === productId && item.size === size);
        return hit
          ? items.map((item) => (item === hit ? { ...item, quantity: item.quantity + 1 } : item))
          : [...items, { productId, size, quantity: 1 }];
      });
      setCartOpen(true);
      toast.success(copy[language].add);
    },
    [language],
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
      setCart((items) =>
        items.map((item) =>
          item.productId === productId && item.size === size ? { ...item, quantity } : item,
        ),
      );
    },
    [removeFromCart],
  );

  const clearCart = useCallback(() => setCart([]), []);
  const toggleTheme = useCallback(
    () => setTheme((current) => (current === "light" ? "dark" : "light")),
    [],
  );

  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce(
    (sum, item) =>
      sum + (products.find((product) => product.id === item.productId)?.price ?? 0) * item.quantity,
    0,
  );

  const value = useMemo(
    () => ({
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
    }),
    [
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
    ],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const value = useContext(ShopContext);
  if (!value) throw new Error("useShop must be used inside ShopProvider");
  return value;
}
