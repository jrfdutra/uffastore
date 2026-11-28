import assert from "node:assert/strict";
import test from "node:test";
import { parseNewsletterRequest } from "./newsletter.ts";

test("aceita uma subscrição válida e normaliza idioma e origem", () => {
  const result = parseNewsletterRequest(
    JSON.stringify({ email: " Cliente@Exemplo.PT ", language: "en", origin: "footer" }),
  );
  assert.equal(result.ok, true);
  assert.equal("request" in result, true);
  if (!("request" in result)) return;
  assert.deepEqual(result.request, {
    email: "cliente@exemplo.pt",
    language: "en",
    origin: "footer",
  });
});

test("honeypot preenchido é ignorado sem expor o remetente", () => {
  const result = parseNewsletterRequest(
    JSON.stringify({ email: "bot@exemplo.pt", _honey: "preenchido" }),
  );
  assert.equal(result.ok, true);
  assert.equal("ignored" in result, true);
});

test("rejeita e-mail inválido e payload malformado", () => {
  assert.deepEqual(parseNewsletterRequest(JSON.stringify({ email: "sem-arroba" })), {
    ok: false,
    reason: "invalid_email",
  });
  assert.deepEqual(parseNewsletterRequest("{"), { ok: false, reason: "invalid_payload" });
});
