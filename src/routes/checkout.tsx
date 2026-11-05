import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, MapPin, Package, Smartphone, Loader2, Share2, MessageSquare, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { copy, money } from "@/lib/shop-data";
import { useShop } from "@/lib/shop-context";
import { tr } from "@/lib/i18n";
import { createShopifyCheckout } from "@/lib/shopify";

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
  
  const [delivery, setDelivery] = useState<"pickup" | "shipping">("pickup");
  const [payment, setPayment] = useState<"card" | "apple">("card");
  const [couponInput, setCouponInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const shipping = delivery === "shipping" ? 5.99 : 0;
  const grandTotal = s.finalTotal + shipping;

  const handleShareWhatsApp = () => {
    const itemsText = s.cart.map((item) => {
      const p = s.catalog.find((c) => c.id === item.productId);
      return `${item.quantity}x ${p?.name || item.productId} (Tam: ${item.size})`;
    }).join(", ");
    const text = `🛒 Carrinho UFFA Store:\n${itemsText}\nTotal: ${money(grandTotal)}\nVisita: ${window.location.origin}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleCopyCart = async () => {
    const itemsText = s.cart.map((item) => {
      const p = s.catalog.find((c) => c.id === item.productId);
      return `${item.quantity}x ${p?.name || item.productId} (Tam: ${item.size})`;
    }).join(", ");
    const text = `🛒 Carrinho UFFA Store: ${itemsText} — Total: ${money(grandTotal)}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(tr(s.language, "Carrinho copiado!", "Cart copied!", "¡Carrito copiado!"));
    } catch {
      toast.error(tr(s.language, "Erro ao copiar.", "Error copying.", "Error al copiar."));
    }
  };

  const handleNativeShare = async () => {
    const itemsText = s.cart.map((item) => {
      const p = s.catalog.find((c) => c.id === item.productId);
      return `${item.quantity}x ${p?.name || item.productId} (Tam: ${item.size})`;
    }).join(", ");
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
      const items = s.cart.map((item) => {
        const product = s.catalog.find((p) => p.id === item.productId);
        const variant = product?.sizes.find((sz) => sz.size === item.size);
        if (!variant?.variantId) {
          throw new Error(`Variant not found for ${item.productId} size ${item.size}`);
        }
        return { variantId: variant.variantId, quantity: item.quantity };
      });

      const checkout = await createShopifyCheckout(items, delivery, s.coupon?.code);
      window.location.href = checkout.webUrl;
    } catch (err: any) {
      console.error(err);
      setError(err?.message || (
        s.language === "pt"
          ? "Erro ao ligar à Shopify. Tenta novamente."
          : "Error connecting to Shopify. Please try again."
      ));
      setLoading(false);
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
              1. {s.language === "pt" ? "Modalidade de Entrega" : s.language === "es" ? "Modalidad de Entrega" : "Delivery Method"}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Choice
                active={delivery === "pickup"}
                onClick={() => setDelivery("pickup")}
                icon={<MapPin />}
                title={tr(s.language, "Receber em mão", "Hand pickup", "Recibir en mano")}
                detail={tr(s.language, "Grátis no Porto (0,00 €)", "Free in Porto (0.00 €)", "Gratis en Oporto (0,00 €)")}
              />
              <Choice
                active={delivery === "shipping"}
                onClick={() => setDelivery("shipping")}
                icon={<Package />}
                title={tr(s.language, "Entregar", "Deliver to address", "Entregar a domicilio")}
                detail={tr(s.language, "5,99 € · Envio expresso CTT", "5.99 € · CTT Express shipping", "5,99 € · Envío CTT")}
              />
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              {delivery === "pickup"
                ? tr(
                    s.language,
                    "* Receber em mão no Porto não tem qualquer custo de envio (0,00 €). A entrega será combinada contigo.",
                    "* Hand pickup in Porto has no shipping fee (0.00 €). We will coordinate handover with you.",
                    "* Recibir en mano en Oporto no tiene gastos de envío (0,00 €)."
                  )
                : tr(
                    s.language,
                    "* Podes preencher a morada de entrega no passo seguinte (Shopify).",
                    "* You can fill the shipping address in the next step (Shopify).",
                    "* Puedes completar la dirección de envío en el siguiente paso (Shopify)."
                  )}
            </p>
          </section>

          <section>
            <h2 className="mb-4 font-display text-3xl uppercase">
              2. {s.language === "pt" ? "Pagamento" : s.language === "es" ? "Pago" : "Payment"}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Choice
                active={payment === "card"}
                onClick={() => setPayment("card")}
                icon={<Smartphone />}
                title={tr(s.language, "Cartão / MB WAY / Google Pay", "Card / Apple Pay / Google Pay", "Tarjeta / Google Pay")}
                detail={tr(s.language, "Pagamento seguro via Shopify", "Secure payment via Shopify", "Pago seguro vía Shopify")}
              />
            </div>
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
                <div key={`${x.productId}-${x.size}`} className="flex justify-between gap-3 text-sm">
                  <span>{x.quantity}× {p.name} · {x.size}</span>
                  <span className="font-bold">{money(p.price * x.quantity)}</span>
                </div>
              ) : null;
            })}
          </div>

          <div className="space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <span>{t.subtotal}</span>
              <span>{money(s.subtotal)}</span>
            </div>
            {s.discountAmount > 0 && (
              <div className="flex justify-between text-primary font-semibold">
                <span>Desconto ({s.coupon?.code})</span>
                <span>-{money(s.discountAmount)}</span>
              </div>
            )}
            {delivery === "shipping" ? (
              <div className="flex justify-between">
                <span>{tr(s.language, "Portes de envio (CTT)", "Shipping (CTT)", "Envío (CTT)")}</span>
                <span>{money(shipping)}</span>
              </div>
            ) : (
              <div className="flex justify-between">
                <span>{tr(s.language, "Receber em mão (Porto)", "Hand pickup (Porto)", "Recibir en mano (Oporto)")}</span>
                <span className="font-semibold text-primary">{tr(s.language, "Grátis (0,00 €)", "Free (0.00 €)", "Gratis (0,00 €)")}</span>
              </div>
            )}
            <div className="flex justify-between pt-3 text-lg font-bold">
              <span>Total</span>
              <span>{money(grandTotal)}</span>
            </div>
          </div>

          {/* Coupon input */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                placeholder={tr(s.language, "Código de desconto", "Discount code", "Código de descuento")}
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
                <span>Cupão {s.coupon.code} (-{s.coupon.discountPercent}%)</span>
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
              tr(s.language, "Pagar agora", "Pay now", "Pagar ahora")
            )}
          </Button>

          {error && <p className="mt-3 text-center text-xs font-bold text-destructive">{error}</p>}
          
          <p className="mt-4 text-center text-[10px] leading-relaxed text-muted-foreground">
            {tr(
              s.language,
              "Serás redirecionado para o checkout oficial da Shopify para concluir o pagamento com total segurança.",
              "You will be redirected to the official Shopify checkout to complete your payment with total security.",
              "Serás redirigido al checkout oficial de Shopify para completar tu pago con total seguridad."
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
      className={`relative h-auto min-h-24 justify-start rounded-none p-4 text-left transition-all ${
        active ? "ring-2 ring-primary ring-offset-2" : "hover:bg-accent"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span className="shrink-0 mr-3 opacity-80">{icon}</span>
      <span>
        <span className="block font-bold">{title}</span>
        <span className="mt-1 block text-xs opacity-70">{detail}</span>
      </span>
      {active && <Check className="absolute right-3 top-3 size-4" />}
    </Button>
  );
}
