import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { BadgeCheck, Box, Hand, Rotate3D } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VerifiedBadge } from "@/components/verified-badge";
import {
  categoryNames,
  copy,
  getProductCategories,
  getProductEffectiveStatus,
  isProductInCategory,
  money,
  type ProductSize,
} from "@/lib/shop-data";
import { loadProduct } from "@/lib/catalog";
import { useShop } from "@/lib/shop-context";
import { type Escalao } from "@/lib/precos";
import {
  escaloesDisponiveis as escaloesComStock,
  precoApresentado,
  tamanhosDoEscalao,
  variantesPorCor,
} from "@/lib/variantes";
import { tr } from "@/lib/i18n";

export const Route = createFileRoute("/produto/$productId")({
  loader: async ({ params }) => {
    const product = await loadProduct(params.productId);
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
      { property: "og:image", content: loaderData?.image ?? "" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `/produto/${loaderData?.id ?? ""}` }],
  }),
  component: ProductDetail,
});

/** Ordem de apresentação dos escalões. */
const ESCALAO_ETIQUETA: Record<Escalao, { pt: string; en: string; es: string; nota: string }> = {
  crianca: { pt: "Criança", en: "Kids", es: "Niño", nota: "28–35" },
  gs: { pt: "GS", en: "GS", es: "GS", nota: "36–39" },
  senior: { pt: "Senior (40+)", en: "Senior (40+)", es: "Senior (40+)", nota: "40–45" },
};

function ProductDetail() {
  const loaderProduct = Route.useLoaderData(),
    s = useShop(),
    t = copy[s.language];
  const p = s.catalog.find((item) => item.id === loaderProduct.id) ?? loaderProduct;

  const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined);
  const [selectedEscalao, setSelectedEscalao] = useState<Escalao | undefined>(undefined);
  const [selected, setSelected] = useState<number>();
  const [angle, setAngle] = useState(0);
  const [activeImage, setActiveImage] = useState(0);
  const [error, setError] = useState(false);
  const drag = useRef<number | null>(null);

  const colors = p.colors ?? [];
  const activeColor =
    selectedColor && colors.some((color) => color.slug === selectedColor)
      ? selectedColor
      : colors[0]?.slug;

  // Variantes reais da cor escolhida (ou todas, se o modelo não tiver opção de cor).
  const sizesForColor = useMemo(
    () => variantesPorCor(p.sizes, activeColor),
    [p.sizes, activeColor],
  );

  // Escalões que existem efetivamente nesta cor, pela ordem Criança → GS → Senior.
  const escaloesDisponiveis = useMemo(() => escaloesComStock(sizesForColor), [sizesForColor]);

  const activeEscalao =
    selectedEscalao && escaloesDisponiveis.includes(selectedEscalao)
      ? selectedEscalao
      : escaloesDisponiveis[0];

  const sizesForEscalao = useMemo(
    () => tamanhosDoEscalao(sizesForColor, activeEscalao),
    [sizesForColor, activeEscalao],
  );

  const selectedVariant: ProductSize | undefined = sizesForEscalao.find(
    (size) => size.size === selected,
  );
  const displayPrice = selectedVariant?.price ?? precoApresentado(p.sizes, activeColor, p.price);

  const effectiveStatus = getProductEffectiveStatus(p);
  const isSoldOut = effectiveStatus === "soldout";
  const isComingSoon = effectiveStatus === "comingsoon";
  const isInactive = p.status === "inactive";

  const transform = `perspective(1000px) rotateY(${angle}deg)`;
  const colorGallery = colors.find((color) => color.slug === activeColor)?.images;
  const gallery = colorGallery?.length ? colorGallery : p.images?.length ? p.images : [p.image];
  const currentImage = gallery[activeImage] ?? gallery[0] ?? p.image;

  const handleColorChange = (slug: string) => {
    setSelectedColor(slug);
    setSelected(undefined);
    setError(false);
    setActiveImage(0);
  };

  const handleEscalaoChange = (escalao: string) => {
    setSelectedEscalao(escalao as Escalao);
    setSelected(undefined);
    setError(false);
  };

  const handleSizeChange = (value: string) => {
    setSelected(Number(value));
    setError(false);
  };

  const canAdd =
    Boolean(selectedVariant) &&
    (selectedVariant?.stock ?? 0) > 0 &&
    !isSoldOut &&
    !isComingSoon &&
    !isInactive;

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
              src={currentImage}
              alt={p.name}
              width={1664}
              height={2080}
              className="aspect-[4/5] h-full w-full object-cover transition-transform duration-75"
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
            {gallery.map((image, i) => (
              <Button
                key={`${image}-${i}`}
                variant="ghost"
                className={`h-auto rounded-none bg-product p-0 ${i === activeImage ? "ring-2 ring-primary" : ""}`}
                onClick={() => {
                  setActiveImage(i);
                  setAngle(0);
                }}
                aria-label={`${p.name} — ${i + 1}`}
                aria-pressed={i === activeImage}
              >
                <img
                  src={image}
                  alt=""
                  width={1664}
                  height={2080}
                  loading="lazy"
                  className="aspect-[4/5] w-full object-cover"
                />
              </Button>
            ))}
          </div>
        </div>
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold uppercase text-primary">
                {getProductCategories(p)
                  .map((category) => categoryNames[category][s.language])
                  .join(" · ")}
              </p>
              {(isProductInCategory(p, "sales") || Boolean(p.originalPrice)) && !isSoldOut && (
                <span className="bg-promo text-promo-foreground border-2 border-promo rounded-[4px] px-3.5 py-1 text-xs font-black uppercase tracking-widest shadow-md">
                  {tr(s.language, "PROMO", "PROMO", "PROMO")}
                </span>
              )}
              {isSoldOut && (
                <span className="bg-foreground text-background px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  {tr(s.language, "ESGOTADO", "SOLD OUT", "AGOTADO")}
                </span>
              )}
              {isComingSoon && (
                <span className="bg-primary text-primary-foreground px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  {tr(s.language, "EM BREVE", "COMING SOON", "PRÓXIMAMENTE")}
                </span>
              )}
            </div>
            <VerifiedBadge />
          </div>
          {isInactive && (
            <div className="mt-4 border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive font-semibold">
              {tr(
                s.language,
                "Aviso: Este produto está marcado como inativo no painel de administração e não se encontra visível na loja pública.",
                "Notice: This product is marked as inactive in administration and is not publicly visible.",
                "Aviso: Este producto está marcado como inactivo en administración.",
              )}
            </div>
          )}
          <h1 className="mt-4 font-display text-6xl uppercase leading-none md:text-7xl">
            {p.name}
          </h1>
          <div className="flex items-baseline gap-3 mt-5">
            <span
              className={`font-display text-foreground font-bold ${Boolean(p.originalPrice) || isProductInCategory(p, "sales") ? "text-4xl md:text-5xl" : "text-3xl"}`}
            >
              {money(displayPrice)}
            </span>
            {p.originalPrice && (
              <span className="text-sm font-semibold text-muted-foreground line-through">
                {money(p.originalPrice)}
              </span>
            )}
          </div>
          <p className="mt-5 max-w-lg leading-relaxed text-muted-foreground">
            {p.description[s.language]}
          </p>

          <div className="my-7 space-y-5 border-y border-border py-6">
            {colors.length > 1 && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-bold uppercase">
                    {tr(s.language, "Cor", "Colour", "Color")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {colors.find((color) => color.slug === activeColor)?.name ?? ""}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => {
                    const isActive = color.slug === activeColor;
                    return (
                      <button
                        key={color.slug}
                        type="button"
                        onClick={() => handleColorChange(color.slug)}
                        aria-pressed={isActive}
                        className={`border px-3.5 py-2 text-xs font-bold uppercase tracking-wide transition ${
                          isActive
                            ? "border-foreground bg-foreground text-background"
                            : "border-border text-foreground hover:border-foreground"
                        }`}
                      >
                        {color.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {escaloesDisponiveis.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-bold uppercase">
                      {tr(s.language, "Categoria", "Category", "Categoría")}
                    </span>
                  </div>
                  <Select value={activeEscalao} onValueChange={handleEscalaoChange}>
                    <SelectTrigger
                      className="h-12 rounded-none border-border px-3 text-left text-sm font-semibold uppercase"
                      aria-label={tr(
                        s.language,
                        "Escolher categoria de tamanho",
                        "Choose size category",
                        "Elegir categoría de talla",
                      )}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {escaloesDisponiveis.map((escalao) => (
                        <SelectItem key={escalao} value={escalao} className="rounded-none py-2.5">
                          {ESCALAO_ETIQUETA[escalao][s.language]}{" "}
                          <span className="text-muted-foreground">
                            · {ESCALAO_ETIQUETA[escalao].nota}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-bold uppercase">{t.size}</span>
                    <span className="text-xs text-muted-foreground">EU</span>
                  </div>
                  <Select
                    value={selected ? String(selected) : undefined}
                    onValueChange={handleSizeChange}
                    disabled={isSoldOut || isComingSoon || sizesForEscalao.length === 0}
                  >
                    <SelectTrigger
                      className="h-12 rounded-none border-border px-3 text-left text-sm font-semibold uppercase"
                      aria-label={t.selectSize}
                    >
                      <SelectValue placeholder={t.selectSize} />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {sizesForEscalao.map((size) => {
                        const disponivel = size.stock > 0;
                        return (
                          <SelectItem
                            key={size.size}
                            value={String(size.size)}
                            disabled={!disponivel}
                            className="rounded-none py-2.5"
                          >
                            <span className="flex w-full items-center justify-between gap-4">
                              <span>{size.size}</span>
                              {!disponivel && (
                                <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                                  {t.soldOut}
                                </span>
                              )}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {selectedVariant && (
              <p className="text-xs text-muted-foreground">
                {tr(s.language, "Selecionado:", "Selected:", "Seleccionado:")}{" "}
                <span className="font-semibold text-foreground">
                  {activeColor
                    ? `${colors.find((color) => color.slug === activeColor)?.name ?? activeColor} · `
                    : ""}
                  {activeEscalao ? `${ESCALAO_ETIQUETA[activeEscalao][s.language]} · ` : ""}
                  {selectedVariant.size}
                </span>
                {" — "}
                {selectedVariant.stock > 0
                  ? tr(
                      s.language,
                      `${selectedVariant.stock} em stock`,
                      `${selectedVariant.stock} in stock`,
                      `${selectedVariant.stock} en stock`,
                    )
                  : t.soldOut}
              </p>
            )}

            {error && <p className="text-sm font-semibold text-destructive">{t.selectSize}</p>}
          </div>

          <Button
            size="lg"
            disabled={isSoldOut || isComingSoon || isInactive}
            className={`h-14 w-full rounded-none text-base uppercase font-bold ${
              isSoldOut || isComingSoon || isInactive
                ? "bg-muted text-muted-foreground cursor-not-allowed hover:bg-muted"
                : ""
            }`}
            onClick={() => {
              if (isSoldOut || isComingSoon || isInactive) return;
              if (!selectedVariant || selectedVariant.stock <= 0) {
                setError(true);
                return;
              }
              s.addToCart(p.id, selectedVariant.size, selectedVariant.color);
            }}
          >
            {isSoldOut
              ? tr(s.language, "Esgotado", "Sold out", "Agotado")
              : isComingSoon
                ? tr(s.language, "Em breve", "Coming soon", "Próximamente")
                : !canAdd
                  ? t.selectSize
                  : t.add}
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
