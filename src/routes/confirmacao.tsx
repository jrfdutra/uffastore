import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  LockKeyhole,
  Mail,
  MapPin,
  Package,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { tr } from "@/lib/i18n";
import { formatDate, getOrderByNumber, type Order } from "@/lib/orders";
import { money, products } from "@/lib/shop-data";
import { useShop } from "@/lib/shop-context";

export const Route = createFileRoute("/confirmacao")({
  validateSearch: (search) => z.object({ order: z.string() }).parse(search),
  head: () => ({
    meta: [
      { title: "Encomenda confirmada — Uffa Store" },
      { name: "description", content: "A tua encomenda UFFA foi confirmada." },
      { property: "og:title", content: "Encomenda confirmada — Uffa Store" },
      { property: "og:description", content: "A tua encomenda foi confirmada." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Confirmation,
});

function Confirmation() {
  const { language } = useShop();
  const { order: orderNumber } = Route.useSearch();
  const [order, setOrder] = useState<Order | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setOrder(getOrderByNumber(orderNumber));
    setLoaded(true);
  }, [orderNumber]);

  const copyValue = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(tr(language, `${label} copiado.`, `${label} copied.`, `${label} copiado.`));
    } catch {
      toast.error(
        tr(language, "Não foi possível copiar.", "Could not copy.", "No se pudo copiar."),
      );
    }
  };

  return (
    <div>
      <section className="border-b border-border bg-section">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center md:px-6 md:py-20">
          <CheckCircle2 className="mx-auto size-16 text-primary" />
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-primary">
            {orderNumber}
          </p>
          <h1 className="mt-3 font-display text-6xl uppercase leading-[.9] md:text-8xl">
            {tr(language, "Está confirmado.", "It's confirmed.", "Está confirmado.")}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            {tr(
              language,
              "Pagamento MB WAY simulado com sucesso. Guarda o código de exclusividade para gerir a encomenda.",
              "MB WAY payment simulated successfully. Keep the exclusive code to manage your order.",
              "Pago MB WAY simulado con éxito. Guarda el código de exclusividad para gestionar el pedido.",
            )}
          </p>
        </div>
      </section>

      {!loaded && (
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
          <div className="h-64 animate-pulse bg-muted" />
        </div>
      )}

      {loaded && !order && (
        <div className="mx-auto max-w-3xl px-4 py-14 text-center md:px-6">
          <Package className="mx-auto size-10 text-primary" />
          <h2 className="mt-4 font-display text-4xl uppercase">
            {tr(language, "Encomenda registada.", "Order registered.", "Pedido registado.")}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
            {tr(
              language,
              "Não encontrámos os detalhes completos neste dispositivo. Abre o portal e introduz os dados da compra.",
              "We couldn't find the full details on this device. Open the portal and enter your purchase details.",
              "No encontramos los detalles completos en este dispositivo. Abre el portal e introduce los datos de la compra.",
            )}
          </p>
          <Button asChild className="mt-6 rounded-none">
            <Link to="/rastreio" search={{ order: orderNumber }}>
              {tr(language, "Abrir portal", "Open portal", "Abrir portal")}
              <ArrowRight />
            </Link>
          </Button>
        </div>
      )}

      {order && (
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              <section className="border-2 border-dashed border-primary bg-primary/5 p-6 text-center md:p-8">
                <LockKeyhole className="mx-auto size-7 text-primary" />
                <p className="mt-3 text-xs font-bold uppercase text-primary">
                  {tr(
                    language,
                    "Código de exclusividade",
                    "Exclusive code",
                    "Código de exclusividad",
                  )}
                </p>
                <p className="mt-2 font-mono text-3xl font-bold tracking-wider md:text-4xl">
                  {order.accessCode}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4 rounded-none"
                  onClick={() =>
                    copyValue(order.accessCode, tr(language, "Código", "Code", "Código"))
                  }
                >
                  <Copy />
                  {tr(language, "Copiar código", "Copy code", "Copiar código")}
                </Button>
                <p className="mx-auto mt-4 max-w-md text-xs text-muted-foreground">
                  {tr(
                    language,
                    "Guarda este código. Vais precisar dele, do número da encomenda e do contacto para entrar no portal.",
                    "Keep this code. You'll need it, the order number and the contact to open the portal.",
                    "Guarda este código. Lo necesitarás, junto con el número de pedido y el contacto, para entrar en el portal.",
                  )}
                </p>
              </section>

              {order.trackingCode && (
                <section className="border border-border bg-card p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Truck className="size-5 text-primary" />
                      <h2 className="font-display text-2xl uppercase">
                        {tr(language, "Envio", "Shipping", "Envío")}
                      </h2>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {order.carrier ?? "CTT Expresso"}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border border-border bg-section px-4 py-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">
                        {tr(
                          language,
                          "Código de rastreio",
                          "Tracking code",
                          "Código de seguimiento",
                        )}
                      </p>
                      <code className="mt-1 block font-mono text-sm font-bold">
                        {order.trackingCode}
                      </code>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-none"
                      onClick={() =>
                        copyValue(
                          order.trackingCode ?? "",
                          tr(
                            language,
                            "Código de rastreio",
                            "Tracking code",
                            "Código de seguimiento",
                          ),
                        )
                      }
                    >
                      <Copy />
                      {tr(language, "Copiar", "Copy", "Copiar")}
                    </Button>
                  </div>
                  <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="size-3.5 text-primary" />
                    {tr(
                      language,
                      "Entrega prevista",
                      "Estimated delivery",
                      "Entrega prevista",
                    )}: {formatDate(order.estimatedDelivery, language)}
                  </p>
                </section>
              )}

              <section className="border border-border bg-card p-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-display text-2xl uppercase">
                    {tr(language, "Itens", "Items", "Artículos")}
                  </h2>
                  <span className="text-xs text-muted-foreground">{order.items.length}</span>
                </div>
                <div className="mt-3">
                  {order.items.map((item) => {
                    const product = products.find((candidate) => candidate.id === item.productId);
                    return (
                      <div
                        key={`${item.productId}-${item.size}`}
                        className="grid grid-cols-[64px_1fr] gap-3 border-b border-border py-4 last:border-b-0"
                      >
                        {product && (
                          <img
                            src={product.image}
                            alt={item.name}
                            width={1200}
                            height={900}
                            className="aspect-square w-16 bg-product object-cover"
                          />
                        )}
                        <div>
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-bold">{item.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {tr(language, "Tamanho", "Size", "Talla")} {item.size} ·{" "}
                                {item.quantity}x
                              </p>
                            </div>
                            <p className="text-sm font-bold">
                              {money(item.unitPrice * item.quantity)}
                            </p>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2 border border-primary/20 bg-primary/5 px-2 py-1.5">
                            <ShieldCheck className="size-3.5 text-primary" />
                            <code className="font-mono text-[11px] font-bold">{item.authCode}</code>
                            <Link
                              to="/verificar"
                              search={{ codigo: item.authCode }}
                              className="ml-auto text-[10px] font-bold uppercase text-primary hover:underline"
                            >
                              {tr(language, "Verificar", "Verify", "Verificar")}
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            <aside className="space-y-6">
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
                      {order.shipping > 0
                        ? money(order.shipping)
                        : tr(language, "Grátis", "Free", "Gratis")}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 border-t border-border pt-2 text-base font-bold">
                    <span>Total</span>
                    <span>{money(order.total)}</span>
                  </div>
                </div>
                <dl className="mt-4 space-y-2 border-t border-border pt-4 text-xs">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">
                      {tr(language, "Data", "Date", "Fecha")}
                    </dt>
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
                    <dt className="text-muted-foreground">
                      {tr(language, "Pagamento", "Payment", "Pago")}
                    </dt>
                    <dd>MB WAY</dd>
                  </div>
                </dl>
              </section>

              <section className="border border-border bg-section p-6">
                <h2 className="font-display text-2xl uppercase">
                  {tr(language, "Próximos passos", "Next steps", "Próximos pasos")}
                </h2>
                <ol className="mt-4 space-y-4">
                  {[
                    {
                      icon: LockKeyhole,
                      title: tr(language, "Guarda o código", "Keep the code", "Guarda el código"),
                      text: tr(
                        language,
                        "É a tua chave de acesso exclusiva à encomenda.",
                        "It's your exclusive key to the order.",
                        "Es tu llave de acceso exclusiva al pedido.",
                      ),
                    },
                    {
                      icon: Truck,
                      title: tr(
                        language,
                        "Acompanha o estado",
                        "Track the status",
                        "Sigue el estado",
                      ),
                      text: tr(
                        language,
                        "Abre o portal para veres envio, rastreio e previsão.",
                        "Open the portal to see shipping, tracking and estimates.",
                        "Abre el portal para ver el envío, seguimiento y previsión.",
                      ),
                    },
                    {
                      icon: ShieldCheck,
                      title: tr(
                        language,
                        "Valida a autenticidade",
                        "Verify authenticity",
                        "Verifica la autenticidad",
                      ),
                      text: tr(
                        language,
                        "Confirma o código único de cada par.",
                        "Confirm the unique code of each pair.",
                        "Confirma el código único de cada par.",
                      ),
                    },
                  ].map((step, index) => (
                    <li key={step.title} className="flex gap-3">
                      <span className="grid size-7 shrink-0 place-items-center bg-foreground text-xs font-bold text-background">
                        {index + 1}
                      </span>
                      <div>
                        <p className="flex items-center gap-1.5 text-sm font-bold">
                          <step.icon className="size-3.5 text-primary" />
                          {step.title}
                        </p>
                        <p className="text-xs text-muted-foreground">{step.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              <Button asChild size="lg" className="h-12 w-full rounded-none">
                <Link to="/rastreio" search={{ order: order.number }}>
                  {tr(
                    language,
                    "Gerir a minha encomenda",
                    "Manage my order",
                    "Gestionar mi pedido",
                  )}
                  <ArrowRight />
                </Link>
              </Button>

              <p className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
                <Mail className="size-3.5" />
                atendimento@uffastore.pt
              </p>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}
