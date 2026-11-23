import { Star } from "lucide-react";
import { tr } from "@/lib/i18n";
import type { Language } from "@/lib/shop-data";

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
      es: "Las fotos no le hacen justicia. La zapatilla es aún mejor en persona y la talla era la que esperaba.",
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
  return (
    <section className="border-y border-border bg-section">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase text-primary">02 / Feedbacks</p>
          <h2 className="mt-2 font-display text-5xl uppercase md:text-7xl">
            {tr(language, "O que dizem por aí", "What people are saying", "Lo que dicen")}
          </h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {FEEDBACKS.map((feedback) => (
            <figure
              key={feedback.name}
              className="flex flex-col border border-border bg-background p-6"
            >
              <div
                className="flex gap-0.5 text-primary"
                aria-label={`${feedback.rating}/5`}
                role="img"
              >
                {Array.from({ length: feedback.rating }, (_, index) => (
                  <Star key={index} aria-hidden="true" className="size-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-base leading-relaxed">
                “{feedback.quote[language]}”
              </blockquote>
              <figcaption className="mt-6 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {feedback.name} · {feedback.place}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
