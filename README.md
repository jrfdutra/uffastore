# Uffa Store

Loja online de sneakers (Porto) — React + TanStack Start + Tailwind, com deploy na Vercel.

Inclui uma área de cliente para acompanhar encomendas de envio ou recolha, validar a autenticidade de cada par e um painel interno de demonstração para gestão de estados. O manual funcional completo está em [`docs/manual-site.md`](docs/manual-site.md).

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

## Catálogo via Shopify

O catálogo vem da Storefront API da Shopify (`src/lib/shopify.ts` + `src/lib/catalog.ts`).
Se as variáveis de ambiente não estiverem definidas, ou a chamada falhar, o site usa
automaticamente os produtos locais de `src/lib/shop-data.ts`.

```bash
cp .env.example .env   # preencher com os dados da loja
```

| Variável | Onde encontrar |
| --- | --- |
| `VITE_SHOPIFY_STORE_DOMAIN` | `xxxxx.myshopify.com` |
| `VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN` | Admin → Headless → Storefront API → token público |

> O `.env` está no `.gitignore`. Em produção (Vercel) as duas variáveis têm de ser
> configuradas no painel do projeto, senão o site cai no catálogo local.

O ficheiro [`docs/shopify/produtos-uffa.csv`](docs/shopify/produtos-uffa.csv) contém o
catálogo de demonstração para importar no Shopify (Produtos → Importar).

## Funcionalidades
- Catálogo, produto, carrinho e checkout com envio ou recolha no Porto.
- Carrinho com confirmação via toast e ação não intrusiva "Ver carrinho", sem redirecionamentos automáticos.
- Categorias do cabeçalho sincronizadas com o filtro do catálogo, inclusive quando o cliente já está em `/catalogo`.
- Stock de demonstração com **5 pares por tamanho** em todos os produtos.
- Preços de oferta com o mesmo peso tipográfico do preço normal e um nível de tamanho acima; placas **PROMO** com contorno nítido em claro e escuro.
- Layout de checkout simplificado com opção de pagamento unificada e ícone de cartão de crédito destacado.
- Integração segura com a Shopify Storefront API para catálogo e checkout.
- Portes: recolha grátis no Porto, **8,94 €** em Portugal Continental e Ilhas, **24,00 €** na União Europeia e **34,00 €** na Suíça.
- Portal `/rastreio` com acesso por três fatores, dashboard, linha temporal e confirmação de receção/recolha.
- Verificação pública de autenticidade em `/verificar`, sem expor dados do comprador.
- Painel `/operacoes` para atualizar estado, previsão, rastreio, transportador e nota pública (gestão de estados demo).
- Aviso de versão demo no primeiro acesso de cada sessão, em PT/EN/ES.
- Textos em PT/EN/ES, tema claro/escuro e layout mobile-first.

## Rotas

| Rota                            | Descrição                                           |
| -------------------------------- | --------------------------------------------------- |
| `/`                             | Home com bloco promocional do portal.               |
| `/catalogo`                     | Catálogo com filtros e categorias sincronizadas.    |
| `/produto/:id`                  | Detalhe do produto.                                 |
| `/checkout`                     | Checkout, entrega e pagamento no checkout Shopify.  |
| `/confirmacao?order=UFFA-XXXXX` | Confirmação demo com código exclusivo e próximos passos. |
| `/rastreio`                     | Portal do cliente.                                  |
| `/verificar`                    | Verificação de autenticidade.                       |
| `/favoritos`                    | Lista de desejos persistente.                       |
| `/ajuda`                        | Perguntas frequentes, contactos e formulário de apoio. |

## Dados de demonstração

| Encomenda    | Contacto       | Código exclusivo | Estado              |
| ------------ | -------------- | ---------------- | ------------------- |
| `UFFA-48217` | `demo@uffa.pt` | `UFFA-7K3M-9QX2` | Em trânsito         |
| `UFFA-73104` | `demo@uffa.pt` | `UFFA-2P8N-5RV6` | Pronta para recolha |

Códigos de autenticidade:

- `UFFA-AUTH-4K7P-2M9Q` — Porto Rose Low, 39
- `UFFA-AUTH-8R3T-6N1W` — Cedofeita Court, 40
- `UFFA-AUTH-9C2L-7B4X` — Invicta 01, 42

Painel de operações: chave `UFFA-OPS-2026`.

O checkout usa a Shopify para dados e pagamento. As encomendas demo acima são as que alimentam a confirmação, o portal e o painel no browser; encomendas concluídas na Shopify não são sincronizadas automaticamente para este armazenamento local.

O aviso de versão demo fecha uma vez por sessão e guarda a dispensa em `sessionStorage` com a chave `uffa-demo-notice-v1`.

> A demonstração guarda encomendas, tentativas e sessões no browser (`localStorage`/`sessionStorage`). Em produção, a validação e a persistência têm de passar para um backend com autenticação, base de dados e auditoria.

## Documentação

- [`docs/manual-site.md`](docs/manual-site.md) — manual funcional completo: rotas, ecrãs, checkout, portal, autenticidade, operações, stock, temas e resolução de problemas.
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
- `docs/manual-site.md` — manual funcional completo do site

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
