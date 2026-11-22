const CTT_TRACKING_URL = "https://www.ctt.pt/feapl_2/app/open/objectSearch/objectSearch.jspx";

/** Abre o «Seguir objeto» do CTT com o código de envio já preenchido. */
export function cttTrackingUrl(code: string): string {
  const params = new URLSearchParams({
    objects: code.trim(),
    request_locale: "pt",
  });
  return `${CTT_TRACKING_URL}?${params.toString()}`;
}

/** Só mostramos o atalho quando o transportador for CTT. */
export function isCttCarrier(carrier: string | null | undefined): boolean {
  return (carrier ?? "").toLowerCase().includes("ctt");
}

/** Dados mínimos e sem PII que viajam no link mágico de rastreio. */
export type TrackingLinkData = {
  orderNumber: string;
  trackingCode: string;
  carrier: string;
  estimatedDelivery: string | null;
  issuedAt: number;
  expiresAt: number;
};
