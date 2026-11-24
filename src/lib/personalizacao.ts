/**
 * Opções de personalização da Air Force W Rope Lace.
 *
 * São escolhas do cliente e não variantes da Shopify: não criam SKUs nem
 * alteram o stock. Seguem na encomenda como atributos da linha do carrinho.
 */

export type OpcaoPersonalizacao = {
  slug: string;
  name: string;
};

export type Personalizacao = {
  corda?: string;
  fio?: string;
};

export const PRODUTO_PERSONALIZAVEL = "nike-air-force-chapa-dourada";

export const CORDAS: readonly OpcaoPersonalizacao[] = [
  { slug: "bege", name: "bege" },
  { slug: "cinza", name: "cinza" },
  { slug: "preto", name: "preto" },
  { slug: "branco", name: "branco" },
];

export const FIOS: readonly OpcaoPersonalizacao[] = [
  { slug: "vermelho", name: "vermelho" },
  { slug: "branco", name: "branco" },
  { slug: "preto", name: "preto" },
  { slug: "laranja", name: "laranja" },
  { slug: "rosa", name: "rosa" },
];

export function temPersonalizacao(productId: string): boolean {
  return productId === PRODUTO_PERSONALIZAVEL;
}

function normalizar(personalizacao?: Personalizacao): Personalizacao {
  return {
    ...(personalizacao?.corda ? { corda: personalizacao.corda } : {}),
    ...(personalizacao?.fio ? { fio: personalizacao.fio } : {}),
  };
}

/** Duas escolhas só são iguais quando têm a mesma corda e o mesmo fio. */
export function mesmaPersonalizacao(a?: Personalizacao, b?: Personalizacao): boolean {
  const esq = normalizar(a);
  const dir = normalizar(b);
  return esq.corda === dir.corda && esq.fio === dir.fio;
}

export function personalizacaoCompleta(personalizacao?: Personalizacao): boolean {
  const escolha = normalizar(personalizacao);
  return (
    Boolean(escolha.corda) &&
    Boolean(escolha.fio) &&
    CORDAS.some((opcao) => opcao.slug === escolha.corda) &&
    FIOS.some((opcao) => opcao.slug === escolha.fio)
  );
}

export function nomeCorda(slug?: string): string | undefined {
  return slug ? (CORDAS.find((opcao) => opcao.slug === slug)?.name ?? slug) : undefined;
}

export function nomeFio(slug?: string): string | undefined {
  return slug ? (FIOS.find((opcao) => opcao.slug === slug)?.name ?? slug) : undefined;
}

/** Texto curto para mostrar no carrinho, na confirmação e na encomenda. */
export function textoPersonalizacao(personalizacao?: Personalizacao): string {
  const escolha = normalizar(personalizacao);
  return [
    escolha.corda ? `Corda: ${nomeCorda(escolha.corda)}` : "",
    escolha.fio ? `Fio: ${nomeFio(escolha.fio)}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

/** Atributos da linha do carrinho, tal como aparecem na encomenda da Shopify. */
export function atributosPersonalizacao(
  personalizacao?: Personalizacao,
): { key: string; value: string }[] {
  const escolha = normalizar(personalizacao);
  return [
    ...(escolha.corda ? [{ key: "Corda", value: nomeCorda(escolha.corda) ?? escolha.corda }] : []),
    ...(escolha.fio ? [{ key: "Fio", value: nomeFio(escolha.fio) ?? escolha.fio }] : []),
  ];
}
