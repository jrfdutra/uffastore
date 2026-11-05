import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ClipboardList,
  Copy,
  ExternalLink,
  KeyRound,
  LogOut,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Store,
  Tag,
  Trash2,
  Truck,
  Upload,
  CheckCircle2,
  AlertCircle,
  EyeOff,
  Clock,
  Edit,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { tr } from "@/lib/i18n";
import {
  categoryNames,
  getProductEffectiveStatus,
  getProductTotalStock,
  money,
  type Category,
  type Product,
  type ProductSize,
  type ProductStatus,
} from "@/lib/shop-data";
import { useShop } from "@/lib/shop-context";
import { readStorage, removeStorage, writeStorage } from "@/lib/storage";
import {
  formatDate,
  formatDateTime,
  fromDateInputValue,
  getNextStatus,
  loadOrders,
  orderStatusInfo,
  statusFlow,
  toDateInputValue,
  updateOrder,
  type Order,
  type OrderStatus,
} from "@/lib/orders";

export const Route = createFileRoute("/operacoes")({
  head: () => ({
    meta: [
      { title: "Operações — Uffa Store" },
      {
        name: "description",
        content: "Painel interno de demonstração para gerir o estado das encomendas UFFA.",
      },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/operacoes" }],
  }),
  component: OperationsPage,
});

const OPS_SESSION_KEY = "uffa-ops-session-v1";
const OPS_ACCESS_KEY = "UFFA-OPS-2026";
const allStatuses = Object.keys(orderStatusInfo) as OrderStatus[];

function OperationsPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setUnlocked(readStorage("session", OPS_SESSION_KEY) === "1");
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="h-10 w-52 animate-pulse bg-muted" />
        <div className="mt-6 h-72 animate-pulse bg-muted" />
      </div>
    );
  }

  if (!unlocked) {
    return (
      <OpsGate
        onUnlock={() => {
          writeStorage("session", OPS_SESSION_KEY, "1");
          setUnlocked(true);
        }}
      />
    );
  }

  return (
    <OpsDashboard
      onLock={() => {
        removeStorage("session", OPS_SESSION_KEY);
        setUnlocked(false);
      }}
    />
  );
}

function OpsGate({ onUnlock }: { onUnlock: () => void }) {
  const { language } = useShop();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (cleanEmail !== "atendimento@uffastore.pt" && cleanEmail !== "ops@uffastore.pt") {
      setError(
        tr(
          language,
          "Utilizador ou e-mail incorreto.",
          "Incorrect user or email.",
          "Usuario o correo electrónico incorrecto.",
        ),
      );
      return;
    }

    if (cleanPassword !== OPS_ACCESS_KEY) {
      setError(
        tr(
          language,
          "Palavra-passe incorreta.",
          "Incorrect password.",
          "Contraseña incorrecta.",
        ),
      );
      return;
    }

    setError("");
    onUnlock();
  };

  return (
    <div className="mx-auto grid min-h-[75vh] max-w-5xl place-items-center px-4 py-14 md:px-6">
      <div className="w-full max-w-xl border border-border bg-card p-6 md:p-10">
        <span className="grid size-12 place-items-center bg-foreground text-background">
          <KeyRound className="size-6" />
        </span>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-primary">
          UFFA Ops · {tr(language, "Acesso interno", "Internal access", "Acceso interno")}
        </p>
        <h1 className="mt-2 font-display text-5xl uppercase leading-[.9] md:text-6xl">
          {tr(language, "Operações.", "Operations.", "Operaciones.")}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {tr(
            language,
            "Painel interno para atualizar estados de envio, rastreio, previsão de entrega e notas públicas.",
            "Internal panel to update shipping statuses, tracking, estimated delivery and public notes.",
            "Panel interno para actualizar estados de envío, seguimiento, previsión de entrega y notas públicas.",
          )}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ops-email">
              {tr(language, "Utilizador / E-mail", "Username / Email", "Usuario / Email")}
            </Label>
            <Input
              id="ops-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ops@uffastore.pt"
              autoComplete="email"
              className="h-11 rounded-none"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ops-password">
              {tr(language, "Palavra-passe", "Password", "Contraseña")}
            </Label>
            <Input
              id="ops-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••••••"
              autoComplete="current-password"
              className="h-11 rounded-none"
              required
            />
          </div>

          {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
          <Button type="submit" size="lg" className="h-12 w-full rounded-none">
            <KeyRound />
            {tr(language, "Entrar no painel", "Enter panel", "Entrar en el panel")}
          </Button>
        </form>

        <div className="mt-5 border border-dashed border-primary bg-primary/15 p-4">
          <p className="text-[10px] font-bold uppercase text-primary">
            {tr(language, "Dados de Acesso Oficiais", "Official Credentials", "Credenciales Oficiales")}
          </p>
          <div className="mt-2 space-y-1 text-xs font-medium">
            <p>E-mail: <code className="font-mono font-bold">ops@uffastore.pt</code></p>
            <p>Password: <code className="font-mono font-bold">{OPS_ACCESS_KEY}</code></p>
          </div>
        </div>

        <p className="mt-4 text-[11px] text-muted-foreground">
          {tr(
            language,
            "Este painel está protegido por autenticação e registo de auditoria interno UFFA Store.",
            "This panel is protected by UFFA Store authentication and internal audit logging.",
            "Este panel está protegido por autenticación y registro de auditoría interno de UFFA Store.",
          )}
        </p>
      </div>
    </div>
  );
}

function OpsDashboard({ onLock }: { onLock: () => void }) {
  const { language } = useShop();
  const [activeTab, setActiveTab] = useState<"orders" | "models">("models");
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");

  useEffect(() => {
    const refresh = () => setOrders(loadOrders());
    refresh();
    window.addEventListener("uffa-orders-changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("uffa-orders-changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesQuery =
        !needle ||
        order.number.toLowerCase().includes(needle) ||
        order.customerName.toLowerCase().includes(needle) ||
        order.contact.toLowerCase().includes(needle);
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [orders, query, statusFilter]);

  const selected = orders.find((order) => order.number === selectedNumber) ?? null;

  const stats = [
    {
      label: tr(language, "Encomendas", "Orders", "Pedidos"),
      value: orders.length,
      icon: ClipboardList,
    },
    {
      label: tr(language, "Em trânsito", "In transit", "En tránsito"),
      value: orders.filter((order) => order.status === "shipped" || order.status === "in_transit")
        .length,
      icon: Truck,
    },
    {
      label: tr(language, "Prontas para recolha", "Ready for pickup", "Listas para recoger"),
      value: orders.filter((order) => order.status === "ready_pickup").length,
      icon: Store,
    },
    {
      label: tr(language, "Concluídas", "Completed", "Completados"),
      value: orders.filter((order) => order.status === "delivered" || order.status === "picked_up")
        .length,
      icon: PackageCheck,
    },
  ];

  return (
    <div>
      <section className="border-b border-border bg-foreground text-background">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
                <KeyRound className="size-4" />
                UFFA Ops · {tr(language, "Painel interno", "Internal panel", "Panel interno")}
              </p>
              <h1 className="mt-10 font-display text-5xl uppercase leading-[.9] md:text-6xl">
                {activeTab === "models"
                  ? tr(language, "Gestão de Modelos", "Model Management", "Gestión de Modelos")
                  : tr(language, "Gestão de encomendas", "Order management", "Gestión de pedidos")}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-background/60">
                {activeTab === "models"
                  ? tr(
                      language,
                      "Controla modelos, stock por variante, preços e publicação em tempo real na loja.",
                      "Control product models, variant stock, pricing and live store publication.",
                      "Controla modelos, stock por variante, precios y publicación en la tienda.",
                    )
                  : tr(
                      language,
                      "Atualiza o estado de envio ou recolha, o rastreio e a previsão. Cada alteração fica registada no histórico do cliente.",
                      "Update shipping or pickup status, tracking and estimates. Every change is recorded in the customer timeline.",
                      "Actualiza el estado de envío o recogida, el seguimiento y la previsión. Cada cambio queda registrado en el historial del cliente.",
                    )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-none border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background"
              >
                <Link to="/">
                  {tr(language, "Ver site", "View site", "Ver sitio")}
                  <ExternalLink />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-none border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background"
                onClick={onLock}
              >
                <LogOut />
                {tr(language, "Sair", "Sign out", "Salir")}
              </Button>
            </div>
          </div>

          <div className="mt-8 flex gap-2 border-b border-background/20 pb-px">
            <button
              type="button"
              onClick={() => setActiveTab("models")}
              className={`border-b-2 px-4 py-2 text-sm font-bold uppercase transition ${
                activeTab === "models"
                  ? "border-primary text-primary"
                  : "border-transparent text-background/60 hover:text-background"
              }`}
            >
              {tr(language, "Gestão de Modelos", "Model Management", "Gestión de Modelos")}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              className={`border-b-2 px-4 py-2 text-sm font-bold uppercase transition ${
                activeTab === "orders"
                  ? "border-primary text-primary"
                  : "border-transparent text-background/60 hover:text-background"
              }`}
            >
              {tr(language, "Encomendas", "Orders", "Pedidos")}
            </button>
          </div>
        </div>
      </section>

      {activeTab === "models" ? (
        <ModelsManagementView />
      ) : (
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">
                  {stat.label}
                </p>
                <stat.icon className="size-4 text-primary" />
              </div>
              <p className="mt-2 font-display text-4xl">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 border border-border bg-section p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={tr(
                language,
                "Pesquisar por encomenda, nome ou contacto",
                "Search by order, name or contact",
                "Buscar por pedido, nombre o contacto",
              )}
              className="h-11 rounded-none bg-background pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as "all" | OrderStatus)}
            >
              <SelectTrigger className="h-11 w-full min-w-48 rounded-none bg-background md:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {tr(language, "Todos os estados", "All statuses", "Todos los estados")}
                </SelectItem>
                {allStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {orderStatusInfo[status].label[language]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_460px]">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-2xl uppercase">
                {tr(language, "Fila de encomendas", "Order queue", "Cola de pedidos")}
              </h2>
              <span className="text-xs text-muted-foreground">
                {filtered.length} {tr(language, "resultados", "results", "resultados")}
              </span>
            </div>
            {filtered.length === 0 ? (
              <div className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                {tr(
                  language,
                  "Nenhuma encomenda encontrada.",
                  "No orders found.",
                  "No se encontraron pedidos.",
                )}
              </div>
            ) : (
              <div className="max-h-[720px] space-y-2 overflow-auto pr-1">
                {filtered.map((order) => {
                  const status = orderStatusInfo[order.status];
                  const isSelected = selectedNumber === order.number;
                  return (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => setSelectedNumber(order.number)}
                      className={`w-full border p-4 text-left transition ${
                        isSelected
                          ? "border-primary bg-primary/15"
                          : "border-border bg-card hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-mono text-xs font-bold">{order.number}</p>
                          <p className="mt-1 truncate font-bold">{order.customerName}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {order.delivery === "shipping"
                              ? tr(language, "Envio", "Shipping", "Envío")
                              : tr(language, "Recolha", "Pickup", "Recogida")}{" "}
                            · {formatDate(order.createdAt, language)}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <span
                            className={`inline-flex border px-2 py-1 text-[10px] font-bold uppercase ${status.tone}`}
                          >
                            {status.label[language]}
                          </span>
                          <span className="text-sm font-bold">{money(order.total)}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            {selected ? (
              <OrderEditor
                key={selected.number}
                order={selected}
                onUpdated={(updated) => {
                  setOrders(loadOrders());
                  setSelectedNumber(updated.number);
                }}
              />
            ) : (
              <div className="grid min-h-72 place-items-center border border-dashed border-border p-8 text-center">
                <div>
                  <ClipboardList className="mx-auto size-9 text-muted-foreground" />
                  <h2 className="mt-3 font-display text-2xl uppercase">
                    {tr(
                      language,
                      "Seleciona uma encomenda",
                      "Select an order",
                      "Selecciona un pedido",
                    )}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {tr(
                      language,
                      "Escolhe uma encomenda na lista para atualizar o estado de envio.",
                      "Choose an order from the list to update its shipping status.",
                      "Elige un pedido de la lista para actualizar su estado de envío.",
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

function OrderEditor({ order, onUpdated }: { order: Order; onUpdated: (order: Order) => void }) {
  const { language } = useShop();
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [tracking, setTracking] = useState(order.trackingCode ?? "");
  const [carrier, setCarrier] = useState(order.carrier ?? "");
  const [estimated, setEstimated] = useState(toDateInputValue(order.estimatedDelivery));
  const [notes, setNotes] = useState(order.notes ?? "");

  useEffect(() => {
    setStatus(order.status);
    setTracking(order.trackingCode ?? "");
    setCarrier(order.carrier ?? "");
    setEstimated(toDateInputValue(order.estimatedDelivery));
    setNotes(order.notes ?? "");
  }, [order]);

  const flow = statusFlow[order.delivery];
  const statusOptions: OrderStatus[] = flow.includes("cancelled") ? flow : [...flow, "cancelled"];
  const next = getNextStatus(order);
  const statusInfo = orderStatusInfo[order.status];

  const save = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const updated = updateOrder(order.number, {
      status,
      trackingCode: order.delivery === "shipping" ? tracking.trim() || null : null,
      carrier: order.delivery === "shipping" ? carrier.trim() || null : null,
      estimatedDelivery: fromDateInputValue(estimated),
      notes: notes.trim() || null,
    });
    if (!updated) {
      toast.error(
        tr(language, "Não foi possível guardar.", "Could not save.", "No se pudo guardar."),
      );
      return;
    }
    toast.success(tr(language, "Encomenda atualizada.", "Order updated.", "Pedido actualizado."));
    onUpdated(updated);
  };

  const advance = () => {
    if (!next) return;
    const updated = updateOrder(order.number, { status: next });
    if (!updated) return;
    toast.success(
      tr(
        language,
        `Estado atualizado para ${orderStatusInfo[next].label.pt}.`,
        `Status updated to ${orderStatusInfo[next].label.en}.`,
        `Estado actualizado a ${orderStatusInfo[next].label.es}.`,
      ),
    );
    onUpdated(updated);
  };

  const copyCredentials = async () => {
    const credentials = [
      `${tr(language, "Encomenda", "Order", "Pedido")}: ${order.number}`,
      `${tr(language, "Contacto", "Contact", "Contacto")}: ${order.contact}`,
      `${tr(language, "Código exclusivo", "Exclusive code", "Código exclusivo")}: ${order.accessCode}`,
      `Portal: ${window.location.origin}/rastreio?order=${order.number}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(credentials);
      toast.success(
        tr(language, "Credenciais copiadas.", "Credentials copied.", "Credenciales copiadas."),
      );
    } catch {
      toast.error(
        tr(language, "Não foi possível copiar.", "Could not copy.", "No se pudo copiar."),
      );
    }
  };

  return (
    <section className="border border-border bg-card">
      <div className="border-b border-border p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs font-bold">{order.number}</p>
            <h2 className="mt-1 font-display text-3xl uppercase leading-none">
              {order.customerName}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {order.delivery === "shipping"
                ? tr(language, "Envio por correio", "Postal shipping", "Envío por correo")
                : tr(language, "Recolha em mãos", "Hand pickup", "Recogida en mano")}{" "}
              · {money(order.total)}
            </p>
          </div>
          <span
            className={`inline-flex border px-2 py-1 text-[10px] font-bold uppercase ${statusInfo.tone}`}
          >
            {statusInfo.label[language]}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{order.contact}</span>
          <span>·</span>
          <span>
            {tr(language, "Criada", "Created", "Creado")} {formatDate(order.createdAt, language)}
          </span>
        </div>
      </div>

      <div className="border-b border-border bg-primary/15 p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase text-primary">
            <KeyRound className="size-3.5" />
            {tr(language, "Acesso do cliente", "Customer access", "Acceso del cliente")}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 rounded-none px-2 text-xs"
            onClick={copyCredentials}
          >
            <Copy />
            {tr(language, "Copiar", "Copy", "Copiar")}
          </Button>
        </div>
        <div className="mt-2 grid gap-1 font-mono text-xs">
          <p>
            <span className="text-muted-foreground">
              {tr(language, "Código", "Code", "Código")}:
            </span>{" "}
            <span className="font-bold">{order.accessCode}</span>
          </p>
          <Link
            to="/rastreio"
            search={{ order: order.number }}
            className="inline-flex items-center gap-1 font-sans text-[11px] font-bold text-primary hover:underline"
          >
            {tr(
              language,
              "Abrir portal do cliente",
              "Open customer portal",
              "Abrir portal del cliente",
            )}
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>

      <form onSubmit={save} className="space-y-4 p-5">
        <div className="space-y-2">
          <Label htmlFor={`status-${order.id}`}>{tr(language, "Estado", "Status", "Estado")}</Label>
          <Select value={status} onValueChange={(value) => setStatus(value as OrderStatus)}>
            <SelectTrigger id={`status-${order.id}`} className="h-11 rounded-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {orderStatusInfo[option].label[language]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`estimated-${order.id}`}>
            {tr(
              language,
              "Previsão de entrega / recolha",
              "Delivery / pickup estimate",
              "Previsión de entrega / recogida",
            )}
          </Label>
          <Input
            id={`estimated-${order.id}`}
            type="date"
            value={estimated}
            onChange={(event) => setEstimated(event.target.value)}
            className="h-11 rounded-none"
          />
        </div>

        {order.delivery === "shipping" && (
          <>
            <div className="space-y-2">
              <Label htmlFor={`tracking-${order.id}`}>
                {tr(language, "Código de rastreio", "Tracking code", "Código de seguimiento")}
              </Label>
              <Input
                id={`tracking-${order.id}`}
                value={tracking}
                onChange={(event) => setTracking(event.target.value)}
                placeholder="PT-48217-9QX2"
                className="h-11 rounded-none font-mono uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`carrier-${order.id}`}>
                {tr(language, "Transportador", "Carrier", "Transportista")}
              </Label>
              <Input
                id={`carrier-${order.id}`}
                value={carrier}
                onChange={(event) => setCarrier(event.target.value)}
                placeholder="CTT Expresso"
                className="h-11 rounded-none"
              />
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor={`notes-${order.id}`}>
            {tr(language, "Nota pública", "Public note", "Nota pública")}
          </Label>
          <Textarea
            id={`notes-${order.id}`}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder={tr(
              language,
              "Ex.: A encomenda segue para distribuição no Porto.",
              "E.g. The order is out for delivery in Porto.",
              "Ej.: El pedido va en reparto en Oporto.",
            )}
            className="rounded-none"
          />
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          <Button type="submit" className="flex-1 rounded-none">
            <PackageCheck />
            {tr(language, "Guardar alterações", "Save changes", "Guardar cambios")}
          </Button>
          {next && (
            <Button type="button" variant="outline" className="rounded-none" onClick={advance}>
              {tr(language, "Avançar para", "Advance to", "Avanzar a")}{" "}
              {orderStatusInfo[next].label[language]}
              <ArrowRight />
            </Button>
          )}
        </div>
      </form>

      <div className="border-t border-border p-5">
        <p className="text-[10px] font-bold uppercase text-muted-foreground">
          {tr(language, "Últimos movimentos", "Latest events", "Últimos movimientos")}
        </p>
        <ol className="mt-3 space-y-2">
          {order.events
            .slice()
            .sort((a, b) => b.at.localeCompare(a.at))
            .slice(0, 3)
            .map((event) => (
              <li key={event.id} className="flex items-start justify-between gap-3 text-xs">
                <span className="font-semibold">
                  {orderStatusInfo[event.status].label[language]}
                </span>
                <span className="text-muted-foreground">{formatDateTime(event.at, language)}</span>
              </li>
            ))}
        </ol>
      </div>
    </section>
  );
}

function ModelsManagementView() {
  const { catalog, language, saveProduct, deleteProduct, updateStock, resetCatalog } = useShop();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredModels = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return catalog.filter((product) => {
      const matchesSearch =
        !q ||
        product.name.toLowerCase().includes(q) ||
        (product.sku && product.sku.toLowerCase().includes(q)) ||
        product.id.toLowerCase().includes(q);

      const matchesCategory =
        categoryFilter === "all" || product.category === categoryFilter;

      const effective = getProductEffectiveStatus(product);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && effective === "active") ||
        (statusFilter === "inactive" && product.status === "inactive") ||
        (statusFilter === "soldout" && effective === "soldout") ||
        (statusFilter === "comingsoon" && effective === "comingsoon");

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [catalog, searchQuery, categoryFilter, statusFilter]);

  const handleOpenNew = () => {
    const newModel: Product = {
      id: `uffa-model-${Date.now().toString(36)}`,
      sku: `UFFA-${Math.floor(100 + Math.random() * 900)}`,
      name: "",
      category: "casual",
      price: 0.2,
      status: "active",
      image: "",
      description: {
        pt: "",
        en: "",
        es: "",
      },
      sizes: [
        { size: 36, stock: 1 },
        { size: 37, stock: 1 },
        { size: 38, stock: 2 },
        { size: 39, stock: 2 },
        { size: 40, stock: 2 },
        { size: 41, stock: 1 },
        { size: 42, stock: 1 },
      ],
    };
    setEditingProduct(newModel);
    setIsDialogOpen(true);
  };

  const handleEdit = (p: Product) => {
    setEditingProduct(JSON.parse(JSON.stringify(p)));
    setIsDialogOpen(true);
  };

  const handleToggleActive = (p: Product) => {
    const nextStatus: ProductStatus = p.status === "inactive" ? "active" : "inactive";
    saveProduct({
      ...p,
      status: nextStatus,
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-3xl uppercase tracking-wide">
            {tr(language, "Catálogo de Modelos", "Model Catalog", "Catálogo de Modelos")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {filteredModels.length}{" "}
            {tr(language, "modelos apresentados", "models shown", "modelos mostrados")} ·{" "}
            {catalog.length} {tr(language, "no total", "total", "en total")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetCatalog}
            className="rounded-none text-xs"
          >
            <RefreshCw className="size-3.5" />
            {tr(language, "Repor Originais", "Reset to Defaults", "Restablecer Originales")}
          </Button>
          <Button
            size="sm"
            onClick={handleOpenNew}
            className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold uppercase"
          >
            <Plus className="size-4" />
            {tr(language, "Adicionar Modelo", "Add Model", "Añadir Modelo")}
          </Button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 border border-border bg-section p-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={tr(
              language,
              "Pesquisar por modelo, nome ou SKU...",
              "Search by model, name or SKU...",
              "Buscar por modelo, nombre o SKU...",
            )}
            className="h-11 rounded-none bg-background pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-11 w-44 rounded-none bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {tr(language, "Todas as Categorias", "All Categories", "Todas las Categorías")}
              </SelectItem>
              <SelectItem value="casual">Casual</SelectItem>
              <SelectItem value="streetwear">Streetwear</SelectItem>
              <SelectItem value="limited">Limited</SelectItem>
              <SelectItem value="sales">Promoções</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-11 w-44 rounded-none bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {tr(language, "Todos os Estados", "All Statuses", "Todos los Estados")}
              </SelectItem>
              <SelectItem value="active">
                {tr(language, "Ativo", "Active", "Activo")}
              </SelectItem>
              <SelectItem value="soldout">
                {tr(language, "Esgotado", "Sold Out", "Agotado")}
              </SelectItem>
              <SelectItem value="comingsoon">
                {tr(language, "Em breve", "Coming Soon", "Próximamente")}
              </SelectItem>
              <SelectItem value="inactive">
                {tr(language, "Inativo (Oculto)", "Inactive (Hidden)", "Inactivo (Oculto)")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        {filteredModels.map((p) => {
          const totalStock = getProductTotalStock(p);
          const effectiveStatus = getProductEffectiveStatus(p);

          return (
            <div
              key={p.id}
              className={`border p-4 transition-all ${
                p.status === "inactive"
                  ? "border-dashed border-border/80 bg-muted/30 opacity-75"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative size-16 shrink-0 overflow-hidden border border-border bg-muted">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="h-full w-full object-cover"
                    />
                    {effectiveStatus === "soldout" && (
                      <span className="absolute inset-0 bg-background/60 flex items-center justify-center font-display text-[8px] font-bold uppercase tracking-wider text-foreground">
                        ESGOTADO
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-muted-foreground">
                        {p.sku || p.id}
                      </span>
                      <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase">
                        {p.category}
                      </span>
                      {p.originalPrice && (
                        <span className="bg-destructive/10 text-destructive border border-destructive/20 px-2 py-0.5 text-[10px] font-bold uppercase">
                          PROMO
                        </span>
                      )}
                    </div>
                    <h3 className="font-display text-xl uppercase tracking-wide text-foreground">
                      {p.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {money(p.price)}
                      {p.originalPrice ? (
                        <span className="ml-1.5 line-through">{money(p.originalPrice)}</span>
                      ) : null}{" "}
                      · {totalStock} {tr(language, "unidades em stock", "units in stock", "unidades en stock")}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 mr-2">
                    {p.status === "inactive" ? (
                      <span className="inline-flex items-center gap-1 border border-muted-foreground/30 bg-muted px-2 py-1 text-[11px] font-bold uppercase text-muted-foreground">
                        <EyeOff className="size-3" />
                        {tr(language, "Inativo (Oculto)", "Inactive", "Inactivo")}
                      </span>
                    ) : effectiveStatus === "comingsoon" ? (
                      <span className="inline-flex items-center gap-1 border border-primary/30 bg-primary/10 px-2 py-1 text-[11px] font-bold uppercase text-primary">
                        <Clock className="size-3" />
                        {tr(language, "Em breve", "Coming Soon", "Próximamente")}
                      </span>
                    ) : effectiveStatus === "soldout" ? (
                      <span className="inline-flex items-center gap-1 border border-foreground/30 bg-foreground/10 px-2 py-1 text-[11px] font-bold uppercase text-foreground">
                        <AlertCircle className="size-3" />
                        {tr(language, "Esgotado", "Sold Out", "Agotado")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 border border-green-600/30 bg-green-500/10 px-2 py-1 text-[11px] font-bold uppercase text-green-600 dark:text-green-400">
                        <CheckCircle2 className="size-3" />
                        {tr(language, "Ativo", "Active", "Activo")}
                      </span>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(p)}
                    className="rounded-none text-xs"
                  >
                    {p.status === "inactive"
                      ? tr(language, "Publicar", "Publish", "Publicar")
                      : tr(language, "Ocultar", "Hide", "Ocultar")}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(p)}
                    className="rounded-none text-xs"
                  >
                    <Edit className="size-3.5" />
                    {tr(language, "Editar", "Edit", "Editar")}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (
                        confirm(
                          language === "pt"
                            ? `Desejas realmente remover o modelo "${p.name}"?`
                            : `Are you sure you want to delete model "${p.name}"?`
                        )
                      ) {
                        deleteProduct(p.id);
                      }
                    }}
                    className="rounded-none text-xs text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>

              {/* Tabela de variantes e stock rápido */}
              <div className="mt-4 border-t border-border pt-3">
                <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">
                  {tr(language, "Stock por Tamanho (Ajuste Rápido)", "Stock by Size (Quick Adjust)", "Stock por Talla (Ajuste Rápido)")}:
                </p>
                <div className="flex flex-wrap gap-2">
                  {p.sizes.map((sz) => (
                    <div
                      key={sz.size}
                      className={`flex items-center border px-2 py-1 text-xs ${
                        sz.stock <= 0
                          ? "border-destructive/30 bg-destructive/5 text-destructive"
                          : "border-border bg-background"
                      }`}
                    >
                      <span className="font-bold mr-2">T.{sz.size}:</span>
                      <input
                        type="number"
                        min="0"
                        value={sz.stock}
                        onChange={(e) => {
                          const val = Number.parseInt(e.target.value, 10);
                          updateStock(p.id, sz.size, Number.isFinite(val) ? val : 0);
                        }}
                        className="w-12 bg-transparent text-center font-mono font-bold focus:outline-none"
                      />
                      <span className="text-[10px] text-muted-foreground ml-1">un.</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {editingProduct && (
        <ProductEditorDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          product={editingProduct}
          onSave={(saved) => {
            saveProduct(saved);
            setIsDialogOpen(false);
          }}
        />
      )}
    </div>
  );
}

function ProductEditorDialog({
  isOpen,
  onClose,
  product,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onSave: (p: Product) => void;
}) {
  const { language } = useShop();
  const [formData, setFormData] = useState<Product>({ ...product });

  const handleSizeStockChange = (size: number, stock: number) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.map((s) => (s.size === size ? { ...s, stock: Math.max(0, stock) } : s)),
    }));
  };

  const handleAddSize = () => {
    const existingSizes = formData.sizes.map((s) => s.size);
    const nextSize = Math.max(...existingSizes, 35) + 1;
    setFormData((prev) => ({
      ...prev,
      sizes: [...prev.sizes, { size: nextSize, stock: 1 }].sort((a, b) => a.size - b.size),
    }));
  };

  const handleRemoveSize = (size: number) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((s) => s.size !== size),
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-none border-2 border-foreground bg-background p-6">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl uppercase">
            {formData.id.startsWith("uffa-model-")
              ? tr(language, "Novo Modelo", "New Model", "Nuevo Modelo")
              : tr(language, "Editar Modelo", "Edit Model", "Editar Modelo")}
          </DialogTitle>
          <DialogDescription>
            {tr(
              language,
              "Configura os dados base, imagem, categorias e variantes de stock.",
              "Configure base details, image, categories and variant inventory.",
              "Configura datos base, imagen, categorías y variantes de stock.",
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs font-bold uppercase">{tr(language, "Nome do Modelo", "Model Name", "Nombre")}</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex.: Porto Rose Low"
                className="mt-1 rounded-none"
              />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase">SKU / Referência</Label>
              <Input
                value={formData.sku ?? ""}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="Ex.: UFFA-PRL-01"
                className="mt-1 rounded-none font-mono"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label className="text-xs font-bold uppercase">{tr(language, "Categoria", "Category", "Categoría")}</Label>
              <Select
                value={formData.category}
                onValueChange={(val) => setFormData({ ...formData, category: val as Category })}
              >
                <SelectTrigger className="mt-1 rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="streetwear">Streetwear</SelectItem>
                  <SelectItem value="limited">Limited</SelectItem>
                  <SelectItem value="sales">Promoções</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-bold uppercase">{tr(language, "Preço (€)", "Price (€)", "Precio (€)")}</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) || 0 })}
                className="mt-1 rounded-none"
              />
            </div>

            <div>
              <Label className="text-xs font-bold uppercase">{tr(language, "Preço Original (€)", "Original Price (€)", "Precio Original (€)")}</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.originalPrice ?? ""}
                onChange={(e) => {
                  const val = e.target.value ? Number.parseFloat(e.target.value) : undefined;
                  setFormData((prev) => {
                    const next = { ...prev };
                    if (val !== undefined && !Number.isNaN(val)) {
                      next.originalPrice = val;
                    } else {
                      delete next.originalPrice;
                    }
                    return next;
                  });
                }}
                placeholder="Opcional (promoção)"
                className="mt-1 rounded-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs font-bold uppercase">{tr(language, "Estado de Publicação", "Publication Status", "Estado")}</Label>
              <Select
                value={formData.status ?? "active"}
                onValueChange={(val) => setFormData({ ...formData, status: val as ProductStatus })}
              >
                <SelectTrigger className="mt-1 rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{tr(language, "Ativo (Visível se houver stock)", "Active", "Activo")}</SelectItem>
                  <SelectItem value="inactive">{tr(language, "Inativo (Oculto da loja)", "Inactive (Hidden)", "Inactivo (Oculto)")}</SelectItem>
                  <SelectItem value="soldout">{tr(language, "Esgotado (Forçar selo ESGOTADO)", "Sold Out", "Agotado")}</SelectItem>
                  <SelectItem value="comingsoon">{tr(language, "Em breve (Selo EM BREVE)", "Coming Soon", "Próximamente")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-bold uppercase">{tr(language, "URL da Imagem Principal", "Image URL", "URL de Imagen")}</Label>
              <Input
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://... ou caminho local"
                className="mt-1 rounded-none text-xs"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-bold uppercase">{tr(language, "Descrição", "Description", "Descripción")}</Label>
            <Textarea
              value={formData.description.pt}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  description: {
                    pt: e.target.value,
                    en: e.target.value,
                    es: e.target.value,
                  },
                })
              }
              rows={3}
              placeholder="Descrição do produto, materiais e acabamentos..."
              className="mt-1 rounded-none"
            />
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-bold uppercase">{tr(language, "Variantes e Stock por Tamanho", "Variants and Stock", "Variantes y Stock")}</Label>
              <Button type="button" size="sm" variant="outline" onClick={handleAddSize} className="rounded-none text-xs">
                <Plus className="size-3 mr-1" />
                {tr(language, "Novo Tamanho", "Add Size", "Nueva Talla")}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {formData.sizes.map((s) => (
                <div key={s.size} className="flex items-center justify-between border border-border bg-card p-2 text-xs">
                  <div>
                    <span className="font-bold">EU {s.size}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      value={s.stock}
                      onChange={(e) => handleSizeStockChange(s.size, Number.parseInt(e.target.value, 10) || 0)}
                      className="w-12 border border-border bg-background p-1 text-center font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSize(s.size)}
                      className="text-muted-foreground hover:text-destructive p-1"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6 border-t border-border pt-4 flex gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-none">
            {tr(language, "Cancelar", "Cancel", "Cancelar")}
          </Button>
          <Button
            onClick={() => {
              if (!formData.name.trim()) {
                toast.error(language === "pt" ? "O nome é obrigatório." : "Name is required.");
                return;
              }
              onSave(formData);
            }}
            className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {tr(language, "Guardar Modelo", "Save Model", "Guardar Modelo")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
