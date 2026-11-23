import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Pause, Play, Star } from "lucide-react";
import { tr } from "@/lib/i18n";
import type { Language } from "@/lib/shop-data";

const AUTOPLAY_MS = 8000;

/**
 * Feedbacks de demonstração para mostrar o layout da secção.
 * Substituir cada texto pelos comentários reais dos clientes quando forem validados.
 */
const FEEDBACKS = [
  {
    name: "Mariana F.",
    place: "Porto",
    rating: 5,
    quote: {
      pt: "Encomendei à noite e no dia seguinte já tinha o par na mão. O atendimento foi rápido e a escolha do local de recolha muito prática.",
      en: "I ordered at night and had the pair in hand the next day. Quick service and the pickup choice was really convenient.",
      es: "Pedí por la noche y al día siguiente ya tenía el par en la mano. Atención rápida y la recogida muy práctica.",
    },
  },
  {
    name: "Rui S.",
    place: "Matosinhos",
    rating: 5,
    quote: {
      pt: "As fotografias não fazem justiça. A sapatilha é ainda melhor ao vivo e o tamanho corresponde ao que esperava.",
      en: "The photos don't do it justice. The sneaker looks even better in person and the size was exactly what I expected.",
      es: "Las fotos no le hacen justicia. La sapatilla es aún mejor en persona y la talla era la que esperaba.",
    },
  },
  {
    name: "Inês C.",
    place: "Maia",
    rating: 5,
    quote: {
      pt: "Comprei em Black Friday com desconto e sem complicações. Recebi o código de rastreio e soube sempre onde estava a encomenda.",
      en: "I bought on Black Friday with a discount and no hassle. I got the tracking code and always knew where my order was.",
      es: "Compré en Black Friday con descuento y sin complicaciones. Recibí el código de seguimiento y supe siempre dónde estaba el pedido.",
    },
  },
] as const;

export function FeedbacksSection({ language }: { language: Language }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);

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

  // Um feedback de 8 em 8 segundos. O timer reinicia a cada mudança de slide,
  // pausa em hover/foco e respeita prefers-reduced-motion (WCAG 2.2.2).
  useEffect(() => {
    if (!emblaApi || FEEDBACKS.length < 2 || paused || interacting) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => emblaApi.scrollNext(), AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [emblaApi, paused, interacting, selected]);

  return (
    <section
      className="border-y border-border bg-foreground text-background"
      aria-roledescription="carousel"
      aria-label={tr(
        language,
        "Opiniões dos clientes",
        "Customer feedback",
        "Opiniones de los clientes",
      )}
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={() => setInteracting(false)}
    >
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase text-primary">02 / Feedbacks</p>
            <h2 className="mt-2 font-display text-5xl uppercase md:text-7xl">
              {tr(language, "O que dizem por aí", "What people are saying", "Lo que dicen")}
            </h2>
          </div>

          <div
            className="flex items-center gap-1"
            aria-label={tr(
              language,
              "Controlos do carrossel",
              "Carousel controls",
              "Controles del carrusel",
            )}
          >
            <button
              type="button"
              onClick={() => emblaApi?.scrollPrev()}
              aria-label={tr(language, "Anterior", "Previous", "Anterior")}
              className="grid size-11 place-items-center text-background"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => emblaApi?.scrollNext()}
              aria-label={tr(language, "Seguinte", "Next", "Siguiente")}
              className="grid size-11 place-items-center text-background"
            >
              <ChevronRight className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => setPaused((value) => !value)}
              aria-pressed={paused}
              aria-label={tr(
                language,
                paused ? "Retomar apresentação" : "Pausar apresentação",
                paused ? "Resume slideshow" : "Pause slideshow",
                paused ? "Reanudar presentación" : "Pausar presentación",
              )}
              className="grid size-11 place-items-center text-background"
            >
              {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
            </button>
          </div>
        </div>

        <div className="-mx-2 overflow-hidden" ref={emblaRef}>
          <div className="flex touch-pan-y">
            {FEEDBACKS.map((feedback, index) => (
              <div
                key={feedback.name}
                className="min-w-0 shrink-0 grow-0 basis-full px-2"
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} / ${FEEDBACKS.length}`}
              >
                <figure className="flex h-full flex-col border border-background/15 bg-foreground p-6 md:p-10">
                  <div
                    className="flex gap-0.5 text-primary"
                    aria-label={`${feedback.rating}/5`}
                    role="img"
                  >
                    {Array.from({ length: feedback.rating }, (_, star) => (
                      <Star key={star} aria-hidden="true" className="size-4 fill-current" />
                    ))}
                  </div>
                  <blockquote className="mt-4 flex-1 text-lg leading-relaxed md:text-2xl">
                    “{feedback.quote[language]}”
                  </blockquote>
                  <figcaption className="mt-8 text-xs font-bold uppercase tracking-wide text-background/60">
                    {feedback.name} · {feedback.place}
                  </figcaption>
                </figure>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-center gap-1">
          {FEEDBACKS.map((feedback, index) => (
            <button
              key={feedback.name}
              type="button"
              onClick={() => emblaApi?.scrollTo(index)}
              aria-label={tr(
                language,
                `Ver feedback ${index + 1}: ${feedback.name}`,
                `View feedback ${index + 1}: ${feedback.name}`,
                `Ver comentario ${index + 1}: ${feedback.name}`,
              )}
              aria-current={selected === index}
              className="grid size-11 min-w-11 place-items-center"
            >
              <span
                className={`block h-1.5 rounded-full transition-all ${
                  selected === index ? "w-6 bg-primary" : "w-1.5 bg-background/30"
                }`}
              />
            </button>
          ))}
        </div>

        <span className="sr-only" aria-live="polite">
          {tr(language, "Feedback", "Feedback", "Comentario")} {selected + 1} / {FEEDBACKS.length}:{" "}
          {FEEDBACKS[selected]?.name}
        </span>
      </div>
    </section>
  );
}
