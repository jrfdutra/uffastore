import assert from "node:assert/strict";
import test from "node:test";
import { cttTrackingUrl, isCttCarrier } from "./tracking.ts";

test("cttTrackingUrl pré-preenche o código e força português", () => {
  const url = new URL(cttTrackingUrl(" RR123456789PT "));
  assert.equal(
    `${url.origin}${url.pathname}`,
    "https://www.ctt.pt/feapl_2/app/open/objectSearch/objectSearch.jspx",
  );
  assert.equal(url.searchParams.get("objects"), "RR123456789PT");
  assert.equal(url.searchParams.get("request_locale"), "pt");
});

test("isCttCarrier reconhece apenas transportadores CTT", () => {
  assert.equal(isCttCarrier("CTT Expresso"), true);
  assert.equal(isCttCarrier("ctt"), true);
  assert.equal(isCttCarrier("DPD"), false);
  assert.equal(isCttCarrier(null), false);
});
