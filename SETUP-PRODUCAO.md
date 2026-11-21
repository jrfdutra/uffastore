# Pôr o e-mail automático a funcionar em produção

Estado em 21/11/2026. O código, o deploy e o CI estão prontos. Falta apenas
configurar credenciais — nada disso pode ser feito por API.

## O que já está feito

- Endpoint `POST /api/webhooks/shopify/orders-paid` em produção, com HMAC,
  validação de tópico, anti-replay e limite de payload.
- Webhook `orders/paid` registado na Shopify:
  `gid://shopify/WebhookSubscription/2578023252316` →
  `https://www.uffastore.pt/api/webhooks/shopify/orders-paid`
- Código commitado em `main`, CI verde, deploy ativo.

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
2. Abrir `orders/paid`.
3. Copiar o **Signing secret**.

> A API da Shopify não expõe nem permite definir este segredo (confirmado por
> introspeção do schema). Só aparece no painel.

## Passo 3 — Vercel: variáveis de ambiente

**Settings → Environment Variables** (Production):

| Nome                     | Valor                                                                   |
| ------------------------ | ----------------------------------------------------------------------- |
| `SHOPIFY_WEBHOOK_SECRET` | segredo do passo 2                                                      |
| `RESEND_API_KEY`         | chave `re_...` do Resend                                                |
| `RESEND_FROM`            | `UFFA Store <atendimento@uffastore.pt>` (depois de verificar o domínio) |
| `SHOPIFY_SHOP_DOMAIN`    | `uffastore.myshopify.com`                                               |

Enquanto o domínio não estiver verificado, usa `onboarding@resend.dev` — mas
só recebes tu os e-mails.

## Passo 4 — Redeploy

**Deployments → ⋯ → Redeploy** (sem cache). As variáveis só entram num deploy novo.

## Passo 5 — Validar

```bash
# 1) Estado geral (Shopify, Resend, produção)
node scripts/status-producao.mjs

# 2) Prova de que o segredo de produção está correto (não envia e-mail)
WEBHOOK_SECRET="o-signing-secret" node scripts/status-producao.mjs

# 3) Envio real de ponta a ponta
WEBHOOK_SECRET="o-signing-secret" node scripts/status-producao.mjs --send
```

O passo 3 envia um e-mail de teste para `junior.dutra.pt@gmail.com`.

## Se quiseres que eu automatize a Vercel

A Vercel tem API, mas esta máquina não tem token. Se criares um token em
[vercel.com/account/tokens](https://vercel.com/account/tokens) e o colocares no
`.env` local como `VERCEL_TOKEN=...`, eu consigo configurar as variáveis e
disparar o redeploy por script, sem passares pelo painel.

> O `.env` está no `.gitignore`; nada disso é commitado.
