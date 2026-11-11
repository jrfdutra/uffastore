import catalogoData from "../data/catalogo.json" with { type: "json" };

export type Escalao = "crianca" | "gs" | "senior";

export type ModeloId =
  | "air-force"
  | "air-force-rope"
  | "nike-dunk-rope"
  | "air-force-floral-rope"
  | "air-force-shine-rope"
  | "air-force-lanvin-rope";

/**
 * Determina o escalão a que pertence um tamanho.
 */
export function escalaoPorTamanho(tamanho: number): Escalao {
  if (tamanho >= 28 && tamanho <= 35) return "crianca";
  if (tamanho >= 36 && tamanho <= 39) return "gs";
  if (tamanho >= 40) return "senior";
  throw new Error(`Tamanho ${tamanho} fora dos escalões válidos (28+).`);
}

/**
 * Devolve o preço tabelado de um modelo consoante o tamanho.
 * Lança erro explícito se não existir preço definido para o escalão.
 */
export function precoPorTamanho(modelo: ModeloId, tamanho: number): number {
  const modeloConfig = catalogoData.modelos[modelo];
  if (!modeloConfig) {
    throw new Error(`Modelo "${modelo}" não reconhecido no catálogo.`);
  }

  const escalao = escalaoPorTamanho(tamanho);
  const precos = modeloConfig.precos as Partial<Record<Escalao, number>>;
  const preco = precos[escalao];

  if (preco === undefined || preco === null) {
    throw new Error(
      `Preço não definido para o modelo "${modeloConfig.nomeBase}" no escalão "${escalao}" (tamanho ${tamanho}).`,
    );
  }

  return preco;
}

export { catalogoData };
