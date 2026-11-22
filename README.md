# Uffa Store

Loja online de sneakers (Porto) — React + TanStack Start + Tailwind, com deploy na Vercel.

Inclui uma área de cliente para acompanhar encomendas de envio ou recolha e um painel interno de demonstração para gestão de estados. O manual funcional completo está em [`docs/manual-site.md`](docs/manual-site.md).

## Desenvolvimento

```bash
npm install
npm run dev       # http://localhost:8080
npm run build     # build de produção
npm run lint
```

Validação rápida:

```bash
npm run typecheck
npm run lint
npm run build
```

## Catálogo via Shopify

O catálogo vem da Storefront API da Shopify (`src/lib/shopify.ts` + `src/lib/catalog.ts`).
Se as variáveis de ambiente não estiverem definidas, ou a chamada falhar, o site usa
automaticamente os produtos locais de `src/lib/shop-data.ts`.

```bash
cp .env.example .env   # preencher com os dados da loja
```

| Variável                               | Onde encontrar                                    |
| -------------------------------------- | ------------------------------------------------- |
| `VITE_SHOPIFY_STORE_DOMAIN`            | `xxxxx.myshopify.com`                             |
| `VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN` | Admin → Headless → Storefront API → token público |

> O `.env` está no `.gitignore`. Em produção (Vercel) as duas variáveis têm de ser
> configuradas no painel do projeto, senão o site cai no catálogo local.

### E-mail automático de encomenda paga

Quando a Shopify confirma o pagamento, envia um webhook para
`POST /api/webhooks/shopify/orders-paid`. O endpoint valida a assinatura HMAC, confirma
o tópico `orders/paid`, evita eventos duplicados e envia o e-mail de confirmação de
encomenda por Resend.

| Variável                 | Obrigatória | Descrição                                                                           |
| ------------------------ | ----------- | ----------------------------------------------------------------------------------- |
| `SHOPIFY_WEBHOOK_SECRET` | Sim         | _Signing secret_ do webhook em Shopify Admin → Definições → Notificações → Webhooks |
| `RESEND_API_KEY`         | Sim         | Chave da API Resend                                                                 |
| `RESEND_FROM`            | Não         | Remetente verificado (por omissão `onboarding@resend.dev`)                          |
| `SHOPIFY_SHOP_DOMAIN`    | Não         | Se definido, só aceita webhooks desta loja (ex.: `uffastore.myshopify.com`)         |

Sem `SHOPIFY_WEBHOOK_SECRET` o endpoint rejeita tudo (fail-closed). Para testar:

```bash
npm run dev
node scripts/test-webhook.mjs          # casos de segurança, sem enviar e-mail
node scripts/test-webhook.mjs --real   # inclui um envio real e prova de replay
```

### Registo de envio e link mágico

A equipa regista o código de rastreio em `/expedicao` (página interna, não indexada).
O servidor cria um link assinado, envia-o por Resend e o cliente abre
`/rastreio?token=...` com o estado do envio e o atalho para o CTT.

| Variável                 | Obrigatória | Descrição                                                   |
| ------------------------ | ----------- | ----------------------------------------------------------- |
| `ORDER_PORTAL_SECRET`    | Sim         | Segredo HMAC (mín. 16 caracteres) dos links de rastreio     |
| `TRACKING_ADMIN_TOKEN`   | Sim         | Segredo (mín. 16 caracteres) exigido em `/expedicao`        |
| `PUBLIC_SITE_URL`        | Não         | URL pública para os links; por omissão é inferido do pedido |
| `TRACKING_LINK_TTL_DAYS` | Não         | Validade dos links, de 1 a 30 dias (por omissão 14)         |

Sem `ORDER_PORTAL_SECRET` ou `TRACKING_ADMIN_TOKEN`, o endpoint de tracking rejeita
todos os pedidos (fail-closed).

### Pesquisa de satisfação 8 dias após a compra

Um cron diário às **09:00 UTC** (`/api/cron/nps`, configurado em `vercel.json`) consulta a
Admin API da Shopify e convida as encomendas pagas há **8 a 30 dias** a avaliar a
experiência. O cliente recebe um link assinado para `/avaliar`, escolhe uma nota de **0 a 5**
e pode deixar um comentário. A resposta fica em metafields da própria encomenda
(`uffa_nps.score`, `uffa_nps.comment`, `uffa_nps.answered_at`), sem base de dados.

| Variável                         | Obrigatória | Descrição                                                                     |
| -------------------------------- | ----------- | ----------------------------------------------------------------------------- |
| `SHOPIFY_ADMIN_STORE_DOMAIN`     | Sim         | Domínio `*.myshopify.com` da Admin API (scopes `read_orders`, `write_orders`) |
| `SHOPIFY_ADMIN_ACCESS_TOKEN`     | Sim         | Token da Admin API — **nunca** no cliente                                     |
| `CRON_SECRET`                    | Sim         | Segredo do header `Authorization: Bearer …` do Vercel Cron                    |
| `NPS_SECRET`                     | Não         | Segredo dos links; por omissão usa `ORDER_PORTAL_SECRET`                      |
| `NPS_ENABLED`                    | Sim         | Tem de ser `true` para enviar e-mails; por omissão o cron fica desativado     |
| `NPS_LINK_TTL_DAYS`              | Não         | Validade do link, de 1 a 60 dias (por omissão 30)                             |
| `RESEND_API_KEY` / `RESEND_FROM` | Sim         | Mesmos do e-mail de encomenda                                                 |

Regras de segurança: sem `CRON_SECRET`, `NPS_SECRET` ou credenciais da Shopify os endpoints
rejeitam tudo (fail-closed). Antes de cada envio, `uffa_nps.invited_at` é gravado na
encomenda, pelo que uma segunda execução ou um retry não duplica o convite. O link assinado
só identifica a encomenda e expira; não expõe e-mail nem código de acesso.

Para testar sem enviar nada:

```bash
curl -X GET "http://localhost:8080/api/cron/nps?dryRun=1" \
  -H "Authorization: Bearer $CRON_SECRET"
# devolve { "dryRun": true, "orderNumbers": ["#1002"], ... }

curl -X GET "http://localhost:8080/api/cron/nps" \
  -H "Authorization: Bearer $CRON_SECRET"
# exige NPS_ENABLED=true; envia e marca os convites
```

Detalhes em [`docs/pesquisa-nps.md`](docs/pesquisa-nps.md).

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
- Painel `/operacoes` para atualizar estado, previsão, rastreio, transportador e nota pública (gestão de estados demo).
- Aviso de versão demo no primeiro acesso de cada sessão, em PT/EN/ES.
- Textos em PT/EN/ES, tema claro/escuro e layout mobile-first.

## Rotas

| Rota                            | Descrição                                                |
| ------------------------------- | -------------------------------------------------------- |
| `/`                             | Home com bloco promocional do portal.                    |
| `/catalogo`                     | Catálogo com filtros e categorias sincronizadas.         |
| `/produto/:id`                  | Detalhe do produto.                                      |
| `/checkout`                     | Checkout, entrega e pagamento no checkout Shopify.       |
| `/confirmacao?order=UFFA-XXXXX` | Confirmação demo com código exclusivo e próximos passos. |
| `/rastreio`                     | Portal do cliente.                                       |
| `/expedicao`                    | Registo interno de envio (não indexado).                 |
| `/avaliar?token=…`              | Pesquisa de satisfação da encomenda (não indexada).      |
| `/favoritos`                    | Lista de desejos persistente.                            |
| `/ajuda`                        | Perguntas frequentes, contactos e formulário de apoio.   |

## Dados de demonstração

| Encomenda    | Contacto       | Código exclusivo | Estado              |
| ------------ | -------------- | ---------------- | ------------------- |
| `UFFA-48217` | `demo@uffa.pt` | `UFFA-7K3M-9QX2` | Em trânsito         |
| `UFFA-73104` | `demo@uffa.pt` | `UFFA-2P8N-5RV6` | Pronta para recolha |

Painel de operações: chave `UFFA-OPS-2026`.

O checkout usa a Shopify para dados e pagamento. As encomendas demo acima são as que alimentam a confirmação, o portal e o painel no browser; encomendas concluídas na Shopify não são sincronizadas automaticamente para este armazenamento local.

O aviso de versão demo fecha uma vez por sessão e guarda a dispensa em `sessionStorage` com a chave `uffa-demo-notice-v1`.

> A demonstração guarda encomendas, tentativas e sessões no browser (`localStorage`/`sessionStorage`). Em produção, a validação e a persistência têm de passar para um backend com controlo de acesso, base de dados e auditoria.

## Documentação

- [`docs/manual-site.md`](docs/manual-site.md) — manual funcional completo: rotas, ecrãs, checkout, portal, operações, stock, temas e resolução de problemas.
- [`docs/portal-encomendas.md`](docs/portal-encomendas.md) — arquitetura, modelo de dados, fluxos, segurança e testes.
- [`docs/pesquisa-nps.md`](docs/pesquisa-nps.md) — pesquisa de satisfação aos 8 dias, metafields e operação do cron.
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
- `src/routes/` — páginas (home, catálogo, produto, checkout, confirmação, rastreio, operações)
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

O percurso de demonstração do site está no último slide: `/`, `/catalogo`, `/produto/porto-rose-low`, `/checkout`, `/rastreio` e `/operacoes`. As capturas podem ser atualizadas com o dev server a correr:

```bash
node scripts/capture-screenshots.mjs
```

## Deploy

Cada push para a branch `main` faz deploy automático na Vercel.
