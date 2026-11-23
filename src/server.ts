import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import {
  FULFILLMENT_WEBHOOK_TOPIC,
  MAX_BODY_BYTES,
  ORDER_UPDATED_TOPIC,
  WebhookDeduplicator,
  isExpectedShop,
  isExpectedTopic,
  verifyShopifyHmac,
} from "./lib/webhook-core";
import { parseFulfillmentPayload, type FulfillmentNotification } from "./lib/fulfillment-webhook";
import { sendContactEmail, sendNpsEmail, sendTrackingEmail } from "./lib/server-actions";
import { parseContactRequest } from "./lib/contact";
import { CONTACT_BODY_LIMIT, CONTACT_PATH } from "./lib/contact-constants";
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
import { loadServerEnv } from "./lib/server-env";

const WEBHOOK_PATH = "/api/webhooks/shopify/orders-paid";
const FULFILLMENT_WEBHOOK_PATH = "/api/webhooks/shopify/orders-fulfilled";
const TRACKING_PATH = "/api/orders/tracking";
const NPS_CRON_PATH = "/api/cron/nps";
const NPS_PATH = "/api/nps";
const TRACKING_BODY_LIMIT = 8_192;
const NPS_BODY_LIMIT = 4_096;

/** Conta bytes UTF-8: `String.length` subestima caracteres multibyte (emoji, acentos). */
const bodyEncoder = new TextEncoder();
function byteLength(value: string): number {
  return bodyEncoder.encode(value).byteLength;
}

// Dois níveis: evita reenvios do mesmo evento e de atualizações posteriores
// com o mesmo código de rastreio (a Shopify pode gerar vários eventos).
const fulfillmentEventDeduplicator = new WebhookDeduplicator();
const fulfillmentTrackingDeduplicator = new WebhookDeduplicator(60 * 60_000, 10_000);

async function handleContact(request: Request): Promise<Response> {
  const declaredLength = Number.parseInt(request.headers.get("content-length") ?? "", 10);
  if (Number.isFinite(declaredLength) && declaredLength > CONTACT_BODY_LIMIT) {
    return jsonResponse(413, { success: false, reason: "payload_too_large" });
  }

  const raw = await request.text();
  if (byteLength(raw) > CONTACT_BODY_LIMIT) {
    return jsonResponse(413, { success: false, reason: "payload_too_large" });
  }

  const parsed = parseContactRequest(raw);
  if (!parsed.ok) return jsonResponse(400, { success: false, reason: parsed.reason });

  const result = await sendContactEmail(parsed.request);
  return jsonResponse(result.success ? 200 : 502, {
    success: result.success,
    reason: result.success ? undefined : "email_failed",
  });
}

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
  if (byteLength(raw) > MAX_BODY_BYTES) {
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

function normalizeShipmentRegistration(
  input: Record<string, unknown>,
): TrackingRegistration | null {
  const orderNumber = cleanString(input["orderNumber"], 40).toUpperCase();
  const trackingCode = cleanString(input["trackingCode"], 40).toUpperCase().replace(/\s+/g, "");
  const carrier = cleanString(input["carrier"], 60) || "CTT Expresso";
  const email = cleanString(input["email"], 160).toLowerCase();
  const deliveryRaw = cleanString(input["estimatedDelivery"], 40);

  if (!orderNumber || !/^[A-Z0-9-]{6,40}$/.test(trackingCode)) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;

  const estimatedDelivery =
    deliveryRaw && !Number.isNaN(Date.parse(deliveryRaw)) ? deliveryRaw : null;
  return { orderNumber, trackingCode, carrier, email, estimatedDelivery };
}

function parseTrackingRegistration(raw: string): TrackingRegistration | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return normalizeShipmentRegistration(parsed as Record<string, unknown>);
  } catch {
    return null;
  }
}

/** Cria o link mágico e envia o e-mail; usado pelo formulário interno e pelo webhook. */
async function issueTrackingLink(registration: TrackingRegistration, request: Request) {
  const secret = getTrackingLinkSecret();
  if (!secret) {
    return { success: false, reason: "tracking_not_configured", emailSent: false, trackingUrl: "" };
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

  return {
    success: emailResult.success,
    reason: emailResult.success ? undefined : "email_failed",
    emailSent: emailResult.success,
    trackingUrl,
  };
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
  if (!adminToken || !getTrackingLinkSecret()) {
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
  if (byteLength(raw) > TRACKING_BODY_LIMIT) {
    return jsonResponse(413, { success: false, reason: "payload_too_large" });
  }

  const registration = parseTrackingRegistration(raw);
  if (!registration) {
    return jsonResponse(400, { success: false, reason: "invalid_payload" });
  }

  const issued = await issueTrackingLink(registration, request);
  return jsonResponse(issued.success ? 200 : 502, {
    success: issued.success,
    reason: issued.reason,
    emailSent: issued.emailSent,
    trackingUrl: issued.trackingUrl,
  });
}

/**
 * Webhooks `orders/fulfilled` e `orders/updated`: quando a equipa adiciona o
 * código de rastreio na Shopify, o cliente recebe o e-mail e o link mágico sem
 * passar por `/expedicao`. O segundo cobre códigos adicionados depois do cumprimento.
 */
async function handleFulfillmentWebhook(request: Request): Promise<Response> {
  const declaredLength = Number.parseInt(request.headers.get("content-length") ?? "", 10);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return jsonResponse(413, { success: false, reason: "payload_too_large" });
  }

  const raw = await request.text();
  if (byteLength(raw) > MAX_BODY_BYTES) {
    return jsonResponse(413, { success: false, reason: "payload_too_large" });
  }

  if (!verifyShopifyHmac(raw, request.headers.get("x-shopify-hmac-sha256"))) {
    return new Response("Unauthorized", { status: 401 });
  }
  const topic = request.headers.get("x-shopify-topic") ?? "";
  const isOrderUpdate = isExpectedTopic(topic, ORDER_UPDATED_TOPIC);
  if (!isOrderUpdate && !isExpectedTopic(topic, FULFILLMENT_WEBHOOK_TOPIC)) {
    return jsonResponse(400, { success: false, reason: "unexpected_topic" });
  }
  if (!isExpectedShop(request.headers.get("x-shopify-shop-domain"))) {
    return jsonResponse(400, { success: false, reason: "unexpected_shop" });
  }

  const eventId = webhookEventId(request);
  if (!fulfillmentEventDeduplicator.claim(eventId)) {
    return jsonResponse(200, { success: true, duplicate: true });
  }

  // Ambos os tópicos trazem a encomenda completa, com `fulfillments`.
  const parsed = parseFulfillmentPayload(raw);
  if (!parsed.ok) {
    fulfillmentEventDeduplicator.release(eventId);
    // Sem e-mail ou sem código não há nada a enviar; não pedir retry à Shopify.
    if (parsed.reason === "no_email" || parsed.reason === "no_tracking_code") {
      return jsonResponse(200, { success: true, ignored: true, reason: parsed.reason });
    }
    return jsonResponse(400, { success: false, reason: parsed.reason });
  }
  const notification: FulfillmentNotification = parsed.notification;

  const registration = normalizeShipmentRegistration({
    orderNumber: notification.orderNumber,
    email: notification.email,
    carrier: notification.carrier,
    trackingCode: notification.trackingCode,
    estimatedDelivery: notification.estimatedDelivery,
  });
  if (!registration || !getTrackingLinkSecret()) {
    fulfillmentEventDeduplicator.release(eventId);
    return jsonResponse(registration ? 503 : 400, {
      success: false,
      reason: registration ? "tracking_not_configured" : "invalid_payload",
    });
  }

  const trackingKey = `${registration.orderNumber}:${registration.trackingCode}`;
  if (!fulfillmentTrackingDeduplicator.claim(trackingKey)) {
    fulfillmentEventDeduplicator.release(eventId);
    return jsonResponse(200, { success: true, duplicate: true });
  }

  const issued = await issueTrackingLink(registration, request);
  if (!issued.success) {
    fulfillmentEventDeduplicator.release(eventId);
    fulfillmentTrackingDeduplicator.release(trackingKey);
    return jsonResponse(502, { success: false, reason: issued.reason ?? "delivery_failed" });
  }

  return jsonResponse(200, {
    success: true,
    emailSent: true,
    orderNumber: registration.orderNumber,
  });
}

function authorizedCron(request: Request, secret: string): boolean {
  const header = request.headers.get("authorization") ?? "";
  const provided = header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : (request.headers.get("x-cron-secret") ?? "");
  return safeEqualStrings(provided, secret);
}

/** Um só disparo de cada vez por instância: Cron e pedido manual não se sobrepõem. */
let npsCronPromise: Promise<Response> | undefined;

async function handleNpsCron(request: Request): Promise<Response> {
  const cronSecret = process.env["CRON_SECRET"]?.trim();
  if (!cronSecret || cronSecret.length < 16) {
    return jsonResponse(503, { success: false, reason: "cron_not_configured" });
  }
  if (!authorizedCron(request, cronSecret)) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (npsCronPromise) {
    return jsonResponse(409, { success: false, reason: "nps_run_in_progress" });
  }

  const run = performNpsCron(request);
  npsCronPromise = run;
  try {
    return await run;
  } finally {
    if (npsCronPromise === run) npsCronPromise = undefined;
  }
}

async function performNpsCron(request: Request): Promise<Response> {
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
  if (byteLength(raw) > NPS_BODY_LIMIT) {
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
    // Uma única leitura do .env garante que todos os endpoints veem os mesmos
    // segredos, quer venham do painel Vercel quer do ficheiro local.
    await loadServerEnv();
    const url = new URL(request.url);

    if (url.pathname === CONTACT_PATH) {
      if (request.method !== "POST") {
        return new Response("Method Not Allowed", {
          status: 405,
          headers: { allow: "POST" },
        });
      }
      try {
        return await handleContact(request);
      } catch (error) {
        console.error("[Contacto] Erro fatal:", error instanceof Error ? error.message : error);
        return jsonResponse(500, { success: false, reason: "internal_error" });
      }
    }

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

    if (url.pathname === FULFILLMENT_WEBHOOK_PATH) {
      if (request.method !== "POST") {
        return new Response("Method Not Allowed", {
          status: 405,
          headers: { allow: "POST" },
        });
      }
      try {
        return await handleFulfillmentWebhook(request);
      } catch (error) {
        console.error("[Expedição] Erro fatal:", error instanceof Error ? error.message : error);
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
