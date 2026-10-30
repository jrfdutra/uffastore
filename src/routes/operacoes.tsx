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
  RefreshCw,
  Search,
  Store,
  Truck,
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
import { Textarea } from "@/components/ui/textarea";
import { tr } from "@/lib/i18n";
import { money } from "@/lib/shop-data";
import { useShop } from "@/lib/shop-context";
import { readStorage, removeStorage, writeStorage } from "@/lib/storage";
import {
  formatDate,
  formatDateTime,
  fromDateInputValue,
  getNextStatus,
  loadOrders,
  orderStatusInfo,
  resetDemoOrders,
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
  const [key, setKey] = useState("");
  const [error, setError] = useState("");

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (key.trim().toUpperCase() !== OPS_ACCESS_KEY) {
      setError(
        tr(
          language,
          "Chave incorreta. Usa a chave de demonstração indicada abaixo.",
          "Incorrect key. Use the demo key shown below.",
          "Clave incorrecta. Usa la clave de demostración indicada abajo.",
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
            "Painel de demonstração para atualizar estados de envio, rastreio, previsão de entrega e notas públicas.",
            "Demo panel to update shipping statuses, tracking, estimated delivery and public notes.",
            "Panel de demostración para actualizar estados de envío, seguimiento, previsión de entrega y notas públicas.",
          )}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <Label htmlFor="ops-key">
            {tr(language, "Chave de acesso", "Access key", "Clave de acceso")}
          </Label>
          <Input
            id="ops-key"
            value={key}
            onChange={(event) => setKey(event.target.value)}
            placeholder="UFFA-OPS-XXXX"
            autoComplete="off"
            spellCheck={false}
            className="h-12 rounded-none font-mono uppercase"
            required
          />
          {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
          <Button type="submit" size="lg" className="h-12 w-full rounded-none">
            <KeyRound />
            {tr(language, "Entrar no painel", "Enter panel", "Entrar en el panel")}
          </Button>
        </form>

        <div className="mt-5 border border-dashed border-primary bg-primary/5 p-4">
          <p className="text-[10px] font-bold uppercase text-primary">
            {tr(language, "Chave de demonstração", "Demo key", "Clave de demostración")}
          </p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <code className="font-mono text-sm font-bold">{OPS_ACCESS_KEY}</code>
            <span className="text-[10px] uppercase text-muted-foreground">
              {tr(language, "Apenas local", "Local only", "Solo local")}
            </span>
          </div>
        </div>

        <p className="mt-4 text-[11px] text-muted-foreground">
          {tr(
            language,
            "Em produção, este painel deve ser protegido por autenticação real, permissões por função e registo de auditoria.",
            "In production, this panel must be protected by real authentication, role permissions and audit logging.",
            "En producción, este panel debe protegerse con autenticación real, permisos por rol y registro de auditoría.",
          )}
        </p>
      </div>
    </div>
  );
}

function OpsDashboard({ onLock }: { onLock: () => void }) {
  const { language } = useShop();
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

  const handleReset = () => {
    if (
      !window.confirm(
        tr(
          language,
          "Repor os dados de demonstração? As alterações locais serão substituídas.",
          "Reset demo data? Local changes will be replaced.",
          "¿Restablecer los datos de demostración? Se sustituirán los cambios locales.",
        ),
      )
    ) {
      return;
    }
    setOrders(resetDemoOrders());
    setSelectedNumber(null);
    toast.success(
      tr(language, "Dados demo repostos.", "Demo data reset.", "Datos demo restablecidos."),
    );
  };

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
                {tr(language, "Gestão de encomendas", "Order management", "Gestión de pedidos")}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-background/60">
                {tr(
                  language,
                  "Atualiza o estado de envio ou recolha, o rastreio e a previsão. Cada alteração fica registada no histórico do cliente.",
                  "Update shipping or pickup status, tracking and estimates. Every change is recorded in the customer timeline.",
                  "Actualiza el estado de envío o recogida, el seguimiento y la previsión. Cada cambio queda registrado en el historial del cliente.",
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="border border-primary/40 px-3 py-1.5 text-[10px] font-bold uppercase text-primary">
                {tr(language, "Modo demonstração", "Demo mode", "Modo demostración")}
              </span>
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
        </div>
      </section>

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
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-none"
              onClick={handleReset}
            >
              <RefreshCw />
              {tr(language, "Repor demo", "Reset demo", "Restablecer demo")}
            </Button>
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
                          ? "border-primary bg-primary/5"
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

      <div className="border-b border-border bg-primary/5 p-5">
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
