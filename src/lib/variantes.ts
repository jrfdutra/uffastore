import { escalaoPorTamanho, type Escalao } from "./precos.ts";
import type { ProductSize } from "./shop-data";

/** Ordem de apresentação dos escalões no seletor. */
export const ORDEM_ESCALOES: Escalao[] = ["crianca", "gs", "senior"];

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

/** Verdadeiro para peças vendidas como tamanho único (sem escala numérica). */
export function isTamanhoUnico(size: ProductSize): boolean {
  return Boolean(size.label) || size.size <= 0;
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
      escalao
        ? !isTamanhoUnico(size) && escalaoPorTamanho(size.size) === escalao
        : true,
    )
    .sort((a, b) => a.size - b.size);
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
