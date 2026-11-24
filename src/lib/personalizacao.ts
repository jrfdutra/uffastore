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
  /** Cor da Air Force escolhida no AIR FORCE FLORAL. */
  corAirForce?: string;
};

export const PRODUTOS_PERSONALIZAVEIS = [
  "nike-air-force-chapa-dourada",
  "air-force-w-rope-lace-offwhite",
] as const;

export const PRODUTO_PERSONALIZAVEL = PRODUTOS_PERSONALIZAVEIS[0];

/** Só o anúncio OffWhite tem a opção de cor do fio. */
export const PRODUTO_COM_FIO = "air-force-w-rope-lace-offwhite";

/** O AIR FORCE FLORAL permite escolher a cor da Air Force. */
export const PRODUTO_COM_COR_AIR_FORCE = "air-force-floral-w-rope-laces";

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

export const CORES_AIR_FORCE: readonly OpcaoPersonalizacao[] = [
  { slug: "branco", name: "Branco" },
  { slug: "preto", name: "Preto" },
];

export function temPersonalizacao(productId: string): boolean {
  return (PRODUTOS_PERSONALIZAVEIS as readonly string[]).includes(productId);
}

export function temFio(productId: string): boolean {
  return productId === PRODUTO_COM_FIO;
}

export function temCorAirForce(productId: string): boolean {
  return productId === PRODUTO_COM_COR_AIR_FORCE;
}

function normalizar(personalizacao?: Personalizacao): Personalizacao {
  return {
    ...(personalizacao?.corda ? { corda: personalizacao.corda } : {}),
    ...(personalizacao?.fio ? { fio: personalizacao.fio } : {}),
    ...(personalizacao?.corAirForce ? { corAirForce: personalizacao.corAirForce } : {}),
  };
}

/** Duas escolhas só são iguais quando têm a mesma corda e o mesmo fio. */
export function mesmaPersonalizacao(a?: Personalizacao, b?: Personalizacao): boolean {
  const esq = normalizar(a);
  const dir = normalizar(b);
  return esq.corda === dir.corda && esq.fio === dir.fio && esq.corAirForce === dir.corAirForce;
}

export function personalizacaoCompleta(
  personalizacao?: Personalizacao,
  comCorda = false,
  comFio = false,
  comCorAirForce = false,
): boolean {
  const escolha = normalizar(personalizacao);
  return (
    (!comCorda ||
      (Boolean(escolha.corda) && CORDAS.some((opcao) => opcao.slug === escolha.corda))) &&
    (!comFio || (Boolean(escolha.fio) && FIOS.some((opcao) => opcao.slug === escolha.fio))) &&
    (!comCorAirForce ||
      (Boolean(escolha.corAirForce) &&
        CORES_AIR_FORCE.some((opcao) => opcao.slug === escolha.corAirForce)))
  );
}

export function nomeCorda(slug?: string): string | undefined {
  return slug ? (CORDAS.find((opcao) => opcao.slug === slug)?.name ?? slug) : undefined;
}

export function nomeFio(slug?: string): string | undefined {
  return slug ? (FIOS.find((opcao) => opcao.slug === slug)?.name ?? slug) : undefined;
}

export function nomeCorAirForce(slug?: string): string | undefined {
  return slug ? (CORES_AIR_FORCE.find((opcao) => opcao.slug === slug)?.name ?? slug) : undefined;
}

/** Texto curto para mostrar no carrinho, na confirmação e na encomenda. */
export function textoPersonalizacao(personalizacao?: Personalizacao): string {
  const escolha = normalizar(personalizacao);
  return [
    escolha.corda ? `Corda: ${nomeCorda(escolha.corda)}` : "",
    escolha.fio ? `Fio: ${nomeFio(escolha.fio)}` : "",
    escolha.corAirForce ? `Cor: ${nomeCorAirForce(escolha.corAirForce)}` : "",
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
    ...(escolha.corAirForce
      ? [
          {
            key: "Cor da Air Force",
            value: nomeCorAirForce(escolha.corAirForce) ?? escolha.corAirForce,
          },
        ]
      : []),
  ];
}
