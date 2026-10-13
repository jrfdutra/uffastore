import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { categoryNames, copy, money, type Product } from "@/lib/shop-data";
import { useShop } from "@/lib/shop-context";
import { VerifiedBadge } from "./verified-badge";
export function ProductCard({product}:{product:Product}) { const {language}=useShop(); return <article className="group min-w-0">
  <Link to="/produto/$productId" params={{productId:product.id}} className="block overflow-hidden bg-product focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
    <div className="relative aspect-[4/3] overflow-hidden"><img src={product.image} alt={product.name} width={1200} height={900} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]"/><div className="absolute left-3 top-3"><VerifiedBadge/></div><span className="absolute bottom-3 right-3 grid size-9 place-items-center bg-background text-foreground opacity-0 transition group-hover:opacity-100"><ArrowUpRight className="size-4"/></span></div>
  </Link><div className="flex items-start justify-between gap-3 border-t border-border pt-3"><div className="min-w-0"><p className="text-xs font-semibold uppercase text-muted-foreground">{categoryNames[product.category][language]}</p><Link to="/produto/$productId" params={{productId:product.id}} className="mt-1 block truncate font-bold hover:text-primary">{product.name}</Link></div><p className="shrink-0 font-bold">{money(product.price)}</p></div>
</article>; }
