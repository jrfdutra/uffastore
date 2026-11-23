import assert from "node:assert/strict";
import test from "node:test";
import type { Category } from "./shop-data.ts";
import { isProductOnSale } from "./sale.ts";

type SaleProduct = Parameters<typeof isProductOnSale>[0];

const product = (overrides: Partial<SaleProduct> = {}): SaleProduct => ({
  category: "lifestyle" as Category,
  categories: [] as Category[],
  price: 80,
  ...overrides,
});

test("produtos da campanha Black Friday contam como oferta", () => {
  assert.equal(isProductOnSale(product({ category: "blackfriday" })), true);
  assert.equal(isProductOnSale(product({ categories: ["blackfriday"] })), true);
});

test("promoções antigas também contam como oferta", () => {
  assert.equal(isProductOnSale(product({ category: "promocoes" })), true);
  assert.equal(isProductOnSale(product({ categories: ["promocoes"] })), true);
});

test("desconto real da Shopify conta como oferta", () => {
  assert.equal(isProductOnSale(product({ originalPrice: 120 })), true);
});

test("preço antigo igual ao atual não conta como oferta", () => {
  assert.equal(isProductOnSale(product({ originalPrice: 80 })), false);
});

test("produto sem desconto nem campanha não conta como oferta", () => {
  assert.equal(isProductOnSale(product()), false);
});
