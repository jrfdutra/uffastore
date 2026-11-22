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
import { readPendingCheckout, type PendingCheckout } from "@/lib/checkout-session";
import { money } from "@/lib/shop-data";
import { useShop } from "@/lib/shop-context";
import { rotuloTamanhoDoProduto } from "@/lib/variantes";

export const Route = createFileRoute("/confirmacao")({
  validateSearch: (search) => z.object({ order: z.string().optional() }).parse(search),
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
  const { language, catalog } = useShop();
  const { order: orderNumber } = Route.useSearch();
  const [order, setOrder] = useState<Order | null>(null);
  const [pending, setPending] = useState<PendingCheckout | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (orderNumber) setOrder(getOrderByNumber(orderNumber));
    setPending(readPendingCheckout());
    setLoaded(true);
  }, [orderNumber]);

  if (loaded && !order) {
    return <ThankYou pending={pending} />;
  }

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
              "Pagamento concluído com sucesso. Guarda o código de exclusividade para gerir a encomenda.",
              "Payment completed successfully. Keep the exclusive code to manage your order.",
              "Pago completado con éxito. Guarda el código de exclusividad para gestionar el pedido.",
            )}
          </p>
        </div>
      </section>

      {!loaded && (
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
          <div className="h-64 animate-pulse bg-muted" />
        </div>
      )}

      {order && (
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
          {" "}
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              <section className="border-2 border-dashed border-primary bg-primary/15 p-6 text-center md:p-8">
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
                  <span className="text-xs text-muted-foreground">
                    {order.items.length} {tr(language, "pares", "pairs", "pares")}
                  </span>
                </div>
                <div className="mt-3">
                  {order.items.map((item, index) => {
                    const product = catalog.find((candidate) => candidate.id === item.productId);
                    return (
                      <div
                        key={`${item.productId}-${item.size}-${index}`}
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
                                {tr(language, "Tamanho", "Size", "Talla")}{" "}
                                {rotuloTamanhoDoProduto(product, item.size)}
                                {item.quantity > 1 ? ` · ${item.quantity}x` : ""}
                              </p>
                            </div>
                            <p className="text-sm font-bold">
                              {money(item.unitPrice * item.quantity)}
                            </p>
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

function ThankYou({ pending }: { pending: PendingCheckout | null }) {
  const { language, catalog } = useShop();
  const greeting = pending?.customerName?.trim();

  return (
    <div>
      <section className="border-b border-border bg-section">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center md:px-6 md:py-20">
          <CheckCircle2 className="mx-auto size-16 text-primary" />
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-primary">
            {tr(language, "Pagamento concluído", "Payment complete", "Pago completado")}
          </p>
          <h1 className="mt-3 font-display text-5xl uppercase leading-[.9] md:text-7xl">
            {greeting
              ? tr(
                  language,
                  `Obrigado, ${greeting}!`,
                  `Thank you, ${greeting}!`,
                  `¡Gracias, ${greeting}!`,
                )
              : tr(
                  language,
                  "Obrigado pela tua compra!",
                  "Thank you for your purchase!",
                  "¡Gracias por tu compra!",
                )}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            {tr(
              language,
              "A tua encomenda foi registada e já está a ser preparada. Vais receber a confirmação com o número de encomenda por email.",
              "Your order is registered and already being prepared. You'll receive the confirmation with the order number by email.",
              "Tu pedido está registrado y ya se está preparando. Recibirás la confirmación con el número de pedido por email.",
            )}
          </p>
          {pending?.email && (
            <p className="mt-2 text-xs text-muted-foreground">
              <Mail className="mr-1 inline size-3.5" />
              {pending.email}
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-10 md:px-6 md:py-14">
        {pending ? (
          <div className="grid gap-6 md:grid-cols-[1fr_300px]">
            <section className="border border-border bg-card p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-2xl uppercase">
                  {tr(language, "Detalhes da encomenda", "Order details", "Detalles del pedido")}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {pending.items.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                  {tr(language, "pares", "pairs", "pares")}
                </span>
              </div>
              <div className="mt-3">
                {pending.items.map((item, index) => {
                  const product = catalog.find((candidate) => candidate.id === item.productId);
                  return (
                    <div
                      key={`${item.productId}-${item.size}-${index}`}
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
                              {tr(language, "Tamanho", "Size", "Talla")}{" "}
                              {rotuloTamanhoDoProduto(product, item.size)}
                              {item.quantity > 1 ? ` · ${item.quantity}x` : ""}
                            </p>
                          </div>
                          <p className="text-sm font-bold">
                            {money(item.unitPrice * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

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
                    <span>{money(pending.subtotal)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">
                      {tr(language, "Portes", "Shipping", "Envío")}
                    </span>
                    <span>
                      {pending.shipping > 0
                        ? money(pending.shipping)
                        : tr(language, "Grátis", "Free", "Gratis")}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 border-t border-border pt-2 text-base font-bold">
                    <span>Total</span>
                    <span>{money(pending.total)}</span>
                  </div>
                </div>
                <dl className="mt-4 space-y-2 border-t border-border pt-4 text-xs">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">
                      {tr(language, "Data", "Date", "Fecha")}
                    </dt>
                    <dd>{formatDate(pending.at, language)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">
                      {tr(language, "Entrega", "Delivery", "Entrega")}
                    </dt>
                    <dd className="text-right">{pending.deliveryLabel}</dd>
                  </div>
                  {pending.coupon && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">
                        {tr(language, "Desconto", "Discount", "Descuento")}
                      </dt>
                      <dd className="font-mono">{pending.coupon}</dd>
                    </div>
                  )}
                </dl>
              </section>

              <section className="border border-border bg-section p-6">
                <p className="flex items-start gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                  {tr(
                    language,
                    "O pagamento foi processado no checkout seguro da Shopify. Guarda o email de confirmação para acompanhar a encomenda.",
                    "Payment was processed on Shopify's secure checkout. Keep the confirmation email to follow your order.",
                    "El pago se procesó en el checkout seguro de Shopify. Guarda el email de confirmación para seguir tu pedido.",
                  )}
                </p>
              </section>
            </aside>
          </div>
        ) : (
          <div className="border border-border bg-card p-6 text-center">
            <Package className="mx-auto size-9 text-primary" />
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
              {tr(
                language,
                "Não encontrámos os detalhes desta compra neste dispositivo. Consulta o email de confirmação enviado pela Shopify.",
                "We couldn't find this purchase's details on this device. Check the confirmation email sent by Shopify.",
                "No encontramos los detalles de esta compra en este dispositivo. Consulta el email de confirmación enviado por Shopify.",
              )}
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="h-12 rounded-none">
            <Link to="/">
              {tr(language, "Voltar ao início", "Back to home", "Volver al inicio")}
              <ArrowRight />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 rounded-none">
            <Link to="/rastreio">
              {tr(language, "Seguir a minha encomenda", "Track my order", "Seguir mi pedido")}
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
