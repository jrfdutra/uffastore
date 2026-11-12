import assert from "node:assert/strict";
import test from "node:test";
import { precoPorTamanho, escalaoPorTamanho, catalogoData } from "./precos.ts";

test("escalaoPorTamanho determina corretamente os escalões", () => {
  assert.equal(escalaoPorTamanho(28), "crianca");
  assert.equal(escalaoPorTamanho(35), "crianca");
  assert.equal(escalaoPorTamanho(36), "gs");
  assert.equal(escalaoPorTamanho(39), "gs");
  assert.equal(escalaoPorTamanho(40), "senior");
  assert.equal(escalaoPorTamanho(45), "senior");
  assert.throws(() => escalaoPorTamanho(25), /fora dos escalões válidos/);
});

test("Air Force Criança só tem preço de criança (129,99 €)", () => {
  assert.equal(precoPorTamanho("air-force-crianca", 28), 129.99);
  assert.equal(precoPorTamanho("air-force-crianca", 35), 129.99);
  assert.throws(() => precoPorTamanho("air-force-crianca", 38), /Preço não definido/);
  assert.throws(() => precoPorTamanho("air-force-crianca", 42), /Preço não definido/);
});

test("Air Force w/ Rope Laces tem preços GS (149,99 €) e Senior (164,99 €)", () => {
  assert.equal(precoPorTamanho("air-force-rope", 37), 149.99);
  assert.equal(precoPorTamanho("air-force-rope", 42), 164.99);
  assert.throws(() => precoPorTamanho("air-force-rope", 30), /Preço não definido/);
});

test("Nike Dunk w/ Rope Laces segue exatamente os preços de Air Force w/ Rope Laces", () => {
  assert.equal(precoPorTamanho("nike-dunk-rope", 38), 149.99);
  assert.equal(precoPorTamanho("nike-dunk-rope", 41), 164.99);
  assert.equal(precoPorTamanho("nike-dunk-rope", 36), precoPorTamanho("air-force-rope", 36));
  assert.equal(precoPorTamanho("nike-dunk-rope", 45), precoPorTamanho("air-force-rope", 45));
  assert.throws(() => precoPorTamanho("nike-dunk-rope", 32), /Preço não definido/);
});

test("Floral Air Force w/ Rope Laces tem preços GS (179,99 €) e Senior (189,99 €)", () => {
  assert.equal(precoPorTamanho("air-force-floral-rope", 36), 179.99);
  assert.equal(precoPorTamanho("air-force-floral-rope", 44), 189.99);
  assert.throws(() => precoPorTamanho("air-force-floral-rope", 31), /Preço não definido/);
});

test("Floral Black tem preços GS (179,99 €) e Senior (189,99 €)", () => {
  assert.equal(precoPorTamanho("floral-black", 39), 179.99);
  assert.equal(precoPorTamanho("floral-black", 40), 189.99);
  assert.throws(() => precoPorTamanho("floral-black", 29), /Preço não definido/);
});

test("Air Force Lanvin W tem preços GS (179,99 €) e Senior (189,99 €)", () => {
  assert.equal(precoPorTamanho("air-force-lanvin", 38), 179.99);
  assert.equal(precoPorTamanho("air-force-lanvin", 43), 189.99);
  assert.throws(() => precoPorTamanho("air-force-lanvin", 34), /Preço não definido/);
});

test("O catálogo define exatamente os seis modelos pedidos", () => {
  assert.deepEqual(Object.keys(catalogoData.modelos).sort(), [
    "air-force-crianca",
    "air-force-floral-rope",
    "air-force-lanvin",
    "air-force-rope",
    "floral-black",
    "nike-dunk-rope",
  ]);
});

test("Os escalões usam a nomenclatura pedida", () => {
  assert.equal(catalogoData.escaloes.crianca.nome, "Criança");
  assert.equal(catalogoData.escaloes.gs.nome, "GS");
  assert.equal(catalogoData.escaloes.senior.nome, "Senior (40+)");
  assert.deepEqual(catalogoData.escaloes.crianca.tamanhos, [28, 29, 30, 31, 32, 33, 34, 35]);
  assert.deepEqual(catalogoData.escaloes.gs.tamanhos, [36, 37, 38, 39]);
  assert.deepEqual(catalogoData.escaloes.senior.tamanhos, [40, 41, 42, 43, 44, 45]);
});
