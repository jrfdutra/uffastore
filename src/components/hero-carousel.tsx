import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { heroSneaker, money, type Product } from "@/lib/shop-data";
import { useShop } from "@/lib/shop-context";
import { tr } from "@/lib/i18n";

const AUTOPLAY_MS = 5200;
const MAX_SLIDES = 8;

/**
 * Hero com carrossel das fotos dos produtos atuais.
 * O slogan (children) fica sobreposto e estável enquanto as fotos rodam.
 */
export function HeroCarousel({ products, children }: { products: Product[]; children: ReactNode }) {
  const { language } = useShop();
  const slides = products.filter((product) => Boolean(product.image)).slice(0, MAX_SLIDES);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);

  const syncSelected = useCallback(() => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    syncSelected();
    emblaApi.on("select", syncSelected);
    emblaApi.on("reInit", syncSelected);
    return () => {
      emblaApi.off("select", syncSelected);
      emblaApi.off("reInit", syncSelected);
    };
  }, [emblaApi, syncSelected]);

  useEffect(() => {
    if (!emblaApi || paused || slides.length < 2) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => emblaApi.scrollNext(), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [emblaApi, paused, slides.length]);

  const hasCarousel = slides.length > 1;
  const current = slides[selected] ?? slides[0];

  const controls = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => emblaApi?.scrollPrev()}
        aria-label={tr(language, "Foto anterior", "Previous photo", "Foto anterior")}
        className="grid size-10 place-items-center border border-hero-foreground/35 bg-hero/45 text-hero-foreground backdrop-blur-sm transition hover:bg-hero-foreground hover:text-hero focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hero-foreground"
      >
        <ChevronLeft className="size-5" />
      </button>

      <div className="flex items-center gap-1.5 bg-hero/45 px-2 py-1.5 backdrop-blur-sm">
        {slides.map((product, index) => (
          <button
            key={product.id}
            type="button"
            onClick={() => emblaApi?.scrollTo(index)}
            aria-label={tr(
              language,
              `Ver foto ${index + 1}: ${product.name}`,
              `View photo ${index + 1}: ${product.name}`,
              `Ver foto ${index + 1}: ${product.name}`,
            )}
            aria-current={selected === index}
            className={`h-1.5 transition-all ${
              selected === index
                ? "w-6 bg-hero-foreground"
                : "w-1.5 bg-hero-foreground/45 hover:bg-hero-foreground/80"
            }`}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => emblaApi?.scrollNext()}
        aria-label={tr(language, "Foto seguinte", "Next photo", "Foto siguiente")}
        className="grid size-10 place-items-center border border-hero-foreground/35 bg-hero/45 text-hero-foreground backdrop-blur-sm transition hover:bg-hero-foreground hover:text-hero focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hero-foreground"
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  );

  return (
    <section
      className="relative mt-0 min-h-[min(720px,78vh)] overflow-hidden bg-hero text-hero-foreground"
      aria-roledescription={hasCarousel ? "carousel" : undefined}
      aria-label={
        hasCarousel
          ? tr(language, "Destaques da loja", "Store highlights", "Destacados de la tienda")
          : undefined
      }
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {slides.length > 0 ? (
        <div className="absolute inset-0 overflow-hidden" ref={emblaRef}>
          <div className="flex h-full touch-pan-y">
            {slides.map((product, index) => (
              <div
                key={product.id}
                className="relative h-full min-w-0 shrink-0 grow-0 basis-full"
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} / ${slides.length}`}
              >
                <img
                  src={product.image}
                  alt={product.name}
                  width={1200}
                  height={1600}
                  draggable={false}
                  className="h-full w-full select-none object-cover object-[center_52%]"
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <img
          src={heroSneaker}
          alt="Uffa Store sneakers"
          width={1200}
          height={900}
          className="absolute inset-0 h-full w-full object-cover object-[66%_center] opacity-90"
        />
      )}

      <div className="pointer-events-none absolute inset-0 bg-hero-overlay" />

      <div className="relative mx-auto flex min-h-[min(720px,78vh)] max-w-7xl items-end px-4 pb-12 md:px-6 md:pb-16">
        {children}
      </div>

      {hasCarousel && (
        <>
          {/* Mobile: controlos compactos no canto superior direito */}
          <div className="absolute right-4 top-4 z-20 md:hidden">{controls}</div>

          {/* Desktop: legenda do produto + controlos no canto superior direito */}
          <div className="absolute right-6 top-8 z-20 hidden flex-col items-end gap-3 md:flex">
            {current && (
              <Link
                to="/produto/$productId"
                params={{ productId: current.id }}
                className="group max-w-xs border border-hero-foreground/15 bg-hero/55 px-4 py-3 text-right backdrop-blur-sm"
              >
                <span className="block text-[10px] font-bold uppercase tracking-[0.24em] text-hero-foreground/70">
                  {tr(language, "Em destaque", "Featured", "Destacado")} ·{" "}
                  {String(selected + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
                </span>
                <span className="mt-1 block font-display text-2xl uppercase leading-none transition group-hover:text-primary lg:text-3xl">
                  {current.name}
                </span>
                <span className="mt-1 block text-sm font-bold text-primary">
                  {money(current.price)}
                </span>
              </Link>
            )}
            {controls}
          </div>
        </>
      )}
    </section>
  );
}
