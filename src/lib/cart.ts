/**
 * Limpeza do carrinho persistido.
 *
 * O carrinho fica no localStorage, por isso pode sobreviver a alterações do
 * catálogo (um produto descontinuado, um handle corrigido na Shopify, etc.).
 * Um item desses não aparece no painel do carrinho — que procura o produto no
 * catálogo — mas continuava a contar no badge. Aqui removemos esses órfãos
 * para que o contador, o subtotal e o painel mostrem sempre a mesma coisa.
 */
export function sanitizeCart<T extends { productId: string }>(
  items: T[],
  catalogIds: ReadonlySet<string>,
): T[] {
  const valid = items.filter((item) => catalogIds.has(item.productId));
  return valid.length === items.length ? items : valid;
}
