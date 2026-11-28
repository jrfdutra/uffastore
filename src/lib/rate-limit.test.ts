import assert from "node:assert/strict";
import test from "node:test";
import { RateLimiter, hasAllowedOrigin } from "./rate-limit.ts";

test("bloqueia após o limite e liberta após a janela", () => {
  const limiter = new RateLimiter(2, 1_000);
  assert.equal(limiter.allows("ip", 0), true);
  assert.equal(limiter.allows("ip", 10), true);
  assert.equal(limiter.allows("ip", 20), false);
  assert.equal(limiter.allows("ip", 1_100), true);
});

test("limites por chave são independentes", () => {
  const limiter = new RateLimiter(1, 1_000);
  assert.equal(limiter.allows("a", 0), true);
  assert.equal(limiter.allows("b", 0), true);
  assert.equal(limiter.allows("a", 1), false);
});

test("origem ausente é aceite; origens locais e da loja são aceites", () => {
  const url = "https://www.uffastore.pt/api/newsletter";
  assert.equal(hasAllowedOrigin(new Request(url, { method: "POST" })), true);
  assert.equal(
    hasAllowedOrigin(
      new Request(url, { method: "POST", headers: { origin: "https://uffastore.pt" } }),
    ),
    true,
  );
  assert.equal(
    hasAllowedOrigin(
      new Request("http://127.0.0.1:8080/api/newsletter", {
        method: "POST",
        headers: { referer: "http://localhost:8080/" },
      }),
    ),
    true,
  );
});

test("origem de outro site é rejeitada", () => {
  const request = new Request("https://www.uffastore.pt/api/contacto", {
    method: "POST",
    headers: { origin: "https://site-exemplo.com" },
  });
  assert.equal(hasAllowedOrigin(request), false);
});
