import { cttTrackingUrl, isCttCarrier } from "./tracking.ts";
import { company } from "./legal.ts";
import { loadServerEnv } from "./server-env.ts";
import type { ContactRequest } from "./contact.ts";
import type { ProductRequest } from "./product-request.ts";

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
  const env = await loadServerEnv();
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
  const env = await loadServerEnv();
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

export async function sendNpsEmail(data: {
  email: string;
  orderNumber: string;
  customerName: string;
  surveyUrl: string;
}) {
  const env = await loadServerEnv();
  const apiKey = env["RESEND_API_KEY"];
  const from = env["RESEND_FROM"] || "onboarding@resend.dev";

  if (!apiKey) {
    console.warn("RESEND_API_KEY não configurada; convite NPS não enviado.");
    return { success: false, error: "Missing RESEND_API_KEY" };
  }

  const subject = `Como foi a tua experiência com a UFFA?`;
  const body = `Olá, ${data.customerName}! 💗

Já passaram alguns dias desde a tua encomenda ${data.orderNumber} e adoraríamos saber como correu.

Dá-nos uma nota de 0 a 5 e, se quiseres, deixa um comentário:
${data.surveyUrl}

Demora menos de um minuto e ajuda-nos a melhorar a Uffa Store.

Se preferires não responder, basta ignorar este e-mail.

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
    console.error("Erro ao enviar convite NPS via Resend:", resJson);
    return { success: false, error: resJson };
  }

  console.log(`Convite NPS enviado para ${data.email} (Encomenda ${data.orderNumber})`);
  return { success: true, data: resJson };
}

export type NpsResponseNotification = {
  email: string;
  orderNumber: string;
  score: number;
  comment: string;
};

/** Texto da notificação interna; separado para poder ser testado sem rede. */
export function buildNpsResponseEmail(data: NpsResponseNotification) {
  const subject = `[NPS] Avaliação ${data.score}/5 — Encomenda ${data.orderNumber}`;
  const text = `Nova avaliação recebida através do link enviado pela UFFA Store.

Encomenda: ${data.orderNumber}
Nota: ${data.score}/5
Cliente: ${data.email || "(não indicado)"}
Comentário: ${data.comment || "(sem comentário)"}

A resposta também fica guardada nos metacampos uffa_nps da encomenda na Shopify.`;

  return { subject, text };
}

/** Avisa a loja por e-mail quando um cliente responde ao NPS. Não guarda dados no servidor. */
export async function sendNpsResponseNotification(data: NpsResponseNotification) {
  const env = await loadServerEnv();
  const apiKey = env["RESEND_API_KEY"];
  const from = env["RESEND_FROM"] || "onboarding@resend.dev";

  if (!apiKey) {
    console.warn("RESEND_API_KEY não configurada; notificação NPS não enviada.");
    return { success: false, error: "Missing RESEND_API_KEY" };
  }

  const { subject, text } = buildNpsResponseEmail(data);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [company.email],
      ...(data.email ? { reply_to: data.email.slice(0, 254) } : {}),
      subject,
      text,
    }),
  });

  const resJson = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    console.error("Erro ao enviar notificação NPS via Resend:", resJson);
    return { success: false, error: resJson };
  }

  console.log(`Notificação NPS enviada para ${company.email} (Encomenda ${data.orderNumber})`);
  return { success: true, data: resJson };
}

const CONTACT_REASON_LABELS: Record<ContactRequest["reason"], string> = {
  geral: "Dúvida geral",
  troca_defeito: "Troca ou defeito no produto",
  encomenda: "Encomenda e entrega",
  outro: "Outro",
};

/** Envia o pedido de contacto ao apoio, com a fotografia em anexo quando existe. */
export async function sendContactEmail(data: ContactRequest) {
  const env = await loadServerEnv();
  const apiKey = env["RESEND_API_KEY"];
  const from = env["RESEND_FROM"] || "onboarding@resend.dev";

  if (!apiKey) {
    console.warn("RESEND_API_KEY não configurada; pedido de contacto não enviado.");
    return { success: false, error: "Missing RESEND_API_KEY" };
  }

  const subject = `[Apoio UFFA] ${CONTACT_REASON_LABELS[data.reason]}${
    data.subject ? ` — ${data.subject}` : ""
  }`;
  const body = `Novo pedido de contacto através do site uffastore.pt.

Nome: ${data.name}
Email: ${data.email}
Motivo: ${CONTACT_REASON_LABELS[data.reason]}
Encomenda: ${data.orderNo || "(não indicada)"}
Assunto: ${data.subject || "(sem assunto)"}

Mensagem:
${data.message}

${data.image ? `Fotografia em anexo: ${data.image.name}` : "Sem fotografia anexa."}

Responder diretamente a ${data.email}.`;

  const attachments = data.image
    ? [
        {
          filename: data.image.name,
          content: data.image.data,
          content_type: data.image.type,
        },
      ]
    : [];

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [company.email],
      reply_to: data.email,
      subject,
      text: body,
      attachments,
    }),
  });

  const resJson = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    console.error("Erro ao enviar pedido de contacto via Resend:", resJson);
    return { success: false, error: resJson };
  }

  console.log(
    `Pedido de contacto enviado para ${company.email} (${CONTACT_REASON_LABELS[data.reason]}, ${data.email})${data.image ? " com fotografia" : ""}`,
  );
  return { success: true, data: resJson };
}

/** Envia o pedido de um produto não encontrado para a UFFA responder diretamente. */
export async function sendProductRequestEmail(data: ProductRequest) {
  const env = await loadServerEnv();
  const apiKey = env["RESEND_API_KEY"];
  const from = env["RESEND_FROM"] || "onboarding@resend.dev";

  if (!apiKey) {
    console.warn("RESEND_API_KEY não configurada; pedido de produto não enviado.");
    return { success: false, error: "Missing RESEND_API_KEY" };
  }

  const subject = `[Pedido UFFA] ${data.product} — ${data.brand}`;
  const body = `Novo pedido de produto através do site uffastore.pt.

Produto procurado: ${data.product}
Marca: ${data.brand}

Descrição:
${data.description}

Email: ${data.email}
Telemóvel: ${data.phone}

Responder diretamente a ${data.email} ou ligar para ${data.phone}.`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [company.email],
      reply_to: data.email,
      subject,
      text: body,
    }),
  });

  const resJson = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    console.error("Erro ao enviar pedido de produto via Resend:", resJson);
    return { success: false, error: resJson };
  }

  console.log(`Pedido de produto enviado para ${company.email} (${data.product}, ${data.email})`);
  return { success: true, data: resJson };
}
