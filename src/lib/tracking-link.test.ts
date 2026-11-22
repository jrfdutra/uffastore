import assert from "node:assert/strict";
import test from "node:test";
import { createTrackingLink, safeEqualStrings, verifyTrackingLink } from "./tracking-link.ts";

process.env["TRACKING_LINK_TTL_DAYS"] = "14";

const SECRET = "teste-de-segredo-com-mais-de-16-caracteres";
const NOW = Date.parse("2026-11-22T12:00:00.000Z");
const INPUT = {
  orderNumber: "UFFA-48217",
  trackingCode: "RR123456789PT",
  carrier: "CTT Expresso",
  estimatedDelivery: "2026-11-25",
};

test("createTrackingLink gera um token verificável", () => {
  const token = createTrackingLink(INPUT, SECRET, NOW);
  const payload = verifyTrackingLink(token, SECRET, NOW);

  assert.deepEqual(payload, {
    ...INPUT,
    orderNumber: "UFFA-48217",
    trackingCode: "RR123456789PT",
    issuedAt: NOW,
    expiresAt: NOW + 14 * 24 * 60 * 60 * 1000,
  });
});

test("verifyTrackingLink rejeita assinatura alterada", () => {
  const token = createTrackingLink(INPUT, SECRET, NOW);
  const [body, signature] = token.split(".");
  const changed = `${body}.${signature === "A" ? "B" : "A"}${signature?.slice(1) ?? ""}`;

  assert.equal(verifyTrackingLink(changed, SECRET, NOW), null);
  assert.equal(verifyTrackingLink(token, "outro-segredo-com-mais-de-16", NOW), null);
});

test("verifyTrackingLink rejeita tokens expirados e malformados", () => {
  const token = createTrackingLink(INPUT, SECRET, NOW);

  assert.equal(verifyTrackingLink(token, SECRET, NOW + 15 * 24 * 60 * 60 * 1000), null);
  assert.equal(verifyTrackingLink("so-um-pedaco", SECRET, NOW), null);
  assert.equal(verifyTrackingLink(`${token}.extra`, SECRET, NOW), null);
});

test("safeEqualStrings compara em tempo constante e não lança com tamanhos diferentes", () => {
  assert.equal(safeEqualStrings("abc", "abc"), true);
  assert.equal(safeEqualStrings("abc", "abd"), false);
  assert.equal(safeEqualStrings("abc", "abcd"), false);
});
