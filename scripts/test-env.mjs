import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

console.log("import.meta.dirname:", import.meta.dirname);
const ROOT = resolve(import.meta.dirname, "..");
console.log("ROOT:", ROOT);
const ENV_PATH = resolve(ROOT, ".env");
console.log("ENV_PATH:", ENV_PATH);

async function loadEnv() {
  const raw = await readFile(ENV_PATH, "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = await loadEnv();
console.log("ENV loaded:", Object.keys(env));
console.log("SHOPIFY_ADMIN_STORE_DOMAIN:", env.SHOPIFY_ADMIN_STORE_DOMAIN);