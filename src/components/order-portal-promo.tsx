import { Link } from "@tanstack/react-router";
import { ArrowRight, LockKeyhole, PackageSearch, ShieldCheck } from "lucide-react";
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
            <LockKeyhole className="size-4" />
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
              "Entra no portal com o número da encomenda, o contacto e o código exclusivo. Acompanha o envio ou a recolha e confirma a receção.",
              "Open the portal with your order number, contact and exclusive code. Track shipping or pickup and confirm receipt.",
              "Entra en el portal con el número de pedido, el contacto y el código exclusivo. Sigue el envío o la recogida y confirma la recepción.",
            )}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild className="rounded-none">
              <Link to="/rastreio">
                {tr(language, "A minha encomenda", "My order", "Mi pedido")}
                <ArrowRight />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-none border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background"
            >
              <Link to="/verificar">
                {tr(
                  language,
                  "Verificar autenticidade",
                  "Verify authenticity",
                  "Verificar autenticidad",
                )}
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2">
          <div className="border-b border-background/15 p-8 sm:border-b-0 sm:border-r md:p-10">
            <PackageSearch className="size-7 text-primary" />
            <h3 className="mt-4 font-display text-2xl uppercase">
              {tr(language, "Acompanha o envio", "Track the delivery", "Sigue el envío")}
            </h3>
            <p className="mt-2 text-sm text-background/60">
              {tr(
                language,
                "Estado, transportador, rastreio e previsão num só painel.",
                "Status, carrier, tracking and estimate in one panel.",
                "Estado, transportista, seguimiento y previsión en un solo panel.",
              )}
            </p>
          </div>
          <div className="p-8 md:p-10">
            <ShieldCheck className="size-7 text-primary" />
            <h3 className="mt-4 font-display text-2xl uppercase">
              {tr(
                language,
                "Prova de autenticidade",
                "Proof of authenticity",
                "Prueba de autenticidad",
              )}
            </h3>
            <p className="mt-2 text-sm text-background/60">
              {tr(
                language,
                "Cada par tem um código único, verificável e privado.",
                "Every pair has a unique, verifiable and private code.",
                "Cada par tiene un código único, verificable y privado.",
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
