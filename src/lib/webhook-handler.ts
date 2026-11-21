import { sendShopifyOrderEmail } from "@/lib/server-actions";
import { parseOrderPaidPayload, WebhookDeduplicator, type ParsedOrder } from "@/lib/webhook-core";

export {
  MAX_BODY_BYTES,
  WEBHOOK_TOPIC,
  getWebhookSecret,
  isExpectedShop,
  isExpectedTopic,
  parseOrderPaidPayload,
  verifyShopifyHmac,
} from "@/lib/webhook-core";

export type OrderEmailSender = (order: ParsedOrder) => Promise<{ success: boolean }>;

export type WebhookResult = {
  success: boolean;
  reason?: "invalid_payload" | "no_email" | "delivery_failed" | "duplicate";
  duplicate?: boolean;
};

export const webhookDeduplicator = new WebhookDeduplicator();

/**
 * Processa um pedido pago já autenticado.
 * `sender` é injetável para permitir testes sem rede/Resend.
 */
export async function processOrderPaidWebhook(
  bodyText: string,
  sender: OrderEmailSender = sendShopifyOrderEmail,
): Promise<WebhookResult> {
  const parsed = parseOrderPaidPayload(bodyText);
  if (!parsed.ok) {
    console.log(`[Webhook] Payload rejeitado: ${parsed.reason}`);
    return { success: false, reason: parsed.reason };
  }

  console.log(
    `[Webhook] A enviar e-mail para ${parsed.order.email} (Encomenda ${parsed.order.orderNumber})...`,
  );

  try {
    const result = await sender(parsed.order);
    if (!result.success) {
      console.error("[Webhook] Entrega falhou; a Shopify pode retentar.");
      return { success: false, reason: "delivery_failed" };
    }
    return { success: true };
  } catch (error) {
    // Nunca devolver detalhes internos ao chamador.
    console.error("[Webhook Error]", error instanceof Error ? error.message : "erro desconhecido");
    return { success: false, reason: "delivery_failed" };
  }
}
