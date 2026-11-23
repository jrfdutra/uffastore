import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, SlidersHorizontal, Check, ChevronDown } from "lucide-react";
import { z } from "zod";
import { useMemo, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/product-card";
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
  isProductInCategory,
  type Category,
  type Language,
} from "@/lib/shop-data";
import { matchesColorFilter, type ColorFilter } from "@/lib/colors";
import { isProductOnSale } from "@/lib/sale";
import {
  BRANDS,
  brandNames,
  compareRopeLacesFirst,
  isProductInBrand,
  matchesModel,
  type Brand,
} from "@/lib/brands";
import { isProductInModel, modelsForBrand } from "@/lib/models";
import { useShop } from "@/lib/shop-context";
import { tr } from "@/lib/i18n";
import { escalaoPorTamanho, type Escalao } from "@/lib/precos";
import { ORDEM_ESCALOES } from "@/lib/variantes";

const searchSchema = z.object({
  // Marcas são o filtro principal. "category" mantém-se apenas para links
  // antigos e para a campanha Black Friday.
  brand: z.enum(BRANDS).optional(),
  /** Modelo dentro da marca (air-force, dunk, vomero-5, campus-00, ...). */
  model: z.string().optional(),
  q: z.string().optional(),
  category: z
    .enum(["promocoes", "lifestyle", "running", "limited", "personalizacao", "blackfriday"])
    .optional(),
});

const groupNames: Record<Escalao, { pt: string; en: string; es: string }> = {
  crianca: { pt: "Criança", en: "Kids", es: "Niño" },
  gs: { pt: "GS", en: "GS", es: "GS" },
  senior: { pt: "Sénior", en: "Senior", es: "Sénior" },
};

/** Grelha de tamanhos a mostrar no filtro, derivada do catálogo real. */
type SizeGroup = {
  key: Escalao;
  name: { pt: string; en: string; es: string };
  options: { value: number; label: string }[];
};

function buildSizeGroups(catalog: { sizes: { size: number; label?: string }[] }[]): SizeGroup[] {
  const byEscalao = new Map<Escalao, Map<number, string>>();
  for (const product of catalog) {
    for (const item of product.sizes) {
      if (item.size <= 0) continue;
      const escalao = escalaoPorTamanho(item.size);
      const bucket = byEscalao.get(escalao) ?? new Map<number, string>();
      if (!bucket.has(item.size)) bucket.set(item.size, item.label ?? String(item.size));
      byEscalao.set(escalao, bucket);
    }
  }

  return ORDEM_ESCALOES.filter((escalao) => byEscalao.has(escalao)).map((escalao) => {
    const bucket = byEscalao.get(escalao)!;
    const options = [...bucket.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([value, label]) => ({ value, label }));
    const first = options[0];
    const last = options[options.length - 1];
    const range = first && last ? `${first.label}–${last.label}` : "";
    return {
      key: escalao,
      name: {
        pt: `${groupNames[escalao].pt} (${range})`,
        en: `${groupNames[escalao].en} (${range})`,
        es: `${groupNames[escalao].es} (${range})`,
      },
      options,
    };
  });
}

const availableColors: {
  slug: ColorFilter;
  name: Record<Language, string>;
  colorClass: string;
}[] = [
  {
    slug: "white",
    name: { pt: "Branco", en: "White", es: "Blanco" },
    colorClass: "bg-white border-black",
  },
  { slug: "black", name: { pt: "Preto", en: "Black", es: "Negro" }, colorClass: "bg-black" },
  { slug: "pink", name: { pt: "Rosa", en: "Pink", es: "Rosa" }, colorClass: "bg-pink-400" },
  {
    slug: "orange",
    name: { pt: "Laranja", en: "Orange", es: "Naranja" },
    colorClass: "bg-orange-500",
  },
  { slug: "gray", name: { pt: "Cinzento", en: "Gray", es: "Gris" }, colorClass: "bg-gray-400" },
];

export const Route = createFileRoute("/catalogo")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Catálogo — Uffa Store" },
      {
        name: "description",
        content: "Descobre sneakers Adidas, Nike, Puma, New Balance e Vans, selecionados no Porto.",
      },
      { property: "og:title", content: "Catálogo — Uffa Store" },
      { property: "og:description", content: "Sneakers selecionados no Porto." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/catalogo" }],
  }),
  component: Catalog,
});

function Catalog() {
  const { language, catalog } = useShop(),
    t = copy[language],
    navigate = Route.useNavigate(),
    search = Route.useSearch();

  // Filtro principal por marca; a categoria só sobrevive em links antigos e
  // no interruptor da campanha Black Friday.
  const brand: Brand | "all" = search.brand ?? "all";
  const setBrand = (value: Brand | "all") => {
    navigate({
      search: (old) => ({
        ...old,
        brand: value === "all" ? undefined : value,
        // O modelo é específico de cada marca: ao trocar de marca, voltamos
        // a mostrar todos os modelos da nova marca.
        model: undefined,
      }),
      replace: true,
    });
  };

  const model: string | "all" = search.model ?? "all";
  const setModel = (value: string | "all") => {
    navigate({
      search: (old) => ({ ...old, model: value === "all" ? undefined : value }),
      replace: true,
    });
  };

  const category: Category | "all" =
    search.category === "promocoes" ? "blackfriday" : (search.category ?? "all");
  const isBlackFriday = category === "blackfriday";
  const setCategory = (c: Category | "all") => {
    navigate({
      search: (old) => ({ ...old, category: c === "all" ? undefined : c }),
      replace: true,
    });
  };

  const [query, setQuery] = useState(search.q ?? "");
  useEffect(() => {
    setQuery(search.q ?? "");
  }, [search.q]);
  const [selectedSizeGroup, setSelectedSizeGroup] = useState<"all" | "crianca" | "gs" | "senior">(
    "all",
  );
  const [size, setSize] = useState<number | "all">("all");
  const [selectedColor, setSelectedColor] = useState<ColorFilter | "all">("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // A numeração é específica de cada marca (a Adidas usa ⅓/⅔, a Nike termina
  // em .5), por isso a lista de tamanhos tem de vir dos produtos da marca ativa.
  const brandCatalog = useMemo(
    () => catalog.filter((p) => p.status !== "inactive" && isProductInBrand(p, brand)),
    [catalog, brand],
  );
  const sizeGroups = useMemo(() => buildSizeGroups(brandCatalog), [brandCatalog]);

  // Subcategorias de modelo dentro da marca (Air Force, Dunk, Vomero 5, ...).
  const modelOptions = useMemo(() => modelsForBrand(catalog, brand), [catalog, brand]);

  // Se o modelo deixar de existir (troca de marca ou alteração do catálogo),
  // removemos o filtro para não ficar uma página vazia sem explicação.
  useEffect(() => {
    if (model !== "all" && !modelOptions.some((option) => option.id === model)) {
      navigate({ search: (old) => ({ ...old, model: undefined }), replace: true });
    }
  }, [brand, model, modelOptions, navigate]);

  // Ao trocar de marca ou campanha, limpa a seleção para não ficar um tamanho
  // que já não existe no novo contexto.
  useEffect(() => {
    setSize("all");
    setSelectedSizeGroup("all");
  }, [brand, category]);
  const [minPrice, setMinPrice] = useState(0);
  // Teto do filtro de preço: acompanha o produto mais caro (ex.: Jordan 699,99 €)
  // para que nenhum produto fique escondido por defeito.
  const priceCeiling = useMemo(
    () => Math.max(250, Math.ceil(Math.max(0, ...catalog.map((p) => p.price)) / 10) * 10),
    [catalog],
  );
  const [maxPrice, setMaxPrice] = useState(priceCeiling);
  useEffect(() => {
    setMaxPrice(priceCeiling);
  }, [priceCeiling]);

  const list = useMemo(
    () =>
      catalog
        .filter((p) => {
          if (p.status === "inactive") return false;
          if (!isProductInBrand(p, brand)) return false;
          if (!isProductInModel(p, model)) return false;
          // A campanha Black Friday inclui também tudo o que tem desconto,
          // mesmo quando a Shopify não marcou a categoria promocional.
          if (category !== "all" && !isProductInCategory(p, category)) {
            if (!(category === "blackfriday" && isProductOnSale(p))) return false;
          }
          if (!matchesModel(p, query)) return false;

          // Filtro de Preço
          if (p.price < minPrice || p.price > maxPrice) return false;

          // Filtro de Agrupamento de Escalão de Tamanho
          if (selectedSizeGroup !== "all") {
            const group = sizeGroups.find((g) => g.key === selectedSizeGroup);
            if (group && !p.sizes.some((s) => group.options.some((o) => o.value === s.size)))
              return false;
          }

          // Filtro de Tamanho Específico
          if (size !== "all" && !p.sizes.some((s) => s.size === size)) return false;

          // Filtro de Cor: a Shopify guarda nomes como "Preta" ou "Branco e
          // Laranja", por isso comparamos termos e não slugs exatos.
          if (selectedColor !== "all" && !matchesColorFilter(p, selectedColor)) return false;

          return true;
        })
        // Rope laces primeiro, em qualquer filtro ou pesquisa.
        .sort(compareRopeLacesFirst),
    [
      catalog,
      brand,
      model,
      category,
      query,
      minPrice,
      maxPrice,
      selectedSizeGroup,
      sizeGroups,
      size,
      selectedColor,
    ],
  );

  const activeFilterCount = [
    brand !== "all",
    model !== "all",
    isBlackFriday,
    query.trim().length > 0,
    maxPrice < priceCeiling,
    selectedSizeGroup !== "all",
    size !== "all",
    selectedColor !== "all",
  ].filter(Boolean).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
      <p className="text-xs font-bold uppercase text-primary">
        {tr(language, "Seleção Uffa", "Uffa selection", "Selección Uffa")}
      </p>
      <h1 className="font-display text-6xl uppercase md:text-8xl">
        {language === "pt" ? "Catálogo" : language === "es" ? "Catálogo" : "Shop all"}
      </h1>

      <div className={`mt-10 grid gap-8 ${filtersOpen ? "lg:grid-cols-[250px_1fr]" : ""}`}>
        <aside className={filtersOpen ? "space-y-7" : "lg:justify-self-start"}>
          <button
            type="button"
            onClick={() => setFiltersOpen((value) => !value)}
            aria-expanded={filtersOpen}
            aria-controls="catalogo-filtros"
            aria-label={tr(
              language,
              filtersOpen ? "Ocultar filtros" : "Mostrar filtros",
              filtersOpen ? "Hide filters" : "Show filters",
              filtersOpen ? "Ocultar filtros" : "Mostrar filtros",
            )}
            className="flex w-full items-center gap-2 border-b border-foreground pb-3 font-bold uppercase lg:w-auto"
          >
            <SlidersHorizontal className="size-4" />
            {t.filters}
            {activeFilterCount > 0 && (
              <span className="grid size-5 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown
              aria-hidden="true"
              className={`ml-auto size-4 transition-transform lg:ml-1 ${filtersOpen ? "rotate-180" : ""}`}
            />
          </button>

          <div id="catalogo-filtros" className={filtersOpen ? "space-y-7" : "hidden"}>
            {/* Marcas */}
            <fieldset>
              <legend className="mb-3 text-xs font-bold uppercase">
                {tr(language, "Marca", "Brand", "Marca")}
              </legend>
              <div className="flex flex-wrap gap-2 lg:flex-col">
                {(["all", ...BRANDS] as const).map((value) => (
                  <Button
                    key={value}
                    variant={brand === value ? "default" : "outline"}
                    size="sm"
                    className="justify-start rounded-none"
                    aria-pressed={brand === value}
                    onClick={() => setBrand(value)}
                  >
                    {value === "all" ? t.all : brandNames[value][language]}
                  </Button>
                ))}
              </div>
            </fieldset>

            {/* Modelos dentro da marca selecionada */}
            {brand !== "all" && (
              <fieldset>
                <legend className="mb-3 text-xs font-bold uppercase">
                  {tr(language, "Modelo", "Model", "Modelo")}
                </legend>
                <div className="flex flex-wrap gap-2 lg:flex-col">
                  <Button
                    variant={model === "all" ? "default" : "outline"}
                    size="sm"
                    className="justify-start rounded-none"
                    aria-pressed={model === "all"}
                    onClick={() => setModel("all")}
                  >
                    {t.all}
                  </Button>
                  {modelOptions.map((option) => (
                    <Button
                      key={option.id}
                      variant={model === option.id ? "default" : "outline"}
                      size="sm"
                      className="justify-start rounded-none"
                      aria-pressed={model === option.id}
                      onClick={() => setModel(model === option.id ? "all" : option.id)}
                    >
                      {option.label}{" "}
                      <span className="ml-1 text-[10px] opacity-60">({option.count})</span>
                    </Button>
                  ))}
                </div>
              </fieldset>
            )}

            {/* Campanha: filtro transversal às marcas */}
            <fieldset>
              <legend className="mb-3 text-xs font-bold uppercase">
                {tr(language, "Campanha", "Campaign", "Campaña")}
              </legend>
              <Button
                variant={isBlackFriday ? "default" : "outline"}
                size="sm"
                className="w-full justify-start rounded-none"
                aria-pressed={isBlackFriday}
                onClick={() => setCategory(isBlackFriday ? "all" : "blackfriday")}
              >
                {categoryNames.blackfriday[language]}
              </Button>
            </fieldset>

            {/* Agrupamento de Tamanhos */}
            <fieldset>
              <legend className="mb-3 text-xs font-bold uppercase">
                {tr(language, "Escalão de Tamanho", "Size Category", "Categoría de Talla")}
              </legend>
              <div className="flex flex-wrap gap-2 lg:flex-col">
                {sizeGroups.map((group) => (
                  <Button
                    key={group.key}
                    variant={selectedSizeGroup === group.key ? "default" : "outline"}
                    size="sm"
                    className="justify-start rounded-none text-xs"
                    aria-pressed={selectedSizeGroup === group.key}
                    onClick={() => {
                      // Clicar no escalão ativo volta a todos os tamanhos, sem
                      // precisar de um botão "Todos" (que gerava confusão).
                      setSelectedSizeGroup(selectedSizeGroup === group.key ? "all" : group.key);
                      setSize("all");
                    }}
                  >
                    {group.name[language]}
                  </Button>
                ))}
              </div>

              {/* Tamanho específico numa lista dropdown */}
              <div className="mt-3">
                <Select
                  value={size === "all" ? "all" : String(size)}
                  onValueChange={(value) => setSize(value === "all" ? "all" : Number(value))}
                >
                  <SelectTrigger
                    className="h-9 w-full rounded-none border-border px-3 text-xs font-semibold"
                    aria-label={tr(language, "Tamanho", "Size", "Talla")}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="all" className="rounded-none py-2 text-xs">
                      {tr(language, "Todos os tamanhos", "All sizes", "Todas las tallas")}
                    </SelectItem>
                    {(selectedSizeGroup === "all"
                      ? sizeGroups.flatMap((group) => group.options)
                      : (sizeGroups.find((g) => g.key === selectedSizeGroup)?.options ?? [])
                    ).map((option) => (
                      <SelectItem
                        key={option.value}
                        value={String(option.value)}
                        className="rounded-none py-2 text-xs"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </fieldset>

            {/* Filtro de Cores */}
            <fieldset>
              <legend className="mb-3 text-xs font-bold uppercase">
                {tr(language, "Cor", "Color", "Color")}
              </legend>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedColor === "all" ? "default" : "outline"}
                  size="sm"
                  className="h-8 rounded-none text-xs"
                  onClick={() => setSelectedColor("all")}
                >
                  {t.all}
                </Button>
                {availableColors.map((col) => (
                  <button
                    key={col.slug}
                    type="button"
                    title={col.name[language]}
                    onClick={() => setSelectedColor(selectedColor === col.slug ? "all" : col.slug)}
                    className={`relative flex size-8 items-center justify-center border transition-all ${col.colorClass} ${
                      selectedColor === col.slug
                        ? "ring-2 ring-primary ring-offset-2"
                        : "border-border"
                    }`}
                  >
                    {selectedColor === col.slug && (
                      <Check
                        className={`size-4 ${col.slug === "white" ? "text-black" : "text-white"}`}
                      />
                    )}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Filtro de Preço */}
            <fieldset className="space-y-3">
              <legend className="text-xs font-bold uppercase">{t.price}</legend>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>{minPrice} €</span>
                <span>{maxPrice} €</span>
              </div>
              <div className="space-y-2">
                <label className="block text-[11px] text-muted-foreground uppercase">
                  {tr(language, "Preço máximo:", "Max price:", "Precio máximo:")} {maxPrice} €
                  <input
                    type="range"
                    min="0"
                    max={priceCeiling}
                    step="5"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="mt-1 w-full accent-primary"
                  />
                </label>
              </div>
            </fieldset>
          </div>
        </aside>

        <div>
          {category !== "personalizacao" && (
            <div className="relative mb-8">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.search}
                aria-label={t.search}
                className="h-12 rounded-none pl-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {list.length} {t.results}
              </span>
            </div>
          )}

          {category === "personalizacao" ? (
            <div className="py-24 text-center border border-dashed border-border bg-card/50 p-8">
              <span className="inline-block px-3 py-1 mb-4 text-xs font-bold uppercase tracking-widest bg-primary/10 text-primary rounded-full">
                {tr(language, "Em Desenvolvimento", "Under Construction", "En Construcción")}
              </span>
              <h2 className="font-display text-4xl uppercase md:text-5xl mb-3">
                {tr(
                  language,
                  "Serviço de Personalização",
                  "Customization Service",
                  "Servicio de Personalización",
                )}
              </h2>
              <p className="max-w-md mx-auto text-muted-foreground text-sm leading-relaxed mb-8">
                {tr(
                  language,
                  "Estamos a preparar uma experiência exclusiva para personalizares os teus pares com Rope Laces, pendentes, pérolas e chapas à medida. Brevemente disponível!",
                  "We are preparing an exclusive experience for you to customize your pairs with rope laces, charms, pearls, and custom tags. Coming soon!",
                  "Estamos preparando una experiencia exclusiva para personalizar tus pares con cordones especiales, dijes, perlas y chapas a medida. ¡Próximamente disponible!",
                )}
              </p>
              <Button asChild className="rounded-none font-bold uppercase tracking-wider">
                <Link to="/catalogo" search={{}}>
                  {tr(language, "Explorar Catálogo", "Explore Catalog", "Explorar Catálogo")}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-10 xl:grid-cols-3">
              {list.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {category !== "personalizacao" && !list.length && (
            <p className="py-20 text-center text-muted-foreground">
              {tr(
                language,
                "Sem produtos encontrados.",
                "No products found.",
                "No se encontraron productos.",
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
