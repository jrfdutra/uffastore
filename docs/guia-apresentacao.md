# Guia de Apresentação — Portal de Encomendas UFFA

Documento de apoio à apresentação `docs/apresentacao-uffa.pptx` e à demonstração ao vivo do portal.

> **Nota (18/11/2026).** O painel interno `/operacoes` foi **removido** do site.
> Sempre que este guia falar desse painel, lê-o como histórico — não existe rota
> nem chave de acesso.

## 1. Sessão

| Item             | Detalhe                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| Duração sugerida | 18–22 minutos (12–14 min de apresentação + 5–8 min de demo)                                            |
| Público          | Equipa UFFA, marketing, operações e potenciais parceiros                                               |
| Objetivo         | Mostrar como o pós-compra passa a ser uma experiência própria da UFFA                                  |
| Tom              | Direto, visual e próximo do estilo da marca                                                            |
| Material         | `docs/apresentacao-uffa.pptx`, site em `http://localhost:8080`, capturas em `docs/assets/screenshots/` |

## 2. Mensagem central

> **O par não desaparece depois do checkout.** O cliente recebe o estado do envio por e-mail e acompanha em `/rastreio`, sem conta nem palavra-passe. A equipa gere a expedição na Shopify Admin; os webhooks enviam os e-mails automaticamente.

Três ideias a repetir:

1. **Acesso simples** — link assinado por e-mail ou código CTT, sem registo.
2. **Transparência** — estado, transportador, rastreio, previsão e histórico num só lugar.
3. **Confiança** — informação clara sobre a entrega, sem expor dados pessoais.

## 3. Guião slide a slide

### Slide 1 — Capa

**Título:** Portal de Encomendas UFFA  
**Subtítulo:** Do checkout à recolha, com acompanhamento exclusivo.  
**Visual:** hero da home em fundo escuro, marca UFFA e data.

**Notas do orador:**

> “Boa tarde. Vamos apresentar o novo portal de encomendas da UFFA. Não é uma página de tracking genérica: é uma extensão da experiência de compra, desenhada para o cliente que já comprou e para a equipa que acompanha a encomenda.”

**Transição:** “Começamos pelo problema que existe hoje.”

---

### Slide 2 — O problema: depois da compra

**Título:** O cliente compra. E depois?  
**Pontos:**

- Falta de visibilidade sobre o estado real do envio ou da recolha.
- Contacto disperso por email, DM e telefone.
- Dúvidas sobre a disponibilidade do par e o momento da recolha.
- A equipa atualiza estados manualmente, sem histórico central.

**Visual:** bloco “O teu par não desaparece” da home.

**Notas do orador:**

> “Hoje o momento de maior ansiedade é entre o pagamento e a entrega. O cliente não sabe se o par saiu, onde está ou quando chega. Na recolha, a dúvida é se já está disponível. Isto gera contactos repetidos e afasta o cliente da marca.”

**Transição:** “A resposta são duas camadas simples.”

---

### Slide 3 — A solução em duas camadas

**Título:** Um portal. Duas garantias.  
**Colunas:**

1. **Portal do cliente** — estado, rastreio, previsão e confirmação.
2. **Operações** — painel interno para atualizar e auditar.

**Visual:** dashboard de envio + painel de operações em dois cartões.

**Notas do orador:**

> “Primeiro, o cliente entra num portal e vê tudo. Segundo, a equipa tem um painel para atualizar o estado e deixar rasto. As duas camadas partilham o mesmo modelo de dados.”

**Transição:** “Vejamos a jornada completa.”

---

### Slide 4 — Jornada: da compra à confirmação

**Título:** O acompanhamento nasce com a encomenda.
**Passos:**

1. Compra e escolha de envio ou recolha.
2. Confirmação enviada pela Shopify.
3. Expedição com código de rastreio na Shopify Admin.
4. Webhook gera o link assinado e envia o e-mail.
5. Cliente acompanha em `/rastreio` e responde ao NPS.

**Visual:** captura da página de confirmação com os próximos passos.

**Notas do orador:**

> “A Shopify envia a confirmação da compra. Quando a encomenda é marcada como cumprida, o webhook gera um link assinado com o estado do envio e o atalho para o CTT. Não há conta nem código exclusivo: o cliente só precisa do e-mail ou do código CTT.”

**Transição:** “Esse link é o centro do acompanhamento.”

---

### Slide 5 — Acesso sem conta

**Título:** Um link. Zero passwords.
**Tabela visual:**

- Link mágico assinado no e-mail de envio.
- Código CTT em `/rastreio`.
- Atalho directo para o site dos CTT.

**Regras:** o link expira, é assinado com HMAC e não contém e-mail nem dados pessoais.

**Visual:** formulário de acesso em `/rastreio`.

**Notas do orador:**

> “O cliente não introduz número de encomenda, contacto nem código exclusivo. O e-mail de envio traz um link assinado com o estado do envio. Quem não tem o link introduz só o código CTT e é encaminhado para os CTT. Sem conta, sem password e sem consulta por e-mail.”

**Transição:** “Depois de entrar, o cliente vê o estado real.”

---

### Slide 6 — Dashboard de envio

**Título:** Tudo o que o cliente precisa de saber.  
**Pontos:**

- Estado atual e linha temporal.
- Detalhes de entrega: previsão, transportador e rastreio.
- Resumo de valores e dados da encomenda.
- Itens da encomenda.
- Ação de confirmação de receção.

**Visual:** dashboard de envio completo (topo + detalhes).

**Notas do orador:**

> “Este é o ecrã principal. O cliente vê imediatamente em que fase está, o histórico, a previsão, o transportador e o código de rastreio. Ao lado tem o resumo e os dados de entrega. Em baixo, os pares incluídos na encomenda. Quando a encomenda chega, pode confirmar a receção e fechar o processo.”

**Transição:** “O fluxo de envio tem cinco estados.”

---

### Slide 7 — Fluxo de envio

**Título:** Confirmada → Entregue.  
**Diagrama:**
`Confirmada` → `Em preparação` → `Enviada` → `Em trânsito` → `Entregue`

**Pontos:**

- Cada mudança cria um evento com data/hora.
- O histórico é visível ao cliente.
- O estado final desativa a confirmação.
- `Cancelada` é um estado independente.

**Visual:** diagrama de estados + linha temporal.

**Notas do orador:**

> “O fluxo é linear e previsível. Cada transição acrescenta um evento ao histórico. O cliente não vê apenas o estado atual: vê quando mudou e onde. Isto reduz a necessidade de contactar o apoio. O estado Cancelada existe à parte e pode ser aplicado pela equipa.”

**Transição:** “Na recolha, o fluxo é mais curto.”

---

### Slide 8 — Recolha na loja

**Título:** Pronta para recolha.  
**Fluxo:** `Confirmada` → `Em preparação` → `Pronta para recolha` → `Recolhida`

**Pontos:**

- Local: UFFA Store, Rua de Santa Catarina 112, Porto.
- Data limite de disponibilidade.
- Nota pública da loja.
- Botão **Confirmar recolha**.
- Sem portes.

**Visual:** dashboard de recolha (`15-rastreio-recolha.png`).

**Notas do orador:**

> “Na recolha, o cliente não precisa de rastreio. Precisa de saber se o par está disponível, até quando e onde. O dashboard mostra a morada, a data limite e a nota da loja. Quando chega, confirma a recolha e o estado passa a Recolhida. É o mesmo modelo, adaptado ao contexto da loja física.”

**Transição:** “Do lado da equipa, o processo é simples.”

---

### Slide 9 — Expedição na Shopify

**Título:** Gerir sem folhas de cálculo.  
**Pontos:**

- Pesquisa da encomenda na Shopify Admin.
- **Marcar como cumprida** com código de rastreio e transportador.
- Webhook `orders/fulfilled` (ou `orders/updated`) para o site.
- Link assinado e e-mail de envio gerados automaticamente.
- Cliente acompanha em `/rastreio`.

**Visual:** encomenda na Shopify Admin com o código de rastreio preenchido.

**Notas do orador:**

> “A equipa trabalha na Shopify Admin: abre a encomenda, marca como cumprida e introduz o código de rastreio e o transportador. A Shopify dispara o webhook, o servidor gera o link assinado e envia o e-mail. O cliente vê o estado atualizado em `/rastreio`, sem intervenção manual.”

**Transição:** “Tudo isto funciona no telemóvel.”

---

### Slide 10 — Mobile

**Título:** A mesma experiência, no bolso.  
**Pontos:**

- Header e menu mobile próprios.
- Linha temporal vertical.
- Cartões empilhados.
- Ações ao alcance do polegar.
- Tema claro/escuro.

**Visual:** captura mobile alta, com recorte do topo e dos itens.

**Notas do orador:**

> “O portal foi desenhado mobile-first. No telemóvel, a linha temporal passa a vertical, os cartões empilham e os botões ficam ao alcance do polegar. O cliente pode acompanhar a encomenda sem instalar nada.”

**Transição:** “Como está construído?”

---

### Slide 11 — Arquitetura

**Título:** Simples na demo, pronto para produção.  
**Diagrama em duas colunas:**

- **Demo:** React + TanStack Start, `localStorage`, `sessionStorage`, dados seed.
- **Produção:** API, PostgreSQL, RLS, sessões assinadas, emails, transportador.

**Notas do orador:**

> “A demonstração corre no browser, com dados locais. Isso permitiu validar toda a experiência sem infraestrutura. Para produção, o modelo passa para uma API com PostgreSQL e RLS. As credenciais de acesso ficam em hash, as sessões são assinadas e as alterações são auditadas. A camada visual mantém-se.”

**Transição:** “O que falta antes de ir para produção?”

---

### Slide 12 — Segurança e próximos passos

**Título:** Do protótipo ao serviço.  
**Checklist:**

- Backend e base de dados.
- Credenciais em hash e rate limiting.
- Autenticação da equipa com roles e MFA.
- Auditoria imutável.
- Emails transacionais.
- Integração com transportador.
- RGPD e retenção.

**Visual:** captura da página de acesso ao portal.

**Notas do orador:**

> “A demo prova a experiência. Para produção, o trabalho crítico é segurança: validação no servidor, credenciais em hash, limites de tentativas, autenticação da equipa e auditoria. Depois vêm os emails e a integração com o transportador. Nada disto muda a experiência do cliente; muda a robustez por trás.”

**Transição:** “Vamos ver isto a funcionar.”

---

### Slide 13 — Demo e fecho

**Título:** O par não desaparece.  
**Credenciais:**

- `UFFA-48217` — encomenda de exemplo com link assinado
- `UFFA-73104` — encomenda de exemplo pronta para recolha
- Código CTT de exemplo para demonstrar `/rastreio`

**Fecho:**

> “Um portal próprio, acompanhamento claro e uma operação mais próxima. O cliente sabe onde está o par. A UFFA sabe o que o cliente vê.”

**Notas do orador:**

> “Termino com uma frase: o par não desaparece depois do checkout. Fica acompanhado a cada passo. Obrigado. Podemos passar à demonstração.”

## 4. Guião de demonstração (5–7 minutos)

### Preparação

1. Abrir `http://localhost:8080` no browser.
2. Confirmar que o tema está claro.
3. Abrir dois separadores: home e `/rastreio`.
4. Ter um código CTT de exemplo e um link mágico de teste à mão.
5. Se a demo falhar, usar as capturas em `docs/assets/screenshots/`.

### Sequência

| Passo | Ação                                     | O que dizer                                                  |
| ----- | ---------------------------------------- | ------------------------------------------------------------ |
| 1     | Home → bloco “O teu par não desaparece”  | “O acompanhamento é apresentado depois da compra.”           |
| 2     | `/rastreio` → introduzir código CTT      | “Um código. Sem conta, sem password, sem consulta por e-mail.” |
| 3     | Abrir link mágico assinado               | “Estado, previsão, transportador e atalho para o CTT.”       |
| 4     | Ver o resumo da entrega                  | “O cliente vê os detalhes do envio num só lugar.”            |
| 5     | Responder ao NPS                         | “O convite chega 8 dias depois e fica na encomenda.”         |
| 6     | Shopify Admin → marcar como cumprida     | “A equipa introduz o código e o transportador.”              |
| 7     | Webhook → e-mail automático              | “O link é gerado e enviado sem trabalho manual.”             |
| 8     | Voltar a `/rastreio`                     | “O cliente vê o estado atualizado.”                          |
| 9     | Abrir em mobile                          | “A mesma experiência no bolso.”                              |

### Frases de segurança

- “Os endpoints são protegidos por segredos e assinaturas HMAC.”
- “A expedição é feita na Shopify Admin; não existe painel interno.”
- “O link mágico não contém e-mail nem dados pessoais.”

## 5. Perguntas frequentes

**Isto substitui o email de confirmação?**  
Não. A Shopify envia a confirmação da compra; o site envia o e-mail de envio com o link assinado.

**O cliente tem de criar conta?**  
Não. Basta o link assinado ou o código CTT em `/rastreio`.

**O link mágico pode ser partilhado?**
Pode, mas dá acesso ao estado da encomenda. Por isso tem validade limitada e assinatura HMAC.

**Como é feita a atualização do rastreio?**  
Ao marcar a encomenda como cumprida na Shopify Admin, os webhooks `orders/fulfilled` e `orders/updated` actualizam o site e enviam o e-mail.

**E se o cliente perder o link?**
Pode usar o código CTT em `/rastreio` ou pedir ajuda em `/ajuda`.

## 6. Checklist antes de apresentar

- [ ] `npm run build` passa.
- [ ] `npx tsc --noEmit` passa.
- [ ] Dev server em `http://localhost:8080`.
- [ ] Webhooks da Shopify apontam para o domínio de produção.
- [ ] Sessões antigas limpas (ou usar janela anónima).
- [ ] Tema claro.
- [ ] Credenciais demo visíveis no slide final.
- [ ] Capturas de fallback abertas.
- [ ] PPTX testado no PowerPoint/Keynote.
- [ ] Notas do orador revistas.

## 7. Ficheiros

| Ficheiro                         | Uso                               |
| -------------------------------- | --------------------------------- |
| `docs/apresentacao-uffa.pptx`    | Apresentação principal.           |
| `docs/portal-encomendas.md`      | Documentação funcional e técnica. |
| `docs/guia-apresentacao.md`      | Este guião.                       |
| `docs/assets/screenshots/`       | Capturas completas.               |
| `docs/assets/screenshots/crops/` | Recortes usados nos slides.       |
| `scripts/build-apresentacao.mjs` | Geração do PPTX.                  |
