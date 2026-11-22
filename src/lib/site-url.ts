/** Origem pública usada nos links de e-mail (configurada ou inferida do pedido). */
export function publicOrigin(request: Request): string {
  const configured = process.env["PUBLIC_SITE_URL"]?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return "https://www.uffastore.pt";
  const proto =
    request.headers.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  return `${proto}://${host}`;
}
