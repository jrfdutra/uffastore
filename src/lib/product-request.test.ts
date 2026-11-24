import assert from "node:assert/strict";
import test from "node:test";
import { parseProductRequest } from "./product-request.ts";

const valido = {
  description: "Procurava uma Nike Dunk branca com cordões grossos.",
  product: "Nike Dunk",
  brand: "Nike",
  email: "Cliente@Exemplo.pt",
  phone: "+351 912 345 678",
};

test("aceita um pedido completo e normaliza o e-mail", () => {
  const result = parseProductRequest(JSON.stringify(valido));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.request.email, "cliente@exemplo.pt");
  assert.equal(result.request.phone, "+351 912 345 678");
  assert.equal(result.request.product, "Nike Dunk");
});

test("rejeita campos em falta", () => {
  const result = parseProductRequest(JSON.stringify({ ...valido, phone: "" }));
  assert.deepEqual(result, { ok: false, reason: "missing_fields" });
});

test("rejeita e-mail inválido", () => {
  const result = parseProductRequest(JSON.stringify({ ...valido, email: "nao-e-email" }));
  assert.deepEqual(result, { ok: false, reason: "invalid_email" });
});

test("rejeita telemóvel inválido", () => {
  const result = parseProductRequest(JSON.stringify({ ...valido, phone: "123" }));
  assert.deepEqual(result, { ok: false, reason: "invalid_phone" });
});

test("remove CRLF e limita o tamanho da descrição", () => {
  const result = parseProductRequest(
    JSON.stringify({ ...valido, description: `linha 1\r\nSubject: injetado\n${"x".repeat(3000)}` }),
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.request.description.includes("\r"), false);
  assert.equal(result.request.description.startsWith("linha 1\nSubject: injetado"), true);
  assert.equal(result.request.description.length, 2000);
});

test("rejeita payload que não seja objeto", () => {
  assert.deepEqual(parseProductRequest("[]"), { ok: false, reason: "invalid_payload" });
  assert.deepEqual(parseProductRequest("texto"), { ok: false, reason: "invalid_payload" });
});
