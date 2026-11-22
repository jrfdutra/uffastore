import assert from "node:assert/strict";
import test from "node:test";
import { getProductModel, isProductInModel, modelsForBrand } from "./models.ts";
import type { Product } from "./shop-data.ts";

function product(name: string, brand: string): Product {
  return {
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    brand,
    category: "lifestyle",
    price: 100,
    image: "",
    description: { pt: "", en: "", es: "" },
    sizes: [],
  };
}

const nike = [
  product("Nike Air Force", "Nike"),
  product("Nike AIR Force Chapa Dourada S/ Rope Laces", "Nike"),
  product("Pearl Force W/ Rope Laces", "Nike"),
  product("Air Force Golden W/ Rope Laces", "Nike"),
  product("Nike Dunk Low", "Nike"),
  product("Nike Valentine Day Dunk", "Nike"),
  product("Nike Vomero 5 RNR", "Nike"),
  product("Nike P6000 All Black", "Nike"),
  product("Nike Jordan Skyline", "Nike"),
  product("Nike AIR More Uptempo Low", "Nike"),
];

test("getProductModel reconhece as famílias Nike a partir do nome", () => {
  assert.deepEqual(
    nike.map((item) => getProductModel(item).id),
    [
      "air-force",
      "air-force",
      "air-force",
      "air-force",
      "dunk",
      "dunk",
      "vomero-5",
      "p6000",
      "jordan",
      "air-more-uptempo",
    ],
  );
});

test("getProductModel reconhece as outras marcas", () => {
  assert.equal(getProductModel(product("Adidas Campus 00 Criança", "Adidas")).id, "campus-00");
  assert.equal(
    getProductModel(product("Adidas Superstar (limitadas) Offwhite", "Adidas")).id,
    "superstar",
  );
  assert.equal(getProductModel(product("Puma Ca PRO Classic", "Puma")).id, "ca-pro");
  assert.equal(getProductModel(product("New Balance 530", "New Balance")).id, "530");
  assert.equal(getProductModel(product("Vans Knu Skool W/ Rope Laces", "Vans")).id, "knu-skool");
});

test("modelos desconhecidos ganham um identificador estável sem quebrar o catálogo", () => {
  const model = getProductModel(product("Nike Zoom Fly 6", "Nike"));
  assert.equal(model.id, "zoom-fly-6");
  assert.equal(model.label, "Zoom Fly 6");
});

test("modelsForBrand devolve apenas os modelos da marca, com contagem", () => {
  const adidas = [
    product("Adidas Campus 00", "Adidas"),
    product("Adidas Campus 00 Offwhite", "Adidas"),
    product("Adidas Superstar", "Adidas"),
  ];

  assert.deepEqual(modelsForBrand([...nike, ...adidas], "adidas"), [
    { id: "campus-00", label: "Campus 00", count: 2 },
    { id: "superstar", label: "Superstar", count: 1 },
  ]);
  assert.deepEqual(
    modelsForBrand([...nike, ...adidas], "nike").map((m) => m.id),
    ["air-force", "dunk", "vomero-5", "p6000", "jordan", "air-more-uptempo"],
  );
});

test("modelsForBrand ignora produtos inativos e isProductInModel filtra pelo modelo", () => {
  const inativo = { ...product("Nike Dunk Low", "Nike"), status: "inactive" as const };
  const dunk = nike.find((item) => item.name === "Nike Dunk Low")!;
  assert.equal(modelsForBrand([inativo, ...nike], "nike").find((m) => m.id === "dunk")?.count, 2);

  assert.equal(isProductInModel(dunk, "dunk"), true);
  assert.equal(isProductInModel(dunk, "air-force"), false);
  assert.equal(isProductInModel(dunk, "all"), true);
});
