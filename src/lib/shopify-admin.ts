import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

/** Em dev lê o .env local; em produção (Vercel) usa as env vars do painel. */
async function loadEnv(): Promise<Record<string, string>> {
  const env = process.env as Record<string, string>;
  try {
    const raw = await readFile(resolve(process.cwd(), ".env"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m?.[1] && m[2] && !env[m[1]]) {
        env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // Sem ficheiro .env em produção — usar apenas process.env.
  }
  return env;
}

export type AdminGraphql = <T>(query: string, variables?: Record<string, unknown>) => Promise<T>;

export async function shopifyAdminGraphql<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const env = await loadEnv();
  const domain = (env["SHOPIFY_ADMIN_STORE_DOMAIN"] || env["SHOPIFY_STORE_DOMAIN"] || "").trim();
  const token = (env["SHOPIFY_ADMIN_ACCESS_TOKEN"] || env["SHOPIFY_ADMIN_TOKEN"] || "").trim();
  const version = (env["SHOPIFY_ADMIN_API_VERSION"] || "2026-07").trim();

  if (!domain || !token) {
    throw new Error("Shopify Admin não configurada (domínio/token em falta)");
  }
  if (!/^[a-z0-9.-]+\.myshopify\.com$/i.test(domain)) {
    throw new Error("Domínio da Shopify Admin inválido");
  }

  const response = await fetch(`https://${domain}/admin/api/${version}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = (await response.json()) as {
    data?: T;
    errors?: { message?: string }[];
  };

  if (!response.ok || json.errors?.length) {
    const detail =
      json.errors?.map((error) => error.message).join("; ") ?? `HTTP ${response.status}`;
    // Nunca incluir o token no erro devolvido ao chamador.
    throw new Error(`Shopify Admin rejeitou a chamada: ${detail.slice(0, 300)}`);
  }
  if (!json.data) throw new Error("Shopify Admin não devolveu dados");
  return json.data;
}
