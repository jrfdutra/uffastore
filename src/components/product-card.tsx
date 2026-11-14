import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, ShoppingBag, Check, Heart } from "lucide-react";
import {
  categoryNames,
  getProductEffectiveStatus,
  isProductInCategory,
  money,
  type Product,
} from "@/lib/shop-data";
import { useShop } from "@/lib/shop-context";
import { VerifiedBadge } from "./verified-badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { tr } from "@/lib/i18n";

export function ProductCard({ product }: { product: Product }) {
  const { language, addToCart, wishlist, toggleWishlist } = useShop();
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined);
  const [added, setAdded] = useState(false);

  const effectiveStatus = getProductEffectiveStatus(product);
  const isSoldOut = effectiveStatus === "soldout";
  const isComingSoon = effectiveStatus === "comingsoon";
  const isSale = isProductInCategory(product, "sales") || Boolean(product.originalPrice);
  const isWishlisted = wishlist.includes(product.id);

  const colors = product.colors ?? [];
  const activeColor =
    selectedColor && colors.some((color) => color.slug === selectedColor)
      ? selectedColor
      : colors[0]?.slug;

  // Só variantes reais da cor ativa; sem opção de cor, todas contam.
  const variants = product.sizes.filter((size) =>
    activeColor ? size.color === activeColor : true,
  );
  const availableSizes = variants.filter((s) => s.stock > 0);
  const defaultSize = availableSizes[0]?.size ?? null;
  const activeSize = selectedSize ?? defaultSize;
  const activeVariant = variants.find((size) => size.size === activeSize);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSoldOut || isComingSoon) return;
    if (!activeVariant || activeVariant.stock <= 0) return;

    addToCart(product.id, activeVariant.size, activeVariant.color);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <article className="group relative flex flex-col justify-between border border-border bg-card p-3 transition duration-300 hover:border-primary/50 hover:shadow-md">
      <div>
        <Link
          to="/produto/$productId"
          params={{ productId: product.id }}
          className="block overflow-hidden bg-product focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="relative aspect-[4/5] overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              width={1664}
              height={2080}
              loading="lazy"
              className={`h-full w-full object-cover transition duration-500 group-hover:scale-[1.035] ${
                isSoldOut ? "grayscale-[0.25] opacity-90" : ""
              }`}
            />

            <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5 items-start z-10">
              <VerifiedBadge />
              {isSale && !isSoldOut && (
                <span className="bg-promo text-promo-foreground border-2 border-promo rounded-[4px] px-3 py-1 font-display text-xs sm:text-sm uppercase tracking-widest font-black shadow-md">
                  {tr(language, "PROMO", "PROMO", "PROMO")}
                </span>
              )}
              {isSoldOut && (
                <span className="bg-foreground/90 backdrop-blur-sm px-2 py-0.5 font-display text-[10px] uppercase tracking-wider text-background font-bold border border-background/20">
                  {tr(language, "ESGOTADO", "SOLD OUT", "AGOTADO")}
                </span>
              )}
              {isComingSoon && (
                <span className="bg-primary px-2 py-0.5 font-display text-[10px] uppercase tracking-wider text-primary-foreground font-bold">
                  {tr(language, "EM BREVE", "COMING SOON", "PRÓXIMAMENTE")}
                </span>
              )}
            </div>

            {isSoldOut && (
              <div className="absolute inset-0 bg-background/20 backdrop-blur-[1px] flex items-center justify-center pointer-events-none z-10">
                <span className="bg-background/95 text-foreground border border-border px-3.5 py-1.5 font-display text-xs uppercase tracking-[0.2em] font-bold shadow-lg">
                  {tr(language, "ESGOTADO", "SOLD OUT", "AGOTADO")}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist(product.id);
              }}
              className="absolute right-2.5 top-2.5 z-20 grid size-10 place-items-center bg-background/85 backdrop-blur-sm text-foreground transition hover:bg-background hover:scale-110 active:scale-95 shadow-sm"
              aria-label={tr(
                language,
                "Adicionar aos favoritos",
                "Add to wishlist",
                "Añadir a favoritos",
              )}
            >
              <Heart
                className={`size-5 transition-colors ${
                  isWishlisted ? "fill-primary text-primary" : "text-foreground"
                }`}
              />
            </button>

            <span className="absolute bottom-2.5 right-2.5 grid size-8 place-items-center bg-background text-foreground opacity-0 transition group-hover:opacity-100">
              <ArrowUpRight className="size-4" />
            </span>
          </div>
        </Link>

        <div className="mt-3 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
              {categoryNames[product.category][language]}
            </p>
            <Link
              to="/produto/$productId"
              params={{ productId: product.id }}
              className="mt-0.5 block truncate font-bold text-foreground hover:text-primary"
            >
              {product.name}
            </Link>
          </div>

          <div className="text-right">
            {product.originalPrice ? (
              <div className="flex flex-col items-end">
                <span className="text-[11px] text-muted-foreground line-through">
                  {money(product.originalPrice)}
                </span>
                <span className="text-lg font-bold text-foreground">{money(product.price)}</span>
              </div>
            ) : isSale ? (
              <span className="text-lg font-bold text-foreground">{money(product.price)}</span>
            ) : (
              <span className="font-bold text-foreground">{money(product.price)}</span>
            )}
          </div>
        </div>

        {variants.length > 0 && (
          <div className="mt-3 space-y-2">
            {colors.length > 1 && (
              <div className="flex flex-wrap items-center gap-1">
                <span className="mr-1 text-[10px] font-semibold uppercase text-muted-foreground">
                  {tr(language, "Cor", "Colour", "Color")}:
                </span>
                {colors.map((color) => (
                  <button
                    key={color.slug}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedColor(color.slug);
                      setSelectedSize(null);
                    }}
                    aria-pressed={color.slug === activeColor}
                    className={`h-6 border px-1.5 text-[10px] font-bold uppercase transition ${
                      color.slug === activeColor
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                    }`}
                  >
                    {color.name}
                  </button>
                ))}
              </div>
            )}

            <Select
              value={activeSize ? String(activeSize) : undefined}
              onValueChange={(value) => setSelectedSize(Number(value))}
              disabled={isSoldOut || isComingSoon || availableSizes.length === 0}
            >
              <SelectTrigger
                className="h-8 rounded-none border-border px-2 text-left text-[11px] font-semibold uppercase"
                aria-label={tr(language, "Escolher tamanho", "Choose size", "Elegir talla")}
              >
                <SelectValue
                  placeholder={tr(language, "Escolher tamanho", "Choose size", "Elegir talla")}
                />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                {variants.map((sz) => (
                  <SelectItem
                    key={`${sz.color ?? "unica"}-${sz.size}`}
                    value={String(sz.size)}
                    disabled={sz.stock <= 0}
                    className="rounded-none py-2 text-xs"
                  >
                    {sz.size}
                    {sz.stock <= 0 ? ` — ${tr(language, "Esgotado", "Sold out", "Agotado")}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-border">
        <Button
          type="button"
          size="sm"
          onClick={handleAddToCart}
          disabled={isSoldOut || isComingSoon || availableSizes.length === 0}
          className={`w-full rounded-none h-10 sm:h-11 px-2 text-[11px] sm:text-xs font-bold uppercase transition-all duration-200 active:scale-[0.98] ${
            isSoldOut || isComingSoon
              ? "bg-muted text-muted-foreground cursor-not-allowed hover:bg-muted"
              : added
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
          }`}
        >
          {isSoldOut ? (
            <span className="truncate">{tr(language, "Esgotado", "Sold Out", "Agotado")}</span>
          ) : isComingSoon ? (
            <span className="truncate">
              {tr(language, "Em breve", "Coming soon", "Próximamente")}
            </span>
          ) : added ? (
            <span className="flex items-center justify-center gap-1.5 truncate">
              <Check className="size-3.5 sm:size-4 shrink-0" />
              <span>{tr(language, "Adicionado!", "Added!", "¡Añadido!")}</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1 sm:gap-1.5 truncate">
              <ShoppingBag className="size-3.5 shrink-0" />
              <span className="truncate">
                {tr(language, "Adicionar", "Add to cart", "Añadir")}
                <span className="hidden min-[380px]:inline">
                  {tr(language, " ao carrinho", "", " al carrito")}
                </span>
              </span>
            </span>
          )}
        </Button>
      </div>
    </article>
  );
}
