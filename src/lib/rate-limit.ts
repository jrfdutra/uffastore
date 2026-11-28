/**
 * Limite de pedidos por IP, em memória. Em serverless é por instância (best
 * effort): serve para travar abuso casual sem exigir base de dados nem serviço
 * externo. A proteção definitiva continua a ser a validação no servidor.
 */
export class RateLimiter {
  private readonly hits = new Map<string, number[]>();
  private readonly limit: number;
  private readonly windowMs: number;
  private readonly maxKeys: number;

  constructor(limit: number, windowMs: number, maxKeys = 5_000) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.maxKeys = maxKeys;
  }

  allows(key: string, now = Date.now()): boolean {
    const cutoff = now - this.windowMs;
    const previous = this.hits.get(key) ?? [];
    const recent = previous.filter((at) => at > cutoff);

    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      return false;
    }

    recent.push(now);
    if (this.hits.size >= this.maxKeys && !this.hits.has(key)) {
      this.hits.delete(this.hits.keys().next().value ?? "");
    }
    this.hits.set(key, recent);
    return true;
  }
}

/** IP do cliente, confiando apenas nos cabeçalhos definidos pela plataforma. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim().slice(0, 64) || "unknown";
  return request.headers.get("x-real-ip")?.trim().slice(0, 64) || "unknown";
}

/**
 * Bloqueia pedidos com Origin/Referer de outro site. Cabeçalhos ausentes são
 * aceites: alguns browsers/privacidade não os enviam em pedidos legítimos.
 */
export function hasAllowedOrigin(request: Request): boolean {
  const raw = request.headers.get("origin") ?? request.headers.get("referer");
  if (!raw) return true;

  try {
    const origin = new URL(raw).hostname.toLowerCase();
    const expected = new URL(request.url).hostname.toLowerCase();
    if (origin === expected) return true;
    return (
      origin.endsWith(`.${expected}`) ||
      origin === "uffastore.pt" ||
      origin === "www.uffastore.pt" ||
      origin === "localhost" ||
      origin === "127.0.0.1"
    );
  } catch {
    return false;
  }
}
