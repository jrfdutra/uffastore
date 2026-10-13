# Uffa Store

Loja online de sneakers (Porto) — React + TanStack Start + Tailwind, com deploy na Vercel.

## Desenvolvimento

```bash
bun install
bun run dev      # servidor local
bun run build    # build de produção
bun run lint
```

## Estrutura

- `src/lib/shop-data.ts` — produtos, preços, tamanhos e textos (PT/EN/ES)
- `src/assets/` — fotografias dos produtos
- `src/components/newsletter.tsx` — subscrições enviadas para atendimento@uffastore.pt
- `src/routes/` — páginas (home, catálogo, produto, checkout, confirmação, rastreio)

## Deploy

Cada push para a branch `main` faz deploy automático na Vercel.
