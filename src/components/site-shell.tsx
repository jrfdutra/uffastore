import { Link, useRouterState } from "@tanstack/react-router";
import {
  Menu,
  Moon,
  PackageSearch,
  ShoppingBag,
  Sun,
  Instagram,
  MapPin,
  Minus,
  Plus,
  Trash2,
  MessageSquare,
  Copy,
  Heart,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  categoryNames,
  copy,
  money,
  type Category,
  type Language,
} from "@/lib/shop-data";
import { useShop } from "@/lib/shop-context";
import { tr } from "@/lib/i18n";
import { useEffect, useState, type ReactNode } from "react";

const cats: Category[] = ["casual", "streetwear", "limited", "sales"];

function CartDrawer() {
  const s = useShop(),
    t = copy[s.language];
  const [couponCode, setCouponCode] = useState("");

  const handleShareWhatsApp = () => {
    const itemsText = s.cart.map((item) => {
      const p = s.catalog.find((c) => c.id === item.productId);
      return `${item.quantity}x ${p?.name || item.productId} (Tam: ${item.size})`;
    }).join(", ");
    const text = `🛒 Carrinho UFFA Store:\n${itemsText}\nTotal: ${money(s.finalTotal)}\nVisita: ${window.location.origin}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleCopyCart = async () => {
    const itemsText = s.cart.map((item) => {
      const p = s.catalog.find((c) => c.id === item.productId);
      return `${item.quantity}x ${p?.name || item.productId} (Tam: ${item.size})`;
    }).join(", ");
    const text = `🛒 Carrinho UFFA Store: ${itemsText} — Total: ${money(s.finalTotal)}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(tr(s.language, "Carrinho copiado!", "Cart copied!", "¡Carrito copiado!"));
    } catch {
      toast.error(tr(s.language, "Erro ao copiar.", "Error copying.", "Error al copiar."));
    }
  };

  return (
    <Sheet open={s.cartOpen} onOpenChange={s.setCartOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`${t.cart} (${s.count})`}
          className="relative"
        >
          <ShoppingBag />
          <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-brand-foreground text-[10px] font-bold text-brand dark:bg-brand dark:text-brand-strong">
            {s.count}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-3xl uppercase">{t.cart}</SheetTitle>
          <SheetDescription>
            {s.count} {t.results}
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 space-y-5 overflow-auto py-5">
          {s.cart.length === 0 ? (
            <div className="grid h-full place-items-center text-center text-muted-foreground">
              <div>
                <ShoppingBag className="mx-auto mb-3 size-9" />
                <p>{t.empty}</p>
              </div>
            </div>
          ) : (
            s.cart.map((item) => {
              const p = s.catalog.find((x) => x.id === item.productId);
              if (!p) return null;
              return (
                <div
                  key={`${item.productId}-${item.size}`}
                  className="grid grid-cols-[84px_1fr] gap-3 border-b border-border pb-5"
                >
                  <img
                    src={p.image}
                    alt=""
                    width={1200}
                    height={900}
                    className="aspect-square h-full w-full bg-product object-cover"
                  />
                  <div>
                    <div className="flex justify-between gap-2">
                      <div>
                        <p className="font-bold">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.size} {item.size}
                        </p>
                      </div>
                      <p className="font-bold">{money(p.price * item.quantity)}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center border border-border">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-none"
                          onClick={() =>
                            s.updateQuantity(item.productId, item.size, item.quantity - 1)
                          }
                          aria-label={tr(
                            s.language,
                            "Diminuir quantidade",
                            "Decrease quantity",
                            "Disminuir cantidad",
                          )}
                        >
                          <Minus />
                        </Button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-none"
                          onClick={() =>
                            s.updateQuantity(item.productId, item.size, item.quantity + 1)
                          }
                          aria-label={tr(
                            s.language,
                            "Aumentar quantidade",
                            "Increase quantity",
                            "Aumentar cantidad",
                          )}
                        >
                          <Plus />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => s.removeFromCart(item.productId, item.size)}
                        aria-label={t.remove}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {s.cart.length > 0 && (
          <div className="border-t border-border pt-5 space-y-4">
            {/* Coupon input */}
            <div className="flex gap-2">
              <Input
                placeholder={tr(s.language, "Código de desconto", "Discount code", "Código de descuento")}
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="h-10 rounded-none text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 rounded-none text-xs px-4"
                onClick={() => {
                  s.applyCoupon(couponCode);
                  setCouponCode("");
                }}
              >
                {tr(s.language, "Aplicar", "Apply", "Aplicar")}
              </Button>
            </div>

            {s.coupon && (
              <div className="flex items-center justify-between text-xs bg-primary/10 text-primary px-3 py-1.5 font-bold">
                <span>Cupão: {s.coupon.code} (-{s.coupon.discountPercent}%)</span>
                <button type="button" onClick={s.removeCoupon} className="underline hover:opacity-80">
                  {tr(s.language, "Remover", "Remove", "Eliminar")}
                </button>
              </div>
            )}

            <div className="flex justify-between text-lg font-bold">
              <span>{t.subtotal}</span>
              <div className="text-right">
                {s.discountAmount > 0 ? (
                  <div>
                    <span className="text-xs text-muted-foreground line-through block">{money(s.subtotal)}</span>
                    <span className="text-primary underline decoration-[#4A2B33] dark:decoration-[#E1A0B4] underline-offset-2">{money(s.finalTotal)}</span>
                  </div>
                ) : (
                  <span className="underline decoration-[#4A2B33] dark:decoration-[#E1A0B4] underline-offset-2">{money(s.subtotal)}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-none text-xs"
                onClick={handleShareWhatsApp}
              >
                <MessageSquare className="size-3.5 mr-1 text-green-600" />
                WhatsApp
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-none text-xs"
                onClick={handleCopyCart}
              >
                <Copy className="size-3.5 mr-1" />
                {tr(s.language, "Copiar", "Copy", "Copiar")}
              </Button>
            </div>

            <Button asChild size="lg" className="h-12 w-full rounded-none">
              <Link to="/checkout" onClick={() => s.setCartOpen(false)}>
                {t.checkout}
              </Link>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function MobileNav() {
  const { language } = useShop(),
    t = copy[language];
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t.menu}>
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full">
        <SheetHeader className="items-start text-left">
          <SheetTitle className="flex items-center gap-2.5 leading-none text-foreground dark:text-brand">
            <span className="font-display text-4xl uppercase tracking-wide">UFFA</span>
            <span className="flex flex-col gap-1">
              <span className="font-display text-xs uppercase leading-none tracking-[0.28em]">
                STORE
              </span>
              <span aria-hidden className="h-[3px] w-full bg-current" />
            </span>
          </SheetTitle>
          <SheetDescription>
            {tr(language, "Para quem pisa forte no estilo!", "For those who step strong in style!", "¡Para quienes pisan fuerte en el estilo!")}
          </SheetDescription>
        </SheetHeader>
        <nav className="mt-10 flex flex-col">
          {cats.map((c) => {
            const location = useRouterState({ select: (state) => state.location });
            const isMobActive =
              location.pathname === "/catalogo" &&
              (location.search as { category?: string })?.category === c;
            return (
              <Link
                key={c}
                to="/catalogo"
                search={{ category: c }}
                onClick={close}
                className={`border-b border-border py-4 font-display text-3xl uppercase flex items-center justify-between ${
                  isMobActive ? "text-primary font-black" : "text-foreground"
                }`}
              >
                <span>{categoryNames[c][language]}</span>
                {isMobActive && (
                  <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
                )}
              </Link>
            );
          })}
          <Link to="/favoritos" onClick={close} className="mt-6 font-semibold text-primary flex items-center gap-2">
            <Heart className="size-4" />
            {tr(language, "Lista de Desejos", "Wishlist", "Lista de Deseos")}
          </Link>
          <Link to="/ajuda" onClick={close} className="mt-4 font-semibold text-primary flex items-center gap-2">
            <HelpCircle className="size-4" />
            {tr(language, "Ajuda e Contactos", "Help & Contacts", "Ayuda y Contactos")}
          </Link>
          <Link to="/rastreio" onClick={close} className="mt-4 font-semibold text-primary">
            {t.track}
          </Link>
          <Link to="/verificar" onClick={close} className="mt-3 font-semibold text-primary">
            {tr(
              language,
              "Verificar autenticidade",
              "Verify authenticity",
              "Verificar autenticidad",
            )}
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  const s = useShop(),
    t = copy[s.language];
  const { setCartOpen } = s;
  const location = useRouterState({ select: (state) => state.location });
  const pathname = location.pathname;
  const currentCategory = (location.search as { category?: string })?.category;

  useEffect(() => setCartOpen(false), [pathname, setCartOpen]);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="bg-foreground px-4 py-2 text-center text-xs font-bold uppercase text-background dark:bg-brand dark:text-brand-foreground">
        {t.pickup}
      </div>
      <header className="sticky top-0 z-40 border-b border-brand-strong/20 bg-brand text-brand-foreground dark:border-brand/30 dark:bg-black dark:text-brand">
        <div className="mx-auto flex h-20 md:h-24 max-w-7xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <MobileNav />
            <Link to="/" className="flex items-center gap-2.5 leading-none">
              <span className="font-display text-4xl md:text-5xl uppercase tracking-wide">UFFA</span>
              <span className="flex flex-col gap-1">
                <span className="font-display text-xs md:text-sm uppercase leading-none tracking-[0.28em]">
                  STORE
                </span>
                <span aria-hidden className="h-[6px] w-full bg-current" />
              </span>
            </Link>
          </div>
          <nav className="hidden h-full items-center gap-6 lg:flex">
            {cats.map((c) => {
              const isActive = pathname === "/catalogo" && currentCategory === c;
              return (
                <Link
                  key={c}
                  to="/catalogo"
                  search={{ category: c }}
                  className={`group relative flex h-full items-center text-xs md:text-sm font-bold uppercase tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    isActive ? "text-brand-foreground dark:text-brand" : "text-brand-foreground/85 hover:text-brand-foreground dark:text-brand/85 dark:hover:text-brand"
                  }`}
                >
                  <span className="relative py-1">
                    {categoryNames[c][s.language]}
                    <span
                      aria-hidden="true"
                      className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] bg-[#4A2B33] dark:bg-[#E1A0B4] transition-all duration-300 ease-out ${
                        isActive
                          ? "w-full opacity-100"
                          : "w-0 opacity-0 group-hover:w-full group-hover:opacity-100"
                      }`}
                    />
                  </span>
                </Link>
              );
            })}
            <Link
              to="/ajuda"
              className={`group relative flex h-full items-center text-xs md:text-sm font-bold uppercase tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                pathname === "/ajuda"
                  ? "text-brand-foreground dark:text-brand"
                  : "text-brand-foreground/85 hover:text-brand-foreground dark:text-brand/85 dark:hover:text-brand"
              }`}
            >
              <span className="relative py-1">
                {tr(s.language, "Ajuda", "Help", "Ayuda")}
                <span
                  aria-hidden="true"
                  className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] bg-[#4A2B33] dark:bg-[#E1A0B4] transition-all duration-300 ease-out ${
                    pathname === "/ajuda"
                      ? "w-full opacity-100"
                      : "w-0 opacity-0 group-hover:w-full group-hover:opacity-100"
                  }`}
                />
              </span>
            </Link>
          </nav>
          <div className="flex items-center gap-1">
            <Select value={s.language} onValueChange={(v) => s.setLanguage(v as Language)}>
              <SelectTrigger
                aria-label={tr(s.language, "Idioma", "Language", "Idioma")}
                className="h-9 w-[70px] border-0 px-2 font-bold shadow-none"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt">PT</SelectItem>
                <SelectItem value="en">EN</SelectItem>
                <SelectItem value="es">ES</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              onClick={s.toggleTheme}
              aria-label={tr(s.language, "Alternar tema", "Toggle theme", "Cambiar tema")}
            >
              {s.theme === "light" ? <Moon /> : <Sun />}
            </Button>
            <Button
              asChild
              variant="ghost"
              size="icon"
              aria-label={tr(s.language, "Lista de Desejos", "Wishlist", "Lista de Deseos")}
              className="relative hidden sm:inline-flex"
            >
              <Link to="/favoritos">
                <Heart className="size-5" />
                {s.wishlist.length > 0 && (
                  <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-brand-foreground text-[10px] font-bold text-brand dark:bg-brand dark:text-brand-strong">
                    {s.wishlist.length}
                  </span>
                )}
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="hidden sm:inline-flex"
              aria-label={tr(s.language, "A minha encomenda", "My order", "Mi pedido")}
            >
              <Link to="/rastreio">
                <PackageSearch />
              </Link>
            </Button>
            <CartDrawer />
          </div>
        </div>
      </header>
      <main key={pathname}>{children}</main>
      <footer className="border-t border-border bg-footer text-footer-foreground">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 md:grid-cols-2 md:px-6 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <Link to="/" className="flex items-center gap-3 leading-none">
              <span className="font-display text-5xl uppercase tracking-wide text-brand">UFFA</span>
              <span className="flex flex-col gap-1.5">
                <span className="font-display text-sm uppercase leading-none tracking-[0.28em] text-brand">
                  STORE
                </span>
                <span aria-hidden className="h-[3px] w-full bg-brand" />
              </span>
            </Link>
            <p className="mt-3 text-sm font-semibold tracking-wide text-footer-foreground">
              {tr(s.language, "Para quem pisa forte no estilo! 🎗️", "For those who step strong in style! 🎗️", "¡Para quienes pisan fuerte en el estilo! 🎗️")}
            </p>
            <p className="mt-2 text-xs text-footer-muted">
              {tr(s.language, "Sapatilhas com selo de autenticidade · Entrega em mãos na zona do Porto", "Sneakers with authenticity seal · Hand delivery in Porto area", "Zapatillas con sello de autenticidad · Entrega en mano en la zona de Oporto")}
            </p>
            <p className="mt-3 flex items-center gap-2 text-sm text-footer-muted">
              <MapPin className="size-4" />
              Porto, Portugal
            </p>
            <a
              href="https://www.instagram.com/uffastore.legit/"
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex items-center gap-2 text-sm hover:text-brand"
            >
              <Instagram className="size-4" />
              @uffastore.legit
            </a>
          </div>
          <nav className="flex flex-col items-start gap-3 text-sm">
            <Link to="/catalogo" search={{}} className="hover:text-brand flex items-center gap-1.5">
              <ShoppingBag className="size-4" />
              {t.shop}
            </Link>
            <Link to="/favoritos" className="hover:text-brand flex items-center gap-1.5">
              <Heart className="size-4" />
              {tr(s.language, "Lista de Desejos", "Wishlist", "Lista de Deseos")}
            </Link>
            <Link to="/ajuda" className="hover:text-brand flex items-center gap-1.5">
              <HelpCircle className="size-4" />
              {tr(s.language, "Ajuda e Contactos", "Help & Contacts", "Ayuda y Contactos")}
            </Link>
            <Link to="/rastreio" className="font-bold text-brand">
              {t.track}
            </Link>
            <Link to="/verificar" className="hover:text-brand">
              {tr(
                s.language,
                "Verificar autenticidade",
                "Verify authenticity",
                "Verificar autenticidad",
              )}
            </Link>
            <Link to="/operacoes" className="text-footer-muted hover:text-brand">
              {tr(s.language, "Operações", "Operations", "Operaciones")}
            </Link>
            <span className="text-footer-muted">{t.noReturns}</span>
          </nav>
        </div>
        <div className="border-t border-footer-border px-4 py-5 text-center text-xs text-footer-muted">
          © 2026 UFFA STORE · PORTO
        </div>
      </footer>
    </div>
  );
}
