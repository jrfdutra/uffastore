import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import {
  MAX_BODY_BYTES,
  isExpectedShop,
  isExpectedTopic,
  verifyShopifyHmac,
} from "./lib/webhook-core";
import { processOrderPaidWebhook, webhookDeduplicator } from "./lib/webhook-handler";

const WEBHOOK_PATH = "/api/webhooks/shopify/orders-paid";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

function webhookEventId(request: Request): string | null {
  return (
    request.headers.get("x-shopify-webhook-id") ?? request.headers.get("x-shopify-event-id") ?? null
  );
}

async function handleShopifyWebhook(request: Request): Promise<Response> {
  const declaredLength = Number.parseInt(request.headers.get("content-length") ?? "", 10);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return jsonResponse(413, { success: false, reason: "payload_too_large" });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return jsonResponse(413, { success: false, reason: "payload_too_large" });
  }

  // 1) Autenticidade: HMAC-SHA256 do corpo raw.
  if (!verifyShopifyHmac(raw, request.headers.get("x-shopify-hmac-sha256"))) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 2) Contexto: só orders/paid e, se configurado, só a nossa loja.
  if (!isExpectedTopic(request.headers.get("x-shopify-topic"))) {
    return jsonResponse(400, { success: false, reason: "unexpected_topic" });
  }
  if (!isExpectedShop(request.headers.get("x-shopify-shop-domain"))) {
    return jsonResponse(400, { success: false, reason: "unexpected_shop" });
  }

  // 3) Idempotência: o mesmo evento não gera dois e-mails.
  const eventId = webhookEventId(request);
  if (!webhookDeduplicator.claim(eventId)) {
    return jsonResponse(200, { success: true, duplicate: true });
  }

  const result = await processOrderPaidWebhook(raw);

  if (!result.success) {
    // Só falhas de entrega devem ser retentadas pela Shopify.
    webhookDeduplicator.release(eventId);
  }

  const status = result.success
    ? 200
    : result.reason === "no_email"
      ? 200
      : result.reason === "invalid_payload"
        ? 400
        : 500;

  return jsonResponse(status, result);
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);

    if (url.pathname === WEBHOOK_PATH) {
      if (request.method !== "POST") {
        return new Response("Method Not Allowed", {
          status: 405,
          headers: { allow: "POST" },
        });
      }
      try {
        return await handleShopifyWebhook(request);
      } catch (error) {
        console.error("[Webhook] Erro fatal:", error instanceof Error ? error.message : error);
        return jsonResponse(500, { success: false, reason: "internal_error" });
      }
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
