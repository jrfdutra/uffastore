# Portal de Encomendas UFFA

Documentação funcional e técnica da área de cliente criada para a UFFA Store, inspirada no modelo de portal de encomendas do OrbitTrack.

> **Estado atual (23/11/2026).** O portal com os três fatores de acesso, o painel
> `/operacoes` e o dashboard demo foram descontinuados. `/rastreio` tem agora duas
> funções apenas: redirecionar um código de rastreio para o CTT e mostrar a vista
> detalhada de uma encomenda real via link mágico assinado enviado por e-mail.
> As secções abaixo descrevem o desenho histórico e servem de referência.

## 1. Objetivo

Dar ao cliente que comprou um par UFFA um espaço próprio para:

- introduzir o código de rastreio e abrir diretamente a pesquisa oficial do CTT;
- consultar transportador, código de rastreio e previsão na vista do link mágico.

A equipa atualiza o estado e o rastreio na Shopify Admin. O código é preenchido em **Marcar como cumprida** (ou **Adicionar rastreio**) e um webhook envia o e-mail ao cliente.

## 2. Rotas

| Rota                                    | Público | Função                                                                   |
| --------------------------------------- | ------- | ------------------------------------------------------------------------ |
| `/checkout`                             | Cliente | Cria a encomenda, o código exclusivo e o rastreio inicial.               |
| `/confirmacao?order=UFFA-XXXXX`         | Cliente | Mostra o código exclusivo, o rastreio, os itens e os próximos passos.     |
| `/rastreio`                             | Cliente | Campo de código que redireciona para o CTT; vista detalhada via token.    |
| `/rastreio?order=UFFA-XXXXX`            | Cliente | Pré-preenche o código no formulário de rastreio.                         |
| `/rastreio?token=…`                     | Cliente | Vista detalhada assinada da encomenda real (link do e-mail).             |

A home, o header, o menu mobile e o footer têm ligações para `/rastreio`.

> **Nota (18/11/2026).** O painel interno `/operacoes` foi removido por não ser
> utilizado. As referências a esse painel mais abaixo neste documento são
> históricas.

## 3. Jornada do cliente

1. **Compra** — o cliente escolhe envio ou recolha no checkout e conclui os dados e o pagamento no checkout oficial da Shopify.
2. **Confirmação** — a Shopify envia a confirmação por email. Na demonstração, a página `/confirmacao` mostra as encomendas de exemplo guardadas localmente, com número, código exclusivo e, no envio, o código de rastreio.
3. **Acesso** — entra em `/rastreio`, introduz só o código de rastreio e é redirecionado para o CTT.
4. **Acompanhamento** — abre o link mágico do e-mail para ver transportador, previsão, código e botão do CTT.
5. **Conclusão** — o acompanhamento final é feito no CTT; o atendimento pode ser contactado por e-mail.

## 4. Modelo de acesso

O acesso não usa password. Usa três fatores que só o comprador conhece:

| Fator               | Exemplo          | Normalização                                           |
| ------------------- | ---------------- | ------------------------------------------------------ |
| Número da encomenda | `UFFA-48217`     | Maiúsculas, sem espaços; `48217` passa a `UFFA-48217`. |
| Contacto            | `demo@uffa.pt`   | Minúsculas, sem espaços.                               |
| Código exclusivo    | `UFFA-7K3M-9QX2` | Maiúsculas, sem pontuação.                             |

Regras implementadas em `src/lib/orders.ts`:

- **5 tentativas** por número de encomenda.
- Bloqueio de **60 segundos** após a quinta falha.
- Sessão de **30 minutos** em `sessionStorage`.
- O botão **Terminar sessão** limpa a sessão imediatamente.
- Nas encomendas demo, o código exclusivo é gerado localmente com o formato `UFFA-XXXX-XXXX`.
- Os códigos usam um alfabeto sem caracteres ambíguos (`I`, `O`, `0`, `1`).

> **Nota:** esta implementação é uma demonstração local. Em produção, a validação tem de acontecer no servidor, com códigos guardados em hash, rate limiting por IP/conta, sessões assinadas e registo de auditoria.

## 5. Fluxos de estado

### Envio por correio

```text
Confirmada → Em preparação → Enviada → Em trânsito → Entregue
```

### Recolha em mãos

```text
Confirmada → Em preparação → Pronta para recolha → Recolhida
```

### Estado independente

```text
Cancelada
```

O estado `Cancelada` pode ser selecionado no backoffice em qualquer momento. Os estados finais (`Entregue`, `Recolhida`, `Cancelada`) não têm estado seguinte.

Cada mudança de estado acrescenta um evento ao histórico com data/hora. O histórico é apresentado por ordem cronológica inversa no painel e por ordem de progressão na linha temporal do cliente.

## 6. Modelo de dados

Tipos principais em `src/lib/orders.ts`:

```ts
type Order = {
  id: string;
  number: string; // UFFA-48217
  accessCode: string; // UFFA-7K3M-9QX2
  contact: string; // email ou telefone usado na compra
  customerName: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  delivery: "shipping" | "pickup";
  address: string | null;
  payment: "mbway" | "apple";
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  trackingCode: string | null;
  carrier: string | null;
  estimatedDelivery: string | null;
  pickupLocation: string | null;
  notes: string | null;
  events: OrderEvent[];
  isDemo: boolean;
};

type OrderItem = {
  productId: string;
  name: string;
  size: number;
  quantity: number;
  unitPrice: number;
};

type OrderEvent = {
  id: string;
  status: OrderStatus;
  at: string;
  message: string | null;
  location: string | null;
};
```

### Regras de negócio

- Portes de envio: **8,94 €** em Portugal Continental e Ilhas, **24,00 €** na União Europeia e **34,00 €** na Suíça. Recolha em mãos no Porto: **grátis**.
- Previsão inicial: **3 dias** para envio, **1 dia** para recolha.
- O número da encomenda é gerado com 5 dígitos e verificado contra duplicados.
- O código de rastreio inicial tem o formato `PT-<5 dígitos>-<4 caracteres>`.
- Em `/rastreio`, qualquer código introduzido abre a pesquisa oficial do CTT com `objects=<código>&request_locale=pt`.
- Para encomendas reais da Shopify, a Shopify envia `orders/fulfilled` (ou `orders/updated`); o servidor cria um `/rastreio?token=...` assinado por HMAC e envia-o por Resend. `/expedicao` é apenas fallback manual.
- A confirmação de receção só é apresentada enquanto a encomenda não estiver num estado final.

## 7. Persistência local

| Chave                    | Onde             | Conteúdo                                       |
| ------------------------ | ---------------- | ---------------------------------------------- |
| `uffa-orders-v1`         | `localStorage`   | Lista de encomendas e histórico.               |
| `uffa-order-attempts-v1` | `localStorage`   | Tentativas falhadas e bloqueios por encomenda. |
| `uffa-order-session-v1`  | `sessionStorage` | Sessão do cliente com expiração de 30 minutos. |
| `uffa-cart`              | `localStorage`   | Carrinho (já existente na loja).               |
| `uffa-theme`             | `localStorage`   | Tema claro/escuro (já existente na loja).      |

Na primeira visita, `loadOrders()` cria duas encomendas de demonstração.

## 8. Dados de demonstração

### Encomendas

| Encomenda    | Contacto       | Código exclusivo | Estado              | Entrega            |
| ------------ | -------------- | ---------------- | ------------------- | ------------------ |
| `UFFA-48217` | `demo@uffa.pt` | `UFFA-7K3M-9QX2` | Em trânsito         | Envio, 2 pares     |
| `UFFA-73104` | `demo@uffa.pt` | `UFFA-2P8N-5RV6` | Pronta para recolha | Recolha, 1 par     |

### Painel de operações

> **Âmbito da demo:** a confirmação e o portal leem as encomendas guardadas em `uffa-orders-v1`. Encomendas concluídas na Shopify não são sincronizadas automaticamente para este armazenamento local.

> **Nota (18/11/2026).** O painel de operações foi removido por não ser utilizado.

## 9. Responsividade e idiomas

- Layout mobile-first com navegação própria para telemóvel.
- Linha temporal vertical em ecrãs pequenos e horizontal em ecrãs grandes.
- Grelhas de resumo e detalhes passam a uma coluna em mobile.
- Textos em PT, EN e ES através de `tr(language, pt, en, es)` em `src/lib/i18n.ts`.
- Tema claro e escuro suportados pelo sistema de temas existente.

## 10. Produção: o que falta

A demonstração usa `localStorage` para ser fácil de apresentar sem infraestrutura. Para produção, o modelo recomendado é:

1. **Base de dados** PostgreSQL com tabelas `orders`, `order_items`, `order_events` e `order_access_attempts`.
2. **API no servidor** para criar encomendas, validar acessos, validar a assinatura/integridade e deduplicar os webhooks `orders/paid`, e atualizar estados.
3. **Códigos em hash** — o código exclusivo nunca deve ser guardado em texto simples.
4. **Sessões assinadas** com cookies `HttpOnly`, `Secure` e `SameSite`.
5. **Rate limiting** por IP, por encomenda e por conta, com bloqueio progressivo.
6. **Acesso da equipa ao backend** com roles (`admin`, `operations`, `support`) e MFA.
7. **Auditoria imutável** de todas as alterações de estado, com utilizador, timestamp e motivo.
8. **Emails transacionais** no checkout, na mudança de estado e na confirmação de receção.
9. **Integração com transportador** para atualizar o rastreio automaticamente.
10. **RGPD** — retenção, minimização, direito ao apagamento e registo de acessos.

## 11. Testes manuais

Checklist usada na validação:

- [x] Abrir `/rastreio`, preencher os dados demo e entrar.
- [x] Confirmar que a linha temporal mostra o estado atual e os eventos anteriores.
- [x] Confirmar receção e confirmar que o estado passa a `Entregue`.
- [x] Recarregar a página e confirmar que a sessão e o estado se mantêm.
- [x] Terminar sessão e confirmar que o dashboard deixa de estar acessível.
- [x] Testar o portal em viewport mobile (390 px).

Comandos de validação:

```bash
npm run build
npx tsc --noEmit
npx eslint src/lib/orders.ts src/routes/rastreio.tsx src/routes/checkout.tsx src/routes/confirmacao.tsx src/components/order-portal-promo.tsx
```

> O lint global ainda reporta problemas pré-existentes de formatação/CRLF em ficheiros não alterados. Os ficheiros novos e modificados estão formatados.

## 12. Capturas

As capturas usadas na apresentação estão em `docs/assets/screenshots/` e os recortes em `docs/assets/screenshots/crops/`.

| Ficheiro                    | Conteúdo                                       |
| --------------------------- | ---------------------------------------------- |
| `01-home.png`               | Home completa com o bloco de portal.           |
| `02-home-portal-promo.png`  | Bloco “O teu par não desaparece”.              |
| `06-confirmacao.png`        | Confirmação com código exclusivo e rastreio.   |
| `07-rastreio-acesso.png`    | Formulário de acesso ao portal.                |
| `08-rastreio-dashboard.png` | Dashboard de envio completo.                   |
| `15-rastreio-recolha.png`   | Dashboard de recolha pronta.                   |
| `14-rastreio-mobile.png`    | Portal em viewport mobile.                     |

## 13. Ficheiros principais

| Ficheiro                                | Responsabilidade                                                        |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `src/lib/orders.ts`                     | Modelo, dados demo, persistência, validação de acesso, estados e códigos exclusivos. |
| `src/lib/i18n.ts`                       | Helper de tradução inline PT/EN/ES.                                     |
| `src/routes/rastreio.tsx`               | Portal do cliente e dashboard.                                          |
| `src/routes/checkout.tsx`               | Criação da encomenda no checkout.                                       |
| `src/routes/confirmacao.tsx`            | Confirmação e próximos passos.                                          |
| `src/components/order-portal-promo.tsx` | Bloco promocional na home.                                              |
| `src/components/site-shell.tsx`         | Header, footer e menu mobile.                                           |
| `scripts/capture-screenshots.mjs`       | Captura automatizada das imagens da documentação.                       |
| `scripts/build-apresentacao.mjs`        | Geração da apresentação PowerPoint.                                     |
