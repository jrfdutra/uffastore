# Guia de Apresentação — Portal de Encomendas UFFA

Documento de apoio à apresentação `docs/apresentacao-uffa.pptx` e à demonstração ao vivo do portal.

## 1. Sessão

| Item             | Detalhe                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| Duração sugerida | 18–22 minutos (12–14 min de apresentação + 5–8 min de demo)                                            |
| Público          | Equipa UFFA, marketing, operações e potenciais parceiros                                               |
| Objetivo         | Mostrar como o pós-compra passa a ser uma experiência própria da UFFA                                  |
| Tom              | Direto, visual e próximo do estilo da marca                                                            |
| Material         | `docs/apresentacao-uffa.pptx`, site em `http://localhost:8080`, capturas em `docs/assets/screenshots/` |

## 2. Mensagem central

> **O par não desaparece depois do checkout.** O cliente passa a ter um portal exclusivo para acompanhar o envio ou a recolha, confirmar a receção e validar a autenticidade de cada par. A equipa passa a ter um painel simples para gerir estados e comunicar proativamente.

Três ideias a repetir:

1. **Exclusividade** — o acesso exige três dados que só o comprador conhece.
2. **Transparência** — estado, transportador, rastreio, previsão e histórico num só lugar.
3. **Confiança** — cada par tem um código de autenticidade verificável, sem expor dados pessoais.

## 3. Guião slide a slide

### Slide 1 — Capa

**Título:** Portal de Encomendas UFFA  
**Subtítulo:** Do checkout à recolha, com exclusividade verificável.  
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
- Incerteza sobre autenticidade e exclusividade do par.
- A equipa atualiza estados manualmente, sem histórico central.

**Visual:** bloco “O teu par não desaparece” da home.

**Notas do orador:**

> “Hoje o momento de maior ansiedade é entre o pagamento e a entrega. O cliente não sabe se o par saiu, onde está ou quando chega. Na recolha, a dúvida é se já está disponível. E a autenticidade é muitas vezes percebida, mas não verificável. Isto gera contactos repetidos e afasta o cliente da marca.”

**Transição:** “A resposta são três camadas simples.”

---

### Slide 3 — A solução em três camadas

**Título:** Um portal. Três garantias.  
**Colunas:**

1. **Portal do cliente** — estado, rastreio, previsão e confirmação.
2. **Prova de autenticidade** — um código único por par, verificável.
3. **Operações** — painel interno para atualizar e auditar.

**Visual:** dashboard de envio + certificado + painel de operações em três cartões.

**Notas do orador:**

> “Primeiro, o cliente entra num portal e vê tudo. Segundo, cada par tem um código que pode ser validado por qualquer pessoa, sem revelar quem comprou. Terceiro, a equipa tem um painel para atualizar o estado e deixar rasto. As três camadas partilham o mesmo modelo de dados.”

**Transição:** “Vejamos a jornada completa.”

---

### Slide 4 — Jornada: do checkout à confirmação

**Título:** O código nasce no checkout.  
**Passos:**

1. Compra e escolha de envio ou recolha.
2. Geração de número, código exclusivo, códigos de autenticidade e rastreio.
3. Confirmação com próximos passos.
4. Entrada no portal.
5. Acompanhamento e confirmação final.

**Visual:** captura da confirmação com o código `UFFA-7K3M-9QX2`.

**Notas do orador:**

> “No checkout criamos a encomenda e, no mesmo momento, geramos o número, o código exclusivo, um código de autenticidade por par e o rastreio inicial. A página de confirmação explica ao cliente o que guardar e o que fazer a seguir. Não há criação de conta: o código exclusivo é a chave.”

**Transição:** “Esse código é o centro do modelo de acesso.”

---

### Slide 5 — Acesso exclusivo por três fatores

**Título:** Três dados. Zero contas.  
**Tabela visual:**

- Número da encomenda.
- Contacto usado na compra.
- Código exclusivo.

**Regras:** 5 tentativas, bloqueio de 60 segundos, sessão de 30 minutos.

**Visual:** formulário de acesso em `/rastreio`.

**Notas do orador:**

> “Pedimos três coisas que o comprador já tem: o número, o contacto e o código exclusivo. O número pode ser escrito só com os cinco dígitos. Ao fim de cinco tentativas falhadas, bloqueamos durante um minuto. A sessão dura 30 minutos e pode ser terminada manualmente. Isto reduz o atrito sem abrir a porta a quem não comprou.”

**Transição:** “Depois de entrar, o cliente vê o estado real.”

---

### Slide 6 — Dashboard de envio

**Título:** Tudo o que o cliente precisa de saber.  
**Pontos:**

- Estado atual e linha temporal.
- Detalhes de entrega: previsão, transportador e rastreio.
- Resumo de valores e dados da encomenda.
- Itens com código de autenticidade.
- Ação de confirmação de receção.

**Visual:** dashboard de envio completo (topo + detalhes).

**Notas do orador:**

> “Este é o ecrã principal. O cliente vê imediatamente em que fase está, o histórico, a previsão, o transportador e o código de rastreio. Ao lado tem o resumo e os dados de entrega. Em baixo, cada par tem o seu código de autenticidade. Quando a encomenda chega, pode confirmar a receção e fechar o processo.”

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

**Transição:** “E a autenticidade?”

---

### Slide 9 — Um par, um código

**Título:** A prova de autenticidade.  
**Pontos:**

- Código gerado no checkout, único por linha.
- Formato `UFFA-AUTH-XXXX-XXXX`.
- Verificação pública em `/verificar`.
- Resultado mostra produto, tamanho, série, edição e data.
- Nunca mostra nome, contacto ou morada.

**Visual:** certificado válido + exemplo inválido.

**Notas do orador:**

> “Cada par recebe um código de autenticidade e um número de série. O cliente pode validá-lo em qualquer momento, até partilhar o link. A página confirma o produto, o tamanho, a edição e a data, mas não revela quem comprou. Se o código não existir, mostramos uma mensagem clara e um contacto. É a mesma lógica de certificação que o OrbitTrack usa, adaptada a sneakers.”

**Transição:** “Do lado da equipa, o processo é simples.”

---

### Slide 10 — Painel de operações

**Título:** Gerir sem folhas de cálculo.  
**Pontos:**

- Pesquisa por encomenda, nome ou contacto.
- Filtro por estado.
- Edição de estado, previsão, rastreio, transportador e nota pública.
- Botão **Avançar para…** para o próximo estado.
- Histórico e reposição de demo.
- Credenciais do cliente copiáveis.

**Visual:** painel de operações com encomenda selecionada.

**Notas do orador:**

> “A equipa entra em `/operacoes` com uma chave. Vê os indicadores, pesquisa e filtra. Ao selecionar uma encomenda, atualiza o estado, a previsão, o rastreio e a nota. O botão Avançar para leva-a ao estado seguinte sem saltos. Cada alteração aparece no portal do cliente. Em demonstração, a chave é `UFFA-OPS-2026`.”

**Transição:** “Tudo isto funciona no telemóvel.”

---

### Slide 11 — Mobile

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

### Slide 12 — Arquitetura

**Título:** Simples na demo, pronto para produção.  
**Diagrama em duas colunas:**

- **Demo:** React + TanStack Start, `localStorage`, `sessionStorage`, dados seed.
- **Produção:** API, PostgreSQL, RLS, sessões assinadas, emails, transportador.

**Notas do orador:**

> “A demonstração corre no browser, com dados locais. Isso permitiu validar toda a experiência sem infraestrutura. Para produção, o modelo passa para uma API com PostgreSQL e RLS. Os códigos ficam em hash, as sessões são assinadas e as alterações são auditadas. A camada visual mantém-se.”

**Transição:** “O que falta antes de ir para produção?”

---

### Slide 13 — Segurança e próximos passos

**Título:** Do protótipo ao serviço.  
**Checklist:**

- Backend e base de dados.
- Códigos em hash e rate limiting.
- Autenticação da equipa com roles e MFA.
- Auditoria imutável.
- Emails transacionais.
- Integração com transportador.
- RGPD e retenção.

**Visual:** captura de código inválido + selo UFFA Verified.

**Notas do orador:**

> “A demo prova a experiência. Para produção, o trabalho crítico é segurança: validação no servidor, códigos em hash, limites de tentativas, autenticação da equipa e auditoria. Depois vêm os emails e a integração com o transportador. Nada disto muda a experiência do cliente; muda a robustez por trás.”

**Transição:** “Vamos ver isto a funcionar.”

---

### Slide 14 — Demo e fecho

**Título:** O par não desaparece.  
**Credenciais:**

- `UFFA-48217` / `demo@uffa.pt` / `UFFA-7K3M-9QX2`
- `UFFA-73104` / `demo@uffa.pt` / `UFFA-2P8N-5RV6`
- Ops: `UFFA-OPS-2026`

**Fecho:**

> “Um portal próprio, uma prova de autenticidade e uma operação mais próxima. O cliente sabe onde está o par. A UFFA sabe o que o cliente vê.”

**Notas do orador:**

> “Termino com uma frase: o par não desaparece depois do checkout. Fica acompanhado, identificado e verificável. Obrigado. Podemos passar à demonstração.”

## 4. Guião de demonstração (5–7 minutos)

### Preparação

1. Abrir `http://localhost:8080` no browser.
2. Confirmar que o tema está claro.
3. Abrir três separadores: home, `/rastreio`, `/operacoes`.
4. Ter as credenciais à mão.
5. Se a demo falhar, usar as capturas em `docs/assets/screenshots/`.

### Sequência

| Passo | Ação                                     | O que dizer                                                  |
| ----- | ---------------------------------------- | ------------------------------------------------------------ |
| 1     | Home → bloco “O teu par não desaparece”  | “O portal é apresentado no momento certo: depois da compra.” |
| 2     | `/rastreio` → preencher dados demo       | “Três dados. Sem conta, sem password.”                       |
| 3     | Dashboard                                | “Estado, histórico, previsão, transportador e rastreio.”     |
| 4     | Rolar até aos itens                      | “Cada par tem o seu código de autenticidade.”                |
| 5     | Copiar código e abrir `/verificar`       | “Qualquer pessoa pode validar, sem ver dados pessoais.”      |
| 6     | Voltar ao portal → **Confirmar receção** | “O cliente fecha o processo.”                                |
| 7     | `/operacoes` → chave demo                | “A equipa vê a fila e os indicadores.”                       |
| 8     | Selecionar encomenda → avançar estado    | “Uma alteração, um evento no histórico.”                     |
| 9     | Voltar ao portal e atualizar             | “O cliente vê a mudança em tempo real.”                      |
| 10    | Abrir em mobile                          | “A mesma experiência no bolso.”                              |

### Frases de segurança

- “Isto é uma demonstração local; em produção, a validação passa para o servidor.”
- “Os dados demo podem ser repostos no painel de operações.”
- “A autenticidade é pública; os dados do comprador não.”

## 5. Perguntas frequentes

**Isto substitui o email de confirmação?**  
Não. Complementa-o. O email continua a levar o número, o código exclusivo e o link do portal.

**O cliente tem de criar conta?**  
Não. O acesso usa número, contacto e código exclusivo. Em produção, pode ser adicionado login opcional para clientes recorrentes.

**O código exclusivo pode ser partilhado?**  
Sim, mas dá acesso à encomenda. Por isso é tratado como credencial: pode ser regenerado e o acesso pode ser revogado.

**A verificação de autenticidade expõe o comprador?**  
Não. Mostra apenas produto, tamanho, série, edição, data e loja emissora.

**Como é feita a atualização do rastreio?**  
Na demo, manualmente no painel. Em produção, via webhook/API do transportador.

**E se o cliente perder o código?**  
Em produção, recuperação por email/telefone com validação adicional. Na demo, a equipa pode copiar as credenciais no painel de operações.

## 6. Checklist antes de apresentar

- [ ] `npm run build` passa.
- [ ] `npx tsc --noEmit` passa.
- [ ] Dev server em `http://localhost:8080`.
- [ ] Dados demo repostos em `/operacoes`.
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
