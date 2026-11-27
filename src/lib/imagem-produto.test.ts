import assert from "node:assert/strict";
import test from "node:test";
import { galeriaDaCor, imagemDaCor, imagemDoItem } from "./imagem-produto.ts";
import type { Product } from "./shop-data.ts";

const produto: Product = {
  id: "nike-air-force-chapa-dourada",
  name: "AIR FORCE W ROPE LACE",
  category: "lifestyle",
  price: 139.99,
  image: "/principal-antiga.webp",
  images: ["/principal-antiga.webp", "/outra.webp"],
  description: { pt: "", en: "", es: "" },
  colors: [
    { name: "Branca", slug: "branca", images: ["/branca.webp"] },
    { name: "Preta", slug: "preta", images: ["/preta.webp"] },
  ],
  sizes: [
    { size: 39, stock: 1, color: "branca", variantId: "gid-branca-39", image: "/branca.webp" },
    { size: 39, stock: 1, color: "preta", variantId: "gid-preta-39", image: "/preta.webp" },
  ],
};

test("A miniatura acompanha a cor/variante do item, não a foto principal", () => {
  assert.equal(imagemDoItem(produto, { variantId: "gid-preta-39", color: "preta" }), "/preta.webp");
  assert.equal(
    imagemDoItem(produto, { variantId: "gid-branca-39", color: "branca" }),
    "/branca.webp",
  );
});

test("Sem variantId, a foto é escolhida pela cor guardada no item", () => {
  assert.equal(imagemDoItem(produto, { color: "preta" }), "/preta.webp");
  assert.equal(imagemDoItem(produto, { color: "branca" }), "/branca.webp");
});

test("Cor desconhecida usa a galeria do anúncio", () => {
  assert.equal(imagemDoItem(produto, { color: "desconhecida" }), "/principal-antiga.webp");
  assert.equal(imagemDaCor(produto), "/principal-antiga.webp");
});

test("A galeria da cor mantém as fotografias dessa cor", () => {
  assert.deepEqual(galeriaDaCor(produto, "preta"), ["/preta.webp"]);
  assert.deepEqual(galeriaDaCor(produto), ["/principal-antiga.webp", "/outra.webp"]);
});
