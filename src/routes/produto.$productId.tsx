import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, Hand, PackageCheck, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  categoryNames,
  copy,
  getProductCategories,
  getProductEffectiveStatus,
  isProductInCategory,
  money,
  type ProductSize,
} from "@/lib/shop-data";
import { brandLabelFor } from "@/lib/brands";
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
import {
  CORDAS,
  CORES_AIR_FORCE,
  FIOS,
  personalizacaoCompleta,
  temCorAirForce,
  temFio,
  temPersonalizacao,
  type Personalizacao,
} from "@/lib/personalizacao";

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
        content: loaderData?.description.pt ?? "Sneaker selecionado pela Uffa Store.",
      },
      { property: "og:title", content: `${loaderData?.name ?? "Produto"} — Uffa Store` },
      {
        property: "og:description",
        content: loaderData?.description.pt ?? "Sneaker selecionado pela Uffa Store.",
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
  crianca: { pt: "Criança", en: "Kids", es: "Niño", nota: "27,5–35" },
  gs: { pt: "GS", en: "GS", es: "GS", nota: "35⅓–39⅓" },
  senior: { pt: "Sénior", en: "Senior", es: "Sénior", nota: "40–50" },
};

function ProductDetail() {
  const loaderProduct = Route.useLoaderData(),
    s = useShop(),
    t = copy[s.language];
  const p = s.catalog.find((item) => item.id === loaderProduct.id) ?? loaderProduct;

  const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined);
  const [selectedCord, setSelectedCord] = useState<string | undefined>(undefined);
  const [personalizacao, setPersonalizacao] = useState<Personalizacao>({});
  const [erroPersonalizacao, setErroPersonalizacao] = useState(false);
  const [selectedEscalao, setSelectedEscalao] = useState<Escalao | undefined>(undefined);
  const [selected, setSelected] = useState<number>();
  const [activeImage, setActiveImage] = useState(0);
  const [error, setError] = useState(false);

  const colors = p.colors ?? [];
  const activeColor =
    selectedColor && colors.some((color) => color.slug === selectedColor)
      ? selectedColor
      : colors[0]?.slug;

  const cords = p.cords ?? [];
  const personalizavel = temPersonalizacao(p.id);
  const comFio = temFio(p.id);
  const comCorAirForce = temCorAirForce(p.id);
  const defaultCord =
    cords.find((cord) => /^sem\b|^without\b/i.test(cord.name))?.slug ?? cords[0]?.slug;
  const activeCord =
    selectedCord && cords.some((cord) => cord.slug === selectedCord) ? selectedCord : defaultCord;

  // Variantes reais da cor (e Cute Cord) escolhidas, ou todas se o modelo não tiver essas opções.
  const sizesForColor = useMemo(
    () => variantesPorCor(p.sizes, activeColor, activeCord),
    [p.sizes, activeColor, activeCord],
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
  const displayPrice =
    selectedVariant?.price ?? precoApresentado(p.sizes, activeColor, p.price, activeCord);
  // Preço antigo riscado: acompanha a variante (cor + Cute Cord) escolhida ou,
  // sem tamanho escolhido, a variante mais barata dessa combinação.
  const cheapestVariant = [...sizesForColor].sort(
    (a, b) => (a.price ?? p.price) - (b.price ?? p.price),
  )[0];
  const compareAtPrice =
    selectedVariant?.compareAtPrice ?? cheapestVariant?.compareAtPrice ?? p.originalPrice;
  const discountPercent =
    compareAtPrice && compareAtPrice > displayPrice
      ? Math.round(((compareAtPrice - displayPrice) / compareAtPrice) * 100)
      : 0;

  const effectiveStatus = getProductEffectiveStatus(p);
  const isSoldOut = effectiveStatus === "soldout";
  const isComingSoon = effectiveStatus === "comingsoon";
  const isInactive = p.status === "inactive";

  const colorGallery = colors.find((color) => color.slug === activeColor)?.images;
  const gallery = colorGallery?.length ? colorGallery : p.images?.length ? p.images : [p.image];
  const currentImage = gallery[activeImage] ?? gallery[0] ?? p.image;

  // O vídeo só aparece na cor a que pertence (ex.: Floral Orange).
  const videoUrl = p.video && (!p.videoColor || p.videoColor === activeColor) ? p.video : undefined;
  const showingVideo = Boolean(videoUrl) && activeImage === gallery.length;
  const currentMedia = showingVideo ? videoUrl : currentImage;

  const handleColorChange = (slug: string) => {
    setSelectedColor(slug);
    setSelected(undefined);
    setError(false);
    setActiveImage(0);
  };

  const handleCordChange = (slug: string) => {
    setSelectedCord(slug);
    setSelected(undefined);
    setError(false);
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
          <div className="relative overflow-hidden bg-product">
            {showingVideo ? (
              <video
                src={currentMedia}
                controls
                playsInline
                className="aspect-[4/5] h-full w-full bg-black object-cover"
              />
            ) : (
              <img
                src={currentMedia}
                alt={p.name}
                width={1664}
                height={2080}
                className="aspect-[4/5] h-full w-full object-cover"
              />
            )}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {gallery.map((image, i) => (
              <Button
                key={`${image}-${i}`}
                variant="ghost"
                className={`h-auto rounded-none bg-product p-0 ${i === activeImage ? "ring-2 ring-primary" : ""}`}
                onClick={() => {
                  setActiveImage(i);
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
            {videoUrl && (
              <Button
                variant="ghost"
                className={`h-auto rounded-none bg-product p-0 ${showingVideo ? "ring-2 ring-primary" : ""}`}
                onClick={() => {
                  setActiveImage(gallery.length);
                }}
                aria-label={`${p.name} — ${s.language === "pt" ? "vídeo" : "video"}`}
                aria-pressed={showingVideo}
              >
                <span className="relative block w-full">
                  <video
                    src={videoUrl}
                    muted
                    playsInline
                    preload="metadata"
                    className="aspect-[4/5] w-full bg-black object-cover"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                    <Play className="size-6 fill-white text-white" />
                  </span>
                </span>
              </Button>
            )}
          </div>
        </div>
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold uppercase text-primary">
                {brandLabelFor(p, s.language) ??
                  getProductCategories(p)
                    .map((category) => categoryNames[category][s.language])
                    .join(" · ")}
              </p>
              {(isProductInCategory(p, "promocoes") || discountPercent > 0) && !isSoldOut && (
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
            <div className="flex items-center gap-2">
              {isProductInCategory(p, "blackfriday") && !isSoldOut && (
                <span className="border border-white/25 bg-black px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-sm">
                  {tr(s.language, "BLACK FRIDAY", "BLACK FRIDAY", "BLACK FRIDAY")}
                </span>
              )}
            </div>
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
          <div className="flex items-end gap-3 mt-5">
            <div className="flex flex-col gap-0.5">
              {compareAtPrice && (
                <span className="text-sm font-semibold text-muted-foreground line-through">
                  {money(compareAtPrice)}
                </span>
              )}
              <span
                className={`font-display text-foreground font-bold ${Boolean(compareAtPrice) || isProductInCategory(p, "promocoes") ? "text-4xl md:text-5xl" : "text-3xl"}`}
              >
                {money(displayPrice)}
              </span>
            </div>
            {discountPercent > 0 && (
              <span className="mb-1.5 bg-black px-2.5 py-1 text-xs font-black uppercase tracking-wide text-white">
                -{discountPercent}%
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

            {cords.length > 1 && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-bold uppercase">{p.cordLabel ?? "Cute Cord"}</span>
                  <span className="text-xs text-muted-foreground">
                    {cords.find((cord) => cord.slug === activeCord)?.name ?? ""}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cords.map((cord) => {
                    const isActive = cord.slug === activeCord;
                    return (
                      <button
                        key={cord.slug}
                        type="button"
                        onClick={() => handleCordChange(cord.slug)}
                        aria-pressed={isActive}
                        className={`border px-3.5 py-2 text-xs font-bold uppercase tracking-wide transition ${
                          isActive
                            ? "border-foreground bg-foreground text-background"
                            : "border-border text-foreground hover:border-foreground"
                        }`}
                      >
                        {cord.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {personalizavel && (
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-bold uppercase">
                      {tr(s.language, "Corda", "Rope", "Cuerda")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {personalizacao.corda ?? ""}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {CORDAS.map((opcao) => {
                      const isActive = personalizacao.corda === opcao.slug;
                      return (
                        <button
                          key={opcao.slug}
                          type="button"
                          onClick={() => {
                            setPersonalizacao((atual) => ({ ...atual, corda: opcao.slug }));
                            setErroPersonalizacao(false);
                          }}
                          aria-pressed={isActive}
                          className={`border px-3.5 py-2 text-xs font-bold uppercase tracking-wide transition ${
                            isActive
                              ? "border-foreground bg-foreground text-background"
                              : "border-border text-foreground hover:border-foreground"
                          }`}
                        >
                          {opcao.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {comFio && (
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-bold uppercase">
                        {tr(s.language, "Fio", "Thread", "Hilo")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {personalizacao.fio ?? ""}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {FIOS.map((opcao) => {
                        const isActive = personalizacao.fio === opcao.slug;
                        return (
                          <button
                            key={opcao.slug}
                            type="button"
                            onClick={() => {
                              setPersonalizacao((atual) => ({ ...atual, fio: opcao.slug }));
                              setErroPersonalizacao(false);
                            }}
                            aria-pressed={isActive}
                            className={`border px-3.5 py-2 text-xs font-bold uppercase tracking-wide transition ${
                              isActive
                                ? "border-foreground bg-foreground text-background"
                                : "border-border text-foreground hover:border-foreground"
                            }`}
                          >
                            {opcao.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {comCorAirForce && (
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-bold uppercase">
                        {tr(
                          s.language,
                          "Cor da Air Force",
                          "Air Force colour",
                          "Color de Air Force",
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {personalizacao.corAirForce ?? ""}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {CORES_AIR_FORCE.map((opcao) => {
                        const isActive = personalizacao.corAirForce === opcao.slug;
                        return (
                          <button
                            key={opcao.slug}
                            type="button"
                            onClick={() => {
                              setPersonalizacao((atual) => ({ ...atual, corAirForce: opcao.slug }));
                              setErroPersonalizacao(false);
                            }}
                            aria-pressed={isActive}
                            className={`border px-3.5 py-2 text-xs font-bold uppercase tracking-wide transition ${
                              isActive
                                ? "border-foreground bg-foreground text-background"
                                : "border-border text-foreground hover:border-foreground"
                            }`}
                          >
                            {opcao.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {erroPersonalizacao && (
                  <p role="alert" className="text-xs font-semibold text-destructive">
                    {comCorAirForce
                      ? tr(
                          s.language,
                          "Escolhe a cor da Air Force para personalizar a tua encomenda.",
                          "Choose the Air Force colour to customise your order.",
                          "Elige el color de Air Force para personalizar tu pedido.",
                        )
                      : comFio
                        ? tr(
                            s.language,
                            "Escolhe a corda e o fio para personalizar a tua encomenda.",
                            "Choose the rope and thread to customise your order.",
                            "Elige la cuerda y el hilo para personalizar tu pedido.",
                          )
                        : tr(
                            s.language,
                            "Escolhe a corda para personalizar a tua encomenda.",
                            "Choose the rope to customise your order.",
                            "Elige la cuerda para personalizar tu pedido.",
                          )}
                  </p>
                )}
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
                  {escaloesDisponiveis.length === 1 && activeEscalao ? (
                    <div className="flex h-12 items-center border border-border px-3 text-sm font-semibold uppercase">
                      {ESCALAO_ETIQUETA[activeEscalao][s.language]}
                      <span className="ml-1.5 text-muted-foreground">
                        · {ESCALAO_ETIQUETA[activeEscalao].nota}
                      </span>
                    </div>
                  ) : (
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
                  )}
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
                              <span>{size.label ?? size.size}</span>
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
              <>
                <p className="text-xs text-muted-foreground">
                  {tr(s.language, "Selecionado:", "Selected:", "Seleccionado:")}{" "}
                  <span className="font-semibold text-foreground">
                    {activeColor
                      ? `${colors.find((color) => color.slug === activeColor)?.name ?? activeColor} · `
                      : ""}
                    {activeCord
                      ? `${cords.find((cord) => cord.slug === activeCord)?.name ?? activeCord} · `
                      : ""}
                    {personalizavel && personalizacao.corda
                      ? `Corda: ${personalizacao.corda} · `
                      : ""}
                    {comFio && personalizacao.fio ? `Fio: ${personalizacao.fio} · ` : ""}
                    {comCorAirForce && personalizacao.corAirForce
                      ? `Cor: ${personalizacao.corAirForce} · `
                      : ""}
                    {activeEscalao ? `${ESCALAO_ETIQUETA[activeEscalao][s.language]} · ` : ""}
                    {selectedVariant.label ?? selectedVariant.size}
                  </span>
                  {" — "}
                  {selectedVariant.stock > 0
                    ? tr(s.language, "Em stock", "In stock", "En stock")
                    : t.soldOut}
                </p>
                {selectedVariant.note && (
                  <p
                    role="status"
                    className="mt-2 flex items-start gap-2 border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-900 dark:text-amber-200"
                  >
                    <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                    <span>{selectedVariant.note}</span>
                  </p>
                )}
              </>
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
              if (!personalizacaoCompleta(personalizacao, personalizavel, comFio, comCorAirForce)) {
                setErroPersonalizacao(true);
                return;
              }
              s.addToCart(
                p.id,
                selectedVariant.size,
                selectedVariant.color,
                selectedVariant.cord,
                personalizavel || comCorAirForce ? personalizacao : undefined,
              );
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
              <PackageCheck className="size-5 text-primary" />
              <span>
                {s.language === "pt"
                  ? "Escolha Uffa"
                  : s.language === "es"
                    ? "Selección Uffa"
                    : "Uffa selection"}
              </span>
            </div>
            <div className="flex gap-3 border border-border p-4">
              <Hand className="size-5 text-primary" />
              <span>{t.pickup}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
