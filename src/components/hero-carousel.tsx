import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import useEmblaCarousel from "embla-carousel-react";
import { heroSneaker } from "@/lib/shop-data";
import { useShop } from "@/lib/shop-context";
import { tr } from "@/lib/i18n";

const AUTOPLAY_MS = 6000;

const CAPA_HOME = "/capas/uffa-capa-home.webp";
const CAPA_HOME_MOBILE = "/capas/uffa-capa-home-mobile.webp";

type Slide = {
  id: string;
  name: string;
  image: string;
  /** Versão vertical para telemóveis (a capa é horizontal). */
  imageMobile?: string;
  href?: "/catalogo";
  /** A capa já traz o texto na própria imagem, por isso esconde o slogan por cima. */
  hideSlogan?: boolean;
};

const slides: Slide[] = [
  {
    id: "capa-online",
    name: "A Uffa Store agora é online",
    image: CAPA_HOME,
    imageMobile: CAPA_HOME_MOBILE,
    href: "/catalogo",
    hideSlogan: true,
  },
  { id: "hero", name: "Uffa Store", image: heroSneaker },
];

/**
 * Hero com carrossel: capa da campanha + fotografia padrão da loja.
 * O slogan (children) fica sobreposto e estável enquanto as fotos rodam,
 * exceto na capa, que já tem o texto incluído na imagem.
 */
export function HeroCarousel({ children }: { children: ReactNode }) {
  const { language } = useShop();

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
  }, [emblaApi]);

  const hasCarousel = slides.length > 1;
  const isCover = Boolean(slides[selected]?.hideSlogan);

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
      <div className="absolute inset-0 overflow-hidden" ref={emblaRef}>
        <div className="flex h-full touch-pan-y">
          {slides.map((slide, index) => {
            const image = (
              <picture className="block h-full w-full">
                {slide.imageMobile && (
                  <source media="(max-width: 767px)" srcSet={slide.imageMobile} />
                )}
                <img
                  src={slide.image}
                  alt={slide.name}
                  width={2400}
                  height={1031}
                  draggable={false}
                  className={`h-full w-full select-none object-cover transition-transform duration-700 ease-out ${
                    slide.hideSlogan ? "object-center md:object-right" : "object-center"
                  }`}
                />
              </picture>
            );

            return (
              <div
                key={slide.id}
                className="relative h-full min-w-0 shrink-0 grow-0 basis-full"
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} / ${slides.length}`}
              >
                {slide.href ? (
                  <Link
                    to={slide.href}
                    aria-label={tr(
                      language,
                      "Comprar agora na Uffa Store",
                      "Shop now at Uffa Store",
                      "Comprar ahora en Uffa Store",
                    )}
                    className="block h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-hero-foreground"
                  >
                    {image}
                  </Link>
                ) : (
                  image
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* A capa já tem contraste próprio; o escurecimento só é necessário nas fotos. */}
      <div
        className={`pointer-events-none absolute inset-0 bg-hero/60 transition-opacity duration-500 sm:bg-hero-overlay ${
          isCover ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* O conteúdo do hero não bloqueia o clique na foto; apenas os elementos interativos o fazem. */}
      <div
        className={`pointer-events-none relative mx-auto flex min-h-[min(720px,78vh)] max-w-7xl items-end px-4 pb-12 transition-[opacity,visibility] duration-500 md:px-6 md:pb-16 [text-shadow:_0_2px_10px_rgb(0_0_0_/_40%)] sm:[text-shadow:none] ${
          isCover ? "invisible opacity-0" : "visible opacity-100"
        }`}
      >
        {children}
      </div>

      {hasCarousel && (
        <div className="pointer-events-auto absolute bottom-6 right-4 z-20 flex items-center gap-1.5 bg-hero/45 px-2 py-1.5 backdrop-blur-sm md:bottom-8 md:right-6">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => emblaApi?.scrollTo(index)}
              aria-label={tr(
                language,
                `Ver foto ${index + 1}: ${slide.name}`,
                `View photo ${index + 1}: ${slide.name}`,
                `Ver foto ${index + 1}: ${slide.name}`,
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
