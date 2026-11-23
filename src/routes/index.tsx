import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Newsletter } from "@/components/newsletter";
import { FeedbacksSection } from "@/components/feedbacks-section";
import { TrustStrip } from "@/components/trust-strip";
import { OffCarousel } from "@/components/off-carousel";
import { HeroCarousel } from "@/components/hero-carousel";
import { copy, type Product } from "@/lib/shop-data";
import { BRANDS, brandNames, getProductBrand, type Brand } from "@/lib/brands";
import { ModelSearch } from "@/components/model-search";
import { FOTO_PADRAO } from "@/lib/consolidated-catalog";
import { useShop } from "@/lib/shop-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Uffa Store — Para quem pisa forte no estilo!" },
      {
        name: "description",
        content: "Sapatilhas selecionadas. Entrega em mãos na zona do Porto.",
      },
      { property: "og:title", content: "Uffa Store — Para quem pisa forte no estilo!" },
      {
        property: "og:description",
        content: "Sapatilhas selecionadas. Entrega em mãos na zona do Porto.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

const hero = {
  pt: {
    eyebrow: "Sapatilhas selecionadas · Porto",
    title: "PARA QUEM PISA FORTE NO ESTILO.",
    text: "Sapatilhas selecionadas. Entrega em mãos na zona do Porto.",
  },
  en: {
    eyebrow: "Selected sneakers · Porto",
    title: "STEP STRONG IN STYLE.",
    text: "Selected sneakers. Hand delivery in the Porto area.",
  },
  es: {
    eyebrow: "Zapatillas seleccionadas · Oporto",
    title: "PARA QUIENES PISAN FUERTE EN EL ESTILO.",
    text: "Zapatillas seleccionadas. Entrega en mano en la zona de Oporto.",
  },
};

/**
 * Capa de cada marca: usa a fotografia real do primeiro produto da marca,
 * pela ordem do catálogo (a Shopify é a fonte de verdade). Quando nenhum produto
 * da marca tem fotografia própria, recorre à imagem padrão da UFFA.
 */
function brandCovers(catalog: Product[]): Record<Brand, string> {
  return BRANDS.reduce(
    (covers, brand) => {
      const cover = catalog.find(
        (product) =>
          getProductBrand(product) === brand &&
          Boolean(product.image) &&
          product.image !== FOTO_PADRAO,
      );
      covers[brand] = cover?.image ?? FOTO_PADRAO;
      return covers;
    },
    {} as Record<Brand, string>,
  );
}

function Home() {
  const { language, catalog } = useShop();
  const t = copy[language],
    h = hero[language];
  const covers = brandCovers(catalog);

  return (
    <>
      <HeroCarousel srTitle={h.title}>
        <div className="pointer-events-none max-w-3xl animate-reveal">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em]">{h.eyebrow}</p>
          <h1 className="font-display text-6xl uppercase leading-[.9] sm:text-7xl md:text-9xl">
            {h.title}
          </h1>
          <p className="mt-5 max-w-xl text-base md:text-lg">{h.text}</p>
          <Button asChild size="lg" className="pointer-events-auto mt-7 h-12 rounded-none px-7">
            <Link to="/catalogo" search={{}}>
              {t.shop}
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </HeroCarousel>

      <TrustStrip />

      {/* Pesquisa de modelos logo no início, antes das secções promocionais */}
      <ModelSearch catalog={catalog} language={language} />

      {/* OFF Carousel positioned strategically right after banner & trust strip */}
      <OffCarousel />

      <section className="mx-auto max-w-7xl px-4 py-16 md:py-20 md:px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-primary">01 / Brands</p>
            <h2 className="mt-2 font-display text-5xl uppercase md:text-7xl">
              {language === "pt"
                ? "Escolhe a tua marca"
                : language === "es"
                  ? "Elige tu marca"
                  : "Choose your brand"}
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {BRANDS.map((brand) => (
            <Link
              key={brand}
              to="/catalogo"
              search={{ brand }}
              className="group relative block aspect-[4/5] overflow-hidden bg-product"
            >
              <img
                src={covers[brand]}
                alt=""
                width={1664}
                height={2080}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-category-overlay" />
              <span className="absolute bottom-4 left-4 font-display text-3xl uppercase text-hero-foreground md:text-4xl">
                {brandNames[brand][language]}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <FeedbacksSection language={language} />

      <section className="mx-auto max-w-7xl px-4 py-16 md:py-20 md:px-6">
        <Newsletter />
      </section>
    </>
  );
}
