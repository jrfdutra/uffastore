import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { HelpCircle, Package, Mail, MapPin, Send, CheckCircle2, Instagram, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useShop } from "@/lib/shop-context";
import { tr } from "@/lib/i18n";
import { toast } from "sonner";
import { CONTACT_MAX_IMAGE_BYTES, CONTACT_PATH, type ContactReason } from "@/lib/contact-constants";

export const Route = createFileRoute("/ajuda")({
  head: () => ({
    meta: [
      { title: "Ajuda e Contactos — Uffa Store" },
      {
        name: "description",
        content: "Perguntas frequentes, pedidos, entregas e contactos da Uffa Store no Porto.",
      },
      { property: "og:title", content: "Ajuda e Contactos — Uffa Store" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/ajuda" }],
  }),
  component: HelpPage,
});

function HelpPage() {
  const { language } = useShop();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [orderNo, setOrderNo] = useState("");
  const [reason, setReason] = useState<ContactReason>("geral");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageName, setImageName] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function clearImage() {
    setImageData(null);
    setImageName("");
    setPreview(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  function resetForm() {
    setSubmitted(false);
    setName("");
    setEmail("");
    setOrderNo("");
    setReason("geral");
    setSubject("");
    setMessage("");
    setServerError(null);
    clearImage();
  }

  /** Reduz a foto a JPEG para caber no limite da Vercel antes de ir no e-mail. */
  async function prepareImage(file: File): Promise<{ name: string; data: string }> {
    const source = await createImageBitmap(file);
    try {
      const scale = Math.min(1, 1600 / Math.max(source.width, source.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(source.width * scale));
      canvas.height = Math.max(1, Math.round(source.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("canvas indisponível");
      context.drawImage(source, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => (result ? resolve(result) : reject(new Error("compressão falhou"))),
          "image/jpeg",
          0.82,
        );
      });
      if (blob.size > CONTACT_MAX_IMAGE_BYTES) throw new Error("imagem demasiado grande");

      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
        reader.onerror = () => reject(new Error("leitura falhou"));
        reader.readAsDataURL(blob);
      });
      return { name: file.name.replace(/\.[^.]+$/, "") || "fotografia", data };
    } finally {
      source.close();
    }
  }

  async function onImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      clearImage();
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error(
        tr(
          language,
          "Formato não suportado. Usa JPG, PNG ou WebP.",
          "Unsupported format. Please use JPG, PNG or WebP.",
          "Formato no compatible. Usa JPG, PNG o WebP.",
        ),
      );
      clearImage();
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      toast.error(
        tr(
          language,
          "A imagem é demasiado grande. Escolhe uma foto até 12 MB.",
          "The image is too large. Choose a photo up to 12 MB.",
          "La imagen es demasiado grande. Elige una foto de hasta 12 MB.",
        ),
      );
      clearImage();
      return;
    }
    try {
      const prepared = await prepareImage(file);
      setImageData(prepared.data);
      setImageName(prepared.name);
      setPreview(`data:image/jpeg;base64,${prepared.data}`);
      setServerError(null);
    } catch {
      toast.error(
        tr(
          language,
          "Não foi possível preparar a imagem. Tenta outra fotografia.",
          "We could not prepare the image. Please try another photo.",
          "No pudimos preparar la imagen. Prueba otra foto.",
        ),
      );
      clearImage();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error(
        tr(
          language,
          "Por favor preenche os campos obrigatórios.",
          "Please fill in required fields.",
          "Por favor completa los campos obligatorios.",
        ),
      );
      return;
    }
    if (reason === "troca_defeito" && !imageData) {
      toast.error(
        tr(
          language,
          "Para troca ou defeito, anexa uma fotografia do produto.",
          "For an exchange or defect, please attach a photo of the product.",
          "Para un cambio o defecto, adjunta una foto del producto.",
        ),
      );
      return;
    }

    setBusy(true);
    setServerError(null);
    try {
      const response = await fetch(CONTACT_PATH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          orderNo,
          reason,
          subject,
          message,
          image: imageData ? { name: imageName, type: "image/jpeg", data: imageData } : null,
        }),
      });
      const data = (await response.json()) as { success?: boolean; reason?: string };
      if (!response.ok || !data.success) {
        throw new Error(
          data.reason === "email_failed" || data.reason === "contact_not_configured"
            ? tr(
                language,
                "Não foi possível enviar a mensagem. Escreve-nos para atendimento@uffastore.pt com a fotografia em anexo.",
                "We could not send your message. Email us at atendimento@uffastore.pt with the photo attached.",
                "No pudimos enviar el mensaje. Escríbenos a atendimento@uffastore.pt con la foto adjunta.",
              )
            : tr(
                language,
                "Não foi possível enviar a mensagem. Tenta novamente.",
                "We could not send your message. Please try again.",
                "No pudimos enviar el mensaje. Inténtalo de nuevo.",
              ),
        );
      }
      setSubmitted(true);
      toast.success(
        tr(
          language,
          "Mensagem enviada com sucesso!",
          "Message sent successfully!",
          "¡Mensaje enviado con éxito!",
        ),
      );
    } catch (caught) {
      const text =
        caught instanceof Error
          ? caught.message
          : tr(
              language,
              "Não foi possível enviar a mensagem. Tenta novamente.",
              "We could not send your message. Please try again.",
              "No pudimos enviar el mensaje. Inténtalo de nuevo.",
            );
      setServerError(text);
      toast.error(text);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
      <div className="text-center max-w-2xl mx-auto">
        <HelpCircle className="mx-auto size-12 text-primary" />
        <h1 className="mt-4 font-display text-5xl uppercase md:text-7xl">
          {tr(language, "Ajuda e Contactos", "Help & Contacts", "Ayuda y Contactos")}
        </h1>
        <p className="mt-3 text-muted-foreground text-sm md:text-base">
          {tr(
            language,
            "Tudo o que precisas de saber sobre encomendas, entregas e suporte na UFFA Store.",
            "Everything you need to know about orders, shipping and support at UFFA Store.",
            "Todo lo que necesitas saber sobre pedidos, envíos y soporte en UFFA Store.",
          )}
        </p>
      </div>

      <div className="mt-16 grid gap-12 lg:grid-cols-2">
        {/* Section A: Pedidos e Entregas */}
        <div className="border border-border bg-card p-6 md:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <Package className="size-6 text-primary" />
            <h2 className="font-display text-2xl uppercase">
              {tr(language, "1. Pedidos e Entregas", "1. Orders & Shipping", "1. Pedidos y Envíos")}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {tr(
              language,
              "Todas as encomendas são preparadas no Porto com rigor. Podes escolher recolha em mãos grátis na zona do Porto ou envio expresso. O código de rastreio é disponibilizado após confirmação.",
              "All orders are carefully prepared in Porto. You can choose free hand pickup in the Porto area or express shipping. Tracking is provided upon confirmation.",
              "Todos los pedidos se preparan en Oporto con rigor. Puedes elegir recogida en mano gratuita en Oporto o envío urgente.",
            )}
          </p>
          <ul className="space-y-2 text-xs text-muted-foreground list-disc pl-4">
            <li>
              {tr(
                language,
                "Recolha em mãos: Grátis (Porto)",
                "Hand pickup: Free (Porto)",
                "Recogida en mano: Gratis (Oporto)",
              )}
            </li>
            <li>
              {tr(
                language,
                "Portugal Continental e Ilhas: 8,94 €",
                "Portugal Mainland & Islands: €8.94",
                "Portugal Continental e Islas: 8,94 €",
              )}
            </li>
            <li>
              {tr(
                language,
                "União Europeia: 24,00 € · Suíça: 34,00 €",
                "European Union: €24.00 · Switzerland: €34.00",
                "Unión Europea: 24,00 € · Suiza: 34,00 €",
              )}
            </li>
            <li>
              {tr(
                language,
                "Acompanhamento online via Portal de Encomendas",
                "Online tracking via Order Portal",
                "Seguimiento online vía Portal de Pedidos",
              )}
            </li>
          </ul>
        </div>

        {/* Section B: Contactos Rápidos */}
        <div className="border border-border bg-card p-6 md:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="size-6 text-primary" />
            <h2 className="font-display text-2xl uppercase">
              {tr(language, "2. Canais Oficiais", "2. Official Channels", "2. Canales Oficiales")}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {tr(
              language,
              "Entra em contacto direto com a nossa equipa de suporte através do email oficial ou do formulário abaixo.",
              "Get in touch directly with our support team via official email or the form below.",
              "Ponte en contacto directo con nuestro equipo de soporte a través del correo oficial o formulario.",
            )}
          </p>
          <div className="space-y-3 text-sm">
            <p className="flex items-center gap-2 font-semibold">
              <Mail className="size-4 text-primary" />
              atendimento@uffastore.pt
            </p>
            <a
              href="https://instagram.com/uffastore.legit"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 font-semibold hover:text-primary transition"
            >
              <Instagram className="size-4 text-primary" />
              @uffastore.legit
            </a>
            <p className="flex items-center gap-2 font-semibold">
              <MapPin className="size-4 text-primary" />
              Porto, Portugal
            </p>
          </div>
        </div>
      </div>

      {/* Contact Form Section */}
      <div className="mt-16 mx-auto max-w-3xl border border-border bg-card p-8 md:p-12">
        <h2 className="font-display text-3xl uppercase text-center">
          {tr(language, "Contacte-nos", "Contact Us", "Contáctenos")}
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {tr(
            language,
            "Envia a tua questão e responderemos o mais breve possível.",
            "Send your question and we will reply as soon as possible.",
            "Envía tu pregunta y responderemos lo antes posible.",
          )}
        </p>

        {submitted ? (
          <div className="mt-8 text-center py-12 border-2 border-dashed border-primary bg-primary/15 p-6">
            <CheckCircle2 className="mx-auto size-12 text-primary" />
            <h3 className="mt-3 font-display text-2xl uppercase">
              {tr(language, "Mensagem Enviada!", "Message Sent!", "¡Mensaje Enviado!")}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {tr(
                language,
                "Obrigado pelo contacto. A nossa equipa responderá para atendimento@uffastore.pt em breve.",
                "Thank you for contacting. Our team will reply to your email shortly.",
                "Gracias por contactar. Nuestro equipo responderá pronto.",
              )}
            </p>
            <Button variant="outline" onClick={resetForm} className="mt-6 rounded-none">
              {tr(language, "Enviar outra mensagem", "Send another message", "Enviar otro mensaje")}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-name" className="block text-xs font-bold uppercase mb-2">
                  {tr(language, "Nome *", "Name *", "Nombre *")}
                </label>
                <Input
                  id="contact-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="O teu nome"
                  className="rounded-none h-11"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="block text-xs font-bold uppercase mb-2">
                  {tr(language, "Email *", "Email *", "Correo electrónico *")}
                </label>
                <Input
                  id="contact-email"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="o.teu@email.com"
                  className="rounded-none h-11"
                />
              </div>
            </div>

            <div>
              <label htmlFor="contact-reason" className="block text-xs font-bold uppercase mb-2">
                {tr(language, "Motivo *", "Reason *", "Motivo *")}
              </label>
              <select
                id="contact-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value as ContactReason)}
                className="h-11 w-full rounded-none border border-input bg-background px-3 text-sm"
              >
                <option value="geral">
                  {tr(language, "Dúvida geral", "General question", "Duda general")}
                </option>
                <option value="troca_defeito">
                  {tr(
                    language,
                    "Troca ou defeito no produto",
                    "Exchange or product defect",
                    "Cambio o defecto del producto",
                  )}
                </option>
                <option value="encomenda">
                  {tr(language, "Encomenda e entrega", "Order and delivery", "Pedido y entrega")}
                </option>
                <option value="outro">{tr(language, "Outro", "Other", "Otro")}</option>
              </select>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-order" className="block text-xs font-bold uppercase mb-2">
                  {tr(
                    language,
                    "Número de Encomenda (opcional)",
                    "Order Number (optional)",
                    "Número de Pedido (opcional)",
                  )}
                </label>
                <Input
                  id="contact-order"
                  value={orderNo}
                  onChange={(e) => setOrderNo(e.target.value)}
                  placeholder="UFFA-..."
                  className="rounded-none h-11"
                />
              </div>
              <div>
                <label htmlFor="contact-subject" className="block text-xs font-bold uppercase mb-2">
                  {tr(language, "Assunto", "Subject", "Asunto")}
                </label>
                <Input
                  id="contact-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ex: Dúvida sobre entrega"
                  className="rounded-none h-11"
                />
              </div>
            </div>

            <div>
              <label htmlFor="contact-message" className="block text-xs font-bold uppercase mb-2">
                {tr(language, "Mensagem *", "Message *", "Mensaje *")}
              </label>
              <Textarea
                id="contact-message"
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escreve aqui a tua mensagem..."
                className="rounded-none resize-none"
              />
            </div>

            <div className="border border-dashed border-border bg-background/50 p-5">
              <label htmlFor="contact-image" className="block text-xs font-bold uppercase">
                {tr(
                  language,
                  reason === "troca_defeito" ? "Fotografia do produto *" : "Fotografia (opcional)",
                  reason === "troca_defeito" ? "Product photo *" : "Photo (optional)",
                  reason === "troca_defeito" ? "Foto del producto *" : "Foto (opcional)",
                )}
              </label>
              <p className="mt-1 text-xs text-muted-foreground">
                {tr(
                  language,
                  "Para trocas ou defeitos, anexa uma foto do produto. JPG, PNG ou WebP até 12 MB; a imagem é reduzida automaticamente.",
                  "For exchanges or defects, attach a photo of the product. JPG, PNG or WebP up to 12 MB; the image is resized automatically.",
                  "Para cambios o defectos, adjunta una foto del producto. JPG, PNG o WebP hasta 12 MB; la imagen se reduce automáticamente.",
                )}
              </p>
              <input
                id="contact-image"
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onImageChange}
                aria-label={tr(
                  language,
                  "Selecionar fotografia do produto",
                  "Select product photo",
                  "Seleccionar foto del producto",
                )}
                className="mt-3 block w-full text-xs file:mr-4 file:border-0 file:bg-foreground file:px-4 file:py-2 file:text-xs file:font-bold file:uppercase file:text-background"
              />
              {preview && (
                <div className="mt-4 flex items-start gap-3">
                  <img
                    src={preview}
                    alt={tr(language, "Pré-visualização", "Preview", "Vista previa")}
                    className="size-20 border border-border object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{imageName}</p>
                    <button
                      type="button"
                      onClick={clearImage}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-bold uppercase text-primary hover:underline"
                    >
                      <X className="size-3" />
                      {tr(language, "Remover foto", "Remove photo", "Quitar foto")}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {serverError && (
              <p role="alert" className="border border-destructive bg-destructive/10 p-3 text-sm">
                {serverError}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={busy}
              className="w-full h-12 rounded-none font-bold uppercase"
            >
              <Send className="size-4 mr-2" />
              {busy
                ? tr(language, "A enviar...", "Sending...", "Enviando...")
                : tr(language, "Enviar mensagem", "Send message", "Enviar mensaje")}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
