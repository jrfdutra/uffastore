/** Pontos de recolha em mão disponíveis no checkout. */
export const PICKUP_LOCATIONS = ["NorteShopping", "Maia Jardim", "MarShopping"] as const;

export type PickupLocation = (typeof PICKUP_LOCATIONS)[number];

/** Primeiro ponto da lista: usado como pré-seleção no checkout. */
export const DEFAULT_PICKUP_LOCATION: PickupLocation = PICKUP_LOCATIONS[0];

export function isPickupLocation(value: unknown): value is PickupLocation {
  return typeof value === "string" && (PICKUP_LOCATIONS as readonly string[]).includes(value);
}

/**
 * Transforma o nome escolhido no checkout no `pickupHandle` da localização
 * correspondente na Shopify (o ID numérico no final do GID).
 */
export function pickupHandleForLocation(
  locations: readonly { id: string; name: string }[],
  pickupLocation: string,
): string | undefined {
  const normalized = pickupLocation.trim().toLowerCase();
  // Nunca aceitar o antigo local de expedição como ponto de recolha.
  const isAllowed = (PICKUP_LOCATIONS as readonly string[]).some(
    (location) => location.toLowerCase() === normalized,
  );
  if (!isAllowed) return undefined;
  const match = locations.find((location) => location.name.trim().toLowerCase() === normalized);
  return match?.id.split("/").pop();
}
