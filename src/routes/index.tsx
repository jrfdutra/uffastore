import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Newsletter } from "@/components/newsletter";
import { ProductCard } from "@/components/product-card";
import { TrustStrip } from "@/components/trust-strip";
import { OrderPortalPromo } from "@/components/order-portal-promo";
import {
  categoryNames,
  copy,
  heroSneaker as heroImage,
  products,
  type Category,
} from "@/lib/shop-data";
import { useShop } from "@/lib/shop-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Uffa Store — Sneakers autênticos no Porto" },
      {
        name: "description",
        content:
          "Sneakers verificados, streetwear e edições limitadas com recolha grátis no Porto.",
      },
      { property: "og:title", content: "Uffa Store — Sneakers autênticos no Porto" },
      {
        property: "og:description",
        content:
          "Sneakers verificados, streetwear e edições limitadas com recolha grátis no Porto.",
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
    eyebrow: "Sneakers verificados · Porto",
    title: "SEM DÚVIDAS. SÓ ESTILO.",
    text: "Pares autênticos, escolhidos um a um. Vê, escolhe e recolhe no Porto — sem ruído.",
  },
  en: {
    eyebrow: "Verified sneakers · Porto",
    title: "NO DOUBT. JUST STYLE.",
    text: "Authentic pairs, selected one by one. Browse, choose and collect in Porto — no noise.",
  },
  es: {
    eyebrow: "Sneakers verificados · Oporto",
    title: "SIN DUDAS. SOLO ESTILO.",
    text: "Pares auténticos, elegidos uno a uno. Mira, elige y recoge en Oporto — sin ruido.",
  },
};
const catImages = {
  running: products.find((p) => p.category === "running")?.image ?? heroImage,
  casual: products.find((p) => p.category === "casual")?.image ?? heroImage,
  streetwear: products.find((p) => p.category === "streetwear")?.image ?? heroImage,
  limited: products.find((p) => p.category === "limited")?.image ?? heroImage,
};
function Home() {
  const { language } = useShop();
  const t = copy[language],
    h = hero[language];
  const cats = Object.keys(catImages) as Category[];
  return (
    <>
      <section className="relative min-h-[min(760px,82vh)] overflow-hidden bg-hero text-hero-foreground">
        <img
          src={heroImage}
          alt="Uffa Store sneakers"
          width={1200}
          height={900}
          className="absolute inset-0 h-full w-full object-cover object-[66%_center] opacity-90"
        />
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="relative mx-auto flex min-h-[min(760px,82vh)] max-w-7xl items-end px-4 pb-14 md:px-6 md:pb-20">
          <div className="max-w-3xl animate-reveal">
            <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em]">
              <BadgeCheck className="size-4 text-primary" />
              {h.eyebrow}
            </p>
            <h1 className="font-display text-6xl uppercase leading-[.9] sm:text-7xl md:text-9xl">
              {h.title}
            </h1>
            <p className="mt-5 max-w-xl text-base md:text-lg">{h.text}</p>
            <Button asChild size="lg" className="mt-7 h-12 rounded-none px-7">
              <Link to="/catalogo" search={{}}>
                {t.shop}
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>
      <TrustStrip />
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
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
        <div className="mx-auto max-w-7xl px-4 py-20 md:px-6">
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
            {products
              .filter((p) => p.featured)
              .map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
        <OrderPortalPromo />
      </section>
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
        <Newsletter />
      </section>
    </>
  );
}
