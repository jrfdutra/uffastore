/** Pontos de recolha em mão disponíveis no checkout. */
export const PICKUP_LOCATIONS = ["NorteShopping", "Maia Jardim", "MarShopping"] as const;

export type PickupLocation = (typeof PICKUP_LOCATIONS)[number];

/** Primeiro ponto da lista: usado como pré-seleção e nos dados demo. */
export const DEFAULT_PICKUP_LOCATION: PickupLocation = PICKUP_LOCATIONS[0];

export function isPickupLocation(value: unknown): value is PickupLocation {
  return typeof value === "string" && (PICKUP_LOCATIONS as readonly string[]).includes(value);
}
