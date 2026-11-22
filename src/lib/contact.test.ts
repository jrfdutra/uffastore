import assert from "node:assert/strict";
import test from "node:test";
import { parseContactRequest } from "./contact.ts";
import { CONTACT_MAX_IMAGE_BYTES } from "./contact-constants.ts";

const PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8AAAwAB/AF+g0ZJAAAAAElFTkSuQmCC";
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]).toString("base64");
const WEBP = Buffer.from([...Buffer.from("RIFF"), 0, 0, 0, 0, ...Buffer.from("WEBP")]).toString(
  "base64",
);

function payload(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    name: "Ana",
    email: "ana@exemplo.pt",
    reason: "geral",
    subject: "Dúvida",
    message: "Olá, tenho uma dúvida.",
    orderNo: "UFFA-48217",
    ...overrides,
  });
}

test("aceita mensagem simples sem fotografia", () => {
  const result = parseContactRequest(payload());
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.request.reason, "geral");
  assert.equal(result.request.image, null);
  assert.equal(result.request.email, "ana@exemplo.pt");
});

test("troca ou defeito exige fotografia", () => {
  const result = parseContactRequest(payload({ reason: "troca_defeito" }));
  assert.deepEqual(result, { ok: false, reason: "image_required" });
});

test("aceita PNG, JPEG e WebP e normaliza o nome do ficheiro", () => {
  for (const [type, data, extension] of [
    ["image/png", PNG, ".png"],
    ["image/jpeg", JPEG, ".jpg"],
    ["image/webp", WEBP, ".webp"],
  ]) {
    const result = parseContactRequest(
      payload({
        reason: "troca_defeito",
        image: { name: "C:\\fotos\\defeito!.PNG", type, data },
      }),
    );
    assert.equal(result.ok, true, type);
    if (!result.ok) return;
    assert.equal(result.request.image?.type, type);
    assert.match(result.request.image?.name ?? "", new RegExp(`${extension}$`));
    assert.doesNotMatch(result.request.image?.name ?? "", /[\\!]/);
  }
});

test("rejeita tipo declarado que não corresponde aos bytes", () => {
  const result = parseContactRequest(
    payload({ image: { name: "foto.png", type: "image/png", data: JPEG } }),
  );
  assert.deepEqual(result, { ok: false, reason: "invalid_image_type" });
});

test("rejeita mime não suportado e base64 inválido", () => {
  assert.deepEqual(
    parseContactRequest(payload({ image: { name: "a.gif", type: "image/gif", data: PNG } })),
    { ok: false, reason: "invalid_image_type" },
  );
  assert.deepEqual(
    parseContactRequest(payload({ image: { name: "a.png", type: "image/png", data: "@@@" } })),
    { ok: false, reason: "invalid_image" },
  );
});

test("rejeita imagem acima do limite", () => {
  const big = Buffer.alloc(CONTACT_MAX_IMAGE_BYTES + 1, 1);
  big.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const result = parseContactRequest(
    payload({ image: { name: "a.png", type: "image/png", data: big.toString("base64") } }),
  );
  assert.deepEqual(result, { ok: false, reason: "image_too_large" });
});

test("remove CRLF e limita campos de texto", () => {
  const result = parseContactRequest(
    payload({
      name: "Ana\r\nBcc: spam@exemplo.pt",
      message: "Linha 1\r\nLinha 2",
      subject: "x".repeat(500),
    }),
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.request.name, "AnaBcc: spam@exemplo.pt");
  assert.equal(result.request.message, "Linha 1\nLinha 2");
  assert.equal(result.request.subject.length, 120);
});

test("rejeita payloads, campos obrigatórios e e-mails inválidos", () => {
  assert.deepEqual(parseContactRequest("{"), { ok: false, reason: "invalid_payload" });
  assert.deepEqual(parseContactRequest(payload({ email: "invalido" })), {
    ok: false,
    reason: "invalid_email",
  });
  assert.deepEqual(parseContactRequest(payload({ message: "   " })), {
    ok: false,
    reason: "missing_fields",
  });
});
