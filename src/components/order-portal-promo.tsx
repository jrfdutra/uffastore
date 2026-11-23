import { Link } from "@tanstack/react-router";
import { ArrowRight, Mail, Navigation, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { tr } from "@/lib/i18n";
import { useShop } from "@/lib/shop-context";

export function OrderPortalPromo() {
  const { language } = useShop();

  return (
    <section className="border border-border bg-foreground text-background">
      <div className="grid lg:grid-cols-2">
        <div className="border-b border-background/15 p-8 md:p-12 lg:border-b-0 lg:border-r">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
            <PackageSearch className="size-4" />
            {tr(language, "Depois da compra", "After checkout", "Después de la compra")}
          </p>
          <h2 className="mt-3 font-display text-5xl uppercase leading-[.9] md:text-6xl">
            {tr(language, "O teu par", "Your pair", "Tu par")}
            <br />
            <span className="text-primary">
              {tr(language, "não desaparece.", "doesn't disappear.", "no desaparece.")}
            </span>
          </h2>
          <p className="mt-4 max-w-md text-sm text-background/70">
            {tr(
              language,
              "Recebeste o e-mail de envio? Introduz o código de rastreio e abre logo a pesquisa do CTT. Tens também um link direto para os detalhes da encomenda.",
              "Got the shipping email? Enter the tracking code and open the CTT search straight away. You also have a direct link to your order details.",
              "¿Recibiste el correo de envío? Introduce el código de seguimiento y abre enseguida la búsqueda de CTT. También tienes un enlace directo a los detalles.",
            )}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild className="rounded-none">
              <Link to="/rastreio">
                {tr(language, "A minha encomenda", "My order", "Mi pedido")}
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2">
          <div className="border-b border-background/15 p-8 sm:border-b-0 sm:border-r md:p-10">
            <Navigation className="size-7 text-primary" />
            <h3 className="mt-4 font-display text-2xl uppercase">
              {tr(language, "Rastreio direto", "Direct tracking", "Seguimiento directo")}
            </h3>
            <p className="mt-2 text-sm text-background/60">
              {tr(
                language,
                "Um código e abres a pesquisa oficial do CTT.",
                "One code and you open the official CTT search.",
                "Un código y abres la búsqueda oficial de CTT.",
              )}
            </p>
          </div>
          <div className="p-8 md:p-10">
            <Mail className="size-7 text-primary" />
            <h3 className="mt-4 font-display text-2xl uppercase">
              {tr(language, "Precisas de ajuda?", "Need help?", "¿Necesitas ayuda?")}
            </h3>
            <p className="mt-2 text-sm text-background/60">
              {tr(
                language,
                "Fala com a equipa UFFA sobre prazos, recolhas ou qualquer detalhe da tua encomenda.",
                "Talk to the UFFA team about timings, pickups or any detail of your order.",
                "Habla con el equipo UFFA sobre plazos, recogidas o cualquier detalle de tu pedido.",
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
