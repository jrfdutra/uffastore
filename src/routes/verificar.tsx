import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Copy,
  ExternalLink,
  Fingerprint,
  LockKeyhole,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { tr } from "@/lib/i18n";
import { categoryNames, type Language } from "@/lib/shop-data";
import { useShop } from "@/lib/shop-context";
import { demoAuthCode, formatDate, verifyAuthCode, type AuthVerification } from "@/lib/orders";

export const Route = createFileRoute("/verificar")({
  validateSearch: (search) => z.object({ codigo: z.string().optional() }).parse(search),
  head: () => ({
    meta: [
      { title: "Verificar autenticidade — Uffa Store" },
      {
        name: "description",
        content:
          "Valida o código exclusivo do teu par UFFA e confirma a autenticidade, o número de série e a edição.",
      },
      { property: "og:title", content: "Verificar autenticidade — Uffa Store" },
      {
        property: "og:description",
        content: "Cada par UFFA tem um código de autenticidade único. Confirma o teu.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/verificar" }],
  }),
  component: VerificationPage,
});

async function copyText(value: string, language: Language, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(tr(language, `${label} copiado.`, `${label} copied.`, `${label} copiado.`));
  } catch {
    toast.error(tr(language, "Não foi possível copiar.", "Could not copy.", "No se pudo copiar."));
  }
}

function VerificationPage() {
  const { language } = useShop();
  const search = Route.useSearch();
  const [code, setCode] = useState(search.codigo ?? "");
  const [result, setResult] = useState<AuthVerification | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!search.codigo) return;
    setCode(search.codigo);
    setResult(verifyAuthCode(search.codigo));
    setChecked(true);
  }, [search.codigo]);

  const runVerification = (value: string) => {
    setResult(verifyAuthCode(value));
    setChecked(true);
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runVerification(code);
  };

  const fillDemo = () => {
    setCode(demoAuthCode);
    runVerification(demoAuthCode);
  };

  return (
    <div>
      <section className="border-b border-border bg-foreground text-background">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 md:px-6 md:py-20 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
              <Fingerprint className="size-4" />
              UFFA Authenticity
            </p>
            <h1 className="mt-4 font-display text-6xl uppercase leading-[.88] md:text-8xl">
              {tr(language, "Verifica", "Verify", "Verifica")}
              <br />
              <span className="text-primary">
                {tr(language, "o teu par.", "your pair.", "tu par.")}
              </span>
            </h1>
            <p className="mt-5 max-w-2xl text-background/70">
              {tr(
                language,
                "Cada par vendido pela UFFA recebe um código de autenticidade único. Introduz o código para confirmar o produto, o tamanho, o número de série e a edição.",
                "Every pair sold by UFFA receives a unique authenticity code. Enter the code to confirm the product, size, serial number and edition.",
                "Cada par vendido por UFFA recibe un código de autenticidad único. Introduce el código para confirmar el producto, la talla, el número de serie y la edición.",
              )}
            </p>
            <div className="mt-7 flex flex-wrap gap-2 text-[11px] font-bold uppercase">
              <span className="flex items-center gap-2 border border-background/20 px-3 py-2">
                <ShieldCheck className="size-4 text-primary" />
                {tr(language, "Código único", "Unique code", "Código único")}
              </span>
              <span className="flex items-center gap-2 border border-background/20 px-3 py-2">
                <LockKeyhole className="size-4 text-primary" />
                {tr(language, "Sem dados pessoais", "No personal data", "Sin datos personales")}
              </span>
              <span className="flex items-center gap-2 border border-background/20 px-3 py-2">
                <BadgeCheck className="size-4 text-primary" />
                {tr(language, "Registo UFFA", "UFFA record", "Registro UFFA")}
              </span>
            </div>
          </div>
          <div className="hidden justify-self-end border border-background/15 p-6 lg:block">
            <p className="text-xs font-bold uppercase text-primary">
              {tr(
                language,
                "Exclusividade verificável",
                "Verifiable exclusivity",
                "Exclusividad verificable",
              )}
            </p>
            <p className="mt-3 max-w-xs text-sm text-background/70">
              {tr(
                language,
                "O código é gerado no checkout e associado a cada par. Pode ser verificado em qualquer momento, sem expor o comprador.",
                "The code is generated at checkout and linked to each pair. It can be verified at any time without exposing the buyer.",
                "El código se genera en el checkout y se asocia a cada par. Puede verificarse en cualquier momento sin exponer al comprador.",
              )}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
          <form onSubmit={submit} className="border border-border bg-card p-6 md:p-8">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center bg-primary text-primary-foreground">
                <Fingerprint className="size-5" />
              </span>
              <div>
                <h2 className="font-display text-3xl uppercase">
                  {tr(
                    language,
                    "Código de autenticidade",
                    "Authenticity code",
                    "Código de autenticidad",
                  )}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tr(
                    language,
                    "Encontras o código na etiqueta do par ou na confirmação da compra.",
                    "You'll find the code on the pair's tag or in your order confirmation.",
                    "Encuentras el código en la etiqueta del par o en la confirmación de la compra.",
                  )}
                </p>
              </div>
            </div>

            <div className="mt-7 space-y-2">
              <Label htmlFor="auth-code">
                {tr(language, "Código exclusivo", "Exclusive code", "Código exclusivo")}
              </Label>
              <Input
                id="auth-code"
                value={code}
                onChange={(event) => {
                  setCode(event.target.value);
                  if (checked) {
                    setChecked(false);
                    setResult(null);
                  }
                }}
                placeholder="UFFA-AUTH-XXXX-XXXX"
                autoComplete="off"
                spellCheck={false}
                className="h-14 rounded-none font-mono text-base uppercase tracking-wider"
                required
              />
              <p className="text-[11px] text-muted-foreground">
                {tr(
                  language,
                  "Formato UFFA-AUTH-XXXX-XXXX. Não distingue maiúsculas de minúsculas.",
                  "Format UFFA-AUTH-XXXX-XXXX. Case-insensitive.",
                  "Formato UFFA-AUTH-XXXX-XXXX. No distingue mayúsculas de minúsculas.",
                )}
              </p>
            </div>

            <Button type="submit" size="lg" className="mt-6 h-12 w-full rounded-none">
              <Search />
              {tr(
                language,
                "Verificar autenticidade",
                "Verify authenticity",
                "Verificar autenticidad",
              )}
            </Button>

            <div className="mt-5 border border-dashed border-primary bg-primary/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase text-primary">
                  {tr(language, "Código de demonstração", "Demo code", "Código de demostración")}
                </p>
                <span className="text-[10px] font-bold uppercase text-muted-foreground">
                  {tr(
                    language,
                    "Porto Rose Low · 39",
                    "Porto Rose Low · 39",
                    "Porto Rose Low · 39",
                  )}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <code className="font-mono text-sm font-bold">{demoAuthCode}</code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-none"
                  onClick={fillDemo}
                >
                  {tr(language, "Testar código", "Test code", "Probar código")}
                  <ArrowRight />
                </Button>
              </div>
            </div>
          </form>

          <aside className="border border-border bg-section p-6 md:p-8">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-primary">
              <ShieldCheck className="size-4" />
              {tr(language, "Como funciona", "How it works", "Cómo funciona")}
            </div>
            <h2 className="mt-3 font-display text-3xl uppercase">
              {tr(language, "Um par, um código.", "One pair, one code.", "Un par, un código.")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {tr(
                language,
                "A UFFA associa um código único a cada par vendido. É a tua prova digital de autenticidade e exclusividade.",
                "UFFA links a unique code to every pair sold. It's your digital proof of authenticity and exclusivity.",
                "UFFA asocia un código único a cada par vendido. Es tu prueba digital de autenticidad y exclusividad.",
              )}
            </p>
            <ol className="mt-5 space-y-4">
              {[
                {
                  title: tr(
                    language,
                    "Gerado no checkout",
                    "Generated at checkout",
                    "Generado en el checkout",
                  ),
                  text: tr(
                    language,
                    "Cada linha da encomenda recebe um código e um número de série.",
                    "Each order line receives a code and a serial number.",
                    "Cada línea del pedido recibe un código y un número de serie.",
                  ),
                },
                {
                  title: tr(language, "Associado ao par", "Linked to the pair", "Asociado al par"),
                  text: tr(
                    language,
                    "O código confirma produto, tamanho, edição e data de registo.",
                    "The code confirms product, size, edition and registration date.",
                    "El código confirma producto, talla, edición y fecha de registro.",
                  ),
                },
                {
                  title: tr(
                    language,
                    "Privado por design",
                    "Private by design",
                    "Privado por diseño",
                  ),
                  text: tr(
                    language,
                    "A verificação nunca revela nome, contacto ou morada do comprador.",
                    "Verification never reveals the buyer's name, contact or address.",
                    "La verificación nunca revela el nombre, contacto o dirección del comprador.",
                  ),
                },
              ].map((item, index) => (
                <li key={item.title} className="flex gap-3">
                  <span className="grid size-7 shrink-0 place-items-center bg-foreground text-xs font-bold text-background">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-bold">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-6 flex items-center gap-2 border-t border-border pt-4 text-[11px] text-muted-foreground">
              <LockKeyhole className="size-3.5 text-primary" />
              {tr(
                language,
                "Não mostramos dados pessoais do comprador.",
                "We don't show the buyer's personal data.",
                "No mostramos datos personales del comprador.",
              )}
            </div>
          </aside>
        </div>

        {checked && result && <ValidResult result={result} />}
        {checked && !result && <InvalidResult code={code} />}
      </section>

      <section className="border-t border-border bg-section">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 py-8 md:flex-row md:items-center md:px-6">
          <div>
            <p className="text-xs font-bold uppercase text-primary">
              {tr(language, "Já tens o código?", "Already have the code?", "¿Ya tienes el código?")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {tr(
                language,
                "Entra no portal para consultar todos os teus pares e códigos.",
                "Open the portal to see all your pairs and codes.",
                "Entra en el portal para consultar todos tus pares y códigos.",
              )}
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-none">
            <Link to="/rastreio">
              {tr(language, "A minha encomenda", "My order", "Mi pedido")}
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function ValidResult({ result }: { result: AuthVerification }) {
  const { language } = useShop();
  const { order, item, product } = result;

  return (
    <section className="mt-8 border border-emerald-600/30 bg-emerald-600/5">
      <div className="flex flex-col gap-4 border-b border-emerald-600/20 p-6 md:flex-row md:items-center md:justify-between md:p-8">
        <div className="flex items-center gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-emerald-600 text-white">
            <ShieldCheck className="size-6" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase text-emerald-700">
              {tr(
                language,
                "Certificado autêntico",
                "Authentic certificate",
                "Certificado auténtico",
              )}
            </p>
            <h2 className="mt-1 font-display text-3xl uppercase">{product.name}</h2>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 self-start border border-emerald-600/30 bg-background px-3 py-1.5 text-xs font-bold uppercase text-emerald-700">
          <BadgeCheck className="size-4" />
          UFFA Verified
        </span>
      </div>

      <div className="grid gap-6 p-6 md:grid-cols-[240px_1fr] md:p-8">
        <div>
          <img
            src={product.image}
            alt={product.name}
            width={1200}
            height={900}
            className="aspect-square w-full bg-product object-cover"
          />
          <p className="mt-2 text-[10px] font-bold uppercase text-muted-foreground">
            {categoryNames[product.category][language]} · {tr(language, "Tamanho", "Size", "Talla")}{" "}
            {item.size}
          </p>
        </div>
        <div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Detail
              label={tr(language, "Código exclusivo", "Exclusive code", "Código exclusivo")}
              value={item.authCode}
              mono
              copy
            />
            <Detail
              label={tr(language, "Número de série", "Serial number", "Número de serie")}
              value={item.serial}
              mono
            />
            <Detail label={tr(language, "Tamanho", "Size", "Talla")} value={String(item.size)} />
            <Detail
              label={tr(language, "Edição", "Edition", "Edición")}
              value={categoryNames[product.category][language]}
            />
            <Detail
              label={tr(language, "Registado em", "Registered on", "Registrado el")}
              value={formatDate(order.createdAt, language)}
            />
            <Detail
              label={tr(language, "Emitido por", "Issued by", "Emitido por")}
              value="UFFA Store · Porto"
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild variant="outline" className="rounded-none">
              <Link to="/produto/$productId" params={{ productId: product.id }}>
                {tr(language, "Ver produto", "View product", "Ver producto")}
                <ExternalLink />
              </Link>
            </Button>
            <Button asChild variant="ghost" className="rounded-none">
              <Link to="/rastreio">
                {tr(language, "A minha encomenda", "My order", "Mi pedido")}
                <ArrowRight />
              </Link>
            </Button>
          </div>

          <div className="mt-5 flex items-start gap-2 border-t border-emerald-600/20 pt-4 text-[11px] text-muted-foreground">
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
            {tr(
              language,
              "Este par foi registado pela UFFA Store. A verificação não expõe dados pessoais do comprador.",
              "This pair was registered by UFFA Store. Verification does not expose the buyer's personal data.",
              "Este par fue registrado por UFFA Store. La verificación no expone datos personales del comprador.",
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function InvalidResult({ code }: { code: string }) {
  const { language } = useShop();
  return (
    <section className="mt-8 border border-destructive/30 bg-destructive/5 p-6 md:p-8">
      <div className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-destructive text-destructive-foreground">
          <XCircle className="size-6" />
        </span>
        <div>
          <p className="text-xs font-bold uppercase text-destructive">
            {tr(language, "Verificação falhada", "Verification failed", "Verificación fallida")}
          </p>
          <h2 className="mt-1 font-display text-3xl uppercase">
            {tr(language, "Código inválido", "Invalid code", "Código inválido")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {tr(
              language,
              "Não encontrámos nenhum par associado a este código. Confirma se copiaste o código completo ou fala com a equipa UFFA.",
              "We couldn't find any pair linked to this code. Check that you copied the full code or talk to the UFFA team.",
              "No encontramos ningún par asociado a este código. Comprueba que copiaste el código completo o habla con el equipo UFFA.",
            )}
          </p>
          {code.trim() && (
            <p className="mt-3 text-xs text-muted-foreground">
              {tr(language, "Código introduzido", "Entered code", "Código introducido")}:{" "}
              <code className="font-mono">{code.trim().toUpperCase()}</code>
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild variant="outline" className="rounded-none">
              <a href="mailto:atendimento@uffastore.pt?subject=Verifica%C3%A7%C3%A3o%20de%20autenticidade">
                {tr(language, "Falar com a UFFA", "Contact UFFA", "Hablar con UFFA")}
                <ArrowRight />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Detail({
  label,
  value,
  mono = false,
  copy = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copy?: boolean;
}) {
  const { language } = useShop();
  return (
    <div className="border border-emerald-600/15 bg-background p-3">
      <p className="text-[10px] font-bold uppercase text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <p className={mono ? "font-mono text-xs font-bold" : "text-sm font-semibold"}>{value}</p>
        {copy && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label={tr(language, "Copiar", "Copy", "Copiar")}
            onClick={() => copyText(value, language, label)}
          >
            <Copy />
          </Button>
        )}
      </div>
    </div>
  );
}
