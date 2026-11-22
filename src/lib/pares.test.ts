import assert from "node:assert/strict";
import test from "node:test";
import { pairCount } from "./pair-code.ts";

test("A quantidade é expandida por par físico", () => {
  assert.equal(pairCount(1), 1);
  assert.equal(pairCount(2), 2);
  assert.equal(pairCount(3), 3);
  assert.equal(pairCount(0), 1);
  assert.equal(pairCount(-2), 1);
  assert.equal(pairCount(1.9), 1);
  assert.equal(pairCount(Number.NaN), 1);
});
