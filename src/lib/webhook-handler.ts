import { createHmac, timingSafeEqual } from "node:crypto";
import { sendShopifyOrderEmail } from "@/lib/server-actions";

const WEBHOOK_SECRET = process.env["SHOPIFY_WEBHOOK_SECRET"] ?? "";

type ShopifyLine = {
  title?: string;
  name?: string;
  quantity?: number;
  price?: string;
  variant_title?: string;
};

type ShopifyOrder = {
  email?: string;
  contact_email?: string;
  customer?: { email?: string; first_name?: string; last_name?: string };
  billing_address?: { first_name?: string; last_name?: string };
  name?: string;
  order_number?: number;
  number?: number;
  line_items?: ShopifyLine[];
  total_price?: string;
};

/** Valida a assinatura X-Shopify-Hmac-Sha256 (HMAC-SHA256 do body raw, em base64). */
export function verifyShopifyHmac(rawBody: string, hmacHeader: string | null): boolean {
  if (!WEBHOOK_SECRET) {
    console.warn("[Webhook] SHOPIFY_WEBHOOK_SECRET não configurado — webhook rejeitado.");
    return false;
  }
  if (!hmacHeader) return false;

  const expected = createHmac("sha256", WEBHOOK_SECRET).update(rawBody, "utf8").digest("base64");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(hmacHeader, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function processOrderPaidWebhook(bodyText: string) {
  try {
    const payload = JSON.parse(bodyText) as ShopifyOrder;
    const email = payload.email || payload.contact_email || payload.customer?.email;
    if (!email) {
      console.log("[Webhook] Nenhum e-mail de cliente encontrado no payload.");
      return { success: false, error: "No email" };
    }

    const orderNumber = payload.name || `#${payload.order_number || payload.number}`;
    const firstName = payload.customer?.first_name || payload.billing_address?.first_name || "";
    const lastName = payload.customer?.last_name || payload.billing_address?.last_name || "";
    const customerName = `${firstName} ${lastName}`.trim() || "Cliente UFFA";

    const items = (payload.line_items || []).map((line) => {
      const sizeOpt = String(line.variant_title || "")
        .split("/")
        .map((s) => s.trim())
        .filter(Boolean);
      const sizeVal = sizeOpt[sizeOpt.length - 1] ?? "EU";

      return {
        name: line.title || line.name || "Sneakers UFFA",
        size: sizeVal,
        quantity: line.quantity || 1,
        unitPrice: parseFloat(line.price || "0"),
      };
    });

    const total = parseFloat(payload.total_price || "0");
    console.log(`[Webhook] A enviar e-mail para ${email} (Encomenda ${orderNumber})...`);

    return await sendShopifyOrderEmail({ orderNumber, customerName, email, items, total });
  } catch (err) {
    console.error("[Webhook Error]", err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
