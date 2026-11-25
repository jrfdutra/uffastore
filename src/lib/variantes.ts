import { type Brand } from "./brands.ts";
import { escalaoPorTamanho, type Escalao } from "./precos.ts";
import type { ProductSize } from "./shop-data";

/** Ordem de apresentação dos escalões no seletor. */
export const ORDEM_ESCALOES: Escalao[] = ["crianca", "gs", "senior"];

/** Números que a UFFA não comercializa em nenhum modelo Nike. */
export const TAMANHOS_NIKE_OCULTOS = [37, 41.5] as const;

/**
 * Esconde da loja os tamanhos Nike fora da escala comercial.
 * Não apaga variantes na Shopify, para não invalidar carrinhos/encomendas.
 */
export function ocultarTamanhosNike<T extends { size: number }>(sizes: T[], brand?: Brand): T[] {
  if (brand !== "nike") return sizes;
  return sizes.filter((size) => !TAMANHOS_NIKE_OCULTOS.some((oculto) => oculto === size.size));
}

/**
 * Variantes reais de uma cor (e, quando indicado, de uma opção Cute Cord).
 * Sem cor/cord (modelos sem essa opção), devolve todas.
 */
export function variantesPorCor(
  sizes: ProductSize[],
  color?: string,
  cord?: string,
): ProductSize[] {
  return sizes.filter(
    (size) => (color ? size.color === color : true) && (cord ? size.cord === cord : true),
  );
}

/**
 * Verdadeiro para peças vendidas como tamanho único (sem escala numérica).
 * Nota: uma etiqueta de fração (ex.: "36 ⅔") tem tamanho numérico válido e
 * por isso NÃO é tamanho único — só conta quando não há número.
 */
export function isTamanhoUnico(size: ProductSize): boolean {
  return size.size <= 0;
}

/** Escalões que existem efetivamente nas variantes recebidas, por ordem. */
export function escaloesDisponiveis(sizes: ProductSize[]): Escalao[] {
  const presentes = new Set(
    sizes.filter((size) => !isTamanhoUnico(size)).map((size) => escalaoPorTamanho(size.size)),
  );
  return ORDEM_ESCALOES.filter((escalao) => presentes.has(escalao));
}

/** Tamanhos de um escalão, ordenados e apenas os que pertencem a esse escalão. */
export function tamanhosDoEscalao(sizes: ProductSize[], escalao?: Escalao): ProductSize[] {
  return sizes
    .filter((size) =>
      escalao ? !isTamanhoUnico(size) && escalaoPorTamanho(size.size) === escalao : true,
    )
    .sort((a, b) => a.size - b.size);
}

/**
 * Etiqueta de tamanho pronta a mostrar. Usa a etiqueta original da variante
 * (ex.: "36 ⅔" na Adidas) quando existe; caso contrário o próprio número.
 */
export function rotuloTamanho(tamanho: number, label?: string): string {
  if (label) return label;
  if (tamanho <= 0) return "Único";
  return String(tamanho);
}

/** Etiqueta de tamanho de um item de carrinho/encomenda, procurada no produto. */
export function rotuloTamanhoDoProduto(
  product: { sizes: ProductSize[] } | undefined,
  tamanho: number,
): string {
  const match = product?.sizes.find((variante) => variante.size === tamanho);
  return rotuloTamanho(tamanho, match?.label);
}

/** Variante selecionável: só devolve algo se existir e tiver stock. */
export function varianteSelecionavel(
  sizes: ProductSize[],
  color: string | undefined,
  escalao: Escalao | undefined,
  tamanho: number | undefined,
  cord?: string,
): ProductSize | undefined {
  if (tamanho === undefined) return undefined;
  const variante = tamanhosDoEscalao(variantesPorCor(sizes, color, cord), escalao).find(
    (size) => size.size === tamanho,
  );
  return variante && variante.stock > 0 ? variante : undefined;
}

/** Preço a apresentar: o da variante escolhida ou o mínimo disponível na cor. */
export function precoApresentado(
  sizes: ProductSize[],
  color: string | undefined,
  precoBase: number,
  cord?: string,
): number {
  const variantes = variantesPorCor(sizes, color, cord);
  if (!variantes.length) return precoBase;
  return Math.min(...variantes.map((variante) => variante.price ?? precoBase));
}

/**
 * Preço do escalão (GS, Sénior…) já escolhido, mesmo sem tamanho selecionado.
 * Permite atualizar o preço no momento em que a categoria muda.
 */
export function precoDoEscalao(
  sizes: ProductSize[],
  color: string | undefined,
  escalao: Escalao | undefined,
  precoBase: number,
  cord?: string,
): number {
  const variantes = tamanhosDoEscalao(variantesPorCor(sizes, color, cord), escalao);
  if (!variantes.length) return precoApresentado(sizes, color, precoBase, cord);
  return Math.min(...variantes.map((variante) => variante.price ?? precoBase));
}
