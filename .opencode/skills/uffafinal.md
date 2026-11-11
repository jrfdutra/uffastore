# Skill: uffafinal

Este procedimento automatiza a auditoria, correção, proteção, deploy e limpeza da UFFA Store.

## Protocolo de Execução
Ao receber o comando `uffafinal`, o agente deve:

1. **Diagnóstico (Leitura apenas):**
   - Git: `git status`, `git branch -a`, `git log --oneline -20`
   - Vercel: `vercel ls --prod` (identificar deploys com erro)
   - Build: Tentar build local (`npm run build`)
   - Dependências: `npm outdated`
   - Env Vars: Listar nomes em `.env.example` vs `.vercel/env`
2. **Correção:**
   - Corrigir erros de build, lint, dead code, vulnerabilidades.
3. **Segurança:**
   - Auditoria de headers, CSP, segredos expostos.
4. **Deploy & Validação:**
   - Deploy controlado (Preview -> Prod), smoke tests.
5. **Limpeza:**
   - Limpar arquivos temporários, branches mergeadas, cache.

## Regras
- SEMPRE pedir autorização para operações destrutivas.
- NÃO expor segredos.
- OBRIGATÓRIO: Relatório no final de cada fase.
