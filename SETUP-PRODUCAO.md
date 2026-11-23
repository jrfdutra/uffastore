# Pôr o e-mail automático a funcionar em produção

Estado em 21/11/2026. O código, o deploy e o CI estão prontos. Falta apenas
configurar credenciais — nada disso pode ser feito por API.

## Configuração concluída em 23/11/2026

Variáveis aplicadas na Vercel (projecto `uffastore`, 16 no total, sem duplicados):
`PUBLIC_SITE_URL`, `ORDER_PORTAL_SECRET`, `TRACKING_ADMIN_TOKEN`,
`TRACKING_LINK_TTL_DAYS`, `CRON_SECRET`, `NPS_SECRET`,
`NPS_LINK_TTL_DAYS`, `NPS_ENABLED=false`, `RESEND_FROM=UFFA Store
<atendimento@uffastore.pt>`, `SHOPIFY_WEBHOOK_SECRET`,
`SHOPIFY_ADMIN_STORE_DOMAIN` e `SHOPIFY_ADMIN_ACCESS_TOKEN`.

Verificações em produção após redeploy:

- `GET /api/orders/tracking?token=…` → **200** com os dados da encomenda;
- `POST /api/webhooks/shopify/orders-fulfilled` com assinatura válida →
  **200 `emailSent: true`** (e-mail de teste enviado para `atendimento@uffastore.pt`);
- `GET /api/cron/nps?dryRun=1` com `CRON_SECRET` → **200**, janela calculada,
  `scanned: 0`;
- `RESEND_FROM` passou a usar o domínio verificado.

Falta apenas fazer a encomenda real de teste e revogar os tokens da Vercel
que apareceram no chat.

## Resend verificado em 23/11/2026

O domínio `uffastore.pt` está **verified** na Resend (disparado pela API após
confirmação dos registos DNS no NS autoritativo). O `RESEND_FROM` local e o
`.env.example` já usam `UFFA Store <atendimento@uffastore.pt>`. Falta apenas
actualizar o valor na Vercel.

## Diagnóstico em 23/11/2026

Verificação feita contra a produção (`www.uffastore.pt`):

- `GET /api/orders/tracking?token=…` → **503 `tracking_not_configured`**:
  falta `ORDER_PORTAL_SECRET` na Vercel. Sem isto, o webhook de expedição não
  consegue gerar o link e o cliente não recebe o e-mail.
- `GET /api/cron/nps` → **503 `cron_not_configured`**: falta `CRON_SECRET`.
- Pedido assinado com o `SHOPIFY_WEBHOOK_SECRET` do `.env` local ao endpoint
  de fulfillment → **401**: o segredo configurado em produção é outro (ou
  não está configurado). Confirmar no painel da Shopify e copiar exactamente
  para a Vercel.
- `resend._domainkey.uffastore.pt` e `send.uffastore.pt` não existem no DNS.
  O domínio foi criado na Resend (id `8c2e2abc-1216-4edd-a9fc-24592cc72c79`,
  estado `not_started`); os registos exactos estão no passo 1 abaixo.

Valores aleatórios para as variáveis em falta foram gerados em
`C:\Users\devel\AppData\Local\Temp\opencode\vercel-variaveis-uffa.txt`
(ficheiro local, não versionado).

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

## Passo 1 — Resend: verificar o domínio

O domínio `uffastore.pt` já foi criado na Resend (23/11/2026). No gestor de DNS
do domínio, adicionar exactamente estes quatro registos:

| Tipo  | Nome                 | Valor                                            |
| ----- | -------------------- | ------------------------------------------------ |
| TXT   | `resend._domainkey`  | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC6K04bUw+QuOcyKXyzHeucx+cNLplN6vR5wQ6LtjHZJA/gQNt6iUjSsTahSCnuWTwljLZzcjGQ6osiZU22JmZJS2IDXv7FgqZnh3L9IU7AnIAazeErH85y3m7fr3/NoaCvEz/w4ordLRZwU557siTrGZ05V4fdfo6sxqxhy6dCMQIDAQAB` |
| MX    | `send`               | `feedback-smtp.eu-west-1.amazonses.com`          |
| TXT   | `send`               | `v=spf1 include:amazonses.com ~all`              |
| CNAME | `rsend`              | `send.forge.rmta.net`                            |

Depois carregar em **Verify** em [resend.com/domains](https://resend.com/domains)
e esperar pelo estado **Verified**. Só então trocar `RESEND_FROM` para
`UFFA Store <atendimento@uffastore.pt>`.

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

## Passo 3b — Locais de recolha na Shopify

Os três pontos de recolha do checkout (**NorteShopping**, **Maia Jardim**,
**MarShopping**) passam a existir como localizações da Shopify, para o cliente
ver o local escolhido no checkout oficial. O antigo local de expedição
(**Rua Alcino de Araújo**) deixa de ser ponto de recolha, mas mantém-se ativo
para não partir o stock que lá está.

A app da Shopify precisa do scope `write_locations` (o token atual só tem
`read_locations`). Em **Shopify Admin → Definições → Apps → [app UFFA] →
Permissões/Scopes**, ativa `write_locations`, reinstala a app e copia o novo
token para `SHOPIFY_ADMIN_ACCESS_TOKEN` no `.env`. Depois:

```bash
node scripts/setup-pickup-locations.mjs --dry-run  # mostra o que vai fazer
node scripts/setup-pickup-locations.mjs            # cria/ativa os três e desativa a recolha antiga
```

O script é idempotente: se os locais já existirem, só garante que a recolha está
ativa neles. Também podes criar os três em **Shopify Admin → Definições →
Localizações** com as moradas públicas dos centros comerciais e ativar
**Local pickup** em cada um — o site encontra-os pelo nome e usa o ID numérico
de cada um como `pickupHandle` do local que o cliente escolheu.

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
