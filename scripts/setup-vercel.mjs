import { readFile } from "node:fs/promises";

const APPLY = process.argv.includes("--apply");
const API = "https://api.vercel.com";

let envRaw = "";
try {
  envRaw = await readFile(new URL("../.env", import.meta.url), "utf8");
} catch {
  // sem .env
}
const get = (key) =>
  process.env[key] ?? envRaw.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim();

const token = get("VERCEL_TOKEN");
if (!token) {
  console.error(
    [
      "Falta VERCEL_TOKEN.",
      "",
      "1. Cria um token em https://vercel.com/account/tokens",
      "2. Coloca no .env local:  VERCEL_TOKEN=...",
      "3. Volta a correr este script.",
      "",
      "O .env está no .gitignore; o token não é commitado.",
    ].join("\n"),
  );
  process.exit(1);
}

async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const message = json?.error?.message ?? json?.message ?? text.slice(0, 300);
    throw new Error(`${res.status} ${message}`);
  }
  return json;
}

// 1) Descobrir o projeto
let project;
const projectId = get("VERCEL_PROJECT_ID");
const projectName = get("VERCEL_PROJECT_NAME");

if (projectId) {
  project = await api(`/v9/projects/${encodeURIComponent(projectId)}`);
} else {
  const list = await api("/v9/projects?limit=100");
  const projects = list.projects ?? [];
  const candidates = projects.filter((p) =>
    projectName
      ? p.name.toLowerCase() === projectName.toLowerCase()
      : /uffa/i.test(p.name) || /uffa/i.test(p.link?.repo ?? ""),
  );
  if (candidates.length === 1) {
    project = candidates[0];
  } else if (candidates.length === 0) {
    console.error("Projeto não encontrado. Define VERCEL_PROJECT_ID no .env.");
    console.error("Projetos disponíveis:", projects.map((p) => p.name).join(", ") || "(nenhum)");
    process.exit(1);
  } else {
    console.error("Mais de um projeto candidato:", candidates.map((p) => p.name).join(", "));
    console.error("Define VERCEL_PROJECT_ID no .env para escolher.");
    process.exit(1);
  }
}

console.log(`Projeto: ${project.name} (${project.id})`);
if (project.link?.repo)
  console.log(`Repositório: ${project.link.repo} @ ${project.link.ref ?? "?"}`);

// 2) Variáveis a configurar
const skipArg = process.argv.find((a) => a.startsWith("--skip="));
const skip = new Set(
  (skipArg?.slice("--skip=".length) ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);

const vars = [
  { key: "SHOPIFY_WEBHOOK_SECRET", value: get("SHOPIFY_WEBHOOK_SECRET") },
  { key: "RESEND_API_KEY", value: get("RESEND_API_KEY") },
  { key: "RESEND_FROM", value: get("RESEND_FROM") || "onboarding@resend.dev" },
  { key: "SHOPIFY_SHOP_DOMAIN", value: get("SHOPIFY_SHOP_DOMAIN") || "uffastore.myshopify.com" },
].filter((v) => !skip.has(v.key));

if (skip.size) console.log(`\nIgnoradas por --skip: ${[...skip].join(", ")}`);

const missing = vars.filter((v) => !v.value);
if (missing.length) {
  console.error(`\nFaltam valores no .env: ${missing.map((v) => v.key).join(", ")}`);
  process.exit(1);
}

console.log("\nVariáveis a configurar em Production:");
for (const v of vars) {
  const preview = `${v.value.slice(0, 4)}…${v.value.slice(-2)}`;
  console.log(`  • ${v.key} = ${preview} (${v.value.length} caracteres)`);
}

// 3) Estado atual (só nomes)
try {
  const current = await api(`/v10/projects/${project.id}/env`);
  const names = new Set((current.envs ?? []).map((e) => e.key));
  const existing = vars.filter((v) => names.has(v.key)).map((v) => v.key);
  console.log(
    `\nJá existem no projeto: ${existing.length ? existing.join(", ") : "(nenhuma destas)"}`,
  );
} catch (err) {
  console.log(`\nAviso: não foi possível listar as variáveis atuais (${err.message})`);
}

if (!APPLY) {
  console.log("\nModo ensaio. Para aplicar:");
  console.log("  node scripts/setup-vercel.mjs --apply\n");
  process.exit(0);
}

// 4) Upsert das variáveis
await api(`/v10/projects/${project.id}/env?upsert=true`, {
  method: "POST",
  body: JSON.stringify(
    vars.map((v) => ({
      key: v.key,
      value: v.value,
      type: "encrypted",
      target: ["production"],
    })),
  ),
});
console.log("\n✓ Variáveis aplicadas em Production.");

// 5) Redeploy
const repoId = project.link?.repoId;
if (!repoId) {
  console.log("\nNão foi possível disparar o redeploy automaticamente (projeto sem repo ligado).");
  console.log("Faz Redeploy no painel da Vercel.");
  process.exit(0);
}

try {
  const deployment = await api("/v13/deployments", {
    method: "POST",
    body: JSON.stringify({
      name: project.name,
      project: project.id,
      target: "production",
      gitSource: {
        type: "github",
        repoId,
        ref: project.link?.ref || "main",
      },
    }),
  });
  console.log(`✓ Redeploy iniciado: ${deployment.url ?? deployment.id}`);
  console.log("Aguarda 1–2 minutos e corre: node scripts/status-producao.mjs");
} catch (err) {
  console.error(`\nRedeploy automático falhou: ${err.message}`);
  console.error("As variáveis ficaram gravadas; faz Redeploy manual no painel.");
  process.exit(1);
}
