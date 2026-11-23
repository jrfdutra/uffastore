import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import useEmblaCarousel from "embla-carousel-react";
import { useShop } from "@/lib/shop-context";
import { tr } from "@/lib/i18n";

const AUTOPLAY_MS = 6000;
/** Black Friday 2026: a primeira imagem visível é sempre a capa da campanha. */
const INITIAL_SLIDE_INDEX = 1;

const CAPA_HOME = "/capas/uffa-capa-home.webp";
const CAPA_HOME_MOBILE = "/capas/uffa-capa-home-mobile.webp";
const CAPA_BLACK_FRIDAY = "/capas/uffa-black-friday.webp";
const CAPA_BLACK_FRIDAY_MOBILE = "/capas/uffa-black-friday-mobile.webp";

type Slide = {
  id: string;
  name: string;
  image: string;
  /** Versão vertical para telemóveis (a capa é horizontal). */
  imageMobile?: string;
  href?: "/catalogo";
  /** A capa já traz o texto na própria imagem, por isso esconde o slogan por cima. */
  hideSlogan?: boolean;
  /** Posição do recorte nas várias larguras. Ambas as capas partilham o mesmo padrão. */
  imageClassName?: string;
};

const slides: Slide[] = [
  {
    id: "capa-online",
    name: "A Uffa Store agora é online",
    image: CAPA_HOME,
    imageMobile: CAPA_HOME_MOBILE,
    href: "/catalogo",
    hideSlogan: true,
    imageClassName: "object-center md:object-right",
  },
  {
    id: "capa-black-friday",
    name: "Black Friday na Uffa Store",
    image: CAPA_BLACK_FRIDAY,
    imageMobile: CAPA_BLACK_FRIDAY_MOBILE,
    href: "/catalogo",
    hideSlogan: true,
    // Mesmo enquadramento da capa rosa: em desktop o texto fica à direita.
    imageClassName: "object-center md:object-right",
  },
];

/**
 * Hero com carrossel: capa "a UFFA agora é online" + capa de Black Friday.
 * Arranca sempre na capa de Black Friday. Ambas já têm o texto na imagem; o
 * título `srTitle` mantém o H1 acessível.
 */
export function HeroCarousel({ children, srTitle }: { children: ReactNode; srTitle: string }) {
  const { language } = useShop();

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    startIndex: INITIAL_SLIDE_INDEX,
  });
  const [selected, setSelected] = useState(INITIAL_SLIDE_INDEX);

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
      className="relative pt-16 min-h-[min(720px,78svh)] overflow-hidden bg-hero text-hero-foreground"
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
                  loading={index === INITIAL_SLIDE_INDEX ? "eager" : "lazy"}
                  fetchPriority={index === INITIAL_SLIDE_INDEX ? "high" : "low"}
                  decoding={index === INITIAL_SLIDE_INDEX ? "sync" : "async"}
                  draggable={false}
                  className={`h-full w-full select-none object-cover transition-transform duration-700 ease-out ${
                    slide.imageClassName ?? "object-center"
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
        className={`pointer-events-none relative mx-auto flex min-h-[min(720px,78svh)] max-w-7xl items-end px-4 pb-12 transition-[opacity,visibility] duration-500 md:px-6 md:pb-16 [text-shadow:_0_2px_10px_rgb(0_0_0_/_40%)] sm:[text-shadow:none] ${
          isCover ? "invisible opacity-0" : "visible opacity-100"
        }`}
      >
        {children}
      </div>

      {isCover && <h1 className="sr-only">{srTitle}</h1>}

      {hasCarousel && (
        <div className="pointer-events-auto absolute bottom-4 right-3 z-20 flex items-center gap-0.5 border border-hero-foreground/10 bg-hero/55 px-1.5 backdrop-blur-sm md:bottom-8 md:right-6 md:gap-1 md:px-2">
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
              className="flex h-11 items-center justify-center px-1"
            >
              <span
                className={`block h-1.5 rounded-full transition-all ${
                  selected === index
                    ? "w-6 bg-hero-foreground"
                    : "w-1.5 bg-hero-foreground/50 hover:bg-hero-foreground/80"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
