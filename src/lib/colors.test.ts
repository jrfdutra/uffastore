import assert from "node:assert/strict";
import test from "node:test";
import { COLOR_FILTERS, matchesColorFilter, type ColorFilter } from "./colors.ts";
import type { Product } from "./shop-data.ts";

/** Produto mínimo: o filtro só lê `colors` e `sizes[].color`. */
function produto(cor: string, slug = cor.toLowerCase().replace(/\s+/g, "-")): Product {
  return {
    id: "teste",
    name: "Sapatilha de teste",
    category: "lifestyle",
    price: 100,
    image: "/produtos/uffa-modelo-padrao.webp",
    description: { pt: "", en: "", es: "" },
    colors: [{ name: cor, slug, images: [] }],
    sizes: [{ size: 40, stock: 1, price: 100, ...(slug ? { color: slug } : {}) }],
  };
}

function coresQueCorrespondem(cor: string): ColorFilter[] {
  return COLOR_FILTERS.filter((filtro) => matchesColorFilter(produto(cor), filtro));
}

test("o filtro cobre as cinco cores oferecidas na interface", () => {
  assert.deepEqual(COLOR_FILTERS, ["white", "black", "pink", "orange", "gray"]);
});

test("reconhece cores em português e inglês", () => {
  assert.deepEqual(coresQueCorrespondem("Preta"), ["black"]);
  assert.deepEqual(coresQueCorrespondem("All Black"), ["black"]);
  assert.deepEqual(coresQueCorrespondem("Branca"), ["white"]);
  assert.deepEqual(coresQueCorrespondem("Off White"), ["white"]);
  assert.deepEqual(coresQueCorrespondem("Rosa"), ["pink"]);
  assert.deepEqual(coresQueCorrespondem("Cinza Verde"), ["gray"]);
});

test("combinações respondem a todas as cores que contêm", () => {
  assert.deepEqual(coresQueCorrespondem("Branco e Laranja"), ["white", "orange"]);
  assert.deepEqual(coresQueCorrespondem("Preto e Branco"), ["white", "black"]);
  assert.deepEqual(coresQueCorrespondem("Bege e Rosa"), ["pink"]);
  assert.deepEqual(coresQueCorrespondem("BRANCA / AZUL BEBE"), ["white"]);
});

test("cores sem botão no filtro não aparecem em nenhum resultado", () => {
  assert.deepEqual(coresQueCorrespondem("Azul Bebê"), []);
  assert.deepEqual(coresQueCorrespondem("Bege/Cromado"), []);
});

test("aceita os slugs canónicos do catálogo consolidado", () => {
  for (const filtro of COLOR_FILTERS) {
    assert.equal(matchesColorFilter(produto(filtro, filtro), filtro), true);
  }
});
