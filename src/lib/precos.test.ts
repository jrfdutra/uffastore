import assert from "node:assert/strict";
import test from "node:test";
import { precoPorTamanho, escalaoPorTamanho } from "./precos.ts";

test("escalaoPorTamanho determina corretamente os escalões", () => {
  assert.equal(escalaoPorTamanho(28), "crianca");
  assert.equal(escalaoPorTamanho(35), "crianca");
  assert.equal(escalaoPorTamanho(36), "gs");
  assert.equal(escalaoPorTamanho(39), "gs");
  assert.equal(escalaoPorTamanho(40), "senior");
  assert.equal(escalaoPorTamanho(45), "senior");
  assert.throws(() => escalaoPorTamanho(25), /fora dos escalões válidos/);
});

test("Air Force normal só tem preço de criança (129,99 €)", () => {
  assert.equal(precoPorTamanho("air-force", 30), 129.99);
  assert.throws(() => precoPorTamanho("air-force", 38), /Preço não definido/);
  assert.throws(() => precoPorTamanho("air-force", 42), /Preço não definido/);
});

test("Air Force w/ Rope Laces tem preços GS (149,99 €) e Sénior (164,99 €)", () => {
  assert.equal(precoPorTamanho("air-force-rope", 37), 149.99);
  assert.equal(precoPorTamanho("air-force-rope", 42), 164.99);
  assert.throws(() => precoPorTamanho("air-force-rope", 30), /Preço não definido/);
});

test("Nike Dunk w/ Rope Laces segue os mesmos preços de Air Force w/ Rope Laces", () => {
  assert.equal(precoPorTamanho("nike-dunk-rope", 38), 149.99);
  assert.equal(precoPorTamanho("nike-dunk-rope", 41), 164.99);
  assert.throws(() => precoPorTamanho("nike-dunk-rope", 32), /Preço não definido/);
});

test("Air Force Floral w/ Rope Laces tem preços GS (179,99 €) e Sénior (189,99 €)", () => {
  assert.equal(precoPorTamanho("air-force-floral-rope", 36), 179.99);
  assert.equal(precoPorTamanho("air-force-floral-rope", 44), 189.99);
  assert.throws(() => precoPorTamanho("air-force-floral-rope", 31), /Preço não definido/);
});

test("Air Force Shine w/ Rope Laces tem preços GS (169,99 €) e Sénior (189,99 €)", () => {
  assert.equal(precoPorTamanho("air-force-shine-rope", 39), 169.99);
  assert.equal(precoPorTamanho("air-force-shine-rope", 40), 189.99);
  assert.throws(() => precoPorTamanho("air-force-shine-rope", 29), /Preço não definido/);
});

test("Air Force Lanvin w/ Rope Laces tem preços GS (179,99 €) e Sénior (189,99 €)", () => {
  assert.equal(precoPorTamanho("air-force-lanvin-rope", 38), 179.99);
  assert.equal(precoPorTamanho("air-force-lanvin-rope", 43), 189.99);
  assert.throws(() => precoPorTamanho("air-force-lanvin-rope", 34), /Preço não definido/);
});
