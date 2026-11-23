# Pesquisa de satisfação — 8 dias após a compra

O objetivo é medir a experiência de compra sem base de dados nova: as respostas ficam na
própria encomenda da Shopify, como metafields.

## Fluxo

1. Todos os dias às **09:00 UTC**, o Vercel Cron chama `GET /api/cron/nps` com
   `Authorization: Bearer $CRON_SECRET`.
2. O endpoint consulta a Admin API da Shopify (`read_orders`) e percorre as encomendas
   ordenadas por `PROCESSED_AT`, do mais recente para o mais antigo.
3. É elegível uma encomenda que:
   - tenha sido paga entre **8 e 30 dias** antes da execução (a janela de 30 dias
     protege contra dias em que o cron não correu);
   - esteja com `displayFinancialStatus = PAID` e não esteja cancelada;
   - tenha e-mail válido;
   - não tenha `uffa_nps.invited_at` nem `uffa_nps.score`.
4. Antes de enviar, o servidor grava `uffa_nps.invited_at` (`write_orders`). Essa marcação
   evita duplicados; um único disparo por instância impede execuções sobrepostas
   (`409 nps_run_in_progress`). Se o e-mail falhar, a marcação é removida e a encomenda
   fica elegível para nova tentativa — o falhanço aparece nos logs e nos campos `failed`
   e `pendingRetry` da resposta do cron.
5. O Resend envia um link assinado `https://www.uffastore.pt/avaliar?token=…`.
6. O cliente escolhe uma nota de **0 a 5** e, opcionalmente, escreve um comentário.
   `POST /api/nps` valida o token e grava a resposta.
7. O Resend envia uma notificação interna para **atendimento@uffastore.pt** com o nº da
   encomenda, a nota, o comentário e o e-mail do cliente (usado como `reply_to`). O envio é
   best-effort: se falhar, a resposta já guardada continua válida e o erro vai para o log.

## Escala

A escala pedida é de **0 a 5**, com legends explícitas na página (0 = muito insatisfeita,
5 = muito satisfeita). Para acompanhamento, o mais simples é calcular a média das notas e a
percentagem de notas 4–5 a partir dos metafields; não é um NPS clássico de 0–10.

## Metafields na encomenda

| Namespace / chave      | Tipo                    | Quando é escrito | Conteúdo                         |
| ---------------------- | ----------------------- | ---------------- | -------------------------------- |
| `uffa_nps.invited_at`  | `date_time`             | Antes do envio   | Data/hora UTC do convite         |
| `uffa_nps.score`       | `number_integer`        | Resposta         | Nota de 0 a 5                    |
| `uffa_nps.answered_at` | `date_time`             | Resposta         | Data/hora UTC da resposta        |
| `uffa_nps.comment`     | `multi_line_text_field` | Resposta         | Comentário (até 1000 caracteres) |

Um comentário vazio não apaga um comentário anterior. É possível submeter outra resposta
com o mesmo link; os metafields são atualizados (upsert).

### Consultar resultados

Na Shopify Admin não é preciso instalar nada: os metafields pertencem à app e podem ser
lidos pela Admin API. Exemplo de consulta GraphQL:

```graphql
query {
  orders(first: 50, sortKey: PROCESSED_AT, reverse: true) {
    nodes {
      name
      processedAt
      metafields(first: 20, namespace: "uffa_nps") {
        nodes {
          key
          value
        }
      }
    }
  }
}
```

## Endpoints

| Endpoint           | Método      | Autenticação                          | Finalidade                            |
| ------------------ | ----------- | ------------------------------------- | ------------------------------------- |
| `/api/cron/nps`    | GET ou POST | `Authorization: Bearer <CRON_SECRET>` | Disparo diário; `?dryRun=1` não envia |
| `/api/nps?token=…` | GET         | Token assinado na query               | Carregar dados da pesquisa            |
| `/api/nps`         | POST        | Token assinado no corpo               | Guardar nota e comentário             |

Respostas relevantes do cron: `nps_disabled` (falta `NPS_ENABLED=true`),
`nps_not_configured` (falta segredo), `cron_not_configured` (falta `CRON_SECRET`
com pelo menos 16 caracteres), `nps_run_in_progress` (já existe um disparo em curso),
`shopify_error` (falha na Admin API). Todas as rotas são fail-closed.

## Configuração na Vercel

`vercel.json` já contém:

```json
{ "crons": [{ "path": "/api/cron/nps", "schedule": "0 9 * * *" }] }
```

Variáveis a definir no projeto (Environment Variables):

- `SHOPIFY_ADMIN_STORE_DOMAIN` — domínio `*.myshopify.com`
- `SHOPIFY_ADMIN_ACCESS_TOKEN` — token da Admin API com `read_orders` e `write_orders`
- `CRON_SECRET` — valor aleatório com pelo menos 16 caracteres; a Vercel envia-o
  automaticamente no header
- `NPS_SECRET` — opcional; se omitido usa `ORDER_PORTAL_SECRET`
- `NPS_ENABLED=true` — **só depois** de confirmar que o domínio do Resend está verificado
- `NPS_LINK_TTL_DAYS` — opcional, 1–60 (por omissão 30)
- `RESEND_API_KEY` e `RESEND_FROM` — já usados pelas outras mensagens

Depois de alterar variáveis, fazer **Redeploy**. Enquanto `NPS_ENABLED` não for `true`, o
cron responde `503 nps_disabled` e não envia nada.

## Operação

- **Ensaio sem efeitos:** `GET /api/cron/nps?dryRun=1` com o header do cron. Devolve a
  janela calculada e os números das encomendas que seriam convidadas; não escreve
  metafields nem envia e-mails.
- **Disparo real:** `GET /api/cron/nps` com o header e `NPS_ENABLED=true`.
- **Reenvio manual:** retirar/alterar `uffa_nps.invited_at` da encomenda e voltar a chamar
  o cron dentro da janela dos 30 dias.
- **Queixa de link expirado:** gerar um novo link com o mesmo formato a partir do ID da
  encomenda (a página `/avaliar` também orienta para `atendimento@uffastore.pt`).

## Privacidade

O e-mail identifica-se como pesquisa de satisfação, diz quanto demora e permite ignorar
a mensagem sem consequências. O link não contém e-mail, morada nem código de acesso ao
portal; contém apenas o ID interno da encomenda, um timestamp e uma assinatura HMAC. A
página é `noindex, nofollow`. Os comentários são texto livre do cliente — devem ser
tratados como dados pessoais e usados apenas para melhorar o serviço.
