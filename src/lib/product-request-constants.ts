/** Pedido de produto não encontrado: formulário → e-mail da UFFA, sem guardar dados. */
export const PRODUCT_REQUEST_PATH = "/api/pedido-produto";

/** 8 KB são mais do que suficientes para cinco campos curtos. */
export const PRODUCT_REQUEST_BODY_LIMIT = 8_192;

export const PRODUCT_REQUEST_LIMITS = {
  description: 2_000,
  product: 160,
  brand: 120,
  email: 160,
  phone: 40,
} as const;
