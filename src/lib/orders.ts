import { localeByLanguage } from "./i18n";
import { products, type Language, type Product } from "./shop-data";
import { readStorage, removeStorage, writeStorage } from "./storage";

export type OrderStatus =
  | "confirmed"
  | "preparing"
  | "shipped"
  | "in_transit"
  | "delivered"
  | "ready_pickup"
  | "picked_up"
  | "cancelled";

export type DeliveryMethod = "pickup" | "shipping";
export type PaymentMethod = "mbway" | "apple";

export type OrderItem = {
  productId: string;
  name: string;
  size: number;
  quantity: number;
  unitPrice: number;
  authCode: string;
  serial: string;
};

export type OrderEvent = {
  id: string;
  status: OrderStatus;
  at: string;
  message: string | null;
  location: string | null;
};

export type Order = {
  id: string;
  number: string;
  accessCode: string;
  contact: string;
  customerName: string;
  createdAt: string;
  updatedAt: string;
  delivery: DeliveryMethod;
  address: string | null;
  payment: PaymentMethod;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  trackingCode: string | null;
  carrier: string | null;
  estimatedDelivery: string | null;
  pickupLocation: string | null;
  notes: string | null;
  events: OrderEvent[];
  isDemo: boolean;
};

export type OrderPatch = {
  status?: OrderStatus;
  trackingCode?: string | null;
  carrier?: string | null;
  estimatedDelivery?: string | null;
  notes?: string | null;
  pickupLocation?: string | null;
};

type StatusInfo = {
  label: Record<Language, string>;
  description: Record<Language, string>;
  tone: string;
};

export const statusFlow: Record<DeliveryMethod, OrderStatus[]> = {
  shipping: ["confirmed", "preparing", "shipped", "in_transit", "delivered"],
  pickup: ["confirmed", "preparing", "ready_pickup", "picked_up"],
};

export const orderStatusInfo: Record<OrderStatus, StatusInfo> = {
  confirmed: {
    label: { pt: "Confirmada", en: "Confirmed", es: "Confirmado" },
    description: {
      pt: "Recebemos a tua encomenda e o pagamento foi confirmado.",
      en: "We received your order and payment is confirmed.",
      es: "Recibimos tu pedido y el pago está confirmado.",
    },
    tone: "border-foreground/20 bg-foreground text-background",
  },
  preparing: {
    label: { pt: "Em preparação", en: "Preparing", es: "En preparación" },
    description: {
      pt: "A tua encomenda está a ser preparada com cuidado pela equipa UFFA.",
      en: "Your order is being carefully prepared by the UFFA team.",
      es: "Tu pedido está siendo preparado con cuidado por el equipo UFFA.",
    },
    tone: "border-amber-500/30 bg-amber-500 text-black",
  },
  shipped: {
    label: { pt: "Enviada", en: "Shipped", es: "Enviado" },
    description: {
      pt: "O teu par já saiu da loja e segue para o transportador.",
      en: "Your pair has left the store and is on its way to the carrier.",
      es: "Tu par ya salió de la tienda y va camino del transportista.",
    },
    tone: "border-blue-600/30 bg-blue-600 text-white",
  },
  in_transit: {
    label: { pt: "Em trânsito", en: "In transit", es: "En tránsito" },
    description: {
      pt: "A encomenda está em trânsito. Acompanha o percurso pelo código de rastreio.",
      en: "Your order is in transit. Follow the journey with the tracking code.",
      es: "El pedido está en tránsito. Sigue el recorrido con el código de seguimiento.",
    },
    tone: "border-indigo-600/30 bg-indigo-600 text-white",
  },
  delivered: {
    label: { pt: "Entregue", en: "Delivered", es: "Entregado" },
    description: {
      pt: "Encomenda entregue. Esperamos que gostes do teu par.",
      en: "Order delivered. We hope you love your pair.",
      es: "Pedido entregado. Esperamos que te guste tu par.",
    },
    tone: "border-emerald-600/30 bg-emerald-600 text-white",
  },
  ready_pickup: {
    label: { pt: "Pronta para recolha", en: "Ready for pickup", es: "Listo para recoger" },
    description: {
      pt: "O teu par está reservado e pronto para recolha na loja no Porto.",
      en: "Your pair is reserved and ready for pickup at the Porto store.",
      es: "Tu par está reservado y listo para recoger en la tienda de Oporto.",
    },
    tone: "border-primary/30 bg-primary text-primary-foreground",
  },
  picked_up: {
    label: { pt: "Recolhida", en: "Picked up", es: "Recogido" },
    description: {
      pt: "Recolha concluída. Obrigado pela tua visita à UFFA.",
      en: "Pickup completed. Thanks for visiting UFFA.",
      es: "Recogida completada. Gracias por tu visita a UFFA.",
    },
    tone: "border-emerald-600/30 bg-emerald-600 text-white",
  },
  cancelled: {
    label: { pt: "Cancelada", en: "Cancelled", es: "Cancelado" },
    description: {
      pt: "Esta encomenda foi cancelada. Contacta-nos se precisares de ajuda.",
      en: "This order was cancelled. Contact us if you need help.",
      es: "Este pedido fue cancelado. Contáctanos si necesitas ayuda.",
    },
    tone: "border-destructive/30 bg-destructive text-destructive-foreground",
  },
};

export const PICKUP_LOCATION = "UFFA Store · Rua de Santa Catarina 112, 4000-447 Porto";
export const DEFAULT_CARRIER = "CTT Expresso";

export const demoAccess = {
  orderNumber: "UFFA-48217",
  contact: "demo@uffa.pt",
  accessCode: "UFFA-7K3M-9QX2",
} as const;

export const demoAuthCode = "UFFA-AUTH-4K7P-2M9Q";

const ORDERS_KEY = "uffa-orders-v1";
const ATTEMPTS_KEY = "uffa-order-attempts-v1";
const SESSION_KEY = "uffa-order-session-v1";
const SESSION_TTL = 30 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const LOCK_MS = 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;
const TOKEN_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function isBrowser() {
  return typeof window !== "undefined";
}

function isOrder(value: unknown): value is Order {
  if (!value || typeof value !== "object") return false;
  const order = value as Partial<Order>;
  return (
    typeof order.id === "string" &&
    typeof order.number === "string" &&
    typeof order.accessCode === "string" &&
    Array.isArray(order.items) &&
    Array.isArray(order.events)
  );
}

function randomToken(length: number) {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, (byte) => TOKEN_ALPHABET.charAt(byte % TOKEN_ALPHABET.length)).join("");
}

function makeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${randomToken(10)}`;
}

function productById(id: string) {
  const product = products.find((candidate) => candidate.id === id);
  if (!product) throw new Error(`Produto desconhecido: ${id}`);
  return product;
}

function at(daysAgo: number, hour: number, minute = 0) {
  const date = new Date(Date.now() - daysAgo * DAY);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function inDays(days: number) {
  return new Date(Date.now() + days * DAY).toISOString();
}

function seedOrders(): Order[] {
  const rose = productById("porto-rose-low");
  const court = productById("cedofeita-court");
  const invicta = productById("invicta-01");
  const afterdark = productById("afterdark-02");

  return [
    {
      id: "demo-order-in-transit",
      number: demoAccess.orderNumber,
      accessCode: demoAccess.accessCode,
      contact: demoAccess.contact,
      customerName: "Marta Silva",
      createdAt: at(5, 10, 12),
      updatedAt: at(1, 18, 10),
      delivery: "shipping",
      address: "Rua de Cedofeita 120, 4050-174 Porto",
      payment: "mbway",
      items: [
        {
          productId: rose.id,
          name: rose.name,
          size: 39,
          quantity: 1,
          unitPrice: rose.price,
          authCode: demoAuthCode,
          serial: "UFFA-2026-104287",
        },
        {
          productId: court.id,
          name: court.name,
          size: 40,
          quantity: 1,
          unitPrice: court.price,
          authCode: "UFFA-AUTH-8R3T-6N1W",
          serial: "UFFA-2026-104288",
        },
      ],
      subtotal: rose.price + court.price,
      shipping: 7,
      total: rose.price + court.price + 7,
      status: "in_transit",
      trackingCode: "PT-48217-9QX2",
      carrier: DEFAULT_CARRIER,
      estimatedDelivery: inDays(2),
      pickupLocation: null,
      notes: "A encomenda segue para distribuição no Porto. Entrega prevista até às 18h.",
      events: [
        {
          id: "demo-event-1",
          status: "confirmed",
          at: at(5, 10, 12),
          message: null,
          location: "UFFA Store · Porto",
        },
        {
          id: "demo-event-2",
          status: "preparing",
          at: at(4, 15, 40),
          message: null,
          location: "UFFA Store · Porto",
        },
        {
          id: "demo-event-3",
          status: "shipped",
          at: at(2, 9, 25),
          message: null,
          location: "CTT Expresso · Porto",
        },
        {
          id: "demo-event-4",
          status: "in_transit",
          at: at(1, 18, 10),
          message: null,
          location: "Centro de distribuição · Lisboa",
        },
      ],
      isDemo: true,
    },
    {
      id: "demo-order-ready-pickup",
      number: "UFFA-73104",
      accessCode: "UFFA-2P8N-5RV6",
      contact: "demo@uffa.pt",
      customerName: "João Pereira",
      createdAt: at(2, 9, 30),
      updatedAt: hoursAgo(5),
      delivery: "pickup",
      address: null,
      payment: "mbway",
      items: [
        {
          productId: invicta.id,
          name: invicta.name,
          size: 42,
          quantity: 1,
          unitPrice: invicta.price,
          authCode: "UFFA-AUTH-9C2L-7B4X",
          serial: "UFFA-2026-104512",
        },
      ],
      subtotal: invicta.price,
      shipping: 0,
      total: invicta.price,
      status: "ready_pickup",
      trackingCode: null,
      carrier: null,
      estimatedDelivery: inDays(1),
      pickupLocation: PICKUP_LOCATION,
      notes: "O teu par está reservado na loja. Traz o número da encomenda e o código exclusivo.",
      events: [
        {
          id: "demo-event-5",
          status: "confirmed",
          at: at(2, 9, 30),
          message: null,
          location: "UFFA Store · Porto",
        },
        {
          id: "demo-event-6",
          status: "preparing",
          at: at(1, 11, 0),
          message: null,
          location: "UFFA Store · Porto",
        },
        {
          id: "demo-event-7",
          status: "ready_pickup",
          at: hoursAgo(5),
          message: null,
          location: PICKUP_LOCATION,
        },
      ],
      isDemo: true,
    },
    {
      id: "demo-order-delivered",
      number: "UFFA-19556",
      accessCode: "UFFA-6D1F-3H8K",
      contact: "ana@uffa.pt",
      customerName: "Ana Costa",
      createdAt: at(12, 11, 0),
      updatedAt: at(7, 14, 30),
      delivery: "shipping",
      address: "Rua do Almada 45, 4050-031 Porto",
      payment: "mbway",
      items: [
        {
          productId: afterdark.id,
          name: afterdark.name,
          size: 41,
          quantity: 1,
          unitPrice: afterdark.price,
          authCode: "UFFA-AUTH-1Z6Y-5A3E",
          serial: "UFFA-2026-103904",
        },
      ],
      subtotal: afterdark.price,
      shipping: 7,
      total: afterdark.price + 7,
      status: "delivered",
      trackingCode: "PT-19556-3H8K",
      carrier: DEFAULT_CARRIER,
      estimatedDelivery: at(8, 18, 0),
      pickupLocation: null,
      notes: null,
      events: [
        {
          id: "demo-event-8",
          status: "confirmed",
          at: at(12, 11, 0),
          message: null,
          location: "UFFA Store · Porto",
        },
        {
          id: "demo-event-9",
          status: "preparing",
          at: at(11, 16, 20),
          message: null,
          location: "UFFA Store · Porto",
        },
        {
          id: "demo-event-10",
          status: "shipped",
          at: at(10, 10, 5),
          message: null,
          location: "CTT Expresso · Porto",
        },
        {
          id: "demo-event-11",
          status: "in_transit",
          at: at(9, 8, 45),
          message: null,
          location: "Centro de distribuição · Porto",
        },
        {
          id: "demo-event-12",
          status: "delivered",
          at: at(7, 14, 30),
          message: null,
          location: "Destino · Porto",
        },
      ],
      isDemo: true,
    },
  ];
}

export function loadOrders(): Order[] {
  if (!isBrowser()) return [];
  try {
    const raw = readStorage("local", ORDERS_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every(isOrder)) return parsed;
    }
  } catch {
    removeStorage("local", ORDERS_KEY);
  }
  const seeded = seedOrders();
  saveOrders(seeded);
  return seeded;
}

export function saveOrders(orders: Order[]) {
  if (!isBrowser()) return;
  writeStorage("local", ORDERS_KEY, JSON.stringify(orders));
  window.dispatchEvent(new Event("uffa-orders-changed"));
}

export function resetDemoOrders() {
  const seeded = seedOrders();
  saveOrders(seeded);
  return seeded;
}

export function getOrderByNumber(number: string) {
  const normalized = normalizeOrderNumber(number);
  return loadOrders().find((order) => order.number === normalized) ?? null;
}

export function createOrder(input: {
  customerName: string;
  contact: string;
  delivery: DeliveryMethod;
  address: string;
  payment: PaymentMethod;
  cart: { productId: string; size: number; quantity: number }[];
}) {
  const existing = loadOrders();
  const number = generateOrderNumber(existing);
  const now = new Date();

  const items: OrderItem[] = input.cart.flatMap((line) => {
    const product = products.find((candidate) => candidate.id === line.productId);
    if (!product) return [];
    return [
      {
        productId: product.id,
        name: product.name,
        size: line.size,
        quantity: line.quantity,
        unitPrice: product.price,
        authCode: generateAuthCode(),
        serial: generateSerial(),
      },
    ];
  });

  if (items.length === 0) throw new Error("O carrinho está vazio.");

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const shipping = input.delivery === "shipping" ? 7 : 0;
  const address = input.address.trim();

  const order: Order = {
    id: makeId(),
    number,
    accessCode: generateAccessCode(),
    contact: input.contact.trim(),
    customerName: input.customerName.trim(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    delivery: input.delivery,
    address: address.length > 0 ? address : null,
    payment: input.payment,
    items,
    subtotal,
    shipping,
    total: subtotal + shipping,
    status: "confirmed",
    trackingCode: input.delivery === "shipping" ? generateTrackingCode(number) : null,
    carrier: input.delivery === "shipping" ? DEFAULT_CARRIER : null,
    estimatedDelivery: inDays(input.delivery === "shipping" ? 3 : 1),
    pickupLocation: input.delivery === "pickup" ? PICKUP_LOCATION : null,
    notes: null,
    events: [
      {
        id: makeId(),
        status: "confirmed",
        at: now.toISOString(),
        message: null,
        location: "UFFA Store · Porto",
      },
    ],
    isDemo: false,
  };

  saveOrders([order, ...existing]);
  return order;
}

export function updateOrder(
  number: string,
  patch: OrderPatch,
  event?: { message: string | null; location: string | null },
) {
  const orders = loadOrders();
  const index = orders.findIndex((order) => order.number === normalizeOrderNumber(number));
  const current = orders[index];
  if (!current) return null;

  const nowIso = new Date().toISOString();
  const statusChanged = patch.status !== undefined && patch.status !== current.status;
  const events: OrderEvent[] = statusChanged
    ? [
        ...current.events,
        {
          id: makeId(),
          status: patch.status ?? current.status,
          at: nowIso,
          message: event?.message ?? null,
          location: event?.location ?? null,
        },
      ]
    : current.events;

  const updated: Order = {
    ...current,
    status: patch.status ?? current.status,
    trackingCode: patch.trackingCode !== undefined ? patch.trackingCode : current.trackingCode,
    carrier: patch.carrier !== undefined ? patch.carrier : current.carrier,
    estimatedDelivery:
      patch.estimatedDelivery !== undefined ? patch.estimatedDelivery : current.estimatedDelivery,
    notes: patch.notes !== undefined ? patch.notes : current.notes,
    pickupLocation:
      patch.pickupLocation !== undefined ? patch.pickupLocation : current.pickupLocation,
    events,
    updatedAt: nowIso,
  };

  const next = orders.slice();
  next[index] = updated;
  saveOrders(next);
  return updated;
}

export function confirmOrderReceipt(number: string) {
  const order = getOrderByNumber(number);
  if (!order) return null;
  const finalStatus: OrderStatus = order.delivery === "pickup" ? "picked_up" : "delivered";
  return updateOrder(number, { status: finalStatus });
}

export type AccessResult =
  | { ok: true; order: Order }
  | { ok: false; reason: "not_found" | "locked"; attemptsLeft: number; retryAfter: number };

type AttemptRecord = Record<string, { count: number; lockedUntil: number }>;

function loadAttempts(): AttemptRecord {
  if (!isBrowser()) return {};
  try {
    const raw = readStorage("local", ATTEMPTS_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as AttemptRecord)
      : {};
  } catch {
    return {};
  }
}

function saveAttempts(attempts: AttemptRecord) {
  if (!isBrowser()) return;
  writeStorage("local", ATTEMPTS_KEY, JSON.stringify(attempts));
}

export function validateOrderAccess(
  orderNumberInput: string,
  contactInput: string,
  accessCodeInput: string,
): AccessResult {
  const orderNumber = normalizeOrderNumber(orderNumberInput);
  const attempts = loadAttempts();
  const record = attempts[orderNumber] ?? { count: 0, lockedUntil: 0 };

  if (record.lockedUntil > Date.now()) {
    return {
      ok: false,
      reason: "locked",
      attemptsLeft: 0,
      retryAfter: Math.ceil((record.lockedUntil - Date.now()) / 1000),
    };
  }

  const order = loadOrders().find((candidate) => candidate.number === orderNumber);
  const valid =
    order !== undefined &&
    normalizeContact(contactInput) === normalizeContact(order.contact) &&
    normalizeCode(accessCodeInput) === normalizeCode(order.accessCode);

  if (valid && order) {
    delete attempts[orderNumber];
    saveAttempts(attempts);
    saveOrderSession(order.number);
    return { ok: true, order };
  }

  const count = record.count + 1;
  const locked = count >= MAX_ATTEMPTS;
  attempts[orderNumber] = {
    count: locked ? 0 : count,
    lockedUntil: locked ? Date.now() + LOCK_MS : 0,
  };
  saveAttempts(attempts);

  return {
    ok: false,
    reason: locked ? "locked" : "not_found",
    attemptsLeft: locked ? 0 : MAX_ATTEMPTS - count,
    retryAfter: locked ? Math.ceil(LOCK_MS / 1000) : 0,
  };
}

export function saveOrderSession(number: string) {
  if (!isBrowser()) return;
  writeStorage(
    "session",
    SESSION_KEY,
    JSON.stringify({ number: normalizeOrderNumber(number), expiresAt: Date.now() + SESSION_TTL }),
  );
}

export function getOrderSession() {
  if (!isBrowser()) return null;
  try {
    const raw = readStorage("session", SESSION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      removeStorage("session", SESSION_KEY);
      return null;
    }
    const session = parsed as { number?: unknown; expiresAt?: unknown };
    if (
      typeof session.number !== "string" ||
      typeof session.expiresAt !== "number" ||
      session.expiresAt < Date.now()
    ) {
      removeStorage("session", SESSION_KEY);
      return null;
    }
    const order = getOrderByNumber(session.number);
    if (!order) {
      removeStorage("session", SESSION_KEY);
      return null;
    }
    return order;
  } catch {
    removeStorage("session", SESSION_KEY);
    return null;
  }
}

export function clearOrderSession() {
  if (!isBrowser()) return;
  removeStorage("session", SESSION_KEY);
}

export type AuthVerification = {
  order: Order;
  item: OrderItem;
  product: Product;
};

export function verifyAuthCode(input: string): AuthVerification | null {
  const code = normalizeCode(input);
  if (!code) return null;
  for (const order of loadOrders()) {
    for (const item of order.items) {
      if (normalizeCode(item.authCode) === code) {
        const product = products.find((candidate) => candidate.id === item.productId);
        if (product) return { order, item, product };
      }
    }
  }
  return null;
}

export function normalizeOrderNumber(value: string) {
  const trimmed = value.trim().toUpperCase().replace(/\s+/g, "");
  if (/^\d{5}$/.test(trimmed)) return `UFFA-${trimmed}`;
  return trimmed;
}

export function normalizeContact(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

export function normalizeCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function isFinalStatus(status: OrderStatus) {
  return status === "delivered" || status === "picked_up" || status === "cancelled";
}

export function getNextStatus(order: Order) {
  const flow = statusFlow[order.delivery];
  const index = flow.indexOf(order.status);
  if (index < 0 || index >= flow.length - 1) return null;
  return flow[index + 1] ?? null;
}

export function getStatusIndex(order: Order) {
  return statusFlow[order.delivery].indexOf(order.status);
}

export function formatDate(value: string | null, language: Language) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(localeByLanguage[language], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value: string, language: Language) {
  return new Intl.DateTimeFormat(localeByLanguage[language], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function toDateInputValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromDateInputValue(value: string) {
  if (!value) return null;
  return new Date(`${value}T12:00:00`).toISOString();
}

function generateOrderNumber(existing: Order[]) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const digits = String(Math.floor(10000 + Math.random() * 90000));
    const candidate = `UFFA-${digits}`;
    if (!existing.some((order) => order.number === candidate)) return candidate;
  }
  return `UFFA-${String(Date.now()).slice(-5)}`;
}

function generateAccessCode() {
  return `UFFA-${randomToken(4)}-${randomToken(4)}`;
}

function generateAuthCode() {
  return `UFFA-AUTH-${randomToken(4)}-${randomToken(4)}`;
}

function generateSerial() {
  return `UFFA-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
}

function generateTrackingCode(number: string) {
  return `PT-${number.replace("UFFA-", "")}-${randomToken(4)}`;
}
