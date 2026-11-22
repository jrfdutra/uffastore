import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Heart, MessageSquareText, Send, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NPS_MAX_COMMENT, NPS_MAX_SCORE, NPS_MIN_SCORE } from "@/lib/nps-core";

export const Route = createFileRoute("/avaliar")({
  head: () => ({
    meta: [
      { title: "Avalia a tua experiência — Uffa Store" },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content: "Pesquisa de satisfação da Uffa Store sobre a tua encomenda.",
      },
    ],
  }),
  component: AvaliarPage,
});

type OrderInfo = {
  orderNumber: string;
  customerName: string;
  score: string | null;
  comment: string | null;
};

function tokenFromUrl(): string {
  return new URLSearchParams(window.location.search).get("token") ?? "";
}

function AvaliarPage() {
  const [token, setToken] = useState("");
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "invalid" | "error">("loading");
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const value = tokenFromUrl();
    setToken(value);
    if (!value) {
      setStatus("invalid");
      return;
    }

    let cancelled = false;
    async function load() {
      try {
        const response = await fetch(`/api/nps?token=${encodeURIComponent(value)}`);
        const data = (await response.json()) as {
          success?: boolean;
          order?: OrderInfo;
          reason?: string;
        };
        if (cancelled) return;
        if (!response.ok || !data.order) {
          setStatus(data.reason === "invalid_token" ? "invalid" : "error");
          return;
        }
        setOrder(data.order);
        if (data.order.score !== null) setScore(Number(data.order.score));
        if (data.order.comment) setComment(data.order.comment);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (score === null) return;
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/nps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, score, comment }),
      });
      const data = (await response.json()) as { success?: boolean; reason?: string };
      if (!response.ok || !data.success) {
        throw new Error(
          data.reason === "invalid_token"
            ? "Este link já não é válido. Pede um novo em atendimento@uffastore.pt."
            : "Não foi possível guardar a tua resposta. Tenta novamente.",
        );
      }
      setSubmitted(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível guardar a resposta.");
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center text-sm text-muted-foreground">
        A carregar a pesquisa…
      </div>
    );
  }

  if (status === "invalid" || status === "error") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24">
        <div className="border border-border bg-card p-8 text-center">
          <XCircle className="mx-auto size-8 text-destructive" />
          <h1 className="mt-4 font-display text-3xl uppercase">Link indisponível</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {status === "invalid"
              ? "Este convite expirou ou não é válido. Se quiseres deixar a tua opinião, escreve-nos para atendimento@uffastore.pt."
              : "Não foi possível carregar a tua encomenda. Tenta novamente mais tarde."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 md:px-6 md:py-24">
      <div className="border border-border bg-card p-6 md:p-10">
        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
          <Heart className="size-4" /> Uffa Store · Opinião
        </span>

        {submitted ? (
          <div className="mt-8 text-center">
            <CheckCircle2 className="mx-auto size-10 text-primary" />
            <h1 className="mt-4 font-display text-4xl uppercase">Obrigada! 💗</h1>
            <p className="mt-4 text-sm text-muted-foreground">
              A tua resposta sobre a encomenda {order?.orderNumber} ficou registada. Ajuda-nos
              verdadeiramente a continuar a melhorar.
            </p>
          </div>
        ) : (
          <>
            <h1 className="mt-4 font-display text-4xl uppercase">Como correu?</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Olá, {order?.customerName || "Cliente"}. Dá-nos uma nota de {NPS_MIN_SCORE} a{" "}
              {NPS_MAX_SCORE} sobre a tua experiência com a encomenda {order?.orderNumber}.
            </p>

            <form onSubmit={submit} className="mt-8">
              <fieldset>
                <legend className="text-sm font-semibold">A tua nota</legend>
                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {Array.from({ length: NPS_MAX_SCORE - NPS_MIN_SCORE + 1 }, (_, index) => {
                    const value = NPS_MIN_SCORE + index;
                    const selected = score === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={selected}
                        aria-label={`Nota ${value} de ${NPS_MAX_SCORE}`}
                        onClick={() => setScore(value)}
                        className={`h-14 border text-lg font-bold transition-colors ${
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background hover:border-primary"
                        }`}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {NPS_MIN_SCORE} = muito insatisfeita · {NPS_MAX_SCORE} = muito satisfeita
                </p>
              </fieldset>

              <div className="mt-8 space-y-2">
                <Label htmlFor="comentario" className="flex items-center gap-2">
                  <MessageSquareText className="size-4" /> Comentário (opcional)
                </Label>
                <Textarea
                  id="comentario"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  maxLength={NPS_MAX_COMMENT}
                  rows={4}
                  placeholder="Conta-nos o que gostaste ou o que podemos melhorar."
                />
              </div>

              {error && (
                <p role="alert" className="mt-5 text-sm text-destructive">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                className="mt-6 h-12 w-full rounded-none"
                disabled={score === null || busy}
              >
                <Send />
                {busy ? "A guardar…" : "Enviar resposta"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
