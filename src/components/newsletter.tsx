import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { copy } from "@/lib/shop-data";
import { useShop } from "@/lib/shop-context";

// Email que recebe todas as subscrições da newsletter.
const NEWSLETTER_INBOX = "atendimento@uffastore.pt";

const messages = {
  pt: { ok: "Estás no radar.", error: "Não foi possível subscrever. Tenta novamente." },
  es: { ok: "Ya estás en el radar.", error: "No se pudo suscribir. Inténtalo de nuevo." },
  en: { ok: "You're on the radar.", error: "Couldn't subscribe. Please try again." },
} as const;

const languageNames = { pt: "Português", es: "Español", en: "English" } as const;

export function Newsletter({ compact = false }: { compact?: boolean }) {
  const { language } = useShop();
  const t = copy[language];
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.includes("@") || sending) return;
    // Campo escondido anti-spam: se um bot o preencher, ignoramos.
    const honey = (e.currentTarget.elements.namedItem("_honey") as HTMLInputElement | null)?.value;
    if (honey) return;

    setSending(true);
    try {
      const res = await fetch(`https://formsubmit.co/ajax/${NEWSLETTER_INBOX}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: "Nova subscrição da newsletter — Uffa Store",
          _template: "table",
          _captcha: "false",
          email: email,
          _replyto: email,
          Idioma: languageNames[language],
          Origem: compact ? "Rodapé do site" : "Página inicial",
          Página: window.location.href,
          Data: new Date().toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" }),
        }),
      });
      const data = await res.json().catch(() => null);
      // O FormSubmit responde 200 mesmo quando falha; temos de ler o campo "success".
      if (!res.ok || (data && String(data.success) === "false")) {
        throw new Error(data?.message ?? `HTTP ${res.status}`);
      }
      toast.success(messages[language].ok);
      setEmail("");
    } catch {
      toast.error(messages[language].error);
    } finally {
      setSending(false);
    }
  }

  return (
    <form
      className={compact ? "space-y-3" : "grid gap-6 md:grid-cols-[1fr_1.1fr] md:items-end"}
      onSubmit={handleSubmit}
    >
      <div>
        <h2 className={compact ? "font-display text-3xl uppercase" : "font-display text-5xl uppercase md:text-7xl"}>
          {t.newsletter}
        </h2>
        <p className="mt-2 text-muted-foreground">{t.newsletterText}</p>
      </div>
      <div className="flex gap-2">
        <input type="text" name="_honey" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
          aria-label={t.email}
          placeholder={t.email}
          className="h-12 rounded-none border-foreground/30"
        />
        <Button aria-label={t.subscribe} size="icon" disabled={sending} className="h-12 w-12 shrink-0 rounded-none">
          <ArrowRight />
        </Button>
      </div>
    </form>
  );
}
