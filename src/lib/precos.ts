import catalogoData from "../data/catalogo.json" with { type: "json" };

export type Escalao = "crianca" | "gs" | "senior";

export type ModeloId =
  | "nike-dunk-rope"
  | "air-force-lanvin"
  | "air-force-floral-rope"
  | "floral-black"
  | "air-force-crianca"
  | "air-force-rope";

/**
 * Determina o escalão a que pertence um tamanho.
 *
 * As grelhas variam por marca: a Nike começa a Criança em 27,5 e o GS em 35,5;
 * a Adidas começa o GS em 35⅓ (35,33). Por isso o limite entre Criança e GS
 * fica em 35,3 — abaixo disso é Criança, acima (até 40) é GS.
 */
export function escalaoPorTamanho(tamanho: number): Escalao {
  if (tamanho >= 27 && tamanho < 35.3) return "crianca";
  if (tamanho >= 35.3 && tamanho < 40) return "gs";
  if (tamanho >= 40) return "senior";
  throw new Error(`Tamanho ${tamanho} fora dos escalões válidos (27+).`);
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
