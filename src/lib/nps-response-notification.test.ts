import assert from "node:assert/strict";
import test from "node:test";
import { company } from "./legal.ts";
import { buildNpsResponseEmail, sendNpsResponseNotification } from "./server-actions.ts";

const DATA = {
  email: "cliente@example.com",
  orderNumber: "#1002",
  score: 5,
  comment: "Gostei muito da recolha em mão.",
};

test("buildNpsResponseEmail inclui nota, comentário, encomenda e cliente", () => {
  const { subject, text } = buildNpsResponseEmail(DATA);
  assert.equal(subject, "[NPS] Avaliação 5/5 — Encomenda #1002");
  assert.match(text, /Encomenda: #1002/);
  assert.match(text, /Nota: 5\/5/);
  assert.match(text, /Cliente: cliente@example.com/);
  assert.match(text, /Gostei muito da recolha em mão\./);
});

test("buildNpsResponseEmail funciona sem comentário e sem e-mail", () => {
  const { text } = buildNpsResponseEmail({ ...DATA, email: "", comment: "" });
  assert.match(text, /Cliente: \(não indicado\)/);
  assert.match(text, /Comentário: \(sem comentário\)/);
});

test("sendNpsResponseNotification envia via Resend para a caixa da loja", async () => {
  const originalKey = process.env["RESEND_API_KEY"];
  const originalFrom = process.env["RESEND_FROM"];
  const originalFetch = globalThis.fetch;
  const calls: { url: string; init: RequestInit }[] = [];

  process.env["RESEND_API_KEY"] = "chave-de-teste-nps";
  process.env["RESEND_FROM"] = "UFFA Store <atendimento@uffastore.pt>";
  globalThis.fetch = async (input, init) => {
    calls.push({ url: String(input), init: init as RequestInit });
    return new Response(JSON.stringify({ id: "email-de-teste" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const result = await sendNpsResponseNotification(DATA);
    assert.equal(result.success, true);
    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.url, "https://api.resend.com/emails");

    const headers = calls[0]?.init.headers as Record<string, string>;
    assert.equal(headers["Authorization"], "Bearer chave-de-teste-nps");

    const payload = JSON.parse(String(calls[0]?.init.body)) as Record<string, unknown>;
    assert.deepEqual(payload["to"], [company.email]);
    assert.equal(payload["reply_to"], DATA.email);
    assert.equal(payload["subject"], "[NPS] Avaliação 5/5 — Encomenda #1002");
    assert.match(String(payload["text"]), /Gostei muito da recolha em mão\./);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env["RESEND_API_KEY"];
    else process.env["RESEND_API_KEY"] = originalKey;
    if (originalFrom === undefined) delete process.env["RESEND_FROM"];
    else process.env["RESEND_FROM"] = originalFrom;
  }
});

test("sendNpsResponseNotification não envia sem RESEND_API_KEY", async () => {
  const originalKey = process.env["RESEND_API_KEY"];
  const originalFetch = globalThis.fetch;
  let called = false;

  delete process.env["RESEND_API_KEY"];
  globalThis.fetch = async () => {
    called = true;
    return new Response("{}", { status: 200 });
  };

  try {
    const result = await sendNpsResponseNotification(DATA);
    assert.equal(result.success, false);
    assert.equal(called, false);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey !== undefined) process.env["RESEND_API_KEY"] = originalKey;
  }
});
