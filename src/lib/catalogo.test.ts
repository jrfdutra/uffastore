import assert from "node:assert/strict";
import test from "node:test";
import { consolidatedProducts } from "./consolidated-catalog.ts";
import { escalaoPorTamanho } from "./precos.ts";

const porHandle = (handle: string) => {
  const produto = consolidatedProducts.find((item) => item.handle === handle);
  assert.ok(produto, `Produto ${handle} não existe`);
  return produto;
};

test("Existem onze produtos no catálogo consolidado", () => {
  assert.equal(consolidatedProducts.length, 11);
  const handles = consolidatedProducts.map((item) => item.handle);
  assert.equal(new Set(handles).size, handles.length, "Handles duplicados");
});

test("Cada modelo é vendido em dois anúncios: GS e Sénior", () => {
  for (const base of [
    "air-force-floral-w-rope-laces",
    "nike-dunk-w-rope-laces",
    "air-force-lanvin-w",
    "floral-black",
    "air-force-w-rope-laces",
  ]) {
    assert.ok(porHandle(`${base}-gs`), `${base}-gs`);
    assert.ok(porHandle(`${base}-senior`), `${base}-senior`);
  }
});

test("Nike Dunk w/ Rope Laces: cores White, Black e Pink", () => {
  const gs = porHandle("nike-dunk-w-rope-laces-gs");
  assert.deepEqual(
    gs.colors.map((cor) => cor.colorName),
    ["White", "Black", "Pink"],
  );
  assert.equal(gs.sizes.length, 12);

  const senior = porHandle("nike-dunk-w-rope-laces-senior");
  assert.equal(senior.sizes.length, 18);
});

test("Air Force Lanvin W não inventa cores", () => {
  const gs = porHandle("air-force-lanvin-w-gs");
  assert.equal(gs.colors.length, 0);
  assert.equal(gs.sizes.length, 4);
  assert.ok(gs.sizes.every((variante) => variante.color === undefined));

  const senior = porHandle("air-force-lanvin-w-senior");
  assert.equal(senior.sizes.length, 6);
});

test("Floral Air Force w/ Rope Laces: cores Pink e Orange", () => {
  for (const handle of [
    "air-force-floral-w-rope-laces-gs",
    "air-force-floral-w-rope-laces-senior",
  ]) {
    const produto = porHandle(handle);
    assert.deepEqual(
      produto.colors.map((cor) => cor.colorName),
      ["Pink", "Orange"],
    );
  }
  assert.equal(porHandle("air-force-floral-w-rope-laces-gs").sizes.length, 8);
  assert.equal(porHandle("air-force-floral-w-rope-laces-senior").sizes.length, 12);
});

test("Floral Black é um produto independente com cor Black", () => {
  for (const handle of ["floral-black-gs", "floral-black-senior"]) {
    const produto = porHandle(handle);
    assert.deepEqual(
      produto.colors.map((cor) => cor.colorName),
      ["Black"],
    );
  }
  assert.equal(porHandle("floral-black-gs").sizes.length, 4);
  assert.equal(porHandle("floral-black-senior").sizes.length, 6);
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
  const gs = porHandle("air-force-w-rope-laces-gs");
  assert.deepEqual(
    gs.colors.map((cor) => cor.colorName),
    ["Gray", "Pink", "Black"],
  );
  assert.equal(gs.sizes.length, 12);
  assert.equal(porHandle("air-force-w-rope-laces-senior").sizes.length, 18);
});

test("Cada produto só tem tamanhos do seu escalão", () => {
  for (const produto of consolidatedProducts) {
    if (produto.handle.endsWith("-gs")) {
      assert.ok(
        produto.sizes.every((variante) => variante.size >= 36 && variante.size <= 39),
        `${produto.handle} tem tamanhos fora do GS`,
      );
    }
    if (produto.handle.endsWith("-senior")) {
      assert.ok(
        produto.sizes.every((variante) => variante.size >= 40),
        `${produto.handle} tem tamanhos fora do Sénior`,
      );
    }
  }
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
    "nike-dunk-rope": { gs: 149.99, senior: 164.99 },
    "air-force-lanvin": { gs: 179.99, senior: 189.99 },
    "air-force-floral-rope": { gs: 179.99, senior: 189.99 },
    "floral-black": { gs: 179.99, senior: 189.99 },
    "air-force-crianca": { crianca: 129.99 },
    "air-force-rope": { gs: 149.99, senior: 164.99 },
  };

  for (const produto of consolidatedProducts) {
    const tabela = esperados[produto.modeloId];
    assert.ok(tabela, `Sem tabela de preços para ${produto.modeloId}`);
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
