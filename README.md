# Uffa Store

Loja online da Uffa Store: catálogo em tempo real da Shopify, checkout seguro, recolha no Porto, envio e acompanhamento de encomendas.

## Estado

Produção: [www.uffastore.pt](https://www.uffastore.pt)  
Repositório: `main` · deploy automático na Vercel.

A loja usa a Shopify como única fonte de verdade para produtos, preços, stock e códigos de desconto. O site não contém catálogo fictício, avisos de demonstração, testemunhos falsos nem descontos calculados no browser.

## Requisitos

- Node 24+
- Conta Shopify com Storefront API pública
- Resend para e-mails transacionais

## Configuração

Copiar `.env.example` para `.env` e preencher:

- `VITE_SHOPIFY_STORE_DOMAIN`
- `VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN`
- `SHOPIFY_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM`
- `PUBLIC_SITE_URL`
- `ORDER_PORTAL_SECRET`, `TRACKING_ADMIN_TOKEN`
- `SHOPIFY_ADMIN_ACCESS_TOKEN`, `CRON_SECRET` (opcionais, para NPS e operações)

**Nunca** gravar o token Admin da Shopify no cliente ou em ficheiros versionados.

## Comandos

```bash
npm install
npm run dev        # http://127.0.0.1:8080
npm run typecheck
npm run lint
npm test
npm run build
```

## Rotas principais

| Rota                      | Função                         |
| ------------------------- | ------------------------------ |
| `/`                       | Home e campanhas               |
| `/catalogo`               | Catálogo com filtros           |
| `/produto/:id`            | Ficha de produto               |
| `/checkout`               | Entrega e pagamento na Shopify |
| `/confirmacao`            | Resumo da encomenda            |
| `/rastreio`               | Pesquisa CTT e link assinado   |
| `/ajuda`                  | Contacto com anexo opcional    |
| `/avaliar`                | Pesquisa de satisfação         |
| `/privacidade`, `/termos` | Informação legal               |
| `/manual`                 | Guia interno do site           |

## Formulários e segurança

- Contacto, pedido de produto e newsletter passam por endpoints próprios com validação de corpo, Origem/Referer, limite de tamanho, honeypot e rate limit por IP.
- Webhooks da Shopify verificam HMAC, loja e tópico, com deduplicação.
- Links de rastreio e avaliação são assinados e expiram.
- E-mails são enviados por Resend; os logs não contêm e-mails de clientes.

## Entregáveis

- `docs/RELATORIO.md` — relatório final com produtos.
- `docs/mapa-site.pdf` — mapa e documentação do site.
- `docs/apresentacao-site-uffa.pptx` — apresentação final.
- `docs/assets/instagram/slide-*.png` — carrossel instrutivo.

Para regenerar:

```bash
node scripts/build-relatorio.mjs
node scripts/build-mapa-pdf.mjs
node scripts/build-apresentacao-site.mjs
node scripts/generate-instagram-carousel.mjs
```

## Dados legais

`src/lib/legal.ts` mantém `NIF` e `phone` como «A preencher» até o titular fornecer os valores. A caixa de atendimento confirmada é `atendimento@uffastore.pt`.
