import type { Product } from "./shop-data";

type SelecaoImagem = {
  variantId?: string | undefined;
  color?: string | undefined;
  cord?: string | undefined;
};

/** Galeria da cor escolhida. Sem foto própria, usa a galeria do anúncio. */
export function galeriaDaCor(product: Product, color?: string): string[] {
  const galeria = product.images?.length ? product.images : [product.image];
  if (!color) return galeria;
  const propria = product.colors?.find((item) => item.slug === color)?.images;
  return propria?.length ? propria : galeria;
}

/** Primeira foto da cor escolhida (ex.: Branca vs. Preta no mesmo anúncio). */
export function imagemDaCor(product: Product, color?: string): string {
  return galeriaDaCor(product, color)[0] ?? product.image;
}

/**
 * Fotografia de uma linha do carrinho/confirmação.
 *
 * A Shopify associa uma imagem a cada variante; quando essa variante não está
 * disponível no catálogo, usa a cor (e o cordão) guardados no item. Nunca usa
 * apenas `product.image`, que é a primeira foto do anúncio e partilhada por
 * todas as cores — era isso que mostrava a Air Force Branca numa linha Preta.
 */
export function imagemDoItem(product: Product, item: SelecaoImagem): string {
  const porId = item.variantId
    ? product.sizes.find((size) => size.variantId === item.variantId)
    : undefined;
  if (porId?.image) return porId.image;

  const porCor =
    porId ??
    (item.color || item.cord
      ? product.sizes.find(
          (size) =>
            (item.color ? size.color === item.color : true) &&
            (item.cord ? size.cord === item.cord : true),
        )
      : undefined);
  if (porCor?.image) return porCor.image;

  return imagemDaCor(product, porCor?.color ?? item.color);
}
