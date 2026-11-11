import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";
import { company, legalLastUpdated } from "@/lib/legal";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — Uffa Store" },
      {
        name: "description",
        content: "Como a Uffa Store recolhe, utiliza e protege os dados pessoais dos clientes.",
      },
      { property: "og:title", content: "Política de Privacidade — Uffa Store" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/privacidade" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage
      title="Política de Privacidade"
      intro="Esta política explica que dados pessoais recolhemos, para que finalidades, com quem os partilhamos e como podes exercer os teus direitos, nos termos do Regulamento Geral sobre a Proteção de Dados (RGPD)."
      updated={legalLastUpdated}
      sections={[
        {
          heading: "1. Responsável pelo tratamento",
          body: (
            <>
              <p>
                O responsável pelo tratamento é <strong>{company.legalName}</strong>, com sede em{" "}
                {company.address}, NIF {company.nif}.
              </p>
              <p>
                Para qualquer questão de privacidade, contacta{" "}
                <a className="text-primary underline" href={`mailto:${company.email}`}>
                  {company.email}
                </a>
                .
              </p>
            </>
          ),
        },
        {
          heading: "2. Dados que recolhemos",
          body: (
            <ul className="list-disc space-y-2 pl-4">
              <li>Dados de identificação e contacto: nome, email, telefone e morada de entrega.</li>
              <li>
                Dados da encomenda: produtos, tamanho, quantidade, valor e estado da encomenda.
              </li>
              <li>
                Dados de comunicação: mensagens enviadas pelo formulário de contacto ou email.
              </li>
              <li>
                Dados técnicos: endereço IP, tipo de dispositivo e registos de acesso ao site.
              </li>
              <li>
                Subscrição da newsletter: endereço de email e data de consentimento. Não recolhemos
                dados de cartão no site; o pagamento é processado no checkout da Shopify.
              </li>
            </ul>
          ),
        },
        {
          heading: "3. Finalidades e fundamentos legais",
          body: (
            <ul className="list-disc space-y-2 pl-4">
              <li>
                <strong>Execução do contrato:</strong> processar encomendas, entregas, devoluções e
                apoio ao cliente.
              </li>
              <li>
                <strong>Obrigação legal:</strong> faturação, contabilidade e conservação de registos
                fiscais.
              </li>
              <li>
                <strong>Consentimento:</strong> envio de newsletter e comunicações de marketing.
                Podes retirar o consentimento em qualquer momento.
              </li>
              <li>
                <strong>Interesse legítimo:</strong> segurança do site, prevenção de fraude e
                melhoria do serviço.
              </li>
            </ul>
          ),
        },
        {
          heading: "4. Cookies e armazenamento local",
          body: (
            <p>
              O site utiliza armazenamento local do navegador para guardar preferências (idioma,
              tema), carrinho, favoritos e sessão do portal de encomendas. Estes dados ficam no teu
              dispositivo e podem ser apagados nas definições do navegador. Não usamos cookies de
              publicidade nem píxeis de redes sociais.
            </p>
          ),
        },
        {
          heading: "5. Partilha com terceiros",
          body: (
            <ul className="list-disc space-y-2 pl-4">
              <li>
                <strong>Shopify</strong> — catálogo, checkout e processamento de pagamentos.
              </li>
              <li>
                <strong>Vercel</strong> — alojamento do site e registos técnicos.
              </li>
              <li>
                <strong>FormSubmit</strong> — entrega das subscrições da newsletter por email.
              </li>
              <li>
                <strong>Google Fonts</strong> — carregamento de tipos de letra.
              </li>
            </ul>
          ),
        },
        {
          heading: "6. Prazos de conservação",
          body: (
            <p>
              Conservamos os dados da encomenda durante o prazo legal de conservação fiscal (10
              anos). Os dados de marketing são conservados até retirares o consentimento. Os
              registos técnicos são conservados pelo período estritamente necessário à segurança do
              serviço.
            </p>
          ),
        },
        {
          heading: "7. Os teus direitos",
          body: (
            <p>
              Tens direito de acesso, retificação, apagamento, limitação, portabilidade e oposição.
              Para exercer qualquer direito, envia um pedido para{" "}
              <a className="text-primary underline" href={`mailto:${company.email}`}>
                {company.email}
              </a>
              . Responderemos no prazo legal de um mês.
            </p>
          ),
        },
        {
          heading: "8. Reclamações",
          body: (
            <p>
              Podes apresentar reclamação à Comissão Nacional de Proteção de Dados (CNPD), em{" "}
              <a
                className="text-primary underline"
                href="https://www.cnpd.pt"
                target="_blank"
                rel="noopener noreferrer"
              >
                www.cnpd.pt
              </a>
              , sem prejuízo de contacto prévio connosco.
            </p>
          ),
        },
        {
          heading: "9. Alterações",
          body: (
            <p>
              Podemos atualizar esta política. A data da última atualização está indicada no topo.
              Alterações materiais serão comunicadas pelos canais habituais.
            </p>
          ),
        },
      ]}
    />
  );
}
