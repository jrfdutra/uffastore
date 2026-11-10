import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, CheckCircle2, Shield, Package, ShoppingBag, Terminal, ExternalLink } from "lucide-react";
import { useShop } from "@/lib/shop-context";
import { tr } from "@/lib/i18n";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/manual")({
  head: () => ({
    meta: [
      { title: "Manual Oficial — Uffa Store" },
      { name: "description", content: "Manual funcional, operacional e técnico da UFFA Store, ecrã a ecrã." },
      { property: "og:title", content: "Manual Oficial — Uffa Store" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/manual" }],
  }),
  component: ManualPage,
});

function ManualPage() {
  const { language } = useShop();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:px-6 md:py-16">
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 border border-border bg-muted/50 px-3 py-1 text-xs font-mono uppercase mb-4">
          <BookOpen className="size-3.5 text-primary" />
          <span>{tr(language, "Documentação Oficial", "Official Documentation", "Documentación Oficial")}</span>
        </div>
        <h1 className="font-display text-4xl uppercase md:text-6xl tracking-tight">
          UFFA Store · Manual do Site
        </h1>
        <p className="mt-4 text-muted-foreground text-base md:text-lg">
          {tr(
            language,
            "Da descoberta à autenticidade — tudo o que o site faz, ecrã a ecrã, integrado com a Shopify e o Portal de Encomendas.",
            "From discovery to authenticity — everything the site does, screen by screen, integrated with Shopify and the Order Portal.",
            "De la descoberta a la autenticidad — todo lo que hace el sitio, pantalla a pantalla, integrado con Shopify."
          )}
        </p>
      </div>

      <div className="mt-12 grid gap-8 border-t border-border pt-12 md:grid-cols-2">
        {/* Capítulo 1: Posicionamento */}
        <div className="border border-border bg-card p-6 md:p-8 space-y-4">
          <span className="text-xs font-mono font-bold text-primary">01 / POSICIONAMENTO</span>
          <h2 className="font-display text-2xl uppercase">Uma loja, não um catálogo</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {tr(
              language,
              "Curadoria rigorosa de 8 pares de sneakers exclusivos no Porto, verificados um a um, com recolha em mão e pós-compra contínuo.",
              "Rigorous curation of 8 exclusive sneaker pairs in Porto, verified one by one, with hand pickup and continuous post-purchase.",
              "Curaduría rigurosa de 8 pares de zapatillas exclusivas en Oporto, verificadas una a una."
            )}
          </p>
        </div>

        {/* Capítulo 2: Home */}
        <div className="border border-border bg-card p-6 md:p-8 space-y-4">
          <span className="text-xs font-mono font-bold text-primary">02 / HOME & EXPERIÊNCIA</span>
          <h2 className="font-display text-2xl uppercase">A marca em primeiro</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {tr(
              language,
              "Hero carousel responsivo com excelente contraste, faixas de confiança, acesso rápido a categorias e destaque para o portal de encomendas e newsletter.",
              "Responsive hero carousel with excellent contrast, trust badges, quick access to categories, and spotlight for the order portal and newsletter.",
              "Hero carrusel responsivo con excelente contraste, insignias de confianza y acceso rápido."
            )}
          </p>
        </div>

        {/* Capítulo 3: Catálogo */}
        <div className="border border-border bg-card p-6 md:p-8 space-y-4">
          <span className="text-xs font-mono font-bold text-primary">03 / CATÁLOGO</span>
          <h2 className="font-display text-2xl uppercase">Filtros e Sincronização</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {tr(
              language,
              "Filtros por linha (Casual, Streetwear, Edições Limitadas, Promoções), tamanhos e preços em tempo real com sincronização instantânea com o cabeçalho.",
              "Filters by line (Casual, Streetwear, Limited Editions, Promos), sizes, and real-time prices with instant header synchronization.",
              "Filtros por línea, tallas y precios en tiempo real con sincronización instantánea con el encabezado."
            )}
          </p>
        </div>

        {/* Capítulo 4: Produto */}
        <div className="border border-border bg-card p-6 md:p-8 space-y-4">
          <span className="text-xs font-mono font-bold text-primary">04 / PRODUTO</span>
          <h2 className="font-display text-2xl uppercase">Detalhes e Garantias</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {tr(
              language,
              "Galeria fotográfica, verificação de stock por tamanho (5 pares padrão), códigos de autenticidade integrados e sugestões relacionadas.",
              "Photo gallery, size stock check (5 default pairs), integrated authenticity codes, and related suggestions.",
              "Galería de fotos, comprobación de stock por talla, códigos de autenticidad integrados y sugerencias."
            )}
          </p>
        </div>

        {/* Capítulo 5: Carrinho */}
        <div className="border border-border bg-card p-6 md:p-8 space-y-4">
          <span className="text-xs font-mono font-bold text-primary">05 / CARRINHO</span>
          <h2 className="font-display text-2xl uppercase">Camada Lateral Eficiente</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {tr(
              language,
              "Adicionar ao carrinho aciona um toast com ação não intrusiva 'Ver carrinho'. Gestão de quantidades, cupões de desconto (ex: PORTO20) e persistência local.",
              "Adding to cart triggers a toast with a non-intrusive 'View cart' action. Quantity management, discount coupons (e.g. PORTO20), and local persistence.",
              "Añadir al carrito activa un toast con acción no intrusiva 'Ver carrito'. Gestión de cantidades y cupones."
            )}
          </p>
        </div>

        {/* Capítulo 6: Checkout */}
        <div className="border border-border bg-card p-6 md:p-8 space-y-4">
          <span className="text-xs font-mono font-bold text-primary">06 / CHECKOUT & SHOPIFY</span>
          <h2 className="font-display text-2xl uppercase">Pagamento e Portes</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {tr(
              language,
              "Opção de pagamento unificada com ícone de cartão de crédito destacado, taxas de envio calculadas para Porto, Continental/Ilhas, UE e Suíça, ligando direto à Shopify.",
              "Unified payment option with prominent credit card icon, shipping rates calculated for Porto, Mainland/Islands, EU, and Switzerland, linking directly to Shopify.",
              "Opción de pago unificada con icono de tarjeta de crédito destacado y tarifas de envío."
            )}
          </p>
        </div>
      </div>

      <div className="mt-16 border border-border bg-muted/30 p-8 text-center space-y-4">
        <h3 className="font-display text-2xl uppercase">
          {tr(language, "Pronto para testar a loja?", "Ready to test the store?", "¿Listo para probar la tienda?")}
        </h3>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          {tr(
            language,
            "Explora o catálogo completo ou vai diretamente ao painel de operações e portal de encomendas para testar todos os fluxos.",
            "Explore the complete catalog or go directly to the operations panel and order portal to test all flows.",
            "Explora el catálogo completo o ve directamente al panel de operaciones y portal de pedidos."
          )}
        </p>
        <div className="pt-2 flex flex-wrap justify-center gap-4">
          <Button asChild className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/catalogo">
              <ShoppingBag className="mr-2 size-4" />
              {tr(language, "Ver Catálogo", "View Catalog", "Ver Catálogo")}
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-none">
            <Link to="/rastreio">
              <Package className="mr-2 size-4" />
              {tr(language, "Portal de Encomendas", "Order Portal", "Portal de Pedidos")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
