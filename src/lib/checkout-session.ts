/**
 * Fotografia da compra tirada imediatamente antes de enviar o cliente para o
 * checkout da Shopify.
 *
 * A Shopify não devolve os detalhes da encomenda ao site, por isso guardamos
 * localmente o essencial para conseguir mostrar uma página de agradecimento com
 * os detalhes da compra quando o cliente regressa.
 */

import { readStorage, removeStorage, writeStorage } from "./storage";

export type PendingCheckoutItem = {
  productId: string;
  name: string;
  size: number;
  color?: string | undefined;
  cord?: string | undefined;
  quantity: number;
  unitPrice: number;
};

export type PendingCheckout = {
  at: string;
  customerName: string;
  email: string;
  deliveryKey: string;
  deliveryLabel: string;
  pickupLocation?: string | undefined;
  items: PendingCheckoutItem[];
  subtotal: number;
  shipping: number;
  total: number;
  coupon?: string | undefined;
};

const PENDING_KEY = "uffa-pending-checkout-v1";

function isItem(value: unknown): value is PendingCheckoutItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<PendingCheckoutItem>;
  return (
    typeof item.productId === "string" &&
    typeof item.name === "string" &&
    typeof item.size === "number" &&
    typeof item.quantity === "number" &&
    item.quantity > 0 &&
    typeof item.unitPrice === "number"
  );
}

function isPending(value: unknown): value is PendingCheckout {
  if (!value || typeof value !== "object") return false;
  const pending = value as Partial<PendingCheckout>;
  return (
    typeof pending.at === "string" &&
    typeof pending.deliveryLabel === "string" &&
    (pending.pickupLocation === undefined || typeof pending.pickupLocation === "string") &&
    typeof pending.subtotal === "number" &&
    typeof pending.shipping === "number" &&
    typeof pending.total === "number" &&
    Array.isArray(pending.items) &&
    pending.items.every(isItem)
  );
}

export function savePendingCheckout(pending: PendingCheckout) {
  writeStorage("local", PENDING_KEY, JSON.stringify(pending));
}

export function readPendingCheckout(): PendingCheckout | null {
  const raw = readStorage("local", PENDING_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isPending(parsed)) return parsed;
  } catch {
    // Registo corrompido
  }
  removeStorage("local", PENDING_KEY);
  return null;
}

export function clearPendingCheckout() {
  removeStorage("local", PENDING_KEY);
}
