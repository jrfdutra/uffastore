import { useState } from "react";
import { ArrowRight, CheckCircle2, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BRANDS, brandNames } from "@/lib/brands";
import { FOTO_PADRAO } from "@/lib/consolidated-catalog";
import { tr } from "@/lib/i18n";
import { PRODUCT_REQUEST_LIMITS, PRODUCT_REQUEST_PATH } from "@/lib/product-request-constants";
import { useShop } from "@/lib/shop-context";

const REASON_MESSAGES: Record<string, string> = {
  missing_fields: "Preenche todos os campos para continuar.",
  invalid_email: "Introduz um e-mail válido.",
  invalid_phone: "Introduz um número de telemóvel válido.",
  payload_too_large: "A mensagem é demasiado grande.",
  email_failed: "Não foi possível enviar agora. Escreve para atendimento@uffastore.pt.",
  internal_error: "Ocorreu um erro. Tenta novamente ou escreve para atendimento@uffastore.pt.",
};

/** Cartão usado nas marcas e na lista de desejo para pedir um produto não encontrado. */
export function ProductRequestCard() {
  const { language } = useShop();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [product, setProduct] = useState("");
  const [brand, setBrand] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const title = tr(
    language,
    "Não encontrou o que procura e comenta conosco.",
    "Didn't find what you're looking for? Tell us.",
    "¿No encontraste lo que buscas? Cuéntanos.",
  );

  function resetForm() {
    setDescription("");
    setProduct("");
    setBrand("");
    setEmail("");
    setPhone("");
    setSubmitted(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    if (!description.trim() || !product.trim() || !brand.trim() || !email.trim() || !phone.trim()) {
      toast.error(REASON_MESSAGES["missing_fields"]!);
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(PRODUCT_REQUEST_PATH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, product, brand, email, phone }),
      });
      const result = (await response.json()) as { success?: boolean; reason?: string };
      if (!response.ok || !result.success) {
        const message = REASON_MESSAGES[result.reason ?? ""] ?? REASON_MESSAGES["internal_error"]!;
        toast.error(message);
        return;
      }
      setSubmitted(true);
      toast.success(
        tr(
          language,
          "Pedido enviado. Vamos entrar em contacto!",
          "Request sent. We'll get in touch!",
          "Pedido enviado. ¡Nos pondremos en contacto!",
        ),
      );
    } catch {
      toast.error(REASON_MESSAGES["internal_error"]!);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={title}
          className="group relative block aspect-[4/5] w-full cursor-pointer overflow-hidden bg-primary text-left"
        >
          <img
            src={FOTO_PADRAO}
            alt=""
            width={1200}
            height={1500}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-category-overlay" />
          <MessageCircle className="absolute left-1/2 top-1/2 size-14 -translate-x-1/2 -translate-y-1/2 text-hero-foreground transition duration-500 group-hover:scale-110" />
          <span className="absolute bottom-4 left-4 right-4 font-display text-2xl uppercase leading-tight text-hero-foreground md:text-3xl">
            {title}
          </span>
          <ArrowRight className="absolute bottom-4 right-4 size-5 text-hero-foreground" />
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none sm:rounded-none">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl uppercase">{title}</DialogTitle>
          <DialogDescription>
            {tr(
              language,
              "Diz-nos o modelo, a marca e como te contactar. Enviamos o pedido para a equipa UFFA.",
              "Tell us the model, the brand and how to reach you. We'll send your request to the UFFA team.",
              "Dinos el modelo, la marca y cómo contactarte. Enviamos tu petición al equipo UFFA.",
            )}
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <CheckCircle2 className="size-12 text-primary" />
            <p className="font-display text-2xl uppercase">
              {tr(language, "Pedido enviado", "Request sent", "Pedido enviado")}
            </p>
            <p className="text-sm text-muted-foreground">
              {tr(
                language,
                "Obrigado! A UFFA entra em contacto contigo assim que possível.",
                "Thanks! The UFFA team will get in touch as soon as possible.",
                "¡Gracias! El equipo UFFA se pondrá en contacto contigo lo antes posible.",
              )}
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="rounded-none" onClick={resetForm}>
                {tr(language, "Enviar outro", "Send another", "Enviar otro")}
              </Button>
              <Button type="button" className="rounded-none" onClick={() => setOpen(false)}>
                {tr(language, "Fechar", "Close", "Cerrar")}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="product-request-description" className="text-sm font-medium">
                {tr(language, "O que procuras", "What you're looking for", "Lo que buscas")} *
              </label>
              <Textarea
                id="product-request-description"
                required
                maxLength={PRODUCT_REQUEST_LIMITS.description}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={tr(
                  language,
                  "Descreve o modelo, a cor, o tamanho ou qualquer detalhe que ajude.",
                  "Describe the model, colour, size or any helpful detail.",
                  "Describe el modelo, el color, la talla o cualquier detalle útil.",
                )}
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="product-request-product" className="text-sm font-medium">
                {tr(language, "Produto / modelo", "Product / model", "Producto / modelo")} *
              </label>
              <Input
                id="product-request-product"
                required
                maxLength={PRODUCT_REQUEST_LIMITS.product}
                value={product}
                onChange={(event) => setProduct(event.target.value)}
                placeholder={tr(language, "Ex.: Nike Dunk", "E.g. Nike Dunk", "Ej.: Nike Dunk")}
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="product-request-brand" className="text-sm font-medium">
                {tr(language, "Marca", "Brand", "Marca")} *
              </label>
              <Input
                id="product-request-brand"
                required
                list="product-request-brands"
                maxLength={PRODUCT_REQUEST_LIMITS.brand}
                value={brand}
                onChange={(event) => setBrand(event.target.value)}
                placeholder={tr(language, "Ex.: Nike", "E.g. Nike", "Ej.: Nike")}
              />
              <datalist id="product-request-brands">
                {BRANDS.map((item) => (
                  <option key={item} value={brandNames[item][language]} />
                ))}
              </datalist>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <label htmlFor="product-request-email" className="text-sm font-medium">
                  {tr(language, "E-mail", "Email", "Correo electrónico")} *
                </label>
                <Input
                  id="product-request-email"
                  type="email"
                  required
                  maxLength={PRODUCT_REQUEST_LIMITS.email}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nome@exemplo.pt"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="product-request-phone" className="text-sm font-medium">
                  {tr(language, "Telemóvel", "Phone", "Teléfono")} *
                </label>
                <Input
                  id="product-request-phone"
                  type="tel"
                  required
                  maxLength={PRODUCT_REQUEST_LIMITS.phone}
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+351 912 345 678"
                />
              </div>
            </div>

            <Button type="submit" disabled={busy} className="mt-2 h-11 rounded-none">
              {busy
                ? tr(language, "A enviar…", "Sending…", "Enviando…")
                : tr(language, "Enviar pedido", "Send request", "Enviar petición")}
              <Send className="ml-2 size-4" />
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
