import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, MapPin, Package, Smartphone, Loader2, Share2, MessageSquare, Copy, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { copy, money } from "@/lib/shop-data";
import { useShop } from "@/lib/shop-context";
import { tr } from "@/lib/i18n";
import { createShopifyCheckout } from "@/lib/shopify";

export type DeliveryOption = "pickup" | "continental" | "islands" | "eu" | "switzerland";

export const deliveryRates: Record<DeliveryOption, { price: number; title: { pt: string; en: string; es: string }; subtitle: { pt: string; en: string; es: string } }> = {
  pickup: {
    price: 0,
    title: { pt: "Recolha em mão no Porto", en: "Hand pickup in Porto", es: "Recogida en mano en Oporto" },
    subtitle: { pt: "Grátis (0,00 €)", en: "Free (0.00 €)", es: "Gratis (0,00 €)" },
  },
  continental: {
    price: 8.94,
    title: { pt: "Portugal Continental", en: "Portugal Mainland", es: "Portugal Continental" },
    subtitle: { pt: "Envio expresso · 8,94 €", en: "Express shipping · 8.94 €", es: "Envío expreso · 8,94 €" },
  },
  islands: {
    price: 8.94,
    title: { pt: "Portugal - Ilhas", en: "Portugal Islands", es: "Portugal - Islas" },
    subtitle: { pt: "Açores e Madeira · 8,94 €", en: "Azores & Madeira · 8.94 €", es: "Azores y Madeira · 8,94 €" },
  },
  eu: {
    price: 24.00,
    title: { pt: "União Europeia", en: "European Union", es: "Unión Europea" },
    subtitle: { pt: "Qualquer país da UE · 24,00 €", en: "Any EU country · 24.00 €", es: "Cualquier país de la UE · 24,00 €" },
  },
  switzerland: {
    price: 34.00,
    title: { pt: "Suíça", en: "Switzerland", es: "Suiza" },
    subtitle: { pt: "Envio internacional · 34,00 €", en: "International shipping · 34.00 €", es: "Envío internacional · 34,00 €" },
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
  const [couponInput, setCouponInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const shipping = deliveryRates[delivery].price;
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
      // Revalidação de stock antes de submeter
      for (const item of s.cart) {
        const product = s.catalog.find((p) => p.id === item.productId);
        if (!product || product.status === "inactive" || product.status === "comingsoon") {
          throw new Error(
            s.language === "pt"
              ? `O modelo ${product?.name ?? item.productId} já não se encontra disponível.`
              : `The model ${product?.name ?? item.productId} is no longer available.`
          );
        }
        const variant = product.sizes.find((sz) => sz.size === item.size);
        if (!variant || variant.stock < item.quantity) {
          throw new Error(
            s.language === "pt"
              ? `Stock insuficiente para ${product.name} (Tamanho ${item.size}). Disponível: ${variant?.stock ?? 0}.`
              : `Insufficient stock for ${product.name} (Size ${item.size}). Available: ${variant?.stock ?? 0}.`
          );
        }
      }

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
                    detail={opt.subtitle[s.language as keyof typeof opt.subtitle] ?? opt.subtitle.pt}
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
                    "* Recibir en mano en Oporto no tiene gastos de envío (0,00 €)."
                  )
                : tr(
                    s.language,
                    `* Envio selecionado (${money(deliveryRates[delivery].price)}). Podes preencher a morada completa no passo seguinte na Shopify.`,
                    `* Selected shipping (${money(deliveryRates[delivery].price)}). You can fill your full address in the next step on Shopify.`,
                    `* Envío seleccionado (${money(deliveryRates[delivery].price)}). Puedes completar tu dirección en el siguiente paso en Shopify.`
                  )}
            </p>
          </section>

          <section>
            <h2 className="mb-4 font-display text-3xl uppercase">
              2. {s.language === "pt" ? "Pagamento" : s.language === "es" ? "Pago" : "Payment"}
            </h2>
            <div className="grid gap-3">
              <Choice
                active={true}
                onClick={() => {}}
                icon={<CreditCard className="text-primary" />}
                title={tr(s.language, "Pagamento Seguro via Shopify", "Secure Payment via Shopify", "Pago Seguro vía Shopify")}
                detail={tr(s.language, "Aceita MB WAY, Cartão de Crédito/Débito (Visa, Mastercard), PayPal, Apple Pay, Google Pay", "Accepts MB WAY, Credit/Debit Card, PayPal, Apple Pay, Google Pay", "Acepta MB WAY, Tarjeta de Crédito/Débito, PayPal, Apple Pay, Google Pay")}
              />
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              {tr(
                s.language,
                "* Todos os pagamentos são processados com encriptação de nível bancário e SSL no checkout seguro da Shopify.",
                "* All payments are processed with bank-level encryption and SSL on Shopify's secure checkout.",
                "* Todos los pagos se procesan con cifrado de nivel bancario y SSL en el checkout seguro de Shopify."
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
                <div key={`${x.productId}-${x.size}`} className="flex min-w-0 justify-between gap-3 text-sm">
                  <span className="min-w-0 break-words">{x.quantity}× {p.name} · {x.size}</span>
                  <span className="shrink-0 whitespace-nowrap font-bold">{money(p.price * x.quantity)}</span>
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
                <span className="min-w-0 break-words">{tr(s.language, `Portes (${deliveryRates[delivery].title[s.language as keyof typeof deliveryRates[typeof delivery]["title"]] ?? deliveryRates[delivery].title.pt})`, `Shipping (${deliveryRates[delivery].title[s.language as keyof typeof deliveryRates[typeof delivery]["title"]] ?? deliveryRates[delivery].title.pt})`, `Envío (${deliveryRates[delivery].title[s.language as keyof typeof deliveryRates[typeof delivery]["title"]] ?? deliveryRates[delivery].title.pt})`)}</span>
                <span className="shrink-0 whitespace-nowrap">{money(shipping)}</span>
              </div>
            ) : (
              <div className="flex min-w-0 justify-between gap-3">
                <span className="min-w-0 break-words">{tr(s.language, "Receber em mão (Porto)", "Hand pickup (Porto)", "Recibir en mano (Oporto)")}</span>
                <span className="shrink-0 whitespace-nowrap font-semibold text-primary">{tr(s.language, "Grátis (0,00 €)", "Free (0.00 €)", "Gratis (0,00 €)")}</span>
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

          <div className="mt-4 flex flex-wrap justify-center gap-3 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b0/Apple_Pay_logo.svg" alt="Apple Pay" className="h-5" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c7/Google_Pay_Logo_%282020%29.svg" alt="Google Pay" className="h-5" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-3 mt-1" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-5" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-5" />
          </div>

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
