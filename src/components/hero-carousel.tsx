import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import useEmblaCarousel from "embla-carousel-react";
import { heroSneaker, type Product } from "@/lib/shop-data";
import { useShop } from "@/lib/shop-context";
import { tr } from "@/lib/i18n";

const AUTOPLAY_MS = 5000;
const MAX_SLIDES = 3;

/**
 * Hero com carrossel das fotos dos produtos atuais.
 * O slogan (children) fica sobreposto e estável enquanto as fotos rodam.
 * Cada foto é um link para o anúncio do respetivo produto.
 */
export function HeroCarousel({ products, children }: { products: Product[]; children: ReactNode }) {
  const { language } = useShop();
  const slides = products.filter((product) => Boolean(product.image)).slice(0, MAX_SLIDES);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });
  const [selected, setSelected] = useState(0);

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

  // Avanço automático sempre ativo (exceto para quem prefere menos movimento).
  useEffect(() => {
    if (!emblaApi || slides.length < 2) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => emblaApi.scrollNext(), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [emblaApi, slides.length]);

  const hasCarousel = slides.length > 1;

  return (
    <section
      className="relative pt-16 min-h-[min(720px,78vh)] overflow-hidden bg-hero text-hero-foreground"
      aria-roledescription={hasCarousel ? "carousel" : undefined}
      aria-label={
        hasCarousel
          ? tr(language, "Destaques da loja", "Store highlights", "Destacados de la tienda")
          : undefined
      }
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
                <Link
                  to="/produto/$productId"
                  params={{ productId: product.id }}
                  aria-label={tr(
                    language,
                    `Ver ${product.name}`,
                    `View ${product.name}`,
                    `Ver ${product.name}`,
                  )}
                  className="group block h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-hero-foreground"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    width={1200}
                    height={1600}
                    draggable={false}
                    className="h-full w-full select-none object-cover object-[center_52%] transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />
                </Link>
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

      <div className="pointer-events-none absolute inset-0 bg-hero/60 sm:bg-hero-overlay" />

      {/* O conteúdo do hero não bloqueia o clique na foto; apenas os elementos interativos o fazem. */}
      <div className="pointer-events-none relative mx-auto flex min-h-[min(720px,78vh)] max-w-7xl items-end px-4 pb-12 md:px-6 md:pb-16 [text-shadow:_0_2px_10px_rgb(0_0_0_/_40%)] sm:[text-shadow:none]">
        {children}
      </div>

      {hasCarousel && (
        <div className="pointer-events-auto absolute bottom-6 right-4 z-20 flex items-center gap-1.5 bg-hero/45 px-2 py-1.5 backdrop-blur-sm md:bottom-8 md:right-6">
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
      )}
    </section>
  );
}
