export type DeliveryOption = "pickup" | "continental" | "islands" | "eu" | "switzerland";

export const deliveryRates: Record<
  DeliveryOption,
  {
    price: number;
    title: { pt: string; en: string; es: string };
    subtitle: { pt: string; en: string; es: string };
  }
> = {
  pickup: {
    price: 0,
    title: {
      pt: "Recolha em mão (3 locais)",
      en: "Hand pickup (3 locations)",
      es: "Recogida en mano (3 lugares)",
    },
    subtitle: { pt: "Grátis (0,00 €)", en: "Free (0.00 €)", es: "Gratis (0,00 €)" },
  },
  continental: {
    price: 8.94,
    title: { pt: "Portugal Continental", en: "Portugal Mainland", es: "Portugal Continental" },
    subtitle: {
      pt: "Envio expresso · 8,94 €",
      en: "Express shipping · 8.94 €",
      es: "Envío expreso · 8,94 €",
    },
  },
  islands: {
    price: 8.94,
    title: { pt: "Portugal - Ilhas", en: "Portugal Islands", es: "Portugal - Islas" },
    subtitle: {
      pt: "Açores e Madeira · 8,94 €",
      en: "Azores & Madeira · 8.94 €",
      es: "Azores y Madeira · 8,94 €",
    },
  },
  eu: {
    price: 24.0,
    title: { pt: "União Europeia", en: "European Union", es: "Unión Europea" },
    subtitle: {
      pt: "Qualquer país da UE · 24,00 €",
      en: "Any EU country · 24.00 €",
      es: "Cualquier país de la UE · 24,00 €",
    },
  },
  switzerland: {
    price: 34.0,
    title: { pt: "Suíça", en: "Switzerland", es: "Suiza" },
    subtitle: {
      pt: "Envio internacional · 34,00 €",
      en: "International shipping · 34.00 €",
      es: "Envío internacional · 34,00 €",
    },
  },
};
