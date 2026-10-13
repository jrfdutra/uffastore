import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { copy, products, type Language } from "./shop-data";

export type CartItem = { productId: string; size: number; quantity: number };
type ShopContextValue = { language: Language; setLanguage: (l: Language) => void; theme: "light" | "dark"; toggleTheme: () => void; cart: CartItem[]; cartOpen: boolean; setCartOpen: (o: boolean) => void; addToCart: (id: string, size: number) => void; removeFromCart: (id: string, size: number) => void; updateQuantity: (id: string, size: number, quantity: number) => void; clearCart: () => void; count: number; subtotal: number };
const ShopContext = createContext<ShopContextValue | null>(null);

export function ShopProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("pt");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  useEffect(() => {
    const lang = localStorage.getItem("uffa-language") as Language | null;
    const savedTheme = localStorage.getItem("uffa-theme") as "light" | "dark" | null;
    const savedCart = localStorage.getItem("uffa-cart");
    if (lang && ["pt", "en", "es"].includes(lang)) setLanguageState(lang);
    if (savedTheme) setTheme(savedTheme);
    if (savedCart) { try { setCart(JSON.parse(savedCart) as CartItem[]); } catch { localStorage.removeItem("uffa-cart"); } }
  }, []);
  useEffect(() => { document.documentElement.classList.toggle("dark", theme === "dark"); localStorage.setItem("uffa-theme", theme); }, [theme]);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  useEffect(() => { localStorage.setItem("uffa-cart", JSON.stringify(cart)); }, [cart]);
  const setLanguage = (l: Language) => { setLanguageState(l); localStorage.setItem("uffa-language", l); };
  const addToCart = (productId: string, size: number) => { setCart((items) => { const hit = items.find((x) => x.productId === productId && x.size === size); return hit ? items.map((x) => x === hit ? {...x, quantity: x.quantity + 1} : x) : [...items, {productId,size,quantity:1}]; }); setCartOpen(true); toast.success(copy[language].add); };
  const removeFromCart = (productId: string, size: number) => setCart((items) => items.filter((x) => !(x.productId === productId && x.size === size)));
  const updateQuantity = (productId: string, size: number, quantity: number) => quantity < 1 ? removeFromCart(productId,size) : setCart((items) => items.map((x) => x.productId === productId && x.size === size ? {...x,quantity} : x));
  const count = cart.reduce((sum,x) => sum + x.quantity,0);
  const subtotal = cart.reduce((sum,x) => sum + (products.find((p) => p.id === x.productId)?.price ?? 0) * x.quantity,0);
  const value = useMemo(() => ({language,setLanguage,theme,toggleTheme:()=>setTheme((t)=>t === "light" ? "dark" : "light"),cart,cartOpen,setCartOpen,addToCart,removeFromCart,updateQuantity,clearCart:()=>setCart([]),count,subtotal}), [language,theme,cart,cartOpen,count,subtotal]);
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}
export function useShop() { const value = useContext(ShopContext); if (!value) throw new Error("useShop must be used inside ShopProvider"); return value; }
