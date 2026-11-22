import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import {
  MAX_BODY_BYTES,
  isExpectedShop,
  isExpectedTopic,
  verifyShopifyHmac,
} from "./lib/webhook-core";
import { sendNpsEmail, sendTrackingEmail } from "./lib/server-actions";
import {
  createTrackingLink,
  getTrackingAdminToken,
  getTrackingLinkSecret,
  safeEqualStrings,
  verifyTrackingLink,
} from "./lib/tracking-link";
import { processOrderPaidWebhook, webhookDeduplicator } from "./lib/webhook-handler";
import { publicOrigin } from "./lib/site-url";
import { shopifyAdminGraphql } from "./lib/shopify-admin";
import { getNpsSecret, verifyNpsLink } from "./lib/nps-link";
import {
  cleanNpsComment,
  customerFirstName,
  getNpsOrder,
  metafieldValue,
  parseNpsScore,
  saveNpsResponse,
} from "./lib/nps-core";
import { runNps } from "./lib/nps-run";

const WEBHOOK_PATH = "/api/webhooks/shopify/orders-paid";
const TRACKING_PATH = "/api/orders/tracking";
const NPS_CRON_PATH = "/api/cron/nps";
const NPS_PATH = "/api/nps";
const TRACKING_BODY_LIMIT = 8_192;
const NPS_BODY_LIMIT = 4_096;

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

  // 1) Integridade: HMAC-SHA256 do corpo raw.
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

type TrackingRegistration = {
  orderNumber: string;
  trackingCode: string;
  carrier: string;
  email: string;
  estimatedDelivery: string | null;
};

function cleanString(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function parseTrackingRegistration(raw: string): TrackingRegistration | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const body = parsed as Record<string, unknown>;

    const orderNumber = cleanString(body["orderNumber"], 40).toUpperCase();
    const trackingCode = cleanString(body["trackingCode"], 40).toUpperCase().replace(/\s+/g, "");
    const carrier = cleanString(body["carrier"], 60) || "CTT Expresso";
    const email = cleanString(body["email"], 160).toLowerCase();
    const deliveryRaw = cleanString(body["estimatedDelivery"], 40);

    if (!orderNumber || !/^[A-Z0-9-]{6,40}$/.test(trackingCode)) return null;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;

    const estimatedDelivery =
      deliveryRaw && !Number.isNaN(Date.parse(deliveryRaw)) ? deliveryRaw : null;
    return { orderNumber, trackingCode, carrier, email, estimatedDelivery };
  } catch {
    return null;
  }
}

function handleTrackingVerify(request: Request): Response {
  const secret = getTrackingLinkSecret();
  if (!secret) {
    return jsonResponse(503, { success: false, reason: "tracking_not_configured" });
  }

  const token = new URL(request.url).searchParams.get("token") ?? "";
  const data = verifyTrackingLink(token, secret);
  if (!data) {
    return jsonResponse(401, { success: false, reason: "invalid_token" });
  }

  return jsonResponse(200, { success: true, order: data });
}

async function handleTrackingRegister(request: Request): Promise<Response> {
  const adminToken = getTrackingAdminToken();
  const secret = getTrackingLinkSecret();
  if (!adminToken || !secret) {
    return jsonResponse(503, { success: false, reason: "tracking_not_configured" });
  }

  const provided = request.headers.get("x-admin-token") ?? "";
  if (!safeEqualStrings(provided, adminToken)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const declaredLength = Number.parseInt(request.headers.get("content-length") ?? "", 10);
  if (Number.isFinite(declaredLength) && declaredLength > TRACKING_BODY_LIMIT) {
    return jsonResponse(413, { success: false, reason: "payload_too_large" });
  }

  const raw = await request.text();
  if (raw.length > TRACKING_BODY_LIMIT) {
    return jsonResponse(413, { success: false, reason: "payload_too_large" });
  }

  const registration = parseTrackingRegistration(raw);
  if (!registration) {
    return jsonResponse(400, { success: false, reason: "invalid_payload" });
  }

  const token = createTrackingLink(
    {
      orderNumber: registration.orderNumber,
      trackingCode: registration.trackingCode,
      carrier: registration.carrier,
      estimatedDelivery: registration.estimatedDelivery,
    },
    secret,
  );
  const trackingUrl = `${publicOrigin(request)}/rastreio?token=${encodeURIComponent(token)}`;

  const emailResult = await sendTrackingEmail({
    email: registration.email,
    orderNumber: registration.orderNumber,
    trackingCode: registration.trackingCode,
    carrier: registration.carrier,
    trackingUrl,
    estimatedDelivery: registration.estimatedDelivery,
  });

  return jsonResponse(emailResult.success ? 200 : 502, {
    success: emailResult.success,
    reason: emailResult.success ? undefined : "email_failed",
    emailSent: emailResult.success,
    trackingUrl,
  });
}

function authorizedCron(request: Request, secret: string): boolean {
  const header = request.headers.get("authorization") ?? "";
  const provided = header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : (request.headers.get("x-cron-secret") ?? "");
  return safeEqualStrings(provided, secret);
}

async function handleNpsCron(request: Request): Promise<Response> {
  const cronSecret = process.env["CRON_SECRET"]?.trim();
  if (!cronSecret) {
    return jsonResponse(503, { success: false, reason: "cron_not_configured" });
  }
  if (!authorizedCron(request, cronSecret)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const secret = getNpsSecret();
  if (!secret) {
    return jsonResponse(503, { success: false, reason: "nps_not_configured" });
  }

  const dryRun = new URL(request.url).searchParams.get("dryRun") === "1";
  if (!dryRun && (process.env["NPS_ENABLED"] ?? "").trim().toLowerCase() !== "true") {
    return jsonResponse(503, { success: false, reason: "nps_disabled" });
  }

  try {
    const result = await runNps({
      graphql: shopifyAdminGraphql,
      send: async (order, surveyUrl) =>
        sendNpsEmail({
          email: order.email,
          orderNumber: order.name,
          customerName: customerFirstName(order),
          surveyUrl,
        }),
      origin: publicOrigin(request),
      secret,
      now: Date.now(),
      dryRun,
    });
    return jsonResponse(result.success ? 200 : 502, result);
  } catch (error) {
    console.error("[NPS] Erro fatal no cron:", error instanceof Error ? error.message : error);
    return jsonResponse(502, { success: false, reason: "shopify_error" });
  }
}

function npsTokenFrom(request: Request): string {
  return new URL(request.url).searchParams.get("token") ?? "";
}

async function handleNpsGet(request: Request): Promise<Response> {
  const secret = getNpsSecret();
  if (!secret) return jsonResponse(503, { success: false, reason: "nps_not_configured" });

  const data = verifyNpsLink(npsTokenFrom(request), secret);
  if (!data) return jsonResponse(401, { success: false, reason: "invalid_token" });

  try {
    const order = await getNpsOrder(shopifyAdminGraphql, data.orderId);
    if (!order) return jsonResponse(404, { success: false, reason: "order_not_found" });
    return jsonResponse(200, {
      success: true,
      order: {
        orderNumber: data.orderNumber,
        customerName: customerFirstName(order),
        score: metafieldValue(order, "score"),
        comment: metafieldValue(order, "comment"),
      },
    });
  } catch (error) {
    console.error("[NPS] Erro ao ler encomenda:", error instanceof Error ? error.message : error);
    return jsonResponse(502, { success: false, reason: "shopify_error" });
  }
}

async function handleNpsPost(request: Request): Promise<Response> {
  const secret = getNpsSecret();
  if (!secret) return jsonResponse(503, { success: false, reason: "nps_not_configured" });

  const declaredLength = Number.parseInt(request.headers.get("content-length") ?? "", 10);
  if (Number.isFinite(declaredLength) && declaredLength > NPS_BODY_LIMIT) {
    return jsonResponse(413, { success: false, reason: "payload_too_large" });
  }
  const raw = await request.text();
  if (raw.length > NPS_BODY_LIMIT) {
    return jsonResponse(413, { success: false, reason: "payload_too_large" });
  }

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("payload");
    body = parsed as Record<string, unknown>;
  } catch {
    return jsonResponse(400, { success: false, reason: "invalid_payload" });
  }

  const data = verifyNpsLink(cleanString(body["token"], 2_048), secret);
  if (!data) return jsonResponse(401, { success: false, reason: "invalid_token" });

  const score = parseNpsScore(body["score"]);
  if (score === null) return jsonResponse(400, { success: false, reason: "invalid_score" });

  try {
    await saveNpsResponse(shopifyAdminGraphql, {
      orderId: data.orderId,
      score,
      comment: cleanNpsComment(body["comment"]),
      now: Date.now(),
    });
    return jsonResponse(200, { success: true, orderNumber: data.orderNumber, score });
  } catch (error) {
    console.error(
      "[NPS] Erro ao guardar resposta:",
      error instanceof Error ? error.message : error,
    );
    return jsonResponse(502, { success: false, reason: "shopify_error" });
  }
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

    if (url.pathname === TRACKING_PATH) {
      if (request.method === "GET") return handleTrackingVerify(request);
      if (request.method === "POST") {
        try {
          return await handleTrackingRegister(request);
        } catch (error) {
          console.error("[Tracking] Erro fatal:", error instanceof Error ? error.message : error);
          return jsonResponse(500, { success: false, reason: "internal_error" });
        }
      }
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { allow: "GET, POST" },
      });
    }

    if (url.pathname === NPS_CRON_PATH) {
      if (request.method !== "GET" && request.method !== "POST") {
        return new Response("Method Not Allowed", {
          status: 405,
          headers: { allow: "GET, POST" },
        });
      }
      try {
        return await handleNpsCron(request);
      } catch (error) {
        console.error("[NPS] Erro fatal no cron:", error instanceof Error ? error.message : error);
        return jsonResponse(500, { success: false, reason: "internal_error" });
      }
    }

    if (url.pathname === NPS_PATH) {
      if (request.method === "GET") {
        try {
          return await handleNpsGet(request);
        } catch (error) {
          console.error(
            "[NPS] Erro fatal na leitura:",
            error instanceof Error ? error.message : error,
          );
          return jsonResponse(500, { success: false, reason: "internal_error" });
        }
      }
      if (request.method === "POST") {
        try {
          return await handleNpsPost(request);
        } catch (error) {
          console.error(
            "[NPS] Erro fatal na resposta:",
            error instanceof Error ? error.message : error,
          );
          return jsonResponse(500, { success: false, reason: "internal_error" });
        }
      }
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { allow: "GET, POST" },
      });
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
