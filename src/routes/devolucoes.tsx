import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";
import { company, legalLastUpdated } from "@/lib/legal";

export const Route = createFileRoute("/devolucoes")({
  head: () => ({
    meta: [
      { title: "Devoluções e Reembolsos — Uffa Store" },
      {
        name: "description",
        content:
          "Política de devoluções da Uffa Store: 14 dias para livre resolução, condições e reembolsos.",
      },
      { property: "og:title", content: "Devoluções e Reembolsos — Uffa Store" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/devolucoes" }],
  }),
  component: ReturnsPage,
});

function ReturnsPage() {
  return (
    <LegalPage
      title="Devoluções e Reembolsos"
      intro="Queremos que compres com confiança. Tens direito legal a devolver a tua encomenda no prazo de 14 dias, sem necessidade de justificação."
      updated={legalLastUpdated}
      sections={[
        {
          heading: "1. Direito de livre resolução (14 dias)",
          body: (
            <p>
              Nos termos do Decreto-Lei n.º 24/2014, tens direito a resolver o contrato no prazo de
              14 dias a contar do dia em que recebes o produto. Não precisas de indicar o motivo.
              Basta informar-nos por email antes de terminar o prazo.
            </p>
          ),
        },
        {
          heading: "2. Como devolver",
          body: (
            <ol className="list-decimal space-y-2 pl-4">
              <li>
                Envia um email para{" "}
                <a className="text-primary underline" href={`mailto:${company.email}`}>
                  {company.email}
                </a>{" "}
                com o número da encomenda e os artigos a devolver.
              </li>
              <li>Confirmamos a devolução e indicamos a morada de envio.</li>
              <li>
                Devolve os artigos no prazo de 14 dias após a comunicação, na embalagem original e
                sem sinais de uso.
              </li>
            </ol>
          ),
        },
        {
          heading: "3. Condições",
          body: (
            <ul className="list-disc space-y-2 pl-4">
              <li>O produto deve estar sem uso, limpo e com etiquetas e embalagem originais.</li>
              <li>Inclui a prova de compra ou o número da encomenda.</li>
              <li>
                Os custos de devolução são suportados pelo cliente, salvo produto defeituoso ou erro
                nosso.
              </li>
            </ul>
          ),
        },
        {
          heading: "4. Reembolsos",
          body: (
            <p>
              Após recebermos e verificarmos os artigos, reembolsamos o valor pago no prazo máximo
              de 14 dias, através do mesmo meio de pagamento utilizado na compra. Os portes de envio
              inicial só são reembolsados se a devolução abranger a totalidade da encomenda.
            </p>
          ),
        },
        {
          heading: "5. Produtos com defeito",
          body: (
            <p>
              Se o produto chegar danificado ou apresentar defeito de fabrico, contacta-nos nas
              primeiras 48 horas com fotografias. Nesse caso, assumimos os custos de devolução e
              enviamos um produto novo ou reembolsamos integralmente, conforme a tua preferência.
            </p>
          ),
        },
        {
          heading: "6. Trocas",
          body: (
            <p>
              Podes pedir a troca por outro tamanho ou modelo, sujeita a disponibilidade de stock. A
              troca segue as mesmas condições da devolução e eventuais diferenças de preço são
              acertadas.
            </p>
          ),
        },
        {
          heading: "7. Exceções",
          body: (
            <p>
              O direito de livre resolução não se aplica a produtos personalizados ou feitos por
              medida, nem a artigos selados por razões de higiene depois de abertos, nos termos da
              lei.
            </p>
          ),
        },
        {
          heading: "8. Contacto",
          body: (
            <p>
              Para qualquer dúvida sobre devoluções, escreve para{" "}
              <a className="text-primary underline" href={`mailto:${company.email}`}>
                {company.email}
              </a>
              . Podes também apresentar reclamação no{" "}
              <a
                className="text-primary underline"
                href={company.complaintsBook}
                target="_blank"
                rel="noopener noreferrer"
              >
                Livro de Reclamações Eletrónico
              </a>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
