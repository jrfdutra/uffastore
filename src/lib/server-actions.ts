import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

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
    authCode?: string;
    serial?: string;
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

  const authDetails = orderData.items
    .map(
      (item, index) =>
        `- ${item.name} (Tamanho ${item.size}): N/S: ${item.serial || `UFFA-SN${100000 + index}`} | Código do par: ${item.authCode || `UFFA-${100000 + index}`}`,
    )
    .join("\n");

  const subject = `Certificado de Autenticidade e Agradecimento · Encomenda UFFA ${orderData.orderNumber}`;
  const body = `Olá, ${orderData.customerName || "Cliente"}! 💗

Muito obrigado pela tua compra na Uffa Store! É um enorme prazer fazer parte do teu estilo.

Em anexo digital, enviamos o teu Certificado de Autenticidade Oficial UFFA para os artigos adquiridos:

${authDetails}

Com o código do par podes consultar a situação de entrega e validar a autenticidade a qualquer momento em: https://www.uffastore.pt/verificar

A tua encomenda foi confirmada com sucesso e já está a ser preparada com todo o cuidado.

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
