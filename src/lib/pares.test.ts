import assert from "node:assert/strict";
import test from "node:test";
import {
  PAIR_CODE_ALPHABET,
  generatePairCode,
  isPairCode,
  normalizePairCode,
  pairCount,
} from "./pair-code.ts";

test("O código do par segue o formato UFFA-XXXXXX", () => {
  for (let index = 0; index < 50; index += 1) {
    const code = generatePairCode();
    assert.match(code, /^UFFA-[A-Z0-9]{6}$/, `Código inesperado: ${code}`);
    assert.ok(isPairCode(code), `O código ${code} devia ser válido`);
  }
});

test("O código do par evita caracteres ambíguos (I, O, 0, 1)", () => {
  for (let index = 0; index < 200; index += 1) {
    const token = generatePairCode().replace("UFFA-", "");
    for (const char of token) {
      assert.ok(
        PAIR_CODE_ALPHABET.includes(char),
        `O carácter ${char} não pertence ao alfabeto permitido`,
      );
    }
    assert.ok(!/[IO01]/.test(token), `O código ${token} contém caracteres ambíguos`);
  }
});

test("Cada código gerado é único numa série de 500", () => {
  const codes = new Set<string>();
  for (let index = 0; index < 500; index += 1) {
    codes.add(generatePairCode());
  }
  assert.equal(codes.size, 500, "Foram encontrados códigos duplicados");
});

test("A normalização aceita minúsculas, espaços e hífenes", () => {
  assert.equal(normalizePairCode("uffa-7k2m9q"), "UFFA7K2M9Q");
  assert.equal(normalizePairCode("  UFFA 7K2M 9Q "), "UFFA7K2M9Q");
  assert.equal(normalizePairCode("UFFA-7K2M9Q"), "UFFA7K2M9Q");
});

test("isPairCode rejeita formatos inválidos", () => {
  assert.equal(isPairCode("UFFA-7K2M9Q"), true);
  assert.equal(isPairCode("uffa-7k2m9q"), true);
  assert.equal(isPairCode("UFFA-7K2M"), false);
  assert.equal(isPairCode("UFFA-7K2M9QX"), false);
  assert.equal(isPairCode("7K2M9Q"), false);
});

test("Cada par físico recebe o seu próprio código (quantidade é expandida)", () => {
  assert.equal(pairCount(1), 1);
  assert.equal(pairCount(2), 2);
  assert.equal(pairCount(3), 3);
  assert.equal(pairCount(0), 1);
  assert.equal(pairCount(-2), 1);
  assert.equal(pairCount(1.9), 1);
  assert.equal(pairCount(Number.NaN), 1);
});
