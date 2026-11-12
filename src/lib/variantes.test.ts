import assert from "node:assert/strict";
import test from "node:test";
import { consolidatedProducts } from "./consolidated-catalog.ts";
import {
  escaloesDisponiveis,
  precoApresentado,
  tamanhosDoEscalao,
  varianteSelecionavel,
  variantesPorCor,
} from "./variantes.ts";

const produto = (handle: string) => {
  const item = consolidatedProducts.find((p) => p.handle === handle);
  assert.ok(item, `Produto ${handle} não existe`);
  return item;
};

test("Cada cor tem apenas as variantes dessa cor", () => {
  const dunk = produto("nike-dunk-w-rope-laces");
  for (const cor of dunk.colors) {
    const variantes = variantesPorCor(dunk.sizes, cor.colorSlug);
    assert.equal(variantes.length, 10, `cor ${cor.colorSlug}`);
    assert.ok(variantes.every((variante) => variante.color === cor.colorSlug));
  }
});

test("Modelos de cor única devolvem todas as variantes", () => {
  const lanvin = produto("air-force-lanvin-w");
  assert.equal(variantesPorCor(lanvin.sizes, undefined).length, 10);
});

test("Escalões apresentados por produto", () => {
  assert.deepEqual(escaloesDisponiveis(produto("nike-dunk-w-rope-laces").sizes), ["gs", "senior"]);
  assert.deepEqual(escaloesDisponiveis(produto("air-force-lanvin-w").sizes), ["gs", "senior"]);
  assert.deepEqual(escaloesDisponiveis(produto("air-force-crianca").sizes), ["crianca"]);
  assert.deepEqual(escaloesDisponiveis(produto("floral-black").sizes), ["gs", "senior"]);
});

test("Tamanhos por escalão", () => {
  const crianca = produto("air-force-crianca");
  assert.deepEqual(
    tamanhosDoEscalao(variantesPorCor(crianca.sizes, "white"), "crianca").map(
      (variante) => variante.size,
    ),
    [28, 29, 30, 31, 32, 33, 34, 35],
  );

  const dunk = produto("nike-dunk-w-rope-laces");
  assert.deepEqual(
    tamanhosDoEscalao(variantesPorCor(dunk.sizes, "white"), "gs").map((variante) => variante.size),
    [36, 37, 38, 39],
  );
  assert.deepEqual(
    tamanhosDoEscalao(variantesPorCor(dunk.sizes, "white"), "senior").map(
      (variante) => variante.size,
    ),
    [40, 41, 42, 43, 44, 45],
  );
});

test("O preço acompanha o escalão selecionado (Dunk)", () => {
  const dunk = produto("nike-dunk-w-rope-laces");
  const gs = tamanhosDoEscalao(variantesPorCor(dunk.sizes, "white"), "gs");
  const senior = tamanhosDoEscalao(variantesPorCor(dunk.sizes, "white"), "senior");
  assert.ok(gs.every((variante) => variante.price === 149.99));
  assert.ok(senior.every((variante) => variante.price === 164.99));
});

test("O preço acompanha o escalão selecionado (Criança)", () => {
  const crianca = produto("air-force-crianca");
  const variantes = tamanhosDoEscalao(variantesPorCor(crianca.sizes, "black"), "crianca");
  assert.equal(variantes.length, 8);
  assert.ok(variantes.every((variante) => variante.price === 129.99));
});

test("A variante escolhida devolve o preço correto em todas as cores", () => {
  for (const handle of [
    "nike-dunk-w-rope-laces",
    "air-force-floral-w-rope-laces",
    "air-force-crianca",
    "air-force-w-rope-laces",
  ]) {
    const item = produto(handle);
    for (const cor of item.colors) {
      // Usa o primeiro escalão e tamanho reais deste produto (a criança não tem GS).
      const variantesDaCor = variantesPorCor(item.sizes, cor.colorSlug);
      const escalao = escaloesDisponiveis(variantesDaCor)[0];
      assert.ok(escalao, `${handle} / ${cor.colorSlug} sem escalão`);
      const tamanho = tamanhosDoEscalao(variantesDaCor, escalao)[0]?.size;
      assert.ok(tamanho, `${handle} / ${cor.colorSlug} sem tamanho`);

      const variante = varianteSelecionavel(item.sizes, cor.colorSlug, escalao, tamanho);
      assert.ok(variante, `${handle} / ${cor.colorSlug} / ${tamanho}`);
      assert.equal(variante.color, cor.colorSlug);
      assert.equal(variante.stock, 5);
      assert.ok(variante.price && variante.price > 0);
    }
  }
});

test("Uma variante sem stock não é selecionável", () => {
  const dunk = produto("nike-dunk-w-rope-laces");
  const semStock = dunk.sizes.map((variante) =>
    variante.size === 38 && variante.color === "white" ? { ...variante, stock: 0 } : variante,
  );
  assert.equal(varianteSelecionavel(semStock, "white", "gs", 38), undefined);
  assert.ok(varianteSelecionavel(semStock, "white", "gs", 37));
});

test("O preço mínimo apresentado por cor está correto", () => {
  const floral = produto("air-force-floral-w-rope-laces");
  assert.equal(precoApresentado(floral.sizes, "pink", 0), 179.99);
  assert.equal(precoApresentado(floral.sizes, "orange", 0), 179.99);

  const dunk = produto("nike-dunk-w-rope-laces");
  assert.equal(precoApresentado(dunk.sizes, "black", 0), 149.99);

  const crianca = produto("air-force-crianca");
  assert.equal(precoApresentado(crianca.sizes, "white", 0), 129.99);
});
