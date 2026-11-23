import { Package, Hand, RefreshCcw } from "lucide-react";
import { useShop } from "@/lib/shop-context";
const items = {
  pt: [
    ["Preparação antes do envio", "Embalagem protegida"],
    ["Entrega em mãos no Porto", "Recolha grátis combinada"],
    ["Compra final", "Sem trocas nem devoluções"],
  ],
  en: [
    ["Packed with care", "Securely packed"],
    ["Hand delivery in Porto", "Free arranged pickup"],
    ["Final purchase", "No exchanges or returns"],
  ],
  es: [
    ["Preparación antes del envío", "Embalaje protegido"],
    ["Entrega en mano en Oporto", "Recogida gratis acordada"],
    ["Compra final", "Sin cambios ni devoluciones"],
  ],
};
export function TrustStrip() {
  const { language } = useShop();
  const icons = [Package, Hand, RefreshCcw];
  return (
    <section className="border-y border-border">
      <div className="mx-auto grid max-w-7xl md:grid-cols-3">
        {items[language].map(([a, b], i) => {
          const Icon = icons[i] ?? Package;
          return (
            <div
              key={a}
              className="flex items-center gap-4 border-b border-border px-6 py-6 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
            >
              <Icon className="size-6 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-bold uppercase">{a}</p>
                <p className="text-xs text-muted-foreground">{b}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
