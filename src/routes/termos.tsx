import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";
import { company, legalLastUpdated } from "@/lib/legal";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos e Condições — Uffa Store" },
      {
        name: "description",
        content:
          "Termos e condições de venda da Uffa Store: encomendas, pagamentos, entregas e garantias.",
      },
      { property: "og:title", content: "Termos e Condições — Uffa Store" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/termos" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPage
      title="Termos e Condições"
      intro="Estes termos regulam a venda de produtos através do site uffastore.pt. Ao efetuar uma encomenda, aceitas as condições abaixo."
      updated={legalLastUpdated}
      sections={[
        {
          heading: "1. Identificação do vendedor",
          body: (
            <p>
              O site é explorado por <strong>{company.legalName}</strong>, com sede em{" "}
              {company.address}, NIF {company.nif}. Contacto:{" "}
              <a className="text-primary underline" href={`mailto:${company.email}`}>
                {company.email}
              </a>
              .
            </p>
          ),
        },
        {
          heading: "2. Produtos e autenticidade",
          body: (
            <p>
              Vendemos sapatilhas verificadas e autenticadas pela Uffa Store. As fotografias e
              descrições são meramente ilustrativas; pequenas variações de cor ou acabamento podem
              ocorrer. O stock é atualizado regularmente, mas pode haver indisponibilidade pontual.
            </p>
          ),
        },
        {
          heading: "3. Preços e pagamentos",
          body: (
            <p>
              Os preços são apresentados em euros (€) e incluem IVA à taxa legal em vigor. Os portes
              são calculados no checkout. O pagamento é processado no checkout seguro da Shopify;
              não recolhemos nem armazenamos dados de cartão no site.
            </p>
          ),
        },
        {
          heading: "4. Encomendas e entregas",
          body: (
            <p>
              A encomenda é confirmada após pagamento. Oferecemos recolha em mãos no Porto e envio
              para Portugal Continental e Ilhas, União Europeia e Suíça. Os prazos de entrega são
              indicativos e podem variar em períodos de maior procura. O código de rastreio é
              disponibilizado após expedição.
            </p>
          ),
        },
        {
          heading: "5. Direito de livre resolução",
          body: (
            <p>
              Nos termos da lei, tens direito a resolver o contrato no prazo de 14 dias a contar da
              receção do produto, sem necessidade de justificação. Consulta a{" "}
              <a className="text-primary underline" href="/devolucoes">
                política de devoluções
              </a>{" "}
              para saber como exercer este direito.
            </p>
          ),
        },
        {
          heading: "6. Garantia e defeitos",
          body: (
            <p>
              Os produtos beneficiam da garantia legal de conformidade de 3 anos para bens móveis
              novos. Se o produto apresentar defeito, contacta-nos em{" "}
              <a className="text-primary underline" href={`mailto:${company.email}`}>
                {company.email}
              </a>{" "}
              com prova de compra e fotografias do defeito.
            </p>
          ),
        },
        {
          heading: "7. Responsabilidade",
          body: (
            <p>
              A Uffa Store não é responsável por atrasos causados por transportadoras, casos de
              força maior ou utilização indevida dos produtos. Nada nestes termos limita os direitos
              legais do consumidor.
            </p>
          ),
        },
        {
          heading: "8. Propriedade intelectual",
          body: (
            <p>
              A marca, logótipo, fotografias e textos do site pertencem à Uffa Store ou são
              utilizados com autorização. É proibida a reprodução sem consentimento escrito.
            </p>
          ),
        },
        {
          heading: "9. Lei aplicável e resolução de litígios",
          body: (
            <p>
              Aplica-se a lei portuguesa. Em caso de litígio, o consumidor pode recorrer às
              entidades de resolução alternativa de litígios de consumo competentes ou ao Livro de
              Reclamações Eletrónico, disponível em{" "}
              <a
                className="text-primary underline"
                href={company.complaintsBook}
                target="_blank"
                rel="noopener noreferrer"
              >
                livroreclamacoes.pt
              </a>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
