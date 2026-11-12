import assert from "node:assert/strict";
import test from "node:test";
import { consolidatedProducts } from "./consolidated-catalog.ts";
import { escalaoPorTamanho } from "./precos.ts";

const porHandle = (handle: string) => {
  const produto = consolidatedProducts.find((item) => item.handle === handle);
  assert.ok(produto, `Produto ${handle} não existe`);
  return produto;
};

test("Existem exatamente seis produtos no catálogo consolidado", () => {
  assert.equal(consolidatedProducts.length, 6);
  const handles = consolidatedProducts.map((item) => item.handle);
  assert.equal(new Set(handles).size, handles.length, "Handles duplicados");
});

test("Nike Dunk w/ Rope Laces: cores White, Black e Pink", () => {
  const produto = porHandle("nike-dunk-w-rope-laces");
  assert.deepEqual(
    produto.colors.map((cor) => cor.colorName),
    ["White", "Black", "Pink"],
  );
  assert.equal(produto.sizes.length, 30);
});

test("Air Force Lanvin W não inventa cores", () => {
  const produto = porHandle("air-force-lanvin-w");
  assert.equal(produto.colors.length, 0);
  assert.equal(produto.sizes.length, 10);
  assert.ok(produto.sizes.every((variante) => variante.color === undefined));
});

test("Floral Air Force w/ Rope Laces: cores Pink e Orange", () => {
  const produto = porHandle("air-force-floral-w-rope-laces");
  assert.deepEqual(
    produto.colors.map((cor) => cor.colorName),
    ["Pink", "Orange"],
  );
  assert.equal(produto.sizes.length, 20);
});

test("Floral Black é um produto independente com cor Black", () => {
  const produto = porHandle("floral-black");
  assert.deepEqual(
    produto.colors.map((cor) => cor.colorName),
    ["Black"],
  );
  assert.equal(produto.sizes.length, 10);
});

test("Air Force Criança: White e Black, tamanhos 28 a 35, 129,99 €", () => {
  const produto = porHandle("air-force-crianca");
  assert.deepEqual(
    produto.colors.map((cor) => cor.colorName),
    ["White", "Black"],
  );
  const tamanhos = [...new Set(produto.sizes.map((variante) => variante.size))].sort(
    (a, b) => a - b,
  );
  assert.deepEqual(tamanhos, [28, 29, 30, 31, 32, 33, 34, 35]);
  assert.ok(produto.sizes.every((variante) => variante.price === 129.99));
  assert.equal(produto.sizes.length, 16);
});

test("Air Force w/ Rope Laces: cores Gray, Pink e Black", () => {
  const produto = porHandle("air-force-w-rope-laces");
  assert.deepEqual(
    produto.colors.map((cor) => cor.colorName),
    ["Gray", "Pink", "Black"],
  );
  assert.equal(produto.sizes.length, 30);
});

test("Cada variante tem 5 unidades de stock inicial", () => {
  for (const produto of consolidatedProducts) {
    for (const variante of produto.sizes) {
      assert.equal(variante.stock, 5, `${produto.handle} / ${variante.size}`);
    }
  }
});

test("Não existem variantes duplicadas de cor + tamanho", () => {
  for (const produto of consolidatedProducts) {
    const chaves = produto.sizes.map((variante) => `${variante.color ?? "-"}-${variante.size}`);
    assert.equal(new Set(chaves).size, chaves.length, `${produto.handle} tem duplicados`);
  }
});

test("O preço de cada variante corresponde ao escalão do tamanho", () => {
  const esperados: Record<string, Record<string, number>> = {
    "nike-dunk-w-rope-laces": { gs: 149.99, senior: 164.99 },
    "air-force-lanvin-w": { gs: 179.99, senior: 189.99 },
    "air-force-floral-w-rope-laces": { gs: 179.99, senior: 189.99 },
    "floral-black": { gs: 179.99, senior: 189.99 },
    "air-force-crianca": { crianca: 129.99 },
    "air-force-w-rope-laces": { gs: 149.99, senior: 164.99 },
  };

  for (const produto of consolidatedProducts) {
    const tabela = esperados[produto.handle];
    assert.ok(tabela, `Sem tabela de preços para ${produto.handle}`);
    for (const variante of produto.sizes) {
      const escalao = escalaoPorTamanho(variante.size);
      assert.equal(
        variante.price,
        tabela[escalao],
        `${produto.handle} / tamanho ${variante.size} (${escalao})`,
      );
    }
  }
});

test("Todos os produtos usam a fotografia padrão fornecida", () => {
  for (const produto of consolidatedProducts) {
    for (const cor of produto.colors) {
      assert.deepEqual(cor.images, ["/produtos/uffa-modelo-padrao.webp"]);
    }
  }
});
