import { BadgeCheck } from "lucide-react";
import { useShop } from "@/lib/shop-context";
import { copy } from "@/lib/shop-data";
export function VerifiedBadge() {
  const { language } = useShop();
  return (
    <span className="inline-flex items-center gap-1.5 border border-primary bg-primary px-2 py-1 text-[11px] font-bold uppercase text-primary-foreground">
      <BadgeCheck className="size-3.5" />
      {copy[language].verified}
    </span>
  );
}
