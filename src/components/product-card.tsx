import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, ShoppingBag, Check, Heart } from "lucide-react";
import { categoryNames, money, type Product } from "@/lib/shop-data";
import { useShop } from "@/lib/shop-context";
import { VerifiedBadge } from "./verified-badge";
import { Button } from "@/components/ui/button";
import { tr } from "@/lib/i18n";

export function ProductCard({ product }: { product: Product }) {
  const { language, addToCart, wishlist, toggleWishlist } = useShop();
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [added, setAdded] = useState(false);

  const isSale = product.category === "sales" || Boolean(product.originalPrice);
  const isWishlisted = wishlist.includes(product.id);
  const availableSizes = product.sizes.filter((s) => s.stock > 0);
  const defaultSize = availableSizes.length > 0 ? availableSizes[0]?.size ?? null : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const sizeToAdd = selectedSize ?? defaultSize;
    if (!sizeToAdd) return;

    addToCart(product.id, sizeToAdd);
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
          <div className="relative aspect-[4/3] overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              width={1200}
              height={900}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]"
            />

            <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5 items-start z-10">
              <VerifiedBadge />
              {isSale && (
                <span className="bg-destructive px-2 py-0.5 font-display text-[11px] uppercase tracking-wider text-destructive-foreground">
                  {tr(language, "SALE", "SALE", "OFERTA")}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist(product.id);
              }}
              className="absolute right-2.5 top-2.5 z-20 grid size-10 place-items-center bg-background/85 backdrop-blur-sm text-foreground transition hover:bg-background hover:scale-110 active:scale-95 shadow-sm"
              aria-label={tr(language, "Adicionar aos favoritos", "Add to wishlist", "Añadir a favoritos")}
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
                <span className="text-xs text-muted-foreground line-through">
                  {money(product.originalPrice)}
                </span>
                <span className="font-display text-base font-bold text-destructive">
                  {money(product.price)}
                </span>
              </div>
            ) : (
              <span className="font-bold text-foreground">{money(product.price)}</span>
            )}
          </div>
        </div>

        {availableSizes.length > 0 && (
          <div className="mt-3 flex items-center gap-1 overflow-x-auto pb-1 text-xs">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase mr-1">
              Tam:
            </span>
            {product.sizes.map((sz) => {
              const inStock = sz.stock > 0;
              const isSelected = (selectedSize ?? defaultSize) === sz.size;

              return (
                <button
                  key={sz.size}
                  type="button"
                  disabled={!inStock}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (inStock) setSelectedSize(sz.size);
                  }}
                  className={`min-w-7 h-7 px-1 rounded text-[11px] font-bold transition ${
                    !inStock
                      ? "opacity-30 line-through cursor-not-allowed"
                      : isSelected
                      ? "bg-primary text-primary-foreground font-black"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {sz.size}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-border">
        <Button
          type="button"
          size="sm"
          onClick={handleAddToCart}
          disabled={availableSizes.length === 0}
          className={`w-full rounded-none h-11 text-xs font-bold uppercase transition-all duration-200 ${
            added
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {added ? (
            <span className="flex items-center gap-1.5">
              <Check className="size-4" />
              {tr(language, "Adicionado!", "Added!", "¡Añadido!")}
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <ShoppingBag className="size-3.5" />
              {tr(language, "Adicionar ao carrinho", "Add to cart", "Añadir al carrito")}
            </span>
          )}
        </Button>
      </div>
    </article>
  );
}
