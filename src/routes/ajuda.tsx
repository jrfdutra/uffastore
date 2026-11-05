import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { HelpCircle, Package, RefreshCw, Mail, MapPin, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useShop } from "@/lib/shop-context";
import { tr } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/ajuda")({
  head: () => ({
    meta: [
      { title: "Ajuda e Contactos — Uffa Store" },
      { name: "description", content: "Perguntas frequentes, pedidos, entregas, devoluções e contactos da Uffa Store no Porto." },
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
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error(tr(language, "Por favor preenche os campos obrigatórios.", "Please fill in required fields.", "Por favor completa los campos obligatorios."));
      return;
    }
    setSubmitted(true);
    toast.success(tr(language, "Mensagem enviada com sucesso!", "Message sent successfully!", "¡Mensaje enviado con éxito!"));
  };

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
            "Tudo o que precisas de saber sobre encomendas, entregas, trocas e suporte na UFFA Store.",
            "Everything you need to know about orders, shipping, exchanges and support at UFFA Store.",
            "Todo lo que necesitas saber sobre pedidos, envíos, cambios y soporte en UFFA Store."
          )}
        </p>
      </div>

      <div className="mt-16 grid gap-12 lg:grid-cols-3">
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
              "Todas as encomendas são verificadas no Porto e preparadas com rigor. Podes escolher recolha em mãos grátis na zona do Porto ou envio expresso. O código de rastreio é disponibilizado após confirmação.",
              "All orders are verified in Porto and carefully prepared. You can choose free hand pickup in the Porto area or express shipping. Tracking is provided upon confirmation.",
              "Todos los pedidos se verifican en Oporto y se preparan con rigor. Puedes elegir recogida en mano gratuita en Oporto o envío urgente."
            )}
          </p>
          <ul className="space-y-2 text-xs text-muted-foreground list-disc pl-4">
            <li>Recolha em mãos: Grátis (Porto)</li>
            <li>Envio expresso CTT: 7,00 €</li>
            <li>Acompanhamento online via Portal de Encomendas</li>
          </ul>
        </div>

        {/* Section B: Devoluções e Reembolsos */}
        <div className="border border-border bg-card p-6 md:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <RefreshCw className="size-6 text-primary" />
            <h2 className="font-display text-2xl uppercase">
              {tr(language, "2. Devoluções e Reembolsos", "2. Returns & Refunds", "2. Devoluciones y Reembolsos")}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {tr(
              language,
              "A UFFA Store pratica uma política rigorosa de autenticidade. Salvo defeito de fabrico comprovado, não efetuamos trocas nem devoluções por escolha de tamanho ou arrependimento. Verifica sempre o guia de tamanhos antes de comprar.",
              "UFFA Store maintains a strict authenticity policy. Unless verified manufacturing defect, we do not offer exchanges or returns for size choice or change of mind.",
              "UFFA Store mantiene una política estricta de autenticidad. Salvo defecto de fabricación comprobado, no realizamos cambios ni devoluciones."
            )}
          </p>
          <ul className="space-y-2 text-xs text-muted-foreground list-disc pl-4">
            <li>Sem trocas nem devoluções por tamanho</li>
            <li>Artigos com defeito: contacto em 48h</li>
            <li>Reembolsos processados via Shopify Payments</li>
          </ul>
        </div>

        {/* Section C: Contactos Rápidos */}
        <div className="border border-border bg-card p-6 md:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="size-6 text-primary" />
            <h2 className="font-display text-2xl uppercase">
              {tr(language, "3. Canais Oficiais", "3. Official Channels", "3. Canales Oficiales")}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {tr(
              language,
              "Entra em contacto direto com a nossa equipa de suporte através do email oficial ou do formulário abaixo.",
              "Get in touch directly with our support team via official email or the form below.",
              "Ponte en contacto directo con nuestro equipo de soporte a través del correo oficial o formulario."
            )}
          </p>
          <div className="space-y-3 text-sm">
            <p className="flex items-center gap-2 font-semibold">
              <Mail className="size-4 text-primary" />
              atendimento@uffastore.pt
            </p>
            <p className="flex items-center gap-2 text-muted-foreground text-xs">
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
            "Envía tu pregunta y responderemos lo antes posible."
          )}
        </p>

        {submitted ? (
          <div className="mt-8 text-center py-12 border-2 border-dashed border-primary bg-primary/5 p-6">
            <CheckCircle2 className="mx-auto size-12 text-primary" />
            <h3 className="mt-3 font-display text-2xl uppercase">
              {tr(language, "Mensagem Enviada!", "Message Sent!", "¡Mensaje Enviado!")}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {tr(
                language,
                "Obrigado pelo contacto. A nossa equipa responderá para atendimento@uffastore.pt em breve.",
                "Thank you for contacting. Our team will reply to your email shortly.",
                "Gracias por contactar. Nuestro equipo responderá pronto."
              )}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSubmitted(false);
                setName("");
                setEmail("");
                setOrderNo("");
                setSubject("");
                setMessage("");
              }}
              className="mt-6 rounded-none"
            >
              {tr(language, "Enviar outra mensagem", "Send another message", "Enviar otro mensaje")}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase mb-2">
                  {tr(language, "Nome *", "Name *", "Nombre *")}
                </label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="O teu nome"
                  className="rounded-none h-11"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-2">
                  {tr(language, "Email *", "Email *", "Correo electrónico *")}
                </label>
                <Input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="o.teu@email.com"
                  className="rounded-none h-11"
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase mb-2">
                  {tr(language, "Número de Encomenda (opcional)", "Order Number (optional)", "Número de Pedido (opcional)")}
                </label>
                <Input
                  value={orderNo}
                  onChange={(e) => setOrderNo(e.target.value)}
                  placeholder="UFFA-..."
                  className="rounded-none h-11"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-2">
                  {tr(language, "Assunto", "Subject", "Asunto")}
                </label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ex: Dúvida sobre entrega"
                  className="rounded-none h-11"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-2">
                {tr(language, "Mensagem *", "Message *", "Mensaje *")}
              </label>
              <Textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escreve aqui a tua mensagem..."
                className="rounded-none resize-none"
              />
            </div>

            <Button type="submit" size="lg" className="w-full h-12 rounded-none font-bold uppercase">
              <Send className="size-4 mr-2" />
              {tr(language, "Enviar mensagem", "Send message", "Enviar mensaje")}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
