import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Newsletter } from "@/components/newsletter";
import { ProductCard } from "@/components/product-card";
import { TrustStrip } from "@/components/trust-strip";
import { OrderPortalPromo } from "@/components/order-portal-promo";
import { OffCarousel } from "@/components/off-carousel";
import { HeroCarousel } from "@/components/hero-carousel";
import { categoryNames, copy, heroSneaker as heroImage, type Category } from "@/lib/shop-data";
import { useShop } from "@/lib/shop-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Uffa Store — Para quem pisa forte no estilo!" },
      {
        name: "description",
        content:
          "Sapatilhas com selo de autenticidade. Entrega em mãos na zona do Porto. Devolução gratuita em 14 dias.",
      },
      { property: "og:title", content: "Uffa Store — Para quem pisa forte no estilo!" },
      {
        property: "og:description",
        content:
          "Sapatilhas com selo de autenticidade. Entrega em mãos na zona do Porto. Devolução gratuita em 14 dias.",
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
    eyebrow: "Sapatilhas com selo de autenticidade · Porto",
    title: "PARA QUEM PISA FORTE NO ESTILO.",
    text: "Sapatilhas com selo de autenticidade. Entrega em mãos na zona do Porto. Devolução gratuita em 14 dias.",
  },
  en: {
    eyebrow: "Authentic certified sneakers · Porto",
    title: "STEP STRONG IN STYLE.",
    text: "Sneakers with authenticity seal. Hand delivery in the Porto area. Free 14-day returns.",
  },
  es: {
    eyebrow: "Zapatillas con sello de autenticidad · Oporto",
    title: "PARA QUIENES PISAN FUERTE EN EL ESTILO.",
    text: "Zapatillas con sello de autenticidad. Entrega en mano en la zona de Oporto. Devolución gratuita en 14 días.",
  },
};

const categoryImages = (catalog: { category: Category; image: string }[]) => ({
  casual: catalog.find((p) => p.category === "casual")?.image ?? heroImage,
  streetwear: catalog.find((p) => p.category === "streetwear")?.image ?? heroImage,
  limited: catalog.find((p) => p.category === "limited")?.image ?? heroImage,
  sales: catalog.find((p) => p.category === "sales")?.image ?? heroImage,
});

function Home() {
  const { language, catalog } = useShop();
  const catImages = categoryImages(catalog);
  const t = copy[language],
    h = hero[language];
  const cats = Object.keys(catImages) as Category[];

  return (
    <>
      <HeroCarousel products={catalog}>
        <div className="pointer-events-none max-w-3xl animate-reveal">
          <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em]">
            <BadgeCheck className="size-4 text-primary" />
            {h.eyebrow}
          </p>
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

      {/* OFF Carousel positioned strategically right after banner & trust strip */}
      <OffCarousel />

      <section className="mx-auto max-w-7xl px-4 py-16 md:py-20 md:px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-primary">01 / Categories</p>
            <h2 className="mt-2 font-display text-5xl uppercase md:text-7xl">
              {language === "pt"
                ? "Escolhe a tua linha"
                : language === "es"
                  ? "Elige tu línea"
                  : "Choose your lane"}
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {cats.map((cat) => (
            <Link
              key={cat}
              to="/catalogo"
              search={{ category: cat }}
              className="group relative block aspect-[4/5] overflow-hidden bg-product"
            >
              <img
                src={catImages[cat]}
                alt=""
                width={1200}
                height={900}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-category-overlay" />
              <span className="absolute bottom-4 left-4 font-display text-3xl uppercase text-hero-foreground md:text-4xl">
                {categoryNames[cat][language]}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-section">
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-20 md:px-6">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-primary">02 / Uffa picks</p>
              <h2 className="mt-2 font-display text-5xl uppercase md:text-7xl">
                {language === "pt"
                  ? "Mais procurados"
                  : language === "es"
                    ? "Los más buscados"
                    : "Most wanted"}
              </h2>
            </div>
            <Button asChild variant="link" className="hidden sm:inline-flex">
              <Link to="/catalogo" search={{}}>
                {t.shop}
                <ArrowRight />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-10 lg:grid-cols-4">
            {catalog
              .filter((p) => p.featured)
              .slice(0, 4)
              .map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:py-20 md:px-6">
        <OrderPortalPromo />
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:py-20 md:px-6">
        <Newsletter />
      </section>
    </>
  );
}
