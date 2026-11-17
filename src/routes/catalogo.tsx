import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, SlidersHorizontal, Check } from "lucide-react";
import { z } from "zod";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { categoryNames, copy, isProductInCategory, type Category } from "@/lib/shop-data";
import { useShop } from "@/lib/shop-context";
import { tr } from "@/lib/i18n";

const searchSchema = z.object({
  category: z.enum(["promocoes", "lifestyle", "running", "limited", "personalizacao"]).optional(),
});

const sizeGroups = [
  {
    name: { pt: "Criança (28–35)", en: "Kids (28–35)", es: "Niño (28–35)" },
    key: "crianca" as const,
    // Escala Criança da Nike (sem 29, 30.5, 32.5 nem 34.5).
    sizes: [28, 28.5, 29.5, 30, 31, 31.5, 32, 33, 33.5, 34, 35],
  },
  {
    name: { pt: "GS (36–39)", en: "GS (36–39)", es: "GS (36–39)" },
    key: "gs" as const,
    // Escala GS/Júnior da Nike (sem 37 nem 39.5).
    sizes: [36, 36.5, 37.5, 38, 38.5, 39],
  },
  {
    name: { pt: "Sénior (40–45)", en: "Senior (40–45)", es: "Sénior (40–45)" },
    key: "senior" as const,
    // Escala adulto da Nike (sem 41.5 nem 43.5).
    sizes: [40, 40.5, 41, 42, 42.5, 43, 44, 44.5, 45],
  },
];

const availableColors = [
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
        content:
          "Descobre sneakers verificados de promoções, lifestyle, running e edições limitadas.",
      },
      { property: "og:title", content: "Catálogo — Uffa Store" },
      { property: "og:description", content: "Sneakers verificados, selecionados no Porto." },
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

  const category: Category | "all" = search.category ?? "all";
  const setCategory = (c: Category | "all") => {
    navigate({
      search: (old) => ({ ...old, category: c === "all" ? undefined : c }),
      replace: true,
    });
  };

  const [query, setQuery] = useState("");
  const [selectedSizeGroup, setSelectedSizeGroup] = useState<"all" | "crianca" | "gs" | "senior">(
    "all",
  );
  const [size, setSize] = useState<number | "all">("all");
  const [selectedColor, setSelectedColor] = useState<string | "all">("all");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(250);

  const list = useMemo(
    () =>
      catalog.filter((p) => {
        if (p.status === "inactive") return false;
        if (!isProductInCategory(p, category)) return false;
        if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false;

        // Filtro de Preço
        if (p.price < minPrice || p.price > maxPrice) return false;

        // Filtro de Agrupamento de Escalão de Tamanho
        if (selectedSizeGroup !== "all") {
          const group = sizeGroups.find((g) => g.key === selectedSizeGroup);
          if (group && !p.sizes.some((s) => group.sizes.includes(s.size))) return false;
        }

        // Filtro de Tamanho Específico
        if (size !== "all" && !p.sizes.some((s) => s.size === size)) return false;

        // Filtro de Cor
        if (selectedColor !== "all") {
          const hasColorMatch =
            p.colors?.some((c) => c.slug === selectedColor) ||
            p.sizes.some((s) => s.color === selectedColor);
          if (!hasColorMatch) return false;
        }

        return true;
      }),
    [catalog, category, query, minPrice, maxPrice, selectedSizeGroup, size, selectedColor],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
      <p className="text-xs font-bold uppercase text-primary">
        {tr(language, "Seleção Uffa", "Uffa selection", "Selección Uffa")}
      </p>
      <h1 className="font-display text-6xl uppercase md:text-8xl">
        {language === "pt" ? "Catálogo" : language === "es" ? "Catálogo" : "Shop all"}
      </h1>

      <div className="mt-10 grid gap-8 lg:grid-cols-[250px_1fr]">
        <aside className="space-y-7">
          <div className="flex items-center gap-2 border-b border-foreground pb-3 font-bold uppercase">
            <SlidersHorizontal className="size-4" />
            {t.filters}
          </div>

          {/* Categorias de Sapatilhas */}
          <fieldset>
            <legend className="mb-3 text-xs font-bold uppercase">
              {tr(language, "Categoria", "Category", "Categoría")}
            </legend>
            <div className="flex flex-wrap gap-2 lg:flex-col">
              {(["all", "promocoes", "lifestyle", "running", "limited"] as const).map((c) => (
                <Button
                  key={c}
                  variant={category === c ? "default" : "outline"}
                  size="sm"
                  className="justify-start rounded-none"
                  aria-pressed={category === c}
                  onClick={() => setCategory(c)}
                >
                  {c === "all" ? t.all : categoryNames[c][language]}
                </Button>
              ))}
            </div>
          </fieldset>

          {/* Agrupamento de Tamanhos */}
          <fieldset>
            <legend className="mb-3 text-xs font-bold uppercase">
              {tr(language, "Escalão de Tamanho", "Size Category", "Categoría de Talla")}
            </legend>
            <div className="flex flex-wrap gap-2 lg:flex-col">
              <Button
                variant={selectedSizeGroup === "all" ? "default" : "outline"}
                size="sm"
                className="justify-start rounded-none text-xs"
                onClick={() => {
                  setSelectedSizeGroup("all");
                  setSize("all");
                }}
              >
                {t.all}
              </Button>
              {sizeGroups.map((group) => (
                <Button
                  key={group.key}
                  variant={selectedSizeGroup === group.key ? "default" : "outline"}
                  size="sm"
                  className="justify-start rounded-none text-xs"
                  onClick={() => {
                    setSelectedSizeGroup(group.key);
                    setSize("all");
                  }}
                >
                  {group.name[language]}
                </Button>
              ))}
            </div>

            {/* Tamanhos individuais dentro do agrupamento selecionado */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(selectedSizeGroup === "all"
                ? sizeGroups.flatMap((group) => group.sizes)
                : (sizeGroups.find((g) => g.key === selectedSizeGroup)?.sizes ?? [])
              ).map((v) => (
                <Button
                  key={v}
                  variant={size === v ? "default" : "outline"}
                  size="sm"
                  className="h-8 min-w-8 px-1.5 rounded-none text-xs font-semibold"
                  aria-pressed={size === v}
                  onClick={() => setSize(size === v ? "all" : v)}
                >
                  {v}
                </Button>
              ))}
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
                  max="250"
                  step="5"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="mt-1 w-full accent-primary"
                />
              </label>
            </div>
          </fieldset>
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
