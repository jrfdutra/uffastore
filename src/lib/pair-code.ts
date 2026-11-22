/**
 * Quantos pares físicos existem numa linha do carrinho.
 * A quantidade é expandida para manter corretos os subtotais e as linhas.
 */
export function pairCount(quantity: number) {
  if (!Number.isFinite(quantity)) return 1;
  return Math.max(1, Math.floor(quantity));
}
