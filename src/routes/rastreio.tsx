import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Copy,
  Mail,
  Navigation,
  PackageSearch,
  Truck,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { tr } from "@/lib/i18n";
import { type Language } from "@/lib/shop-data";
import { useShop } from "@/lib/shop-context";
import { formatDate } from "@/lib/orders";
import { cttTrackingUrl, isCttCarrier, type TrackingLinkData } from "@/lib/tracking";

export const Route = createFileRoute("/rastreio")({
  validateSearch: (search) =>
    z.object({ order: z.string().optional(), token: z.string().optional() }).parse(search),
  head: () => ({
    meta: [
      { title: "Rastrear encomenda — Uffa Store" },
      {
        name: "description",
        content: "Introduz o código de rastreio e abre diretamente a pesquisa oficial do CTT.",
      },
      { property: "og:title", content: "Rastrear encomenda — Uffa Store" },
      {
        property: "og:description",
        content: "Rastreio simples: um código e botão direto para o CTT.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/rastreio" }],
  }),
  component: OrderPortal,
});

async function copyText(value: string, language: Language, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(tr(language, `${label} copiado.`, `${label} copied.`, `${label} copiado.`));
  } catch {
    toast.error(tr(language, "Não foi possível copiar.", "Could not copy.", "No se pudo copiar."));
  }
}

type TrackingLinkState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; data: TrackingLinkData };

function OrderPortal() {
  const search = Route.useSearch();
  const [trackingLink, setTrackingLink] = useState<TrackingLinkState>({ status: "idle" });

  useEffect(() => {
    const token = search.token;
    if (!token) {
      setTrackingLink({ status: "idle" });
      return;
    }

    let cancelled = false;
    setTrackingLink({ status: "loading" });
    fetch(`/api/orders/tracking?token=${encodeURIComponent(token)}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("invalid token");
        return (await response.json()) as { success: boolean; order: TrackingLinkData };
      })
      .then((data) => {
        if (!cancelled) setTrackingLink({ status: "ready", data: data.order });
      })
      .catch(() => {
        if (!cancelled) setTrackingLink({ status: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, [search.token]);

  if (search.token) {
    if (trackingLink.status === "loading" || trackingLink.status === "idle") {
      return <PortalSkeleton />;
    }
    if (trackingLink.status === "error") return <TrackingLinkInvalid />;
    return <TrackingLinkDashboard data={trackingLink.data} />;
  }

  return <CttRedirectForm initialCode={search.order ?? ""} />;
}

function PortalSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 md:px-6">
      <div className="h-10 w-44 animate-pulse bg-muted" />
      <div className="mt-4 h-24 w-full max-w-2xl animate-pulse bg-muted" />
      <div className="mt-10 h-64 animate-pulse bg-muted" />
    </div>
  );
}

function TrackingLinkInvalid() {
  const { language } = useShop();
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
      <div className="border border-destructive/30 bg-destructive/5 p-8">
        <p className="flex items-center gap-2 text-xs font-bold uppercase text-destructive">
          <XCircle className="size-4" />
          {tr(language, "Ligação inválida", "Invalid link", "Enlace no válido")}
        </p>
        <h1 className="mt-4 font-display text-4xl uppercase">
          {tr(
            language,
            "Este link de rastreio expirou ou não é válido.",
            "This tracking link has expired or is invalid.",
            "Este enlace de seguimiento ha caducado o no es válido.",
          )}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {tr(
            language,
            "Podes pedir um novo link por e-mail ou introduzir o código abaixo.",
            "You can request a new link by email or enter the code below.",
            "Puedes pedir un nuevo enlace por correo o introducir el código abajo.",
          )}
        </p>
        <Button asChild className="mt-6 rounded-none">
          <Link to="/rastreio">{tr(language, "Abrir portal", "Open portal", "Abrir portal")}</Link>
        </Button>
      </div>
    </div>
  );
}

function TrackingLinkDashboard({ data }: { data: TrackingLinkData }) {
  const { language } = useShop();

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 md:px-6">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
        <Truck className="size-4" />
        {tr(language, "Encomenda enviada", "Order shipped", "Pedido enviado")}
      </p>
      <h1 className="mt-3 font-display text-5xl uppercase md:text-6xl">{data.orderNumber}</h1>
      <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
        {tr(
          language,
          "A tua encomenda já foi entregue ao transportador. Podes acompanhar o percurso com o código de rastreio.",
          "Your order is now with the carrier. You can follow its progress with the tracking code.",
          "Tu pedido ya está con el transportista. Puedes seguir su recorrido con el código de seguimiento.",
        )}
      </p>

      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        <InfoBlock
          icon={Truck}
          label={tr(language, "Transportador", "Carrier", "Transportista")}
          value={data.carrier}
        />
        <InfoBlock
          icon={CalendarDays}
          label={tr(language, "Previsão de entrega", "Estimated delivery", "Entrega prevista")}
          value={data.estimatedDelivery ? formatDate(data.estimatedDelivery, language) : "—"}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border border-border bg-section px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Navigation className="size-4 text-primary" />
          <span className="text-xs font-bold uppercase text-muted-foreground">
            {tr(language, "Código de rastreio", "Tracking code", "Código de seguimiento")}
          </span>
          <code className="font-mono text-sm font-bold">{data.trackingCode}</code>
        </div>
        <div className="flex flex-wrap gap-2">
          {isCttCarrier(data.carrier) && (
            <Button asChild size="sm" className="rounded-none">
              <a href={cttTrackingUrl(data.trackingCode)} target="_blank" rel="noopener noreferrer">
                <Navigation />
                {tr(language, "Ver no CTT", "Track on CTT", "Ver en CTT")}
              </a>
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-none"
            onClick={() =>
              copyText(
                data.trackingCode,
                language,
                tr(language, "Código de rastreio", "Tracking code", "Código de seguimiento"),
              )
            }
          >
            <Copy />
            {tr(language, "Copiar", "Copy", "Copiar")}
          </Button>
        </div>
      </div>

      <div className="mt-8 border border-border bg-card p-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
          {tr(language, "Próximos passos", "Next steps", "Próximos pasos")}
        </p>
        <div className="mt-5 space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-bold">
                {tr(language, "Pagamento confirmado", "Payment confirmed", "Pago confirmado")}
              </p>
              <p className="text-xs text-muted-foreground">
                {tr(
                  language,
                  "A tua compra foi recebida pela UFFA Store.",
                  "Your purchase was received by UFFA Store.",
                  "Tu compra fue recibida por UFFA Store.",
                )}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-bold">
                {tr(
                  language,
                  "Entregue ao transportador",
                  "Handed to carrier",
                  "Entregado al transportista",
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {tr(
                  language,
                  "O código de rastreio já está disponível.",
                  "The tracking code is now available.",
                  "El código de seguimiento ya está disponible.",
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        {tr(
          language,
          "Dúvidas? Responde ao e-mail de envio ou escreve para atendimento@uffastore.pt.",
          "Questions? Reply to the shipping email or write to atendimento@uffastore.pt.",
          "¿Dudas? Responde al correo de envío o escribe a atendimento@uffastore.pt.",
        )}
      </p>
    </div>
  );
}

function CttRedirectForm({ initialCode }: { initialCode: string }) {
  const { language } = useShop();
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState<string | null>(null);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = code.trim().toUpperCase().replace(/\s+/g, "");

    if (!normalized) {
      setError(
        tr(
          language,
          "Introduz o código de rastreio.",
          "Enter the tracking code.",
          "Introduce el código de seguimiento.",
        ),
      );
      return;
    }

    setError(null);
    window.location.assign(cttTrackingUrl(normalized));
  };

  return (
    <div>
      <section className="border-b border-border bg-foreground text-background">
        <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
            <PackageSearch className="size-4" />
            UFFA Store · {tr(language, "Rastreio simples", "Simple tracking", "Seguimiento simple")}
          </p>
          <h1 className="mt-4 font-display text-6xl uppercase leading-[.88] md:text-8xl">
            {tr(language, "Onde está", "Where is", "Dónde está")}
            <br />
            <span className="text-primary">
              {tr(language, "o meu par?", "my pair?", "mi par?")}
            </span>
          </h1>
          <p className="mt-5 max-w-2xl text-background/70">
            {tr(
              language,
              "Introduz o código de rastreio que veio no e-mail e abre diretamente a pesquisa oficial do CTT. Sem registo, sem outros dados.",
              "Enter the tracking code from your shipping email and open the official CTT search directly. No sign-in, no extra details.",
              "Introduce el código de seguimiento del correo y abre directamente la búsqueda oficial de CTT. Sin registro ni otros datos.",
            )}
          </p>
          <div className="mt-7 flex flex-wrap gap-2 text-[11px] font-bold uppercase">
            <span className="flex items-center gap-2 border border-background/20 px-3 py-2">
              <Navigation className="size-4 text-primary" />
              {tr(language, "1 código", "1 code", "1 código")}
            </span>
            <span className="flex items-center gap-2 border border-background/20 px-3 py-2">
              <Truck className="size-4 text-primary" />
              {tr(language, "Botão CTT direto", "Direct CTT button", "Botón CTT directo")}
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 md:px-6 md:py-16">
        <form
          onSubmit={submit}
          action="https://www.ctt.pt/feapl_2/app/open/objectSearch/objectSearch.jspx"
          method="get"
          className="border border-border bg-card p-6 md:p-8"
        >
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center bg-primary text-primary-foreground">
              <PackageSearch className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-3xl uppercase">
                {tr(language, "Rastrear encomenda", "Track your order", "Rastrear pedido")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {tr(
                  language,
                  "Usa o código que veio no e-mail de envio.",
                  "Use the code from the shipping email.",
                  "Usa el código del correo de envío.",
                )}
              </p>
            </div>
          </div>

          <div className="mt-7 space-y-2">
            <Label htmlFor="tracking-code">
              {tr(language, "Código de rastreio", "Tracking code", "Código de seguimiento")}
            </Label>
            <Input
              id="tracking-code"
              name="objects"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="RR123456789PT"
              autoComplete="off"
              spellCheck={false}
              className="h-14 rounded-none font-mono text-lg uppercase"
              required
            />
          </div>
          <input type="hidden" name="request_locale" value="pt" />

          {error && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-3 border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            >
              <XCircle className="mt-0.5 size-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <Button type="submit" size="lg" className="mt-6 h-14 w-full rounded-none">
            <Navigation />
            {tr(language, "Abrir no CTT", "Open on CTT", "Abrir en CTT")}
            <ArrowRight />
          </Button>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            {tr(
              language,
              "A pesquisa abre no site oficial dos CTT com o código já preenchido.",
              "The search opens on the official CTT website with the code already filled in.",
              "La búsqueda se abre en la web oficial de CTT con el código ya relleno.",
            )}
          </p>
        </form>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="border border-border bg-section p-6">
            <p className="flex items-center gap-2 text-xs font-bold uppercase text-primary">
              <Mail className="size-4" />
              {tr(language, "Recebeste o e-mail?", "Got the email?", "¿Recibiste el correo?")}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              {tr(
                language,
                "O e-mail de envio tem o código de rastreio e um link direto para a vista detalhada da tua encomenda.",
                "The shipping email has the tracking code and a direct link to the detailed view of your order.",
                "El correo de envío tiene el código de seguimiento y un enlace directo a la vista detallada de tu pedido.",
              )}
            </p>
          </div>
          <div className="border border-border bg-section p-6">
            <p className="flex items-center gap-2 text-xs font-bold uppercase text-primary">
              <CheckCircle2 className="size-4" />
              {tr(language, "Sem conta necessária", "No account needed", "Sin cuenta necesaria")}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              {tr(
                language,
                "Não pedimos e-mail nem dados pessoais. O código é tudo o que precisas para consultar o CTT.",
                "We don't ask for email or personal data. The code is all you need to check CTT.",
                "No pedimos correo ni datos personales. El código es todo lo que necesitas para consultar CTT.",
              )}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-14 md:px-6">
        <a
          href="mailto:atendimento@uffastore.pt?subject=Ajuda%20com%20a%20minha%20encomenda"
          className="group flex flex-col gap-2 border border-border bg-section p-6 transition hover:border-primary md:flex-row md:items-center md:justify-between md:p-8"
        >
          <div className="flex items-start gap-4">
            <Mail className="mt-1 size-7 shrink-0 text-primary" />
            <div>
              <h2 className="font-display text-3xl uppercase">
                {tr(language, "Precisas de ajuda?", "Need help?", "¿Necesitas ayuda?")}
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {tr(
                  language,
                  "Fala com a equipa UFFA se o código não aparecer ou tiveres dúvidas sobre a entrega.",
                  "Talk to the UFFA team if the code is missing or you have questions about delivery.",
                  "Habla con el equipo UFFA si el código no aparece o tienes dudas sobre la entrega.",
                )}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 text-sm font-bold uppercase text-primary">
            atendimento@uffastore.pt
            <ArrowRight className="size-4 transition group-hover:translate-x-1" />
          </span>
        </a>
      </section>
    </div>
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
