import { createFileRoute, notFound } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { BadgeCheck, Box, Hand, Rotate3D } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VerifiedBadge } from "@/components/verified-badge";
import { categoryNames, copy, money, products } from "@/lib/shop-data";
import { useShop } from "@/lib/shop-context";
export const Route = createFileRoute("/produto/$productId")({
  loader: ({ params }) => {
    const product = products.find((p) => p.id === params.productId);
    if (!product) throw notFound();
    return product;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Produto"} — Uffa Store` },
      {
        name: "description",
        content: loaderData?.description.pt ?? "Sneaker verificado pela Uffa Store.",
      },
      { property: "og:title", content: `${loaderData?.name ?? "Produto"} — Uffa Store` },
      {
        property: "og:description",
        content: loaderData?.description.pt ?? "Sneaker verificado pela Uffa Store.",
      },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `/produto/${loaderData?.id ?? ""}` }],
  }),
  component: ProductDetail,
});
function ProductDetail() {
  const p = Route.useLoaderData(),
    s = useShop(),
    t = copy[s.language];
  const [selected, setSelected] = useState<number>();
  const [angle, setAngle] = useState(0);
  const [error, setError] = useState(false);
  const drag = useRef<number | null>(null);
  const transform = `perspective(1000px) rotateY(${angle}deg)`;
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-16">
      <div className="grid gap-10 lg:grid-cols-[1.15fr_.85fr]">
        <div>
          <div
            className="relative overflow-hidden bg-product touch-none"
            onPointerDown={(e) => {
              drag.current = e.clientX;
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              const start = drag.current;
              if (start === null) return;
              setAngle((a) => a + (e.clientX - start) * 0.35);
              drag.current = e.clientX;
            }}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
          >
            <img
              src={p.image}
              alt={p.name}
              width={1200}
              height={900}
              className="aspect-[4/3] h-full w-full object-cover transition-transform duration-75"
              style={{ transform }}
            />
            <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-background px-3 py-2 text-xs font-bold uppercase text-foreground">
              <Rotate3D className="size-4 text-primary" />
              {s.language === "pt"
                ? "Arrasta para rodar 360°"
                : s.language === "es"
                  ? "Arrastra para girar 360°"
                  : "Drag to rotate 360°"}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {[0, -10, 10].map((v, i) => (
              <Button
                key={v}
                variant="ghost"
                className="h-auto rounded-none bg-product p-0"
                onClick={() => setAngle(v * 2)}
                aria-label={`View ${i + 1}`}
              >
                <img
                  src={p.image}
                  alt=""
                  width={1200}
                  height={900}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover"
                  style={{ transform: `rotate(${v}deg)` }}
                />
              </Button>
            ))}
          </div>
        </div>
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase text-primary">
              {categoryNames[p.category][s.language]}
            </p>
            <VerifiedBadge />
          </div>
          <h1 className="mt-4 font-display text-6xl uppercase leading-none md:text-7xl">
            {p.name}
          </h1>
          <p className="mt-5 text-2xl font-bold">{money(p.price)}</p>
          <p className="mt-5 max-w-lg leading-relaxed text-muted-foreground">
            {p.description[s.language]}
          </p>
          <div className="my-7 border-y border-border py-6">
            <div className="mb-3 flex justify-between">
              <span className="text-sm font-bold uppercase">{t.selectSize}</span>
              <span className="text-xs text-muted-foreground">EU</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {p.sizes.map((x) => (
                <Button
                  key={x.size}
                  variant={selected === x.size ? "default" : "outline"}
                  className="relative h-12 rounded-none"
                  disabled={!x.stock}
                  onClick={() => {
                    setSelected(x.size);
                    setError(false);
                  }}
                >
                  <span>{x.size}</span>
                  {!x.stock && (
                    <span className="absolute inset-x-1 bottom-1 text-[8px] uppercase">
                      {t.soldOut}
                    </span>
                  )}
                </Button>
              ))}
            </div>
            {error && <p className="mt-3 text-sm font-semibold text-destructive">{t.selectSize}</p>}
          </div>
          <Button
            size="lg"
            className="h-14 w-full rounded-none text-base uppercase"
            onClick={() => {
              if (!selected) {
                setError(true);
                return;
              }
              s.addToCart(p.id, selected);
            }}
          >
            {t.add}
          </Button>
          <div className="mt-7 grid grid-cols-2 gap-3 text-xs">
            <div className="flex gap-3 border border-border p-4">
              <BadgeCheck className="size-5 text-primary" />
              <span>
                {s.language === "pt"
                  ? "Autenticidade verificada"
                  : s.language === "es"
                    ? "Autenticidad verificada"
                    : "Authenticity verified"}
              </span>
            </div>
            <div className="flex gap-3 border border-border p-4">
              <Hand className="size-5 text-primary" />
              <span>{t.pickup}</span>
            </div>
            <div className="col-span-2 flex gap-3 border border-border p-4">
              <Box className="size-5 text-primary" />
              <span>{t.noReturns}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
