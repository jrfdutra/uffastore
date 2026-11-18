import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Check,
  MapPin,
  Package,
  Smartphone,
  Loader2,
  Share2,
  MessageSquare,
  Copy,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { copy, money } from "@/lib/shop-data";
import { useShop } from "@/lib/shop-context";
import { tr } from "@/lib/i18n";
import { savePendingCheckout } from "@/lib/checkout-session";
import { createShopifyCheckout } from "@/lib/shopify";
import { generatePairCode, pairCount } from "@/lib/pair-code";
import { createOrder } from "@/lib/orders";

export type DeliveryOption = "pickup" | "continental" | "islands" | "eu" | "switzerland";

export const deliveryRates: Record<
  DeliveryOption,
  {
    price: number;
    title: { pt: string; en: string; es: string };
    subtitle: { pt: string; en: string; es: string };
  }
> = {
  pickup: {
    price: 0,
    title: {
      pt: "Recolha em mão no Porto",
      en: "Hand pickup in Porto",
      es: "Recogida en mano en Oporto",
    },
    subtitle: { pt: "Grátis (0,00 €)", en: "Free (0.00 €)", es: "Gratis (0,00 €)" },
  },
  continental: {
    price: 8.94,
    title: { pt: "Portugal Continental", en: "Portugal Mainland", es: "Portugal Continental" },
    subtitle: {
      pt: "Envio expresso · 8,94 €",
      en: "Express shipping · 8.94 €",
      es: "Envío expreso · 8,94 €",
    },
  },
  islands: {
    price: 8.94,
    title: { pt: "Portugal - Ilhas", en: "Portugal Islands", es: "Portugal - Islas" },
    subtitle: {
      pt: "Açores e Madeira · 8,94 €",
      en: "Azores & Madeira · 8.94 €",
      es: "Azores y Madeira · 8,94 €",
    },
  },
  eu: {
    price: 24.0,
    title: { pt: "União Europeia", en: "European Union", es: "Unión Europea" },
    subtitle: {
      pt: "Qualquer país da UE · 24,00 €",
      en: "Any EU country · 24.00 €",
      es: "Cualquier país de la UE · 24,00 €",
    },
  },
  switzerland: {
    price: 34.0,
    title: { pt: "Suíça", en: "Switzerland", es: "Suiza" },
    subtitle: {
      pt: "Envio internacional · 34,00 €",
      en: "International shipping · 34.00 €",
      es: "Envío internacional · 34,00 €",
    },
  },
};

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Uffa Store" },
      {
        name: "description",
        content: "Escolhe recolha no Porto ou envio e confirma a tua encomenda Uffa Store.",
      },
      { property: "og:title", content: "Checkout — Uffa Store" },
      { property: "og:description", content: "Confirma a tua encomenda de sneakers verificados." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/checkout" }],
  }),
  component: Checkout,
});

function Checkout() {
  const s = useShop(),
    t = copy[s.language];

  const [delivery, setDelivery] = useState<DeliveryOption>("pickup");
  const [payment, setPayment] = useState<"card" | "mbway" | "paypal" | "apple">("card");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const shipping = deliveryRates[delivery].price;
  const grandTotal = s.finalTotal + shipping;

  const handleShareWhatsApp = () => {
    const itemsText = s.cart
      .map((item) => {
        const p = s.catalog.find((c) => c.id === item.productId);
        return `${item.quantity}x ${p?.name || item.productId} (Tam: ${item.size})`;
      })
      .join(", ");
    const text = `🛒 Carrinho UFFA Store:\n${itemsText}\nTotal: ${money(grandTotal)}\nVisita: ${window.location.origin}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleCopyCart = async () => {
    const itemsText = s.cart
      .map((item) => {
        const p = s.catalog.find((c) => c.id === item.productId);
        return `${item.quantity}x ${p?.name || item.productId} (Tam: ${item.size})`;
      })
      .join(", ");
    const text = `🛒 Carrinho UFFA Store: ${itemsText} — Total: ${money(grandTotal)}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(tr(s.language, "Carrinho copiado!", "Cart copied!", "¡Carrito copiado!"));
    } catch {
      toast.error(tr(s.language, "Erro ao copiar.", "Error copying.", "Error al copiar."));
    }
  };

  const handleNativeShare = async () => {
    const itemsText = s.cart
      .map((item) => {
        const p = s.catalog.find((c) => c.id === item.productId);
        return `${item.quantity}x ${p?.name || item.productId} (Tam: ${item.size})`;
      })
      .join(", ");
    const text = `🛒 Carrinho UFFA Store:\n${itemsText}\nTotal: ${money(grandTotal)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Carrinho UFFA Store", text, url: window.location.href });
      } catch {
        // cancelled
      }
    } else {
      handleCopyCart();
    }
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Revalidação de stock antes de submeter
      for (const item of s.cart) {
        const product = s.catalog.find((p) => p.id === item.productId);
        if (!product || product.status === "inactive" || product.status === "comingsoon") {
          throw new Error(
            s.language === "pt"
              ? `O modelo ${product?.name ?? item.productId} já não se encontra disponível.`
              : `The model ${product?.name ?? item.productId} is no longer available.`,
          );
        }
        const variant = product.sizes.find(
          (sz) => sz.size === item.size && (item.color ? sz.color === item.color : true),
        );
        if (!variant || variant.stock < item.quantity) {
          throw new Error(
            s.language === "pt"
              ? `Stock insuficiente para ${product.name} (Tamanho ${item.size}). Disponível: ${variant?.stock ?? 0}.`
              : `Insufficient stock for ${product.name} (Size ${item.size}). Available: ${variant?.stock ?? 0}.`,
          );
        }
      }

      const items = s.cart.map((item) => {
        const product = s.catalog.find((p) => p.id === item.productId);
        const variant = product?.sizes.find(
          (sz) => sz.size === item.size && (item.color ? sz.color === item.color : true),
        );
        const variantId = variant?.variantId ?? item.variantId;
        if (!variantId) {
          throw new Error(`Variant not found for ${item.productId} size ${item.size}`);
        }
        return { variantId, quantity: item.quantity };
      });

      // Guarda os detalhes da compra antes de sair para a Shopify, para os poder
      // mostrar na página de agradecimento quando o cliente regressar.
      savePendingCheckout({
        at: new Date().toISOString(),
        customerName: `${firstName} ${lastName}`.trim(),
        email,
        deliveryKey: delivery,
        deliveryLabel: deliveryRates[delivery].title[s.language],
        items: s.cart.flatMap((item) => {
          const product = s.catalog.find((p) => p.id === item.productId);
          const pairs = pairCount(item.quantity);
          return Array.from({ length: pairs }, () => ({
            productId: item.productId,
            name: product?.name ?? item.productId,
            size: item.size,
            color: item.color,
            quantity: 1,
            unitPrice: product?.price ?? item.unitPrice ?? 0,
            authCode: generatePairCode(),
          }));
        }),
        subtotal: s.subtotal,
        shipping,
        total: grandTotal,
        coupon: s.coupon?.code,
      });

      const checkout = await createShopifyCheckout(
        items,
        delivery,
        s.coupon?.code,
        {
          firstName,
          lastName,
          email,
          phone,
        },
        `${window.location.origin}/confirmacao`,
      );
      window.location.href = checkout.webUrl;
    } catch (err: unknown) {
      console.error(err);
      setError(
        (err instanceof Error && err.message) ||
          (s.language === "pt"
            ? "Erro ao ligar à Shopify. Tenta novamente."
            : "Error connecting to Shopify. Please try again."),
      );
      setLoading(false);
    }
  };

  const handleFakeCheckout = () => {
    if (!firstName || !lastName || !email) {
      toast.error(
        tr(
          s.language,
          "Por favor preenche pelo menos o nome, apelido e email para simular a compra.",
          "Please fill at least name, last name and email to simulate purchase.",
          "Por favor rellena al menos nombre, apellido y email para simular.",
        ),
      );
      return;
    }
    try {
      const order = createOrder({
        customerName: `${firstName} ${lastName}`.trim(),
        contact: email,
        delivery: delivery === "pickup" ? "pickup" : "shipping",
        address: delivery === "pickup" ? "" : "Rua de Teste 123, 4000-000 Porto",
        payment: "mbway",
        cart: s.cart.map((item) => ({
          productId: item.productId,
          size: item.size,
          quantity: item.quantity,
        })),
      });

      savePendingCheckout({
        at: order.createdAt,
        customerName: order.customerName,
        email: order.contact,
        deliveryKey: delivery,
        deliveryLabel: deliveryRates[delivery].title[s.language],
        items: order.items.map((i) => ({
          productId: i.productId,
          name: i.name,
          size: i.size,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          authCode: i.authCode,
        })),
        subtotal: order.subtotal,
        shipping: order.shipping,
        total: order.total,
      });

      s.clearCart();
      window.location.href = `/confirmacao?order=${order.number}`;
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao simular compra");
    }
  };

  if (!s.cart.length)
    return (
      <div className="mx-auto grid min-h-[55vh] max-w-xl place-items-center px-4 text-center">
        <div>
          <Package className="mx-auto mb-4 size-12 text-primary" />
          <h1 className="font-display text-5xl uppercase">{t.empty}</h1>
          <Button asChild className="mt-6 rounded-none">
            <Link to="/catalogo" search={{}}>
              {t.shop}
            </Link>
          </Button>
        </div>
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
      <p className="text-xs font-bold uppercase text-primary">
        {tr(s.language, "Checkout seguro", "Secure checkout", "Pago seguro")}
      </p>
      <h1 className="font-display text-6xl uppercase md:text-8xl">{t.checkout}</h1>

      <form onSubmit={submit} className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-10">
          <section>
            <h2 className="mb-4 font-display text-3xl uppercase">
              1.{" "}
              {s.language === "pt"
                ? "Modalidade de Entrega"
                : s.language === "es"
                  ? "Modalidad de Entrega"
                  : "Delivery Method"}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {(Object.keys(deliveryRates) as DeliveryOption[]).map((key) => {
                const opt = deliveryRates[key];
                const isActive = delivery === key;
                return (
                  <Choice
                    key={key}
                    active={isActive}
                    onClick={() => setDelivery(key)}
                    icon={key === "pickup" ? <MapPin /> : <Package />}
                    title={opt.title[s.language as keyof typeof opt.title] ?? opt.title.pt}
                    detail={
                      opt.subtitle[s.language as keyof typeof opt.subtitle] ?? opt.subtitle.pt
                    }
                  />
                );
              })}
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              {delivery === "pickup"
                ? tr(
                    s.language,
                    "* Receber em mão no Porto não tem qualquer custo de envio (0,00 €). A entrega será combinada contigo.",
                    "* Hand pickup in Porto has no shipping fee (0.00 €). We will coordinate handover with you.",
                    "* Recibir en mano en Oporto no tiene gastos de envío (0,00 €).",
                  )
                : tr(
                    s.language,
                    `* Envio selecionado (${money(deliveryRates[delivery].price)}). Podes preencher a morada completa no passo seguinte na Shopify.`,
                    `* Selected shipping (${money(deliveryRates[delivery].price)}). You can fill your full address in the next step on Shopify.`,
                    `* Envío seleccionado (${money(deliveryRates[delivery].price)}). Puedes completar tu dirección en el siguiente paso en Shopify.`,
                  )}
            </p>
          </section>

          <section>
            <h2 className="mb-4 font-display text-3xl uppercase">
              2. {tr(s.language, "Dados do Cliente", "Customer Details", "Datos del Cliente")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase">
                  {tr(s.language, "Nome Próprio *", "First Name *", "Nombre *")}
                </label>
                <Input
                  required
                  placeholder={tr(s.language, "Ex: João", "Ex: John", "Ej: Juan")}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="rounded-none h-11"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase">
                  {tr(s.language, "Apelido *", "Last Name *", "Apellido *")}
                </label>
                <Input
                  required
                  placeholder={tr(s.language, "Ex: Silva", "Ex: Smith", "Ej: Silva")}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="rounded-none h-11"
                />
              </div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase">
                  {tr(s.language, "E-mail *", "E-mail *", "Correo electrónico *")}
                </label>
                <Input
                  required
                  type="email"
                  placeholder="joao@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-none h-11"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase">
                  {tr(s.language, "Telemóvel *", "Phone *", "Teléfono *")}
                </label>
                <Input
                  required
                  type="tel"
                  placeholder="912 345 678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-none h-11"
                />
              </div>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {tr(
                s.language,
                "* Estes dados preenchem automaticamente o checkout da Shopify para aceleração instantânea do pagamento.",
                "* These details automatically prefill the Shopify checkout for instant payment.",
                "* Estos datos rellenan automáticamente el checkout de Shopify.",
              )}
            </p>
          </section>

          <section>
            <h2 className="mb-4 font-display text-3xl uppercase">
              3. {s.language === "pt" ? "Pagamento" : s.language === "es" ? "Pago" : "Payment"}
            </h2>
            <div className="grid gap-3">
              <Choice
                active={true}
                onClick={() => {}}
                icon={
                  <div className="flex items-center gap-2">
                    <CreditCard className="text-primary size-5" />
                    <ShieldCheck className="text-primary size-5" />
                  </div>
                }
                title={tr(
                  s.language,
                  "Checkout Seguro Shopify (MB WAY, Cartão, PayPal, Multibanco)",
                  "Shopify Secure Checkout (MB WAY, Card, PayPal)",
                  "Checkout Seguro Shopify (MB WAY, Tarjeta, PayPal)",
                )}
                detail={tr(
                  s.language,
                  "Aceita MB WAY, Cartão de Crédito/Débito (Visa, Mastercard), PayPal e Multibanco",
                  "Accepts MB WAY, Credit/Debit Card (Visa, Mastercard), PayPal and Multibanco",
                  "Acepta MB WAY, Tarjeta de Crédito/Débito (Visa, Mastercard), PayPal y Multibanco",
                )}
              />
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              {tr(
                s.language,
                "* Todos os pagamentos são processados com encriptação de nível bancário e SSL no checkout seguro da Shopify.",
                "* All payments are processed with bank-level encryption and SSL on Shopify's secure checkout.",
                "* Todos los pagos se procesan con cifrado de nivel bancario y SSL en el checkout seguro de Shopify.",
              )}
            </p>
          </section>
        </div>

        <aside className="border border-border p-6 lg:sticky lg:top-28 lg:self-start">
          <h2 className="font-display text-3xl uppercase">
            {s.language === "pt" ? "Resumo" : s.language === "es" ? "Resumen" : "Summary"}
          </h2>

          <div className="my-5 space-y-4">
            {s.cart.map((x) => {
              const p = s.catalog.find((y) => y.id === x.productId);
              return p ? (
                <div
                  key={`${x.productId}-${x.size}`}
                  className="flex min-w-0 justify-between gap-3 text-sm"
                >
                  <span className="min-w-0 break-words">
                    {x.quantity}× {p.name} · {x.size}
                  </span>
                  <span className="shrink-0 whitespace-nowrap font-bold">
                    {money(p.price * x.quantity)}
                  </span>
                </div>
              ) : null;
            })}
          </div>

          <div className="space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex min-w-0 justify-between gap-3">
              <span className="min-w-0">{t.subtotal}</span>
              <span className="shrink-0 whitespace-nowrap">{money(s.subtotal)}</span>
            </div>
            {s.discountAmount > 0 && (
              <div className="flex min-w-0 justify-between gap-3 text-primary font-semibold">
                <span className="min-w-0 break-words">Desconto ({s.coupon?.code})</span>
                <span className="shrink-0 whitespace-nowrap">-{money(s.discountAmount)}</span>
              </div>
            )}
            {delivery !== "pickup" ? (
              <div className="flex min-w-0 justify-between gap-3">
                <span className="min-w-0 break-words">
                  {tr(
                    s.language,
                    `Portes (${deliveryRates[delivery].title[s.language as keyof (typeof deliveryRates)[typeof delivery]["title"]] ?? deliveryRates[delivery].title.pt})`,
                    `Shipping (${deliveryRates[delivery].title[s.language as keyof (typeof deliveryRates)[typeof delivery]["title"]] ?? deliveryRates[delivery].title.pt})`,
                    `Envío (${deliveryRates[delivery].title[s.language as keyof (typeof deliveryRates)[typeof delivery]["title"]] ?? deliveryRates[delivery].title.pt})`,
                  )}
                </span>
                <span className="shrink-0 whitespace-nowrap">{money(shipping)}</span>
              </div>
            ) : (
              <div className="flex min-w-0 justify-between gap-3">
                <span className="min-w-0 break-words">
                  {tr(
                    s.language,
                    "Receber em mão (Porto)",
                    "Hand pickup (Porto)",
                    "Recibir en mano (Oporto)",
                  )}
                </span>
                <span className="shrink-0 whitespace-nowrap font-semibold text-primary">
                  {tr(s.language, "Grátis (0,00 €)", "Free (0.00 €)", "Gratis (0,00 €)")}
                </span>
              </div>
            )}
            <div className="flex min-w-0 justify-between gap-3 pt-3 text-lg font-bold">
              <span className="min-w-0">Total</span>
              <span className="shrink-0 whitespace-nowrap">{money(grandTotal)}</span>
            </div>
          </div>

          {/* Coupon input */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                placeholder={tr(
                  s.language,
                  "Código de desconto",
                  "Discount code",
                  "Código de descuento",
                )}
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                className="h-9 rounded-none text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-none text-xs px-3"
                onClick={() => {
                  s.applyCoupon(couponInput);
                  setCouponInput("");
                }}
              >
                {tr(s.language, "Aplicar", "Apply", "Aplicar")}
              </Button>
            </div>
            {s.coupon && (
              <div className="mt-2 flex items-center justify-between text-[11px] bg-primary/10 text-primary px-2.5 py-1 font-bold">
                <span>
                  Cupão {s.coupon.code} (-{s.coupon.discountPercent}%)
                </span>
                <button type="button" onClick={s.removeCoupon} className="underline">
                  {tr(s.language, "Remover", "Remove", "Eliminar")}
                </button>
              </div>
            )}
          </div>

          {/* Cart Sharing */}
          <div className="mt-6 border-t border-border pt-4">
            <p className="text-xs font-bold uppercase text-muted-foreground mb-2">
              {tr(s.language, "Partilhar carrinho", "Share cart", "Compartir carrito")}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-none text-xs"
                onClick={handleShareWhatsApp}
                title="WhatsApp"
              >
                <MessageSquare className="size-3.5 mr-1 text-green-600" />
                WhatsApp
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-none text-xs"
                onClick={handleCopyCart}
                title="Copiar"
              >
                <Copy className="size-3.5 mr-1" />
                Copiar
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-none text-xs"
                onClick={handleNativeShare}
                title="Partilhar"
              >
                <Share2 className="size-3.5 mr-1" />
                Partilhar
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="mt-6 h-12 w-full rounded-none font-bold uppercase tracking-wider"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              tr(s.language, "Pagar na Shopify", "Pay on Shopify", "Pagar en Shopify")
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleFakeCheckout}
            className="mt-3 h-12 w-full rounded-none font-bold uppercase tracking-wider border-primary text-primary hover:bg-primary/10"
          >
            {tr(
              s.language,
              "⚡ Simular Compra de Teste (Fake)",
              "⚡ Simulate Test Purchase (Fake)",
              "⚡ Simular Compra de Prueba (Fake)",
            )}
          </Button>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-muted-foreground border border-border bg-section p-3">
            {/* Apple Pay */}
            <div
              className="flex items-center gap-1 bg-background px-2.5 py-1 border border-border rounded-sm"
              title="Apple Pay"
            >
              <svg className="h-4 w-auto fill-current text-foreground" viewBox="0 0 170 70">
                <path d="M37.3 22.8c-2.4 2.8-5.8 4.7-9.4 4.8-0.2-2.3 0.8-4.7 2.2-6.5 1.7-2.1 4.7-3.8 7.3-3.9 0.2 2.4-0.1 4.2-0.1 5.6zM38.8 28c-3.1 0-6.1 1.8-7.9 1.8s-4.6-1.7-7.6-1.7c-4 0-7.7 2.3-9.7 5.9-4.2 7.3-1.1 18.2 2.9 24.2 2 2.9 4.3 6.1 7.4 6s3-1.9 5.7-1.9 3.6 1.9 5.7 1.9c3.1 0 5.1-3 7.1-5.9 2.3-3.3 3.2-6.5 3.3-6.7-0.1 0-6.2-2.4-6.3-9.5-0.1-5.9 4.8-8.7 5-8.8-2.8-4.1-7.2-4.5-8.7-4.7z" />
                <path d="M83.4 25.1h-7.1v32.6h7.1c6.7 0 11.2-4.1 11.2-16.3s-4.5-16.3-11.2-16.3zm3.7 24.5c-1.3 1.9-3.7 2.6-6.1 2.6h-1.3V31.5h1.3c2.4 0 4.8 0.7 6.1 2.6 1.6 2.3 2.1 6.1 2.1 10s-0.5 7.7-2.1 10z" />
                <path d="M123.5 25.1h-7.1v32.6h7.1c6.7 0 11.2-4.1 11.2-16.3s-4.5-16.3-11.2-16.3zm3.7 24.5c-1.3 1.9-3.7 2.6-6.1 2.6h-1.3V31.5h1.3c2.4 0 4.8 0.7 6.1 2.6 1.6 2.3 2.1 6.1 2.1 10s-0.5 7.7-2.1 10z" />
                <path d="M154.5 57.7c4 0 7.3-1.7 8.9-4.8l-5.6-2.3c-0.8 1-2 1.8-3.3 1.8-2.1 0-3.6-1.1-4.2-3.2l15.1-6.3-0.5-1.3c-1.2-3.4-4.8-6.1-9-6.1-5.6 0-10.2 4.4-10.2 11.1 0 6.5 4.3 11.1 9.8 11.1zm-0.4-19c2.1 0 3.8 1.1 4.5 2.8l-9.9 4.1c-0.2-3.5 2.4-6.9 5.4-6.9z" />
              </svg>
            </div>

            {/* Google Pay */}
            <div
              className="flex items-center gap-1 bg-background px-2.5 py-1 border border-border rounded-sm"
              title="Google Pay"
            >
              <span className="font-bold text-xs tracking-tighter text-foreground">G Pay</span>
            </div>

            {/* Visa */}
            <div
              className="flex items-center bg-background px-2.5 py-1 border border-border rounded-sm font-black italic text-blue-600 text-xs tracking-widest"
              title="Visa"
            >
              VISA
            </div>

            {/* Mastercard */}
            <div
              className="flex items-center gap-0.5 bg-background px-2.5 py-1 border border-border rounded-sm"
              title="Mastercard"
            >
              <div className="size-3 rounded-full bg-red-600 opacity-90" />
              <div className="size-3 rounded-full bg-amber-500 opacity-90 -ml-1.5" />
            </div>

            {/* PayPal */}
            <div
              className="flex items-center font-bold text-blue-800 bg-background px-2.5 py-1 border border-border rounded-sm text-xs italic"
              title="PayPal"
            >
              PayPal
            </div>

            {/* MB WAY */}
            <div
              className="flex items-center font-black text-red-600 bg-background px-2.5 py-1 border border-border rounded-sm text-[11px] tracking-tight"
              title="MB WAY"
            >
              MB<span className="text-emerald-600 font-bold ml-0.5">WAY</span>
            </div>
          </div>

          {error && <p className="mt-3 text-center text-xs font-bold text-destructive">{error}</p>}

          <p className="mt-4 text-center text-[10px] leading-relaxed text-muted-foreground">
            {tr(
              s.language,
              "Serás redirecionado para o checkout oficial da Shopify para concluir o pagamento com total segurança.",
              "You will be redirected to the official Shopify checkout to complete your payment with total security.",
              "Serás redirigido al checkout oficial de Shopify para completar tu pago con total seguridad.",
            )}
          </p>
        </aside>
      </form>
    </div>
  );
}

function Choice({
  active,
  onClick,
  icon,
  title,
  detail,
  disabled = false,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  detail: string;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      onClick={onClick}
      disabled={disabled}
      className={`relative w-full h-auto min-h-24 flex-col items-center justify-center whitespace-normal rounded-none p-4 text-center transition-all ${
        active ? "ring-2 ring-primary ring-offset-2" : "hover:bg-accent"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span className="mb-2 shrink-0 opacity-80">{icon}</span>
      <span className="min-w-0">
        <span className="block font-bold leading-snug">{title}</span>
        <span className="mt-1 block text-xs leading-snug opacity-70">{detail}</span>
      </span>
      {active && <Check className="absolute right-3 top-3 size-4" />}
    </Button>
  );
}
