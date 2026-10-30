# Portal de Encomendas UFFA

Documentação funcional e técnica da área de cliente criada para a UFFA Store, inspirada no modelo de portal público e certificação do OrbitTrack.

## 1. Objetivo

Dar ao cliente que comprou um par UFFA um espaço próprio para:

- acompanhar o estado de um envio ou de uma recolha na loja do Porto;
- consultar transportador, código de rastreio, previsão e nota pública da loja;
- confirmar a receção ou a recolha;
- consultar o código de autenticidade de cada par e validá-lo publicamente;
- manter o acesso protegido por três fatores, sem criar uma conta tradicional.

A área interna de operações permite à equipa atualizar o estado, o rastreio, a previsão e a nota pública. Todas as alterações ficam registadas no histórico visível ao cliente.

## 2. Rotas

| Rota                                    | Público       | Função                                                                                  |
| --------------------------------------- | ------------- | --------------------------------------------------------------------------------------- |
| `/checkout`                             | Cliente       | Cria a encomenda, o código exclusivo, os códigos de autenticidade e o rastreio inicial. |
| `/confirmacao?order=UFFA-XXXXX`         | Cliente       | Mostra o código exclusivo, o rastreio, os itens e os próximos passos.                   |
| `/rastreio`                             | Cliente       | Entrada no portal com número da encomenda, contacto e código exclusivo.                 |
| `/rastreio?order=UFFA-XXXXX`            | Cliente       | Pré-preenche o número da encomenda no formulário de acesso.                             |
| `/verificar`                            | Público       | Valida um código de autenticidade sem expor dados pessoais.                             |
| `/verificar?codigo=UFFA-AUTH-XXXX-XXXX` | Público       | Abre o resultado da verificação diretamente a partir de um link.                        |
| `/operacoes`                            | Equipa (demo) | Painel interno para gerir estados, rastreio, previsão e notas.                          |

A home, o header, o menu mobile e o footer têm ligações para `/rastreio`, `/verificar` e `/operacoes`.

## 3. Jornada do cliente

1. **Compra** — o cliente escolhe envio ou recolha no checkout e confirma o pagamento MB WAY simulado.
2. **Confirmação** — recebe o número da encomenda, o código exclusivo e, no envio, o código de rastreio.
3. **Acesso** — entra em `/rastreio` com três dados: número da encomenda, contacto usado na compra e código exclusivo.
4. **Acompanhamento** — vê o estado atual, a linha temporal, os detalhes de entrega ou recolha, os itens e o resumo.
5. **Conclusão** — confirma a receção (envio) ou a recolha (loja). O estado passa a `Entregue` ou `Recolhida`.
6. **Autenticidade** — em qualquer momento, valida o código de cada par em `/verificar`.

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
- O código exclusivo é gerado no checkout com o formato `UFFA-XXXX-XXXX`.
- Os códigos usam um alfabeto sem caracteres ambíguos (`I`, `O`, `0`, `1`).
- A verificação de autenticidade não revela nome, contacto ou morada do comprador.

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

O estado `Cancelada` pode ser selecionado no painel de operações em qualquer momento. Os estados finais (`Entregue`, `Recolhida`, `Cancelada`) não têm estado seguinte.

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
  authCode: string; // UFFA-AUTH-XXXX-XXXX
  serial: string; // UFFA-2026-104287
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

- Portes de envio: **7,00 €**. Recolha: **grátis**.
- Previsão inicial: **3 dias** para envio, **1 dia** para recolha.
- Cada linha do carrinho recebe um código de autenticidade e um número de série próprios.
- O número da encomenda é gerado com 5 dígitos e verificado contra duplicados.
- O código de rastreio inicial tem o formato `PT-<5 dígitos>-<4 caracteres>`.
- A confirmação de receção só é apresentada enquanto a encomenda não estiver num estado final.

## 7. Persistência local

| Chave                    | Onde             | Conteúdo                                       |
| ------------------------ | ---------------- | ---------------------------------------------- |
| `uffa-orders-v1`         | `localStorage`   | Lista de encomendas e histórico.               |
| `uffa-order-attempts-v1` | `localStorage`   | Tentativas falhadas e bloqueios por encomenda. |
| `uffa-order-session-v1`  | `sessionStorage` | Sessão do cliente com expiração de 30 minutos. |
| `uffa-ops-session-v1`    | `sessionStorage` | Sessão do painel de operações.                 |
| `uffa-cart`              | `localStorage`   | Carrinho (já existente na loja).               |
| `uffa-theme`             | `localStorage`   | Tema claro/escuro (já existente na loja).      |

Na primeira visita, `loadOrders()` cria três encomendas de demonstração. O botão **Repor demo** em `/operacoes` volta a criar esses dados.

## 8. Dados de demonstração

### Encomendas

| Encomenda    | Contacto       | Código exclusivo | Estado              | Entrega                  |
| ------------ | -------------- | ---------------- | ------------------- | ------------------------ |
| `UFFA-48217` | `demo@uffa.pt` | `UFFA-7K3M-9QX2` | Em trânsito         | Envio, 2 pares, 251,00 € |
| `UFFA-73104` | `demo@uffa.pt` | `UFFA-2P8N-5RV6` | Pronta para recolha | Recolha, 1 par, 219,00 € |
| `UFFA-19556` | `ana@uffa.pt`  | `UFFA-6D1F-3H8K` | Entregue            | Envio, 1 par, 236,00 €   |

### Códigos de autenticidade

| Código                | Produto         | Tamanho |
| --------------------- | --------------- | ------- |
| `UFFA-AUTH-4K7P-2M9Q` | Porto Rose Low  | 39      |
| `UFFA-AUTH-8R3T-6N1W` | Cedofeita Court | 40      |
| `UFFA-AUTH-9C2L-7B4X` | Invicta 01      | 42      |
| `UFFA-AUTH-1Z6Y-5A3E` | Afterdark 02    | 41      |

### Painel de operações

- Chave demo: `UFFA-OPS-2026`
- A chave é validada no browser. Em produção, tem de ser substituída por autenticação real com perfis e permissões.

## 9. Painel de operações

Funcionalidades disponíveis em `/operacoes`:

- cartões de resumo: total, em trânsito, prontas para recolha e concluídas;
- pesquisa por número, nome ou contacto;
- filtro por estado;
- fila de encomendas ordenada por atualização;
- editor com estado, previsão, rastreio, transportador e nota pública;
- botão **Avançar para…** para o estado seguinte do fluxo;
- botão **Copiar** com número, contacto, código exclusivo e link do portal;
- histórico dos últimos movimentos;
- reposição dos dados de demonstração;
- bloqueio da sessão com **Sair**.

O editor adapta-se ao tipo de entrega: rastreio e transportador só aparecem em encomendas de envio.

## 10. Verificação de autenticidade

`/verificar` procura o código em todas as encomendas guardadas. Se encontrar, apresenta:

- selo **UFFA Verified**;
- nome do produto e imagem;
- código exclusivo;
- número de série;
- tamanho;
- edição;
- data de registo;
- loja emissora;
- ligações para o produto e para o portal.

Se não encontrar, apresenta **Código inválido**, o código introduzido e um contacto direto para a equipa. A verificação nunca mostra nome, email, telefone ou morada.

## 11. Responsividade e idiomas

- Layout mobile-first com navegação própria para telemóvel.
- Linha temporal vertical em ecrãs pequenos e horizontal em ecrãs grandes.
- Grelhas de resumo e detalhes passam a uma coluna em mobile.
- Textos em PT, EN e ES através de `tr(language, pt, en, es)` em `src/lib/i18n.ts`.
- Tema claro e escuro suportados pelo sistema de temas existente.

## 12. Produção: o que falta

A demonstração usa `localStorage` para ser fácil de apresentar sem infraestrutura. Para produção, o modelo recomendado é:

1. **Base de dados** PostgreSQL com tabelas `orders`, `order_items`, `order_events`, `order_access_attempts` e `auth_certificates`.
2. **API no servidor** para criar encomendas, validar acessos, atualizar estados e verificar códigos.
3. **Códigos em hash** — o código exclusivo e o código de autenticidade nunca devem ser guardados em texto simples.
4. **Sessões assinadas** com cookies `HttpOnly`, `Secure` e `SameSite`.
5. **Rate limiting** por IP, por encomenda e por conta, com bloqueio progressivo.
6. **Autenticação da equipa** com roles (`admin`, `operations`, `support`) e MFA.
7. **Auditoria imutável** de todas as alterações de estado, com utilizador, timestamp e motivo.
8. **Emails transacionais** no checkout, na mudança de estado e na confirmação de receção.
9. **Integração com transportador** para atualizar o rastreio automaticamente.
10. **RGPD** — retenção, minimização, direito ao apagamento e registo de acessos.

## 13. Testes manuais

Checklist usada na validação:

- [x] Abrir `/rastreio`, preencher os dados demo e entrar.
- [x] Confirmar que a linha temporal mostra o estado atual e os eventos anteriores.
- [x] Confirmar receção e verificar que o estado passa a `Entregue`.
- [x] Recarregar a página e confirmar que a sessão e o estado se mantêm.
- [x] Terminar sessão e confirmar que o dashboard deixa de estar acessível.
- [x] Introduzir um código de autenticidade válido em `/verificar`.
- [x] Introduzir um código inválido e confirmar a mensagem de erro.
- [x] Entrar em `/operacoes` com a chave demo.
- [x] Avançar o estado de uma encomenda e confirmar a atualização no portal.
- [x] Repor os dados demo.
- [x] Testar o portal em viewport mobile (390 px).

Comandos de validação:

```bash
npm run build
npx tsc --noEmit
npx eslint src/lib/orders.ts src/routes/rastreio.tsx src/routes/verificar.tsx src/routes/operacoes.tsx src/routes/checkout.tsx src/routes/confirmacao.tsx src/components/order-portal-promo.tsx
```

> O lint global ainda reporta problemas pré-existentes de formatação/CRLF em ficheiros não alterados. Os ficheiros novos e modificados estão formatados.

## 14. Capturas

As capturas usadas na apresentação estão em `docs/assets/screenshots/` e os recortes em `docs/assets/screenshots/crops/`.

| Ficheiro                    | Conteúdo                                       |
| --------------------------- | ---------------------------------------------- |
| `01-home.png`               | Home completa com o bloco de portal.           |
| `02-home-portal-promo.png`  | Bloco “O teu par não desaparece”.              |
| `06-confirmacao.png`        | Confirmação com código exclusivo e rastreio.   |
| `07-rastreio-acesso.png`    | Formulário de acesso ao portal.                |
| `08-rastreio-dashboard.png` | Dashboard de envio completo.                   |
| `11-verificar-valido.png`   | Certificado de autenticidade válido.           |
| `13-operacoes-painel.png`   | Painel de operações com encomenda selecionada. |
| `15-rastreio-recolha.png`   | Dashboard de recolha pronta.                   |
| `16-verificar-invalido.png` | Resultado de código inválido.                  |
| `14-rastreio-mobile.png`    | Portal em viewport mobile.                     |

## 15. Ficheiros principais

| Ficheiro                                | Responsabilidade                                                |
| --------------------------------------- | --------------------------------------------------------------- |
| `src/lib/orders.ts`                     | Modelo, dados demo, persistência, validação, estados e códigos. |
| `src/lib/i18n.ts`                       | Helper de tradução inline PT/EN/ES.                             |
| `src/routes/rastreio.tsx`               | Portal do cliente e dashboard.                                  |
| `src/routes/verificar.tsx`              | Verificação pública de autenticidade.                           |
| `src/routes/operacoes.tsx`              | Painel interno de demonstração.                                 |
| `src/routes/checkout.tsx`               | Criação da encomenda no checkout.                               |
| `src/routes/confirmacao.tsx`            | Confirmação e próximos passos.                                  |
| `src/components/order-portal-promo.tsx` | Bloco promocional na home.                                      |
| `src/components/site-shell.tsx`         | Header, footer e menu mobile.                                   |
| `scripts/capture-screenshots.mjs`       | Captura automatizada das imagens da documentação.               |
| `scripts/build-apresentacao.mjs`        | Geração da apresentação PowerPoint.                             |
