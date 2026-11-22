import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { cttTrackingUrl, isCttCarrier } from "./tracking";

/** Em dev lê o .env local; em produção (Vercel) usa as env vars do painel. */
async function loadEnv(): Promise<Record<string, string>> {
  const env = process.env as Record<string, string>;
  try {
    const raw = await readFile(resolve(process.cwd(), ".env"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m?.[1] && m[2] && !env[m[1]]) {
        env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // Sem ficheiro .env em produção — usar apenas process.env.
  }
  return env;
}

export async function sendShopifyOrderEmail(orderData: {
  orderNumber: string;
  customerName: string;
  email: string;
  items: {
    name: string;
    size: number | string;
    quantity: number;
    unitPrice: number;
  }[];
  total: number;
}) {
  const env = await loadEnv();
  const apiKey = env["RESEND_API_KEY"];
  const from = env["RESEND_FROM"] || "onboarding@resend.dev";

  if (!apiKey) {
    console.warn("RESEND_API_KEY não configurada.");
    return { success: false, error: "Missing RESEND_API_KEY" };
  }

  const artigos = orderData.items.map((item) => `- ${item.name} (Tamanho ${item.size})`).join("\n");

  const subject = `Encomenda UFFA ${orderData.orderNumber} confirmada`;
  const body = `Olá, ${orderData.customerName || "Cliente"}! 💗

Muito obrigado pela tua compra na Uffa Store! É um enorme prazer fazer parte do teu estilo.

Artigos adquiridos:
${artigos}

A tua encomenda foi confirmada com sucesso e já está a ser preparada com todo o cuidado. Podes acompanhar o estado em: https://www.uffastore.pt/rastreio

Com carinho e estilo,
Equipa UFFA
atendimento@uffastore.pt`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ from, to: [orderData.email], subject, text: body }),
  });

  const resJson = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    console.error("Erro ao enviar e-mail via Resend:", resJson);
    return { success: false, error: resJson };
  }

  console.log(
    `E-mail de confirmação enviado para ${orderData.email} (Encomenda ${orderData.orderNumber})`,
  );
  return { success: true, data: resJson };
}

export async function sendTrackingEmail(data: {
  email: string;
  orderNumber: string;
  trackingCode: string;
  carrier: string;
  trackingUrl: string;
  estimatedDelivery: string | null;
}) {
  const env = await loadEnv();
  const apiKey = env["RESEND_API_KEY"];
  const from = env["RESEND_FROM"] || "onboarding@resend.dev";

  if (!apiKey) {
    console.warn("RESEND_API_KEY não configurada; e-mail de envio não enviado.");
    return { success: false, error: "Missing RESEND_API_KEY" };
  }

  const cttLink = isCttCarrier(data.carrier)
    ? `\nPodes consultar diretamente no CTT: ${cttTrackingUrl(data.trackingCode)}`
    : "";
  const previsao = data.estimatedDelivery
    ? `\nPrevisão de entrega: ${data.estimatedDelivery}.`
    : "";

  const subject = `Encomenda UFFA ${data.orderNumber} foi enviada`;
  const body = `Olá! 💗

A tua encomenda UFFA ${data.orderNumber} já foi entregue ao transportador.

Transportador: ${data.carrier}
Código de rastreio: ${data.trackingCode}${previsao}${cttLink}

Acompanha tudo no nosso site, com o estado e o atalho para o transportador:
${data.trackingUrl}

Se tiveres alguma dúvida, responde a este e-mail ou escreve para atendimento@uffastore.pt.

Com carinho e estilo,
Equipa UFFA
atendimento@uffastore.pt`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ from, to: [data.email], subject, text: body }),
  });

  const resJson = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    console.error("Erro ao enviar e-mail de envio via Resend:", resJson);
    return { success: false, error: resJson };
  }

  console.log(`E-mail de envio enviado para ${data.email} (Encomenda ${data.orderNumber})`);
  return { success: true, data: resJson };
}
