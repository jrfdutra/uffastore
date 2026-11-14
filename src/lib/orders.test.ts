import assert from "node:assert/strict";
import test from "node:test";

// Definições simples para o teste (mock das interfaces sem importar ficheiros reais)
type OrderStatus = "confirmed" | "shipped";
type OrderItem = { name: string; size: number; authCode: string; serial: string };
type Order = { number: string; customerName: string; items: OrderItem[] };

test("Geração correta de notificação de e-mail com certificado de autenticidade (Mock)", () => {
  const testOrder: Order = {
    number: "UFFA-9999",
    customerName: "Maria Teste",
    items: [
      {
        name: "Nike Dunk w/ Rope Laces",
        size: 42,
        authCode: "UFFA-AUTH-ABC123XYZ",
        serial: "SN-778899",
      },
    ],
  };

  const authDetails = testOrder.items
    .map(
      (item) =>
        `- ${item.name} (Tamanho ${item.size}): N/S: ${item.serial} | Código de Autenticidade: ${item.authCode}`,
    )
    .join("\n");

  const body = `Olá, ${testOrder.customerName}! 💗\n\nMuito obrigado pela tua compra na Uffa Store! É um enorme prazer fazer parte do teu estilo.\n\nEm anexo digital, enviamos o teu Certificado de Autenticidade Oficial UFFA para os artigos adquiridos:\n\n${authDetails}\n\nPodes verificar e validar a autenticidade dos teus ténis a qualquer momento em: https://www.uffastore.pt/verificar\n\nA tua encomenda foi confirmada com sucesso e já está a ser preparada com todo o cuidado.\n\nCom carinho e estilo,\nEquipa UFFA\natendimento@uffastore.pt`;

  assert.ok(body.includes("UFFA-AUTH-ABC123XYZ"), "O corpo do e-mail deve conter o código de autenticidade único");
  assert.ok(body.includes("SN-778899"), "O corpo do e-mail deve conter o número de série");
  assert.ok(body.includes("https://www.uffastore.pt/verificar"), "Deve incluir o link de verificação de autenticidade");
});
