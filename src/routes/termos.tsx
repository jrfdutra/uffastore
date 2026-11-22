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
              {company.address}. Contacto:{" "}
              <a className="text-primary underline" href={`mailto:${company.email}`}>
                {company.email}
              </a>
              .
            </p>
          ),
        },
        {
          heading: "2. Produtos",
          body: (
            <p>
              Vendemos sapatilhas selecionadas pela Uffa Store. As fotografias e descrições são
              meramente ilustrativas; pequenas variações de cor ou acabamento podem ocorrer. O stock
              é atualizado regularmente, mas pode haver indisponibilidade pontual.
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
              para Portugal Continental e Ilhas, União Europeia e Suíça. O prazo de entrega é de 7 a
              10 dias úteis e pode variar em períodos de maior procura. O código de rastreio é
              disponibilizado após expedição.
            </p>
          ),
        },
        {
          heading: "5. Garantia e defeitos",
          body: (
            <p>
              Se o produto apresentar defeito, contacta-nos em{" "}
              <a className="text-primary underline" href={`mailto:${company.email}`}>
                {company.email}
              </a>{" "}
              com prova de compra e fotografias do defeito. O par não pode ser utilizado: pares com
              sinais de uso não são aceites para análise.
            </p>
          ),
        },
        {
          heading: "6. Responsabilidade",
          body: (
            <p>
              A Uffa Store não é responsável por atrasos causados por transportadoras, casos de
              força maior ou utilização indevida dos produtos. Nada nestes termos limita os direitos
              legais do consumidor.
            </p>
          ),
        },
        {
          heading: "7. Propriedade intelectual",
          body: (
            <p>
              A marca, logótipo, fotografias e textos do site pertencem à Uffa Store ou são
              utilizados com autorização. É proibida a reprodução sem consentimento escrito.
            </p>
          ),
        },
      ]}
    />
  );
}
