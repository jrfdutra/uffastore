import type { ReactNode } from "react";
import { useShop } from "@/lib/shop-context";
import { tr } from "@/lib/i18n";

export type LegalSection = {
  heading: string;
  body: ReactNode;
};

type LegalPageProps = {
  title: string;
  intro: string;
  updated: string;
  sections: LegalSection[];
};

export function LegalPage({ title, intro, updated, sections }: LegalPageProps) {
  const { language } = useShop();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
      <p className="text-xs font-bold uppercase tracking-widest text-primary">
        {tr(language, "Informação legal", "Legal information", "Información legal")}
      </p>
      <h1 className="mt-3 font-display text-5xl uppercase md:text-6xl">{title}</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{intro}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        {tr(language, "Última atualização:", "Last updated:", "Última actualización:")} {updated}
      </p>
      <p className="mt-4 border border-border bg-card p-3 text-xs text-muted-foreground">
        {tr(
          language,
          "A versão vinculativa destes documentos é a portuguesa. Em caso de divergência, prevalece o texto em português.",
          "The binding version of these documents is the Portuguese one. In case of divergence, the Portuguese text prevails.",
          "La versión vinculante de estos documentos es la portuguesa. En caso de divergencia, prevalece el texto en portugués.",
        )}
      </p>

      <div className="mt-10 space-y-8">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-display text-2xl uppercase">{section.heading}</h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
              {section.body}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
