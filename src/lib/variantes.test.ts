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
  const dunk = produto("nike-dunk-w-rope-laces-gs");
  for (const cor of dunk.colors) {
    const variantes = variantesPorCor(dunk.sizes, cor.colorSlug);
    assert.equal(variantes.length, 8, `cor ${cor.colorSlug}`);
    assert.ok(variantes.every((variante) => variante.color === cor.colorSlug));
  }

  const dunkSenior = produto("nike-dunk-w-rope-laces-senior");
  for (const cor of dunkSenior.colors) {
    assert.equal(variantesPorCor(dunkSenior.sizes, cor.colorSlug).length, 11);
  }
});

test("Modelos de cor única devolvem todas as variantes", () => {
  const lanvin = produto("air-force-lanvin-w-gs");
  assert.equal(variantesPorCor(lanvin.sizes, undefined).length, 8);
  assert.equal(variantesPorCor(produto("air-force-lanvin-w-senior").sizes, undefined).length, 11);
});

test("Cada anúncio apresenta apenas o seu escalão", () => {
  assert.deepEqual(escaloesDisponiveis(produto("nike-dunk-w-rope-laces-gs").sizes), ["gs"]);
  assert.deepEqual(escaloesDisponiveis(produto("nike-dunk-w-rope-laces-senior").sizes), ["senior"]);
  assert.deepEqual(escaloesDisponiveis(produto("air-force-lanvin-w-gs").sizes), ["gs"]);
  assert.deepEqual(escaloesDisponiveis(produto("air-force-crianca").sizes), ["crianca"]);
  assert.deepEqual(escaloesDisponiveis(produto("floral-black-senior").sizes), ["senior"]);
});

test("Tamanhos por escalão", () => {
  const crianca = produto("air-force-crianca");
  assert.deepEqual(
    tamanhosDoEscalao(variantesPorCor(crianca.sizes, "white"), "crianca").map(
      (variante) => variante.size,
    ),
    [28, 28.5, 29, 29.5, 30, 30.5, 31, 31.5, 32, 32.5, 33, 33.5, 34, 34.5, 35, 35.5],
  );

  const dunkGs = produto("nike-dunk-w-rope-laces-gs");
  assert.deepEqual(
    tamanhosDoEscalao(variantesPorCor(dunkGs.sizes, "white"), "gs").map(
      (variante) => variante.size,
    ),
    [36, 36.5, 37, 37.5, 38, 38.5, 39, 39.5],
  );

  const dunkSenior = produto("nike-dunk-w-rope-laces-senior");
  assert.deepEqual(
    tamanhosDoEscalao(variantesPorCor(dunkSenior.sizes, "white"), "senior").map(
      (variante) => variante.size,
    ),
    [40, 40.5, 41, 41.5, 42, 42.5, 43, 43.5, 44, 44.5, 45],
  );
});

test("O preço acompanha o escalão selecionado (Dunk)", () => {
  const gs = produto("nike-dunk-w-rope-laces-gs");
  assert.ok(gs.sizes.every((variante) => variante.price === 149.99));

  const senior = produto("nike-dunk-w-rope-laces-senior");
  assert.ok(senior.sizes.every((variante) => variante.price === 164.99));
});

test("O preço acompanha o escalão selecionado (Criança)", () => {
  const crianca = produto("air-force-crianca");
  const variantes = tamanhosDoEscalao(variantesPorCor(crianca.sizes, "black"), "crianca");
  assert.equal(variantes.length, 16);
  assert.ok(variantes.every((variante) => variante.price === 129.99));
});

test("A variante escolhida devolve o preço correto em todas as cores", () => {
  for (const handle of [
    "nike-dunk-w-rope-laces-gs",
    "air-force-floral-w-rope-laces-senior",
    "air-force-crianca",
    "air-force-w-rope-laces-senior",
  ]) {
    const item = produto(handle);
    for (const cor of item.colors) {
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
  const dunk = produto("nike-dunk-w-rope-laces-gs");
  const semStock = dunk.sizes.map((variante) =>
    variante.size === 38 && variante.color === "white" ? { ...variante, stock: 0 } : variante,
  );
  assert.equal(varianteSelecionavel(semStock, "white", "gs", 38), undefined);
  assert.ok(varianteSelecionavel(semStock, "white", "gs", 37));
});

test("O preço mínimo apresentado por cor está correto", () => {
  const floralGs = produto("air-force-floral-w-rope-laces-gs");
  assert.equal(precoApresentado(floralGs.sizes, "pink", 0), 179.99);
  assert.equal(precoApresentado(floralGs.sizes, "orange", 0), 179.99);

  const floralSenior = produto("air-force-floral-w-rope-laces-senior");
  assert.equal(precoApresentado(floralSenior.sizes, "pink", 0), 189.99);
  assert.equal(precoApresentado(floralSenior.sizes, "orange", 0), 189.99);

  const dunk = produto("nike-dunk-w-rope-laces-gs");
  assert.equal(precoApresentado(dunk.sizes, "black", 0), 149.99);

  const crianca = produto("air-force-crianca");
  assert.equal(precoApresentado(crianca.sizes, "white", 0), 129.99);
});
