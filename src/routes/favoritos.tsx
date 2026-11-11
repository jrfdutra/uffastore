import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { useShop } from "@/lib/shop-context";
import { tr } from "@/lib/i18n";
import { copy } from "@/lib/shop-data";

export const Route = createFileRoute("/favoritos")({
  head: () => ({
    meta: [
      { title: "Lista de Desejos — Uffa Store" },
      { name: "description", content: "Os teus sneakers favoritos guardados na Uffa Store." },
      { property: "og:title", content: "Lista de Desejos — Uffa Store" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/favoritos" }],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { language, wishlist, catalog } = useShop();
  const t = copy[language];

  const favoriteProducts = catalog.filter((p) => wishlist.includes(p.id));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
      <div className="flex items-center gap-3">
        <Heart className="size-8 text-primary fill-primary" />
        <div>
          <p className="text-xs font-bold uppercase text-primary">
            {tr(language, "Os teus preferidos", "Your favorites", "Tus favoritos")}
          </p>
          <h1 className="font-display text-5xl uppercase md:text-7xl">
            {tr(language, "Lista de Desejos", "Wishlist", "Lista de Deseos")}
          </h1>
        </div>
      </div>

      <div className="mt-10">
        {favoriteProducts.length === 0 ? (
          <div className="mx-auto grid min-h-[40vh] max-w-md place-items-center text-center">
            <div>
              <Heart className="mx-auto mb-4 size-16 text-muted-foreground/40" />
              <h2 className="font-display text-3xl uppercase">
                {tr(
                  language,
                  "A tua lista está vazia",
                  "Your wishlist is empty",
                  "Tu lista está vacía",
                )}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {tr(
                  language,
                  "Clica no ícone de coração nos produtos para guardá-los para mais tarde.",
                  "Click the heart icon on products to save them for later.",
                  "Haz clic en el ícono de corazón en los productos para guardarlos para más tarde.",
                )}
              </p>
              <Button asChild className="mt-6 rounded-none">
                <Link to="/catalogo" search={{}}>
                  {t.shop}
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <p className="mb-6 text-xs text-muted-foreground uppercase">
              {favoriteProducts.length}{" "}
              {favoriteProducts.length === 1 ? "produto guardado" : "produtos guardados"}
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-10 xl:grid-cols-4">
              {favoriteProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
