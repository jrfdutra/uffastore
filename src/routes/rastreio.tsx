import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  Hand,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  Navigation,
  Package,
  PackageCheck,
  PackageOpen,
  PackageSearch,
  ShieldCheck,
  Store,
  Truck,
  User,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { tr } from "@/lib/i18n";
import { categoryNames, money, products, type Language } from "@/lib/shop-data";
import { useShop } from "@/lib/shop-context";
import {
  clearOrderSession,
  confirmOrderReceipt,
  demoAccess,
  formatDate,
  formatDateTime,
  getOrderSession,
  getStatusIndex,
  isFinalStatus,
  normalizeOrderNumber,
  orderStatusInfo,
  statusFlow,
  validateOrderAccess,
  type Order,
  type OrderStatus,
} from "@/lib/orders";

export const Route = createFileRoute("/rastreio")({
  validateSearch: (search) => z.object({ order: z.string().optional() }).parse(search),
  head: () => ({
    meta: [
      { title: "A minha encomenda — Uffa Store" },
      {
        name: "description",
        content:
          "Acede à tua encomenda UFFA com validação de exclusividade e acompanha o estado de envio ou recolha.",
      },
      { property: "og:title", content: "A minha encomenda — Uffa Store" },
      {
        property: "og:description",
        content: "Portal exclusivo para gerir a tua encomenda UFFA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/rastreio" }],
  }),
  component: OrderPortal,
});

const statusIcons: Record<OrderStatus, LucideIcon> = {
  confirmed: Package,
  preparing: PackageOpen,
  shipped: Truck,
  in_transit: Navigation,
  delivered: PackageCheck,
  ready_pickup: Store,
  picked_up: BadgeCheck,
  cancelled: XCircle,
};

async function copyText(value: string, language: Language, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(tr(language, `${label} copiado.`, `${label} copied.`, `${label} copiado.`));
  } catch {
    toast.error(tr(language, "Não foi possível copiar.", "Could not copy.", "No se pudo copiar."));
  }
}

function OrderPortal() {
  const search = Route.useSearch();
  const [order, setOrder] = useState<Order | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setOrder(getOrderSession());
    setHydrated(true);
  }, []);

  if (!hydrated) return <PortalSkeleton />;

  if (order) {
    return (
      <OrderDashboard
        order={order}
        onOrderChange={setOrder}
        onLogout={() => {
          clearOrderSession();
          setOrder(null);
        }}
      />
    );
  }

  return <AccessLanding initialOrder={search.order ?? ""} onUnlock={setOrder} />;
}

function PortalSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 md:px-6">
      <div className="h-10 w-44 animate-pulse bg-muted" />
      <div className="mt-4 h-24 w-full max-w-2xl animate-pulse bg-muted" />
      <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <div className="h-96 animate-pulse bg-muted" />
        <div className="h-96 animate-pulse bg-muted" />
      </div>
    </div>
  );
}

function AccessLanding({
  initialOrder,
  onUnlock,
}: {
  initialOrder: string;
  onUnlock: (order: Order) => void;
}) {
  const { language } = useShop();
  const [orderNumber, setOrderNumber] = useState(initialOrder);
  const [contact, setContact] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initialOrder) setOrderNumber(normalizeOrderNumber(initialOrder));
  }, [initialOrder]);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!orderNumber.trim() || !contact.trim() || !accessCode.trim()) {
      setError(
        tr(
          language,
          "Preenche o número da encomenda, o contacto e o código exclusivo.",
          "Fill in the order number, contact and exclusive code.",
          "Rellena el número de pedido, el contacto y el código exclusivo.",
        ),
      );
      return;
    }

    setBusy(true);
    const result = validateOrderAccess(orderNumber, contact, accessCode);
    setBusy(false);

    if (result.ok) {
      toast.success(
        tr(
          language,
          "Acesso exclusivo validado.",
          "Exclusive access verified.",
          "Acceso exclusivo validado.",
        ),
      );
      onUnlock(result.order);
      return;
    }

    if (result.reason === "locked") {
      setError(
        tr(
          language,
          `Demasiadas tentativas. Tenta novamente em ${result.retryAfter}s.`,
          `Too many attempts. Try again in ${result.retryAfter}s.`,
          `Demasiados intentos. Inténtalo de nuevo en ${result.retryAfter}s.`,
        ),
      );
      return;
    }

    setError(
      tr(
        language,
        `Dados incorretos. Confirma o número, o contacto e o código exclusivo. Restam ${result.attemptsLeft} tentativas.`,
        `Incorrect details. Check the order number, contact and exclusive code. ${result.attemptsLeft} attempts left.`,
        `Datos incorrectos. Revisa el número, el contacto y el código exclusivo. Quedan ${result.attemptsLeft} intentos.`,
      ),
    );
  };

  const fillDemo = () => {
    setOrderNumber(demoAccess.orderNumber);
    setContact(demoAccess.contact);
    setAccessCode(demoAccess.accessCode);
    setError(null);
  };

  const steps = [
    {
      icon: Package,
      number: "01",
      title: tr(language, "Encomenda confirmada", "Order confirmed", "Pedido confirmado"),
      text: tr(
        language,
        "Recebes o número da encomenda e um código exclusivo no checkout.",
        "You receive the order number and an exclusive code at checkout.",
        "Recibes el número de pedido y un código exclusivo en el checkout.",
      ),
    },
    {
      icon: Truck,
      number: "02",
      title: tr(language, "Acompanha o envio", "Track the delivery", "Sigue el envío"),
      text: tr(
        language,
        "Vê o estado, o transportador, o rastreio e a previsão de entrega.",
        "See the status, carrier, tracking and estimated delivery.",
        "Consulta el estado, el transportista, el seguimiento y la previsión.",
      ),
    },
    {
      icon: ShieldCheck,
      number: "03",
      title: tr(
        language,
        "Valida a autenticidade",
        "Verify authenticity",
        "Verifica la autenticidad",
      ),
      text: tr(
        language,
        "Cada par tem um código único que confirma a autenticidade UFFA.",
        "Each pair has a unique code that confirms UFFA authenticity.",
        "Cada par tiene un código único que confirma la autenticidad UFFA.",
      ),
    },
  ];

  return (
    <div>
      <section className="border-b border-border bg-foreground text-background">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:px-6 md:py-20 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
              <PackageSearch className="size-4" />
              UFFA Portal · {tr(language, "Área do cliente", "Customer area", "Área de cliente")}
            </p>
            <h1 className="mt-4 font-display text-6xl uppercase leading-[.88] md:text-8xl">
              {tr(language, "A minha", "My", "Mi")}
              <br />
              <span className="text-primary">
                {tr(language, "encomenda.", "order.", "pedido.")}
              </span>
            </h1>
            <p className="mt-5 max-w-2xl text-background/70">
              {tr(
                language,
                "O teu par, do checkout à porta. Entra com os três dados exclusivos da tua compra para acompanhar o envio, gerir a recolha e validar a autenticidade.",
                "Your pair, from checkout to your door. Sign in with the three exclusive details from your purchase to track shipping, manage pickup and verify authenticity.",
                "Tu par, del checkout a la puerta. Entra con los tres datos exclusivos de tu compra para seguir el envío, gestionar la recogida y verificar la autenticidad.",
              )}
            </p>
            <div className="mt-7 flex flex-wrap gap-2 text-[11px] font-bold uppercase">
              <span className="flex items-center gap-2 border border-background/20 px-3 py-2">
                <LockKeyhole className="size-4 text-primary" />
                {tr(language, "Acesso exclusivo", "Exclusive access", "Acceso exclusivo")}
              </span>
              <span className="flex items-center gap-2 border border-background/20 px-3 py-2">
                <Truck className="size-4 text-primary" />
                {tr(language, "Estado de envio", "Shipping status", "Estado del envío")}
              </span>
              <span className="flex items-center gap-2 border border-background/20 px-3 py-2">
                <ShieldCheck className="size-4 text-primary" />
                {tr(language, "Autenticidade", "Authenticity", "Autenticidad")}
              </span>
            </div>
          </div>
          <div className="hidden justify-self-end border border-background/15 p-6 lg:block">
            <p className="text-xs font-bold uppercase text-primary">
              {tr(language, "Sessão protegida", "Protected session", "Sesión protegida")}
            </p>
            <p className="mt-3 max-w-xs text-sm text-background/70">
              {tr(
                language,
                "O código exclusivo é gerado no checkout e só é mostrado ao comprador. Sem ele, os dados da encomenda não são revelados.",
                "The exclusive code is generated at checkout and only shown to the buyer. Without it, order details are not revealed.",
                "El código exclusivo se genera en el checkout y solo se muestra al comprador. Sin él, no se revelan los datos del pedido.",
              )}
            </p>
            <div className="mt-5 flex items-center gap-2 text-xs font-bold uppercase text-background/60">
              <ShieldCheck className="size-4 text-primary" />
              {tr(
                language,
                "3 fatores de validação",
                "3 validation factors",
                "3 factores de validación",
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <form onSubmit={submit} className="border border-border bg-card p-6 md:p-8">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center bg-primary text-primary-foreground">
                <LockKeyhole className="size-5" />
              </span>
              <div>
                <h2 className="font-display text-3xl uppercase">
                  {tr(language, "Entrar na encomenda", "Open your order", "Entrar en el pedido")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tr(
                    language,
                    "Usa exatamente os dados que introduziste na compra.",
                    "Use exactly the details you entered at checkout.",
                    "Usa exactamente los datos que introdujiste en la compra.",
                  )}
                </p>
              </div>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="order-number">
                  {tr(language, "Número da encomenda", "Order number", "Número de pedido")}
                </Label>
                <Input
                  id="order-number"
                  value={orderNumber}
                  onChange={(event) => setOrderNumber(event.target.value)}
                  placeholder="UFFA-48217"
                  autoComplete="off"
                  spellCheck={false}
                  className="h-12 rounded-none font-mono uppercase"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order-contact">
                  {tr(language, "Email ou telefone", "Email or phone", "Email o teléfono")}
                </Label>
                <Input
                  id="order-contact"
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                  placeholder="demo@uffa.pt"
                  autoComplete="email"
                  className="h-12 rounded-none"
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="order-code">
                    {tr(
                      language,
                      "Código de exclusividade",
                      "Exclusive code",
                      "Código de exclusividad",
                    )}
                  </Label>
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-primary">
                    <ShieldCheck className="size-3.5" />
                    {tr(
                      language,
                      "Só tu tens acesso",
                      "Only you have access",
                      "Solo tú tienes acceso",
                    )}
                  </span>
                </div>
                <Input
                  id="order-code"
                  value={accessCode}
                  onChange={(event) => setAccessCode(event.target.value)}
                  placeholder="UFFA-XXXX-XXXX"
                  autoComplete="off"
                  spellCheck={false}
                  className="h-12 rounded-none font-mono uppercase tracking-wider"
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  {tr(
                    language,
                    "Formato UFFA-XXXX-XXXX. Encontras este código na confirmação da compra.",
                    "Format UFFA-XXXX-XXXX. You'll find this code in your order confirmation.",
                    "Formato UFFA-XXXX-XXXX. Encuentras este código en la confirmación de la compra.",
                  )}
                </p>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-5 flex items-start gap-3 border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
              >
                <XCircle className="mt-0.5 size-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="mt-6 h-12 w-full rounded-none"
              disabled={busy}
            >
              <LockKeyhole />
              {busy
                ? tr(language, "A validar…", "Validating…", "Validando…")
                : tr(language, "Desbloquear encomenda", "Unlock order", "Desbloquear pedido")}
            </Button>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              {tr(
                language,
                "Ainda não tens encomenda?",
                "Don't have an order yet?",
                "¿Aún no tienes pedido?",
              )}{" "}
              <Link
                to="/catalogo"
                search={{}}
                className="font-bold text-primary underline-offset-4 hover:underline"
              >
                {tr(language, "Ver catálogo", "Browse the catalog", "Ver catálogo")}
              </Link>
            </p>
          </form>

          <aside className="space-y-4">
            <div className="border border-border bg-section p-6 md:p-8">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-primary">
                <ShieldCheck className="size-4" />
                {tr(
                  language,
                  "Validação de exclusividade",
                  "Exclusivity validation",
                  "Validación de exclusividad",
                )}
              </div>
              <h2 className="mt-3 font-display text-3xl uppercase">
                {tr(language, "Porque 3 dados?", "Why 3 details?", "¿Por qué 3 datos?")}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {tr(
                  language,
                  "O portal cruza três informações antes de revelar qualquer dado. É o equivalente ao token público do OrbitTrack, adaptado à loja.",
                  "The portal checks three pieces of information before revealing any data. It's the equivalent of OrbitTrack's public token, adapted to the store.",
                  "El portal cruza tres informaciones antes de revelar cualquier dato. Es el equivalente al token público de OrbitTrack, adaptado a la tienda.",
                )}
              </p>
              <ol className="mt-5 space-y-4">
                {[
                  {
                    title: tr(language, "Número da encomenda", "Order number", "Número de pedido"),
                    text: tr(
                      language,
                      "Identifica a compra.",
                      "Identifies the purchase.",
                      "Identifica la compra.",
                    ),
                  },
                  {
                    title: tr(
                      language,
                      "Contacto do comprador",
                      "Buyer contact",
                      "Contacto del comprador",
                    ),
                    text: tr(
                      language,
                      "Confirma quem comprou.",
                      "Confirms who bought it.",
                      "Confirma quién compró.",
                    ),
                  },
                  {
                    title: tr(language, "Código exclusivo", "Exclusive code", "Código exclusivo"),
                    text: tr(
                      language,
                      "Gerado no checkout e guardado contigo.",
                      "Generated at checkout and kept with you.",
                      "Generado en el checkout y guardado contigo.",
                    ),
                  },
                ].map((item, index) => (
                  <li key={item.title} className="flex gap-3">
                    <span className="grid size-7 shrink-0 place-items-center bg-foreground text-xs font-bold text-background">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-bold">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="border border-dashed border-primary bg-primary/5 p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase text-primary">
                  {tr(
                    language,
                    "Experimenta sem comprar",
                    "Try without buying",
                    "Prueba sin comprar",
                  )}
                </p>
                <span className="border border-primary/30 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                  {tr(language, "Dados demo", "Demo data", "Datos demo")}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {tr(
                  language,
                  "Encomenda em trânsito com dois pares. Clica para preencher o formulário.",
                  "An in-transit order with two pairs. Click to fill the form.",
                  "Un pedido en tránsito con dos pares. Haz clic para rellenar el formulario.",
                )}
              </p>
              <dl className="mt-4 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">
                    {tr(language, "Encomenda", "Order", "Pedido")}
                  </dt>
                  <dd>{demoAccess.orderNumber}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">
                    {tr(language, "Contacto", "Contact", "Contacto")}
                  </dt>
                  <dd>{demoAccess.contact}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">
                    {tr(language, "Código", "Code", "Código")}
                  </dt>
                  <dd>{demoAccess.accessCode}</dd>
                </div>
              </dl>
              <Button
                type="button"
                variant="outline"
                className="mt-4 w-full rounded-none"
                onClick={fillDemo}
              >
                {tr(language, "Preencher acesso demo", "Fill demo access", "Rellenar acceso demo")}
                <ArrowRight />
              </Button>
              <p className="mt-3 text-[10px] text-muted-foreground">
                {tr(
                  language,
                  "Os dados demo são criados localmente no primeiro acesso.",
                  "Demo data is created locally on first visit.",
                  "Los datos demo se crean localmente en el primer acceso.",
                )}
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-y border-border bg-section">
        <div className="mx-auto grid max-w-7xl px-4 md:grid-cols-3 md:px-6">
          {steps.map((step) => (
            <div
              key={step.number}
              className="flex gap-4 border-b border-border py-6 last:border-b-0 md:border-b-0 md:border-r md:px-6 md:first:pl-0 md:last:border-r-0"
            >
              <step.icon className="mt-1 size-6 shrink-0 text-primary" />
              <div>
                <p className="text-[10px] font-bold uppercase text-muted-foreground">
                  {step.number}
                </p>
                <h3 className="mt-1 text-sm font-bold uppercase">{step.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        <div className="grid gap-3 md:grid-cols-2">
          <Link
            to="/verificar"
            className="group border border-border bg-card p-6 transition hover:border-primary md:p-8"
          >
            <ShieldCheck className="size-7 text-primary" />
            <h2 className="mt-4 font-display text-3xl uppercase">
              {tr(language, "Verifica o teu par", "Verify your pair", "Verifica tu par")}
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              {tr(
                language,
                "Cada par vendido tem um código de autenticidade único. Confirma aqui se é genuíno.",
                "Every pair sold has a unique authenticity code. Confirm here that it's genuine.",
                "Cada par vendido tiene un código de autenticidad único. Confirma aquí que es genuino.",
              )}
            </p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold uppercase text-primary">
              {tr(language, "Verificar código", "Verify code", "Verificar código")}
              <ArrowRight className="size-4 transition group-hover:translate-x-1" />
            </span>
          </Link>
          <a
            href="mailto:atendimento@uffastore.pt?subject=Ajuda%20com%20a%20minha%20encomenda"
            className="group border border-border bg-section p-6 transition hover:border-primary md:p-8"
          >
            <Mail className="size-7 text-primary" />
            <h2 className="mt-4 font-display text-3xl uppercase">
              {tr(language, "Precisas de ajuda?", "Need help?", "¿Necesitas ayuda?")}
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              {tr(
                language,
                "Fala com a equipa UFFA sobre prazos, recolhas ou qualquer detalhe da tua encomenda.",
                "Talk to the UFFA team about timings, pickups or any detail of your order.",
                "Habla con el equipo UFFA sobre plazos, recogidas o cualquier detalle de tu pedido.",
              )}
            </p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold uppercase text-primary">
              atendimento@uffastore.pt
              <ArrowRight className="size-4 transition group-hover:translate-x-1" />
            </span>
          </a>
        </div>
      </section>
    </div>
  );
}

function OrderDashboard({
  order,
  onOrderChange,
  onLogout,
}: {
  order: Order;
  onOrderChange: (order: Order) => void;
  onLogout: () => void;
}) {
  const { language } = useShop();
  const status = orderStatusInfo[order.status];
  const StatusIcon = statusIcons[order.status];

  const handleConfirm = () => {
    const updated = confirmOrderReceipt(order.number);
    if (updated) {
      onOrderChange(updated);
      toast.success(
        tr(
          language,
          "Receção confirmada. Obrigado!",
          "Receipt confirmed. Thank you!",
          "Recepción confirmada. ¡Gracias!",
        ),
      );
      return;
    }
    toast.error(
      tr(
        language,
        "Não foi possível atualizar a encomenda.",
        "Could not update the order.",
        "No se pudo actualizar el pedido.",
      ),
    );
  };

  return (
    <div>
      <section className="border-b border-border bg-section">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                UFFA Portal · {order.number}
              </p>
              <h1 className="mt-10 font-display text-5xl uppercase leading-[.9] md:text-7xl">
                {status.label[language]}.
              </h1>
              <p className="mt-3 max-w-2xl text-muted-foreground">{status.description[language]}</p>
            </div>
            <div className="flex flex-col items-start gap-3 lg:items-end">
              <span
                className={`inline-flex items-center gap-2 border px-3 py-1.5 text-xs font-bold uppercase ${status.tone}`}
              >
                <StatusIcon className="size-4" />
                {status.label[language]}
              </span>
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <LockKeyhole className="size-4 text-primary" />
                {tr(
                  language,
                  "Acesso exclusivo verificado",
                  "Exclusive access verified",
                  "Acceso exclusivo verificado",
                )}
              </p>
              <Button variant="outline" size="sm" className="rounded-none" onClick={onLogout}>
                <LogOut />
                {tr(language, "Terminar sessão", "Sign out", "Cerrar sesión")}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <ProgressCard order={order} />
            <CurrentStatusCard order={order} />
            <TimelineCard order={order} />
            <ItemsCard order={order} />
          </div>
          <aside className="space-y-6">
            <SummaryCard order={order} />
            <DeliveryCard order={order} />
            <ActionCard order={order} onConfirm={handleConfirm} />
            <HelpCard />
          </aside>
        </div>
      </div>
    </div>
  );
}

function ProgressCard({ order }: { order: Order }) {
  const { language } = useShop();
  const flow = statusFlow[order.delivery];
  const currentIndex = getStatusIndex(order);
  const final = isFinalStatus(order.status);
  const cancelled = order.status === "cancelled";

  return (
    <section className="border border-border bg-card p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-primary">
            {order.delivery === "shipping"
              ? tr(language, "Envio por correio", "Postal shipping", "Envío por correo")
              : tr(language, "Recolha em mãos", "Hand pickup", "Recogida en mano")}
          </p>
          <h2 className="mt-1 font-display text-3xl uppercase">
            {order.delivery === "shipping"
              ? tr(language, "Estado do envio", "Shipping status", "Estado del envío")
              : tr(language, "Estado da recolha", "Pickup status", "Estado de la recogida")}
          </h2>
        </div>
        <span className="font-mono text-xs text-muted-foreground">{order.number}</span>
      </div>

      {cancelled ? (
        <div className="mt-6 flex items-start gap-3 border border-destructive/30 bg-destructive/5 p-4 text-destructive">
          <XCircle className="mt-0.5 size-5 shrink-0" />
          <p className="text-sm">{orderStatusInfo.cancelled.description[language]}</p>
        </div>
      ) : (
        <>
          <ol className="mt-7 md:hidden">
            {flow.map((step, index) => {
              const done = index < currentIndex || (final && index <= currentIndex);
              const active = index === currentIndex && !final;
              const Icon = statusIcons[step];
              return (
                <li key={step} className="relative flex gap-4 pb-7 last:pb-0">
                  {index < flow.length - 1 && (
                    <span
                      className={`absolute left-4 top-8 h-[calc(100%-2rem)] w-0.5 ${
                        index < currentIndex ? "bg-primary" : "bg-border"
                      }`}
                    />
                  )}
                  <span
                    className={`relative z-10 grid size-8 shrink-0 place-items-center rounded-full border-2 ${
                      done
                        ? "border-primary bg-primary text-primary-foreground"
                        : active
                          ? "border-primary bg-background text-primary"
                          : "border-border bg-background text-muted-foreground"
                    }`}
                  >
                    {done ? <Check className="size-4" /> : <Icon className="size-4" />}
                  </span>
                  <div className="pt-1">
                    <p
                      className={`text-sm font-bold uppercase ${
                        active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {orderStatusInfo[step].label[language]}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {orderStatusInfo[step].description[language]}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>

          <ol className="mt-8 hidden md:flex">
            {flow.map((step, index) => {
              const done = index < currentIndex || (final && index <= currentIndex);
              const active = index === currentIndex && !final;
              const Icon = statusIcons[step];
              return (
                <li key={step} className="relative flex-1">
                  {index < flow.length - 1 && (
                    <span
                      className={`absolute left-4 top-4 h-0.5 w-[calc(100%-2rem)] ${
                        index < currentIndex ? "bg-primary" : "bg-border"
                      }`}
                    />
                  )}
                  <span
                    className={`relative z-10 grid size-8 place-items-center rounded-full border-2 ${
                      done
                        ? "border-primary bg-primary text-primary-foreground"
                        : active
                          ? "border-primary bg-background text-primary"
                          : "border-border bg-background text-muted-foreground"
                    }`}
                  >
                    {done ? <Check className="size-4" /> : <Icon className="size-4" />}
                  </span>
                  <p
                    className={`mt-3 pr-3 text-xs font-bold uppercase ${
                      active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {orderStatusInfo[step].label[language]}
                  </p>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </section>
  );
}

function CurrentStatusCard({ order }: { order: Order }) {
  const { language } = useShop();
  const isPickup = order.delivery === "pickup";

  return (
    <section className="border border-border bg-card p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-3xl uppercase">
          {isPickup
            ? tr(language, "Onde recolher", "Where to collect", "Dónde recoger")
            : tr(language, "Detalhes da entrega", "Delivery details", "Detalles de la entrega")}
        </h2>
        <p className="text-xs text-muted-foreground">
          {tr(language, "Atualizado", "Updated", "Actualizado")}{" "}
          {formatDateTime(order.updatedAt, language)}
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <InfoBlock
          icon={CalendarDays}
          label={
            isPickup
              ? tr(language, "Disponível até", "Available until", "Disponible hasta")
              : tr(language, "Entrega prevista", "Estimated delivery", "Entrega prevista")
          }
          value={formatDate(order.estimatedDelivery, language)}
        />
        {isPickup ? (
          <InfoBlock
            icon={Store}
            label={tr(language, "Local de recolha", "Pickup point", "Punto de recogida")}
            value={order.pickupLocation ?? "—"}
          />
        ) : (
          <InfoBlock
            icon={Truck}
            label={tr(language, "Transportador", "Carrier", "Transportista")}
            value={order.carrier ?? "—"}
          />
        )}
      </div>

      {!isPickup && order.trackingCode && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border border-border bg-section px-4 py-3">
          <div className="flex items-center gap-2">
            <Navigation className="size-4 text-primary" />
            <span className="text-xs font-bold uppercase text-muted-foreground">
              {tr(language, "Código de rastreio", "Tracking code", "Código de seguimiento")}
            </span>
            <code className="font-mono text-sm font-bold">{order.trackingCode}</code>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-none"
            onClick={() =>
              copyText(
                order.trackingCode ?? "",
                language,
                tr(language, "Código de rastreio", "Tracking code", "Código de seguimiento"),
              )
            }
          >
            <Copy />
            {tr(language, "Copiar", "Copy", "Copiar")}
          </Button>
        </div>
      )}

      {order.notes && (
        <div className="mt-4 border-l-2 border-primary bg-primary/5 px-4 py-3">
          <p className="text-[10px] font-bold uppercase text-primary">
            {tr(language, "Nota da loja", "Store note", "Nota de la tienda")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{order.notes}</p>
        </div>
      )}
    </section>
  );
}

function InfoBlock({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="border border-border bg-section p-4">
      <p className="flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground">
        <Icon className="size-3.5 text-primary" />
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  );
}

function TimelineCard({ order }: { order: Order }) {
  const { language } = useShop();
  const events = order.events.slice().sort((a, b) => b.at.localeCompare(a.at));

  return (
    <section className="border border-border bg-card p-6 md:p-8">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-3xl uppercase">
          {tr(language, "Histórico", "History", "Historial")}
        </h2>
        <span className="text-xs text-muted-foreground">
          {events.length} {tr(language, "movimentos", "events", "movimientos")}
        </span>
      </div>

      <ol className="mt-6 space-y-0">
        {events.map((event, index) => {
          const info = orderStatusInfo[event.status];
          const Icon = statusIcons[event.status];
          const latest = index === 0;
          return (
            <li key={event.id} className="relative flex gap-4 pb-7 last:pb-0">
              {index < events.length - 1 && (
                <span className="absolute left-4 top-8 h-[calc(100%-2rem)] w-0.5 bg-border" />
              )}
              <span
                className={`relative z-10 grid size-8 shrink-0 place-items-center rounded-full border-2 ${
                  latest
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground"
                }`}
              >
                <Icon className="size-4" />
              </span>
              <div className="pt-0.5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p
                    className={`text-sm font-bold uppercase ${latest ? "text-primary" : "text-foreground"}`}
                  >
                    {info.label[language]}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatDateTime(event.at, language)}
                  </p>
                </div>
                {event.location && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <MapPin className="size-3" />
                    {event.location}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {event.message ?? info.description[language]}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function ItemsCard({ order }: { order: Order }) {
  const { language } = useShop();

  return (
    <section className="border border-border bg-card p-6 md:p-8">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-3xl uppercase">
          {tr(language, "Itens", "Items", "Artículos")}
        </h2>
        <span className="text-xs text-muted-foreground">
          {order.items.length} {tr(language, "referências", "references", "referencias")}
        </span>
      </div>

      <div className="mt-4">
        {order.items.map((item) => {
          const product = products.find((candidate) => candidate.id === item.productId);
          return (
            <div
              key={`${item.productId}-${item.size}`}
              className="grid gap-4 border-b border-border py-5 last:border-b-0 sm:grid-cols-[96px_1fr]"
            >
              {product && (
                <img
                  src={product.image}
                  alt={item.name}
                  width={1200}
                  height={900}
                  className="aspect-square w-24 bg-product object-cover"
                />
              )}
              <div>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">
                      {product ? categoryNames[product.category][language] : "UFFA"}
                    </p>
                    <h3 className="mt-1 font-bold">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {tr(language, "Tamanho", "Size", "Talla")} {item.size} · {item.quantity}x
                    </p>
                  </div>
                  <p className="font-bold">{money(item.unitPrice * item.quantity)}</p>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 border border-primary/20 bg-primary/5 px-3 py-2">
                  <ShieldCheck className="size-4 text-primary" />
                  <span className="text-[10px] font-bold uppercase text-primary">
                    {tr(
                      language,
                      "Código de autenticidade",
                      "Authenticity code",
                      "Código de autenticidad",
                    )}
                  </span>
                  <code className="font-mono text-xs font-bold">{item.authCode}</code>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label={tr(language, "Copiar código", "Copy code", "Copiar código")}
                    onClick={() =>
                      copyText(
                        item.authCode,
                        language,
                        tr(
                          language,
                          "Código de autenticidade",
                          "Authenticity code",
                          "Código de autenticidad",
                        ),
                      )
                    }
                  >
                    <Copy />
                  </Button>
                  <Button asChild variant="link" size="sm" className="ml-auto h-auto p-0 text-xs">
                    <Link to="/verificar" search={{ codigo: item.authCode }}>
                      {tr(language, "Verificar", "Verify", "Verificar")}
                      <ExternalLink />
                    </Link>
                  </Button>
                </div>

                <p className="mt-2 text-[11px] text-muted-foreground">
                  {tr(language, "Nº de série", "Serial no.", "Nº de serie")}:{" "}
                  <span className="font-mono">{item.serial}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SummaryCard({ order }: { order: Order }) {
  const { language } = useShop();

  return (
    <section className="border border-border bg-card p-6">
      <h2 className="font-display text-2xl uppercase">
        {tr(language, "Resumo", "Summary", "Resumen")}
      </h2>
      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">
            {tr(language, "Subtotal", "Subtotal", "Subtotal")}
          </span>
          <span>{money(order.subtotal)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">
            {tr(language, "Portes", "Shipping", "Envío")}
          </span>
          <span>
            {order.shipping > 0 ? money(order.shipping) : tr(language, "Grátis", "Free", "Gratis")}
          </span>
        </div>
        <div className="flex justify-between gap-3 border-t border-border pt-2 text-base font-bold">
          <span>Total</span>
          <span>{money(order.total)}</span>
        </div>
      </div>
      <dl className="mt-5 space-y-2 border-t border-border pt-4 text-xs">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">{tr(language, "Encomenda", "Order", "Pedido")}</dt>
          <dd className="font-mono">{order.number}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">{tr(language, "Data", "Date", "Fecha")}</dt>
          <dd>{formatDate(order.createdAt, language)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">
            {tr(language, "Entrega", "Delivery", "Entrega")}
          </dt>
          <dd>
            {order.delivery === "shipping"
              ? tr(language, "Correio", "Shipping", "Correo")
              : tr(language, "Recolha", "Pickup", "Recogida")}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">{tr(language, "Pagamento", "Payment", "Pago")}</dt>
          <dd>{order.payment === "mbway" ? "MB WAY" : "Apple Pay"}</dd>
        </div>
      </dl>
    </section>
  );
}

function DeliveryCard({ order }: { order: Order }) {
  const { language } = useShop();
  const isPickup = order.delivery === "pickup";
  const contactHref = order.contact.includes("@")
    ? `mailto:${order.contact}`
    : `tel:${order.contact.replace(/\s+/g, "")}`;

  return (
    <section className="border border-border bg-card p-6">
      <h2 className="font-display text-2xl uppercase">
        {isPickup
          ? tr(language, "Recolha", "Pickup", "Recogida")
          : tr(language, "Entrega", "Delivery", "Entrega")}
      </h2>
      <div className="mt-4 space-y-3 text-sm">
        <p className="flex items-start gap-2">
          <User className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>{order.customerName}</span>
        </p>
        <p className="flex items-start gap-2">
          <Mail className="mt-0.5 size-4 shrink-0 text-primary" />
          <a href={contactHref} className="break-all hover:text-primary">
            {order.contact}
          </a>
        </p>
        <p className="flex items-start gap-2">
          <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>{isPickup ? order.pickupLocation : order.address}</span>
        </p>
      </div>
      {isPickup && order.pickupLocation && (
        <Button asChild variant="outline" size="sm" className="mt-4 w-full rounded-none">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.pickupLocation)}`}
            target="_blank"
            rel="noreferrer"
          >
            <MapPin />
            {tr(language, "Abrir no mapa", "Open in maps", "Abrir en el mapa")}
          </a>
        </Button>
      )}
      {isPickup && (
        <p className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
          <Hand className="size-3.5 text-primary" />
          {tr(
            language,
            "Recolha gratuita no Porto",
            "Free pickup in Porto",
            "Recogida gratuita en Oporto",
          )}
        </p>
      )}
    </section>
  );
}

function ActionCard({ order, onConfirm }: { order: Order; onConfirm: () => void }) {
  const { language } = useShop();
  const canConfirm =
    (order.delivery === "shipping" &&
      (order.status === "shipped" || order.status === "in_transit")) ||
    (order.delivery === "pickup" && order.status === "ready_pickup");
  const final = order.status === "delivered" || order.status === "picked_up";

  if (order.status === "cancelled") {
    return (
      <section className="border border-destructive/30 bg-destructive/5 p-6">
        <XCircle className="size-7 text-destructive" />
        <h2 className="mt-3 font-display text-2xl uppercase">
          {tr(language, "Encomenda cancelada", "Order cancelled", "Pedido cancelado")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {orderStatusInfo.cancelled.description[language]}
        </p>
      </section>
    );
  }

  if (final) {
    return (
      <section className="border border-emerald-600/30 bg-emerald-600/5 p-6">
        <CheckCircle2 className="size-7 text-emerald-600" />
        <h2 className="mt-3 font-display text-2xl uppercase">
          {tr(language, "Encomenda concluída", "Order complete", "Pedido completado")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {tr(
            language,
            "Obrigado pela tua compra. Podes voltar aqui sempre que quiseres para consultar os códigos de autenticidade.",
            "Thanks for your purchase. You can come back anytime to check the authenticity codes.",
            "Gracias por tu compra. Puedes volver aquí cuando quieras para consultar los códigos de autenticidad.",
          )}
        </p>
        <Button asChild variant="outline" className="mt-4 w-full rounded-none">
          <Link to="/catalogo" search={{}}>
            {tr(language, "Ver catálogo", "Browse catalog", "Ver catálogo")}
            <ArrowRight />
          </Link>
        </Button>
      </section>
    );
  }

  if (canConfirm) {
    return (
      <section className="border border-primary bg-primary/5 p-6">
        <PackageCheck className="size-7 text-primary" />
        <h2 className="mt-3 font-display text-2xl uppercase">
          {order.delivery === "shipping"
            ? tr(language, "Já recebeste?", "Already received?", "¿Ya lo recibiste?")
            : tr(language, "Já recolheste?", "Already picked up?", "¿Ya lo recogiste?")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {order.delivery === "shipping"
            ? tr(
                language,
                "Confirma a receção para fechar a encomenda. Se algo estiver errado, fala connosco.",
                "Confirm receipt to close the order. If something is wrong, talk to us.",
                "Confirma la recepción para cerrar el pedido. Si algo está mal, habla con nosotros.",
              )
            : tr(
                language,
                "Confirma a recolha para fechar a encomenda. Obrigado pela visita.",
                "Confirm pickup to close the order. Thanks for visiting.",
                "Confirma la recogida para cerrar el pedido. Gracias por la visita.",
              )}
        </p>
        <Button className="mt-4 w-full rounded-none" onClick={onConfirm}>
          <CheckCircle2 />
          {order.delivery === "shipping"
            ? tr(language, "Confirmar receção", "Confirm receipt", "Confirmar recepción")
            : tr(language, "Confirmar recolha", "Confirm pickup", "Confirmar recogida")}
        </Button>
      </section>
    );
  }

  return (
    <section className="border border-border bg-section p-6">
      <Clock3 className="size-7 text-primary" />
      <h2 className="mt-3 font-display text-2xl uppercase">
        {tr(language, "Estamos a preparar", "We're preparing", "Estamos preparando")}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {tr(
          language,
          "Assim que houver uma atualização, o estado aparece aqui. Guarda esta página nos favoritos.",
          "As soon as there's an update, the status appears here. Bookmark this page.",
          "En cuanto haya una actualización, el estado aparecerá aquí. Guarda esta página en favoritos.",
        )}
      </p>
    </section>
  );
}

function HelpCard() {
  const { language } = useShop();
  return (
    <section className="border border-border bg-card p-6">
      <Mail className="size-6 text-primary" />
      <h2 className="mt-3 font-display text-2xl uppercase">
        {tr(language, "Ajuda", "Help", "Ayuda")}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {tr(
          language,
          "Dúvidas sobre prazos, recolhas ou autenticidade? Fala com a equipa UFFA.",
          "Questions about timings, pickups or authenticity? Talk to the UFFA team.",
          "¿Dudas sobre plazos, recogidas o autenticidad? Habla con el equipo UFFA.",
        )}
      </p>
      <a
        href="mailto:atendimento@uffastore.pt?subject=Ajuda%20com%20a%20minha%20encomenda"
        className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
      >
        atendimento@uffastore.pt
        <ArrowRight className="size-4" />
      </a>
      <p className="mt-3 text-[11px] text-muted-foreground">
        {tr(
          language,
          "Resposta em 24h úteis.",
          "Reply within 24 business hours.",
          "Respuesta en 24h laborables.",
        )}
      </p>
    </section>
  );
}
