import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Tag } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { useShop } from "@/lib/shop-context";
import { tr } from "@/lib/i18n";
import useEmblaCarousel from "embla-carousel-react";

export function OffCarousel() {
  const { catalog, language } = useShop();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const saleProducts = catalog.filter((p) => p.category === "sales" || Boolean(p.originalPrice));

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    skipSnaps: false,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  useEffect(() => {
    if (!emblaApi) return;

    const updateSelection = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };

    updateSelection();
    emblaApi.on("select", updateSelection);
    emblaApi.on("reInit", updateSelection);

    return () => {
      emblaApi.off("select", updateSelection);
      emblaApi.off("reInit", updateSelection);
    };
  }, [emblaApi]);

  if (saleProducts.length === 0) return null;

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

  if (!mounted) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.16em]">
              <Tag className="size-4" />
              <span>OFF · {tr(language, "Promoções exclusivas", "Exclusive offers", "Ofertas exclusivas")}</span>
            </div>
            <h2 className="mt-2 font-display text-5xl uppercase md:text-7xl">
              {tr(language, "Ofertas Especiais", "Special Offers", "Ofertas Especiales")}
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {saleProducts.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.16em]">
            <Tag className="size-4" />
            <span>OFF · {tr(language, "Promoções exclusivas", "Exclusive offers", "Ofertas exclusivas")}</span>
          </div>
          <h2 className="mt-2 font-display text-5xl uppercase md:text-7xl">
            {tr(language, "Ofertas Especiais", "Special Offers", "Ofertas Especiales")}
          </h2>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className="size-11 rounded-none border-border bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-30"
            aria-label={tr(language, "Anterior", "Previous", "Anterior")}
          >
            <ChevronLeft className="size-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={scrollNext}
            disabled={!canScrollNext}
            className="size-11 rounded-none border-border bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-30"
            aria-label={tr(language, "Seguinte", "Next", "Siguiente")}
          >
            <ChevronRight className="size-5" />
          </Button>
        </div>
      </div>

      <div className="relative overflow-hidden" ref={emblaRef}>
        <div className="flex -ml-4 touch-pan-y">
          {saleProducts.map((product) => (
            <div
              key={product.id}
              className="min-w-0 shrink-0 grow-0 basis-[85%] sm:basis-[45%] lg:basis-[28%] pl-4"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
