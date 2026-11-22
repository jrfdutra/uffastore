import assert from "node:assert/strict";
import test from "node:test";
import { createNpsLink, getNpsSecret, npsLinkTtlMs, verifyNpsLink } from "./nps-link.ts";

process.env["NPS_LINK_TTL_DAYS"] = "30";

const SECRET = "segredo-de-teste-com-mais-de-16-caracteres";
const NOW = Date.parse("2026-11-22T12:00:00.000Z");
const INPUT = { orderId: "gid://shopify/Order/123456", orderNumber: "#1002" };

test("createNpsLink gera um token verificável", () => {
  const token = createNpsLink(INPUT, SECRET, NOW);
  assert.deepEqual(verifyNpsLink(token, SECRET, NOW), {
    ...INPUT,
    issuedAt: NOW,
    expiresAt: NOW + 30 * 24 * 60 * 60 * 1000,
  });
});

test("verifyNpsLink rejeita assinatura alterada e segredo errado", () => {
  const token = createNpsLink(INPUT, SECRET, NOW);
  const [body, signature] = token.split(".");
  const changed = `${body}.${signature === "A" ? "B" : "A"}${signature?.slice(1) ?? ""}`;

  assert.equal(verifyNpsLink(changed, SECRET, NOW), null);
  assert.equal(verifyNpsLink(token, "outro-segredo-com-mais-de-16", NOW), null);
});

test("verifyNpsLink rejeita tokens expirados, malformados e com ID inválido", () => {
  const token = createNpsLink(INPUT, SECRET, NOW);
  assert.equal(verifyNpsLink(token, SECRET, NOW + 31 * 24 * 60 * 60 * 1000), null);
  assert.equal(verifyNpsLink("so-um-pedaco", SECRET, NOW), null);
  assert.equal(verifyNpsLink(`${token}.extra`, SECRET, NOW), null);

  const forged = Buffer.from(
    JSON.stringify({
      ...INPUT,
      orderId: "gid://shopify/Order/nao-numerico",
      issuedAt: NOW,
      expiresAt: NOW + 1000,
    }),
  ).toString("base64url");
  assert.equal(verifyNpsLink(forged, SECRET, NOW), null);
});

test("getNpsSecret usa NPS_SECRET e cai para ORDER_PORTAL_SECRET", () => {
  const originalDedicated = process.env["NPS_SECRET"];
  const originalFallback = process.env["ORDER_PORTAL_SECRET"];
  try {
    delete process.env["NPS_SECRET"];
    process.env["ORDER_PORTAL_SECRET"] = "segredo-de-rastreio-com-mais-de-16";
    assert.equal(getNpsSecret(), "segredo-de-rastreio-com-mais-de-16");

    process.env["NPS_SECRET"] = "segredo-de-pesquisa-com-mais-de-16";
    assert.equal(getNpsSecret(), "segredo-de-pesquisa-com-mais-de-16");

    process.env["NPS_SECRET"] = "curto";
    delete process.env["ORDER_PORTAL_SECRET"];
    assert.equal(getNpsSecret(), null);
  } finally {
    if (originalDedicated === undefined) delete process.env["NPS_SECRET"];
    else process.env["NPS_SECRET"] = originalDedicated;
    if (originalFallback === undefined) delete process.env["ORDER_PORTAL_SECRET"];
    else process.env["ORDER_PORTAL_SECRET"] = originalFallback;
  }
});

test("npsLinkTtlMs limita o valor configurado entre 1 e 60 dias", () => {
  const original = process.env["NPS_LINK_TTL_DAYS"];
  try {
    process.env["NPS_LINK_TTL_DAYS"] = "0";
    assert.equal(npsLinkTtlMs(), 24 * 60 * 60 * 1000);
    process.env["NPS_LINK_TTL_DAYS"] = "999";
    assert.equal(npsLinkTtlMs(), 60 * 24 * 60 * 60 * 1000);
    delete process.env["NPS_LINK_TTL_DAYS"];
    assert.equal(npsLinkTtlMs(), 30 * 24 * 60 * 60 * 1000);
  } finally {
    if (original === undefined) delete process.env["NPS_LINK_TTL_DAYS"];
    else process.env["NPS_LINK_TTL_DAYS"] = original;
  }
});
