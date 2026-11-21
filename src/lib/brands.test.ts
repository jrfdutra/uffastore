import assert from "node:assert/strict";
import test from "node:test";
import { consolidatedProducts } from "./consolidated-catalog.ts";
import {
  BRANDS,
  brandFromText,
  compareRopeLacesFirst,
  getProductBrand,
  hasRopeLaces,
  isProductInBrand,
  matchesModel,
  normalizeText,
  searchModels,
} from "./brands.ts";

const sample = [
  {
    id: "nike-dunk-low-panda",
    name: "Nike Dunk Low Panda",
    brand: "Nike",
  },
  {
    id: "adidas-campus-00-w",
    name: "Adidas Campus 00s",
    brand: "Adidas",
  },
  {
    id: "new-balance-530",
    name: "New Balance 530",
    brand: "New Balance",
  },
  {
    id: "vans-knu-skool",
    name: "Vans Knu Skool",
    brand: "Vans",
  },
  {
    id: "air-force-crianca",
    name: "Air Force Criança",
    brand: undefined,
  },
];

const item = (index: number) => sample[index]!;

test("as cinco marcas da loja estão definidas, com a Nike em primeiro", () => {
  assert.deepEqual(BRANDS, ["nike", "adidas", "puma", "new-balance", "vans"]);
});

test("normalizeText remove acentos e pontuação", () => {
  assert.equal(normalizeText("Sapatilha d'Água — Nike"), "sapatilha d agua nike");
});

test("brandFromText reconhece as marcas em vendor, nome e handle", () => {
  assert.equal(brandFromText("Nike"), "nike");
  assert.equal(brandFromText("ADIDAS"), "adidas");
  assert.equal(brandFromText("New Balance"), "new-balance");
  assert.equal(brandFromText("newbalance"), "new-balance");
  assert.equal(brandFromText("Vans"), "vans");
  assert.equal(brandFromText("Puma"), "puma");
  assert.equal(brandFromText(undefined, "Nike Dunk Low", "nike-dunk-low"), "nike");
  assert.equal(brandFromText("Uffa Store", "Floral Black", "floral-black"), undefined);
});

test("getProductBrand usa o vendor antes do nome", () => {
  assert.equal(getProductBrand(item(4)), undefined);
  assert.equal(getProductBrand({ id: "x", name: "Air Force", brand: "Adidas" }), "adidas");
});

test("isProductInBrand filtra por marca", () => {
  assert.equal(isProductInBrand(item(0), "all"), true);
  assert.equal(isProductInBrand(item(0), "nike"), true);
  assert.equal(isProductInBrand(item(0), "adidas"), false);
  assert.equal(isProductInBrand(item(4), "nike"), false);
});

test("matchesModel aceita acentos, multi-palavra e pesquisa por marca", () => {
  assert.equal(matchesModel(item(0), "dunk"), true);
  assert.equal(matchesModel(item(0), "NIKE DUNK"), true);
  assert.equal(matchesModel(item(0), "panda preto"), false);
  assert.equal(matchesModel(item(4), "crianca"), true);
  assert.equal(matchesModel(item(2), "new balance"), true);
});

test("searchModels combina marca e pesquisa e ordena melhores resultados primeiro", () => {
  const found = searchModels(sample as never, "dunk");
  assert.deepEqual(
    found.map((product) => product.id),
    ["nike-dunk-low-panda"],
  );
  assert.deepEqual(
    searchModels(sample as never, "", "vans").map((product) => product.id),
    ["vans-knu-skool"],
  );
  assert.equal(searchModels(sample as never, "zzzz").length, 0);
});

test("o catálogo de fallback também permite reconhecer marcas", () => {
  const nike = consolidatedProducts.filter(
    (product) => brandFromText(product.name, product.handle) === "nike",
  );
  assert.ok(nike.length > 0, "pelo menos um produto Nike no fallback");
});

test("hasRopeLaces distingue 'com' de 'sem' rope laces", () => {
  assert.equal(hasRopeLaces({ name: "Nike Dunk Panda W/ Rope Laces", id: "x" }), true);
  assert.equal(hasRopeLaces({ name: "Air Force With Rope Laces", id: "x" }), true);
  assert.equal(
    hasRopeLaces({ name: "Nike AIR Force Chapa Dourada S/ Rope Laces", id: "x" }),
    false,
  );
  assert.equal(hasRopeLaces({ name: "Adidas Campus 00 W/ Double Laces", id: "x" }), false);
});

test("compareRopeLacesFirst coloca os modelos com rope laces à frente", () => {
  const com = { name: "Nike Dunk Panda W/ Rope Laces", id: "com" };
  const sem = { name: "Nike Dunk Low", id: "sem" };
  const ordem = [sem, com].sort(compareRopeLacesFirst);

  assert.deepEqual(
    ordem.map((product) => product.id),
    ["com", "sem"],
  );
  assert.equal(compareRopeLacesFirst(com, sem), -1);
  assert.equal(compareRopeLacesFirst(sem, com), 1);
  assert.equal(compareRopeLacesFirst(com, com), 0);
});
