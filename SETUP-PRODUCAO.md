# Pôr o e-mail automático a funcionar em produção

Estado em 21/11/2026. O código, o deploy e o CI estão prontos. Falta apenas
configurar credenciais — nada disso pode ser feito por API.

## O que já está feito

- Endpoint `POST /api/webhooks/shopify/orders-paid` em produção, com HMAC,
  validação de tópico, anti-replay e limite de payload.
- Webhook `orders/paid` registado na Shopify:
  `gid://shopify/WebhookSubscription/2578023252316` →
  `https://www.uffastore.pt/api/webhooks/shopify/orders-paid`
- Endpoint `POST /api/webhooks/shopify/orders-fulfilled` para envio automático
  quando a encomenda é marcada como enviada com código de rastreio.
- Webhook `orders/fulfilled` registado na Shopify:
  `gid://shopify/WebhookSubscription/2579990839644` →
  `https://www.uffastore.pt/api/webhooks/shopify/orders-fulfilled`
- Webhook `orders/updated` registado no mesmo endpoint:
  `gid://shopify/WebhookSubscription/2579994804572` →
  `https://www.uffastore.pt/api/webhooks/shopify/orders-fulfilled`
  (cobre o código adicionado depois de marcar como cumprida)
- Código commitado em `main`, CI verde, deploy ativo.

## Onde preencher o código de rastreio

**Shopify Admin → Encomendas → abrir a encomenda → Marcar como cumprida →
Número de rastreio → Cumprir.**

Na Shopify, o número de rastreio é introduzido no formulário de **cumprimento**
(fulfillment) da encomenda, juntamente com o transportador. Assim que confirmas,
a Shopify dispara `orders/fulfilled` e a loja envia o e-mail ao cliente com o
código, o atalho para o CTT e o link de rastreio — sem passar por `/expedicao`.

Se a encomenda já tinha sido marcada como cumprida sem código, abre a encomenda,
**Adicionar rastreio** (ou edita o cumprimento) e guarda o número. O tópico
`orders/updated` dispara o mesmo envio automático; não é preciso voltar a `/expedicao`.

O formulário manual continua em `https://www.uffastore.pt/expedicao`, para
reenvios ou correções; exige o `TRACKING_ADMIN_TOKEN`.

## Passo 1 — Resend: verificar o domínio (amanhã)

1. [resend.com/domains](https://resend.com/domains) → **Add Domain** → `uffastore.pt`.
2. Copiar os registos DNS (DKIM + SPF/MX) para o gestor do domínio.
3. Esperar por **Verified**.

> Sem isto, o Resend só entrega ao e-mail dono da conta. Para clientes é obrigatório.
>
> Verificas o **domínio** `uffastore.pt`, não uma caixa de correio. Depois podes
> enviar de `atendimento@uffastore.pt` — a caixa que já tens. Não é preciso criar
> `encomendas@` nem qualquer outro endereço.

## Passo 2 — Shopify: copiar o Signing secret

1. Shopify Admin → **Definições → Notificações → Webhooks**.
2. Abrir `orders/paid` (ou `orders/fulfilled`).
3. Copiar o **Signing secret**.

> A API da Shopify não expõe nem permite definir este segredo (confirmado por
> introspeção do schema). Só aparece no painel. Os webhooks criados pela mesma
> app partilham o segredo; se o painel mostrar valores diferentes, confirma o
> valor usado em `SHOPIFY_WEBHOOK_SECRET` antes de testar o fulfillment.

## Passo 3 — Vercel: variáveis de ambiente

**Settings → Environment Variables** (Production):

E-mail de encomenda:

| Nome                     | Valor                                                                   |
| ------------------------ | ----------------------------------------------------------------------- |
| `SHOPIFY_WEBHOOK_SECRET` | segredo do passo 2                                                      |
| `RESEND_API_KEY`         | chave `re_...` do Resend                                                |
| `RESEND_FROM`            | `UFFA Store <atendimento@uffastore.pt>` (depois de verificar o domínio) |
| `SHOPIFY_SHOP_DOMAIN`    | `uffastore.myshopify.com`                                               |

Registo de envio e link mágico de rastreio:

| Nome                     | Valor                                                   |
| ------------------------ | ------------------------------------------------------- |
| `ORDER_PORTAL_SECRET`    | segredo HMAC (mín. 16 caracteres) dos links de rastreio |
| `TRACKING_ADMIN_TOKEN`   | segredo (mín. 16 caracteres) exigido em `/expedicao`    |
| `PUBLIC_SITE_URL`        | `https://www.uffastore.pt`                              |
| `TRACKING_LINK_TTL_DAYS` | `14`                                                    |

Pesquisa de satisfação 8 dias após a compra:

| Nome                         | Valor                                                          |
| ---------------------------- | -------------------------------------------------------------- |
| `SHOPIFY_ADMIN_STORE_DOMAIN` | `uffastore.myshopify.com`                                      |
| `SHOPIFY_ADMIN_ACCESS_TOKEN` | token da Admin API com `read_orders` e `write_orders`          |
| `CRON_SECRET`                | valor longo e aleatório enviado pelo Vercel Cron               |
| `NPS_SECRET`                 | valor longo e aleatório; pode reutilizar `ORDER_PORTAL_SECRET` |
| `NPS_ENABLED`                | `false` até o domínio Resend estar verificado; depois `true`   |
| `NPS_LINK_TTL_DAYS`          | `30`                                                           |

Enquanto o domínio não estiver verificado, usa `onboarding@resend.dev` — mas
só recebes tu os e-mails. O cron da pesquisa corre às 09:00 UTC e, sem
`NPS_ENABLED=true`, responde `nps_disabled` sem enviar nada.

> O `scripts/setup-vercel.mjs` configura apenas as quatro variáveis base do
> e-mail. As restantes devem ser definidas em **Environment Variables** ou
> adicionadas ao array `vars` desse script.

## Passo 4 — Redeploy

**Deployments → ⋯ → Redeploy** (sem cache). As variáveis só entram num deploy novo.

## Passo 5 — Validar

```bash
# 1) Estado geral (Shopify, Resend, produção)
node scripts/status-producao.mjs

# 2) Prova de que o segredo está correto nos dois endpoints (não envia e-mail)
WEBHOOK_SECRET="o-signing-secret" node scripts/status-producao.mjs

# 3) Envio real de ponta a ponta (orders/paid)
WEBHOOK_SECRET="o-signing-secret" node scripts/status-producao.mjs --send

# 4) Ensaio do cron da pesquisa: sem e-mails e sem metafields escritos
curl -s -H "Authorization: Bearer $CRON_SECRET" \
  "https://www.uffastore.pt/api/cron/nps?dryRun=1"
```

O passo 3 envia um e-mail de teste para `junior.dutra.pt@gmail.com`. O passo 4
devolve `{ "dryRun": true, ... }` com a janela de 8 a 30 dias e os números das
encomendas que seriam convidadas. Depois de confirmar o domínio no Resend,
muda `NPS_ENABLED` para `true`, faz redeploy e chama o mesmo endpoint sem
`?dryRun=1` para enviar os convites.

Para validar a automação de expedição, faz uma encomenda real de teste, abre-a
em Shopify Admin → **Encomendas** e marca como cumprida com um código de rastreio
de teste. Confirma que chega o e-mail "Encomenda UFFA … foi enviada" e que o link
abre a vista detalhada em `/rastreio`. Se o domínio Resend ainda não estiver
verificado, usa o link apresentado em `/expedicao` como fallback.

## Se quiseres que eu automatize a Vercel

A Vercel tem API, mas esta máquina não tem token. Se criares um token em
[vercel.com/account/tokens](https://vercel.com/account/tokens) e o colocares no
`.env` local como `VERCEL_TOKEN=...`, eu consigo configurar as variáveis e
disparar o redeploy por script, sem passares pelo painel:

```bash
node scripts/setup-vercel.mjs           # ensaio: mostra o que faria
node scripts/setup-vercel.mjs --apply   # aplica + redeploy
```

> O `.env` está no `.gitignore`; nada disso é commitado.
