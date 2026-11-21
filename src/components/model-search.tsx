import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { brandLabel, getProductBrand, searchModels } from "@/lib/brands";
import { tr } from "@/lib/i18n";
import { money, type Language, type Product } from "@/lib/shop-data";

const suggestions = ["Air Force", "Dunk", "Jordan", "Campus", "Knu Skool"];

/**
 * Pesquisa de modelos na página inicial. Trabalha sobre o catálogo real da
 * Shopify (o mesmo contexto usado pelo resto da loja), sem pedidos extra.
 */
export function ModelSearch({ catalog, language }: { catalog: Product[]; language: Language }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchModels(catalog, query).slice(0, 8), [catalog, query]);

  return (
    <section className="border-b border-border bg-section" id="pesquisa">
      <div className="mx-auto max-w-7xl px-4 py-16 md:py-20 md:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase text-primary">
              {tr(language, "Pesquisa de modelos", "Model search", "Búsqueda de modelos")}
            </p>
            <h2 className="mt-2 font-display text-5xl uppercase md:text-7xl">
              {tr(language, "Encontra o teu par", "Find your pair", "Encuentra tu par")}
            </h2>
          </div>
          <p className="max-w-xs text-sm text-muted-foreground">
            {tr(
              language,
              "Escreve o nome do modelo, a marca ou a cor. Ex.: Nike Dunk, Jordan 1, Campus.",
              "Type the model, brand or colour. Ex.: Nike Dunk, Jordan 1, Campus.",
              "Escribe el modelo, la marca o el color. Ej.: Nike Dunk, Jordan 1, Campus.",
            )}
          </p>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={tr(language, "Pesquisar modelos…", "Search models…", "Buscar modelos…")}
            aria-label={tr(language, "Pesquisar modelos", "Search models", "Buscar modelos")}
            className="h-14 rounded-none border-2 pl-12 pr-12 text-base"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={tr(language, "Limpar pesquisa", "Clear search", "Borrar búsqueda")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {tr(language, "Sugestões", "Suggestions", "Sugerencias")}:
          </span>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setQuery(suggestion)}
              className="border border-border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition hover:border-primary hover:text-primary"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {query.trim() && (
          <div className="mt-10">
            <div className="mb-5 flex items-center justify-between gap-4">
              <p className="text-sm font-bold uppercase tracking-wide">
                {results.length}{" "}
                {tr(
                  language,
                  results.length === 1 ? "modelo encontrado" : "modelos encontrados",
                  results.length === 1 ? "model found" : "models found",
                  results.length === 1 ? "modelo encontrado" : "modelos encontrados",
                )}
              </p>
              <Button asChild variant="link" className="px-0">
                <Link to="/catalogo" search={{ q: query }}>
                  {tr(language, "Ver no catálogo", "View in catalog", "Ver en el catálogo")}
                  <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
            </div>

            {results.length ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {results.map((product) => {
                  const brand = getProductBrand(product);
                  return (
                    <Link
                      key={product.id}
                      to="/produto/$productId"
                      params={{ productId: product.id }}
                      className="group flex gap-3 border border-border bg-background p-2 transition hover:border-primary"
                    >
                      <img
                        src={product.image}
                        alt=""
                        width={1664}
                        height={2080}
                        loading="lazy"
                        className="size-20 shrink-0 bg-product object-cover"
                      />
                      <div className="min-w-0 self-center">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-primary">
                          {brand ? brandLabel(brand, language) : "UFFA"}
                        </p>
                        <p className="line-clamp-2 text-xs font-bold leading-tight group-hover:text-primary">
                          {product.name}
                        </p>
                        <p className="mt-1 text-xs font-semibold">{money(product.price)}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
                {tr(
                  language,
                  "Sem modelos para esta pesquisa. Experimenta outro nome ou marca.",
                  "No models for this search. Try another name or brand.",
                  "Sin modelos para esta búsqueda. Prueba otro nombre o marca.",
                )}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
