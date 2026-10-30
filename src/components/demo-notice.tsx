import { useEffect, useState } from "react";
import { ArrowRight, Construction, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { tr } from "@/lib/i18n";
import { useShop } from "@/lib/shop-context";
import { readStorage, writeStorage } from "@/lib/storage";

const NOTICE_KEY = "uffa-demo-notice-v1";

export function DemoNotice() {
  const { language } = useShop();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(readStorage("session", NOTICE_KEY) !== "1");
  }, []);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) writeStorage("session", NOTICE_KEY, "1");
  };

  const points = [
    tr(
      language,
      "Catálogo, stock e preços são demonstrativos.",
      "Catalogue, stock and prices are for demonstration.",
      "El catálogo, el stock y los precios son demostrativos.",
    ),
    tr(
      language,
      "Encomendas e pagamentos são simulados.",
      "Orders and payments are simulated.",
      "Los pedidos y los pagos son simulados.",
    ),
    tr(
      language,
      "Os dados ficam guardados apenas neste browser.",
      "Data is stored only in this browser.",
      "Los datos se guardan solo en este navegador.",
    ),
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-[560px] gap-0 overflow-y-auto rounded-none border-2 border-foreground bg-background p-0 shadow-2xl sm:rounded-none [&>button]:hidden">
        <div className="relative bg-foreground px-6 pb-6 pt-5 text-background">
          <DialogClose asChild>
            <button
              type="button"
              aria-label={tr(language, "Fechar aviso", "Close notice", "Cerrar aviso")}
              className="absolute right-4 top-4 grid size-9 place-items-center border border-background/25 text-background transition hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="size-4" />
            </button>
          </DialogClose>
          <p className="flex items-center gap-2 pr-12 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            <Construction className="size-4" aria-hidden="true" />
            {tr(
              language,
              "UFFA Store · Versão demo",
              "UFFA Store · Demo version",
              "UFFA Store · Versión demo",
            )}
          </p>
          <DialogTitle className="mt-4 max-w-[420px] font-display text-4xl uppercase leading-none text-background sm:text-5xl">
            {tr(
              language,
              "Site em desenvolvimento.",
              "Site under development.",
              "Sitio en desarrollo.",
            )}
          </DialogTitle>
        </div>

        <div className="px-6 py-6">
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            {tr(
              language,
              "Estás a navegar na versão de demonstração da UFFA Store. O site está em desenvolvimento e nenhuma compra é real.",
              "You're browsing the demo version of UFFA Store. The site is under development and no purchase is real.",
              "Estás navegando por la versión de demostración de UFFA Store. El sitio está en desarrollo y ninguna compra es real.",
            )}
          </DialogDescription>

          <ul className="mt-5 space-y-2.5">
            {points.map((point) => (
              <li key={point} className="flex gap-2.5 text-sm">
                <span className="mt-1.5 size-2 shrink-0 bg-primary" aria-hidden="true" />
                <span>{point}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 border border-primary/40 bg-primary/5 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
              {tr(language, "Versão final", "Final version", "Versión final")}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {tr(
                language,
                "A versão final será publicada em www.uffastore.pt.",
                "The final version will be published at www.uffastore.pt.",
                "La versión final se publicará en www.uffastore.pt.",
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border bg-section px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            UFFA Store · Porto · 2026
          </span>
          <DialogClose asChild>
            <Button className="h-11 rounded-none px-6">
              {tr(language, "Entendi, continuar", "Got it, continue", "Entendido, continuar")}
              <ArrowRight />
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
