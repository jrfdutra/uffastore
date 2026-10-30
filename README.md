# Uffa Store

Loja online de sneakers (Porto) — React + TanStack Start + Tailwind, com deploy na Vercel.

Inclui uma área de cliente para acompanhar encomendas de envio ou recolha, validar a autenticidade de cada par e um painel interno de demonstração para gestão de estados.

## Desenvolvimento

```bash
bun install       # ou: npm install
bun run dev       # http://localhost:8080
bun run build     # build de produção
bun run lint
```

Validação rápida:

```bash
npx tsc --noEmit
npm run build
```

## Funcionalidades

- Catálogo, produto, carrinho e checkout com envio ou recolha no Porto.
- Checkout cria número de encomenda, código exclusivo, rastreio e um código de autenticidade por par.
- Portal `/rastreio` com acesso por três fatores, dashboard, linha temporal e confirmação de receção/recolha.
- Verificação pública de autenticidade em `/verificar`, sem expor dados do comprador.
- Painel `/operacoes` para atualizar estado, previsão, rastreio, transportador e nota pública.
- Aviso de versão demo no primeiro acesso de cada sessão, em PT/EN/ES.
- Textos em PT/EN/ES, tema claro/escuro e layout mobile-first.

## Rotas

| Rota                            | Descrição                                           |
| ------------------------------- | --------------------------------------------------- |
| `/`                             | Home com bloco promocional do portal.               |
| `/catalogo`                     | Catálogo com filtros.                               |
| `/produto/:id`                  | Detalhe do produto.                                 |
| `/checkout`                     | Checkout e criação da encomenda.                    |
| `/confirmacao?order=UFFA-XXXXX` | Confirmação com código exclusivo e próximos passos. |
| `/rastreio`                     | Portal do cliente.                                  |
| `/verificar`                    | Verificação de autenticidade.                       |
| `/operacoes`                    | Painel interno de demonstração.                     |

## Dados de demonstração

| Encomenda    | Contacto       | Código exclusivo | Estado              |
| ------------ | -------------- | ---------------- | ------------------- |
| `UFFA-48217` | `demo@uffa.pt` | `UFFA-7K3M-9QX2` | Em trânsito         |
| `UFFA-73104` | `demo@uffa.pt` | `UFFA-2P8N-5RV6` | Pronta para recolha |
| `UFFA-19556` | `ana@uffa.pt`  | `UFFA-6D1F-3H8K` | Entregue            |

Códigos de autenticidade:

- `UFFA-AUTH-4K7P-2M9Q` — Porto Rose Low, 39
- `UFFA-AUTH-8R3T-6N1W` — Cedofeita Court, 40
- `UFFA-AUTH-9C2L-7B4X` — Invicta 01, 42
- `UFFA-AUTH-1Z6Y-5A3E` — Afterdark 02, 41

Painel de operações: chave `UFFA-OPS-2026`.

O aviso de versão demo fecha uma vez por sessão e guarda a dispensa em `sessionStorage` com a chave `uffa-demo-notice-v1`.

> A demonstração guarda encomendas, tentativas e sessões no browser (`localStorage`/`sessionStorage`). Em produção, a validação e a persistência têm de passar para um backend com autenticação, base de dados e auditoria.

## Documentação

- [`docs/portal-encomendas.md`](docs/portal-encomendas.md) — arquitetura, modelo de dados, fluxos, segurança e testes.
- [`docs/guia-apresentacao.md`](docs/guia-apresentacao.md) — guião slide a slide da apresentação do portal.
- [`docs/guia-apresentacao-site.md`](docs/guia-apresentacao-site.md) — guião slide a slide da apresentação do site.
- [`docs/apresentacao-uffa.pptx`](docs/apresentacao-uffa.pptx) — apresentação do portal de encomendas.
- [`docs/apresentacao-site-uffa.pptx`](docs/apresentacao-site-uffa.pptx) — apresentação do site e da loja.
- [`docs/assets/screenshots/`](docs/assets/screenshots/) — capturas completas e recortes.

## Estrutura

- `src/lib/shop-data.ts` — produtos, preços, tamanhos e textos (PT/EN/ES)
- `src/lib/orders.ts` — encomendas, códigos, estados, sessões e persistência demo
- `src/lib/i18n.ts` — helper de tradução inline
- `src/assets/` — fotografias dos produtos
- `src/components/newsletter.tsx` — subscrições enviadas para atendimento@uffastore.pt
- `src/components/demo-notice.tsx` — aviso de versão demo com dispensa por sessão
- `src/components/order-portal-promo.tsx` — bloco do portal na home
- `src/routes/` — páginas (home, catálogo, produto, checkout, confirmação, rastreio, verificar, operações)
- `scripts/capture-screenshots.mjs` — captura automatizada das imagens da documentação
- `scripts/build-apresentacao.mjs` — geração da apresentação do portal com `pptxgenjs`
- `scripts/build-apresentacao-site.mjs` — geração da apresentação do site com `pptxgenjs`

## Apresentações

Duas apresentações complementares, ambas com notas do orador:

| Deck                               | Foco                          | Comando                                    |
| ---------------------------------- | ----------------------------- | ------------------------------------------ |
| `docs/apresentacao-uffa.pptx`      | Portal de encomendas          | `node scripts/build-apresentacao.mjs`      |
| `docs/apresentacao-site-uffa.pptx` | Site, loja e jornada completa | `node scripts/build-apresentacao-site.mjs` |

```bash
npm install --no-save --package-lock=false pptxgenjs
node scripts/build-apresentacao-site.mjs
```

O percurso de demonstração do site está no último slide: `/`, `/catalogo`, `/produto/porto-rose-low`, `/checkout`, `/rastreio`, `/verificar` e `/operacoes`. As capturas podem ser atualizadas com o dev server a correr:

```bash
node scripts/capture-screenshots.mjs
```

## Deploy

Cada push para a branch `main` faz deploy automático na Vercel.
