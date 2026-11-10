# Comando: uffavercel

Diagnóstico, correção e otimização completa da integração UFFA Store ↔ GitHub ↔ Vercel.

Site oficial: https://www.uffastore.pt
Repositório: https://github.com/jrfdutra/uffastore
Branch de produção: `main`

Ao receber `uffavercel`, executar automaticamente as fases abaixo, sem pedir para repetir o procedimento.

---

## ⛔ REGRAS INVIOLÁVEIS (aprendidas em produção)

1. **O script `build` do `package.json` tem de ser EXATAMENTE `vite build`.**
   - ❌ NUNCA `vite build && npx nitro build`
   - ❌ NUNCA `vite build && npx nitro generate`
   - Motivo: o `vite build` (plugin Nitro do TanStack Start) já gera `.vercel/output`
     com as rotas da aplicação. Um segundo `npx nitro build` na Vercel deteta
     `VERCEL=1`, reconstrói `.vercel/output` do zero **sem** as rotas e a função
     `__server` passa a devolver `{"error":true,"status":404,"message":"Cannot find
     any route matching [GET] ..."}`. O build fica verde e o site quebrado.

2. **Preset Nitro:** `vite.config.ts` deve manter `nitro: { preset: "vercel" }`
   (determinístico). Não adicionar plugins manualmente (a config base já os inclui).

3. **`vercel.json`:** permitido APENAS com `headers` (segurança). Nunca incluir
   `buildCommand`, `outputDirectory` ou `rewrites` — deixar o Nitro gerar
   `.vercel/output/config.json`.

4. Não expor segredos. Não usar `git push --force` em `main`.
   Não apagar deployments/domínios/env vars sem autorização.

---

## FASE 1 — Diagnóstico (leitura)

1. `git status`, `git log --oneline -10`, `git branch -a`
2. Confirmar `package.json` → `"build": "vite build"`
3. Confirmar `vite.config.ts` → `nitro.preset === "vercel"`
4. Confirmar que `vercel.json` (se existir) só tem `headers`
5. `npm run build` local → tem de terminar com código 0
6. Verificar artefacto gerado:
   - `.vercel/output/config.json` contém `"dest": "/__server"`
   - `.vercel/output/functions/__server.func/index.mjs` contém `route: "/**"`
   - **NÃO** deve existir pasta `.output/` local após o build

## FASE 2 — Correção

- Corrigir build/runtime conforme o diagnóstico.
- Se o build gerar `.output/` (Cloudflare) em vez de `.vercel/output/` → falta o preset `vercel`.
- Se `index.mjs` não tiver `route: "/**"` → o `npx nitro build` voltou ao script.
- Remover código morto e imports não usados; sem `console.log` de debug.

## FASE 3 — Segurança

- Headers via `vercel.json` (apenas `headers`): `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`,
  `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`.
- Não adicionar CSP restritiva sem testar (parte o checkout Shopify e Apple/Google Pay).
- Verificar que não há segredos versionados.

## FASE 4 — Deploy

1. Commit(s) com Conventional Commits.
2. `git push origin main` → deploy automático na Vercel.
3. Aguardar estado READY.

## FASE 5 — Smoke tests obrigatórios

Testar `https://www.uffastore.pt` nas rotas:
`/`, `/catalogo`, `/checkout`, `/ajuda`, `/rastreio`, `/favoritos`, `/operacoes`.

- Todas devem devolver **200** e **não** conter `This page didn't load`
  nem `Cannot find any route`.
- Em `/operacoes`: fazer login (`ops@uffastore.pt` / `UFFA-OPS-2026`) e confirmar
  que o dashboard abre (Gestão de Modelos / Encomendas) sem erros na consola.
- Verificar headers de segurança na resposta.

## FASE 6 — Relatório

- Estado antes/depois, ficheiros alterados, SHA em produção, resultados dos smoke tests.
- Classificação: APROVADO / APROVADO COM RESSALVAS / NÃO APROVADO.

---

## Notas de diagnóstico rápido

- Erro `Cannot find any route matching` → build script errado (ver Regra 1).
- Página "This page didn't load" numa rota → erro de runtime no cliente; abrir
  DevTools → Console e corrigir a exceção (ex.: dados em localStorage a apontar
  para produtos que já não existem).
- Build "Unknown command generate" → remover o passo `npx nitro generate`.
