import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeCart } from "./cart.ts";

test("sanitizeCart remove produtos que já não estão no catálogo", () => {
  const items = [
    { productId: "nike-dunk-low", size: 42, quantity: 1 },
    { productId: "nike-air-force", size: 43, quantity: 2 },
    { productId: "adidas-campus-00", size: 40, quantity: 1 },
  ];
  const ids = new Set(["nike-dunk-low", "adidas-campus-00"]);

  assert.deepEqual(sanitizeCart(items, ids), [items[0], items[2]]);
});

test("sanitizeCart preserva quantidades e não altera um carrinho válido", () => {
  const items = [
    { productId: "a", size: 40, quantity: 3 },
    { productId: "b", size: 41, quantity: 1 },
  ];
  const result = sanitizeCart(items, new Set(["a", "b"]));

  assert.equal(result, items, "sem alterações, devolve a mesma referência de array");
  assert.deepEqual(
    result.map((item) => item.quantity),
    [3, 1],
  );
});

test("sanitizeCart lida com catálogo vazio e carrinho vazio", () => {
  assert.deepEqual(sanitizeCart([{ productId: "x", size: 42, quantity: 1 }], new Set()), []);
  assert.deepEqual(sanitizeCart([], new Set(["x"])), []);
});
