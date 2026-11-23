import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

let envPromise: Promise<Record<string, string>> | undefined;

/**
 * Carrega o `.env` local uma vez por processo. Em produção (Vercel) as variáveis
 * do painel já vêm em `process.env` e têm sempre precedência.
 *
 * Centralizar esta leitura evita que um endpoint (ex.: `/api/cron/nps`) veja
 * segredos diferentes dos usados pelo Shopify Admin ou pelo Resend.
 */
export function loadServerEnv(): Promise<Record<string, string>> {
  if (!envPromise) {
    envPromise = readFile(resolve(process.cwd(), ".env"), "utf8")
      .then((raw) => {
        const env = process.env as Record<string, string>;
        for (const line of raw.split(/\r?\n/)) {
          const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
          const key = match?.[1];
          const value = match?.[2];
          if (key && value && !env[key]) {
            env[key] = value.replace(/^["']|["']$/g, "");
          }
        }
        return env;
      })
      .catch(() => process.env as Record<string, string>);
  }
  return envPromise;
}
