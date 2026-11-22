import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, LockKeyhole, Send, Truck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/expedicao")({
  head: () => ({
    meta: [{ title: "Expedição — Uffa Store" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: ExpedicaoPage,
});

type FormState = {
  adminToken: string;
  orderNumber: string;
  email: string;
  carrier: string;
  trackingCode: string;
  estimatedDelivery: string;
};

const initialForm: FormState = {
  adminToken: "",
  orderNumber: "",
  email: "",
  carrier: "CTT Expresso",
  trackingCode: "",
  estimatedDelivery: "",
};

function ExpedicaoPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ trackingUrl: string; emailSent: boolean } | null>(null);

  function update(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);
    setBusy(true);

    try {
      const response = await fetch("/api/orders/tracking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": form.adminToken,
        },
        body: JSON.stringify({
          orderNumber: form.orderNumber,
          email: form.email,
          carrier: form.carrier,
          trackingCode: form.trackingCode,
          estimatedDelivery: form.estimatedDelivery,
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        trackingUrl?: string;
        emailSent?: boolean;
        reason?: string;
      };

      if (data.trackingUrl) {
        setResult({ trackingUrl: data.trackingUrl, emailSent: Boolean(data.emailSent) });
      }

      if (!response.ok || !data.success || !data.trackingUrl) {
        throw new Error(
          data.reason === "email_failed" && data.trackingUrl
            ? "O link foi criado, mas o e-mail falhou. Copia o link acima e envia manualmente."
            : "Não foi possível registar o envio. Confere os dados e o token interno.",
        );
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível registar o envio. Tenta novamente.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
        Uffa Store · Interno
      </p>
      <h1 className="mt-3 font-display text-5xl uppercase">Registar envio</h1>
      <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
        Regista o código de rastreio de uma encomenda paga. A loja cria um link seguro, envia o
        e-mail ao cliente e mostra o atalho para o transportador no portal de rastreio.
      </p>

      <form onSubmit={submit} className="mt-10 border border-border bg-card p-6 md:p-8">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center bg-primary text-primary-foreground">
            <Truck className="size-5" />
          </span>
          <div>
            <h2 className="font-display text-2xl uppercase">Dados do envio</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              O token interno não é guardado no browser.
            </p>
          </div>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="admin-token">Token interno</Label>
            <Input
              id="admin-token"
              type="password"
              value={form.adminToken}
              onChange={(event) => update("adminToken", event.target.value)}
              autoComplete="off"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="order-number">Número da encomenda</Label>
            <Input
              id="order-number"
              value={form.orderNumber}
              onChange={(event) => update("orderNumber", event.target.value)}
              placeholder="UFFA-48217 ou #1234"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-email">E-mail do cliente</Label>
            <Input
              id="customer-email"
              type="email"
              value={form.email}
              onChange={(event) => update("email", event.target.value)}
              placeholder="cliente@exemplo.pt"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="carrier">Transportador</Label>
            <Input
              id="carrier"
              value={form.carrier}
              onChange={(event) => update("carrier", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tracking-code">Código de rastreio</Label>
            <Input
              id="tracking-code"
              value={form.trackingCode}
              onChange={(event) => update("trackingCode", event.target.value)}
              placeholder="RR123456789PT"
              className="font-mono uppercase"
              required
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="estimated-delivery">Previsão de entrega (opcional)</Label>
            <Input
              id="estimated-delivery"
              value={form.estimatedDelivery}
              onChange={(event) => update("estimatedDelivery", event.target.value)}
              placeholder="2026-11-28"
            />
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

        {result && (
          <div className="mt-5 border border-primary/30 bg-primary/10 p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-primary">
              {result.emailSent ? (
                <CheckCircle2 className="size-4" />
              ) : (
                <LockKeyhole className="size-4" />
              )}
              {result.emailSent
                ? "Envio registado e e-mail enviado."
                : "Link criado; envia manualmente."}
            </p>
            <p className="mt-2 break-all font-mono text-xs">{result.trackingUrl}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 rounded-none"
              onClick={() => navigator.clipboard.writeText(result.trackingUrl)}
            >
              Copiar link
            </Button>
          </div>
        )}

        <Button type="submit" size="lg" className="mt-6 h-12 w-full rounded-none" disabled={busy}>
          <Send />
          {busy ? "A registar…" : "Registar e enviar e-mail"}
        </Button>
      </form>
    </div>
  );
}
