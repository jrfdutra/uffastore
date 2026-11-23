# Guia de Apresentação — Site UFFA

Documento de apoio à apresentação `docs/apresentacao-site-uffa.pptx` e à demonstração ao vivo da loja.

> **Nota (18/11/2026).** O painel interno `/operacoes` foi **removido** do site.
> Sempre que este guia falar desse painel, lê-o como histórico — não existe rota
> nem chave de acesso.

## 1. Sessão

| Item             | Detalhe                                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------------------------- |
| Duração sugerida | 16–20 minutos (10–12 min de apresentação + 6–8 min de demo)                                                 |
| Público          | Equipa UFFA, marketing, operações e potenciais parceiros                                                    |
| Objetivo         | Mostrar a loja como uma jornada completa: marca, descoberta, compra, pós-compra e operação                  |
| Tom              | Direto, visual e próximo do estilo da marca                                                                 |
| Material         | `docs/apresentacao-site-uffa.pptx`, site em `http://localhost:8080`, capturas em `docs/assets/screenshots/` |

## 2. Mensagem central

> **O site não é um catálogo. É a jornada completa da UFFA.** A home apresenta a marca, o catálogo ajuda a escolher, o produto responde às dúvidas, o checkout remove fricção e o pós-compra mantém a relação viva. A equipa fecha o ciclo no painel de operações.

Três ideias a repetir:

1. **Curadoria** — oito pares, quatro linhas, escolhidos um a um antes de entrarem.
2. **Porto** — recolha gratuita em mãos; a loja física faz parte da experiência digital.
3. **Continuidade** — portal e operação no mesmo sistema, sem emails soltos.

## 2.1 Identidade visual e navegação

Pontos a demonstrar em qualquer ecrã:

- **Cabeçalho fixo** com logótipo proporcional, altura `h-20 md:h-24` e menu em `text-xs md:text-sm` com `gap-6`.
- **Categorias sincronizadas** — clicar em Casual, Streetwear, Edições Limitadas ou Promoções abre `/catalogo` já filtrado. Se o cliente já estiver no catálogo, o filtro muda no momento, sem recarregar.
- **Sublinhado animado** no item ativo e em `hover`: ameixa no modo claro (`#4A2B33`) e rosa UFFA no modo escuro (`#E1A0B4`).
- **Preços** — o preço normal e o preço de oferta usam `font-bold text-foreground`; o preço de oferta fica um nível de tamanho acima.
- **Placas PROMO** — cor burgundy (`--promo`), `border-2 border-promo`, preenchimento e tracking generosos, sem sombras.
- **Stock** — 5 pares por tamanho em todos os produtos; tamanhos esgotados aparecem desativados.
- **Temas** — claro e escuro em todas as páginas, com preferência guardada em `localStorage`.

## 3. Percurso de demonstração

| Rota                      | O que mostrar                                                    |
| ------------------------- | ---------------------------------------------------------------- |
| `/`                       | Hero, categorias, feedbacks, pesquisa e newsletter.              |
| `/catalogo`               | Filtros por linha, tamanho e preço; pesquisa instantânea.        |
| `/produto/porto-rose-low` | Fotos, tamanhos com stock e preço.                               |
| `/checkout`               | Recolha grátis ou envio: 8,94 € PT Continental/Ilhas, 24 € UE, 34 € Suíça; dados e pagamento no checkout Shopify. |
| `/confirmacao`            | Resumo da compra e próximos passos.                              |
| `/rastreio`               | Código CTT ou link mágico assinado; estado e atalho para o CTT.  |

### Credenciais demo

| Encomenda    | Contacto       | Código exclusivo | Estado              |
| ------------ | -------------- | ---------------- | ------------------- |
| `UFFA-48217` | `demo@uffa.pt` | `UFFA-7K3M-9QX2` | Em trânsito         |
| `UFFA-73104` | `demo@uffa.pt` | `UFFA-2P8N-5RV6` | Pronta para recolha |

Acompanhamento: link mágico assinado enviado por e-mail (`/rastreio?token=…`) ou código CTT em `/rastreio`. O antigo painel `/operacoes` foi removido.

## 4. Guião slide a slide

### Slide 1 — Capa

**Título:** UFFA Store. O site.  
**Visual:** produto em destaque sobre fundo escuro e rosa.

**Notas do orador:**

> “Boa tarde. Esta apresentação mostra o site da UFFA como uma experiência completa. A deck anterior aprofundou o portal de encomendas; esta percorre a jornada inteira, da home à operação.”

**Transição:** “Começamos pelo posicionamento.”

---

### Slide 2 — Posicionamento

**Título:** Uma loja, não um catálogo.  
**Pontos:** curadoria, Porto e pós-compra.

**Notas do orador:**

> “Não competimos por quantidade. Temos oito pares escolhidos um a um, com recolha no Porto e uma camada de pós-compra que prolonga a relação. Estes três pilares aparecem em todos os ecrãs.”

**Transição:** “A home é o primeiro contacto com essa promessa.”

---

### Slide 3 — Home

**Título:** A marca em primeiro.  
**Visual:** hero, categorias e mais procurados.

**Notas do orador:**

> “A home não mostra tudo. Mostra o próximo passo: hero com promessa e CTA, faixa de confiança, quatro categorias, produtos em destaque, bloco do portal e newsletter. Cada bloco tem uma função e conduz à compra ou ao acompanhamento.”

**Transição:** “Do interesse passamos à escolha.”

---

### Slide 4 — Catálogo

**Título:** Encontrar o par certo.  
**Visual:** catálogo com filtros e oito produtos.

**Notas do orador:**

> “O catálogo permite filtrar por linha, tamanho e preço máximo, pesquisar sem recarregar a página e comparar cartões com preço, categoria e linha. As categorias do cabeçalho abrem o catálogo já filtrado e sincronizam com o URL (`?category=sales`), mesmo quando o cliente já está na página. No mobile, os filtros empilham e continuam utilizáveis.”

**Transição:** “Escolhido o par, a decisão acontece no produto.”

---

### Slide 5 — Produto

**Título:** A decisão acontece aqui.  
**Visual:** Porto Rose Low com galeria e tamanhos.

**Notas do orador:**

> “A página de produto responde às dúvidas todas antes do carrinho: galeria com rotação 360°, stock por tamanho, descrição, preço, recolha gratuita e política de trocas. O stock está a 5 pares por tamanho, os tamanhos esgotados ficam desativados e o preço de oferta mantém o peso do preço normal, um nível acima. O cliente não precisa de abrir menus para decidir.”

**Transição:** “Com a decisão tomada, falta o último empurrão.”

---

### Slide 6 — Carrinho

**Título:** O último empurrão.  
**Visual:** carrinho lateral com quatro artigos e subtotal.

**Notas do orador:**

> “O carrinho é uma camada, não uma página. Abre, mostra produto, tamanho, quantidade e preço, permite ajustar e remover, e fecha com um único CTA para o checkout. O cliente não perde o contexto da loja.”

**Transição:** “No checkout, reduzimos tudo a três decisões.”

---

### Slide 7 — Checkout

**Título:** Três decisões. Zero fricção.  
**Visual:** entrega, dados e pagamento.

**Notas do orador:**

> “Entrega — recolha grátis em NorteShopping, Maia Jardim ou MarShopping, ou envio por 8,94 € em Portugal Continental e Ilhas, 24 € na União Europeia e 34 € na Suíça. Dados e pagamento — o cliente é redirecionado para o checkout oficial da Shopify. Não é criada conta UFFA. A confirmação local mostra o resumo da compra e os próximos passos.”

**Transição:** “A confirmação é o início do pós-compra.”

---

### Slide 8 — Confirmação

**Título:** O pós-compra começa aqui.  
**Visual:** confirmação `UFFA-48217` com os próximos passos.

**Notas do orador:**

> “A página de confirmação mostra o resumo da compra, a entrega escolhida e os próximos passos. Não há conta: o acompanhamento chega por e-mail, com o código CTT ou com um link mágico assinado. Numa encomenda real, a confirmação é enviada pela própria Shopify.”

**Transição:** “Com o e-mail de envio, o par não desaparece.”

---

### Slide 9 — Portal

**Título:** O par não desaparece.  
**Visual:** dashboard de envio em `/rastreio`.

**Notas do orador:**

> “Em `/rastreio` o cliente introduz só o código CTT e é encaminhado para o site dos CTT. Quando a encomenda é expedida, o e-mail traz um link assinado com o estado do envio, a previsão e o atalho para o CTT — sem registo nem palavra-passe.”

**Transição:** “Do lado da equipa, o ciclo fecha-se na Shopify.”

---

### Slide 10 — Operações

**Título:** Gerir sem folhas de cálculo.  
**Visual:** link mágico de rastreio e e-mails automáticos da Shopify.

**Notas do orador:**

> “Os webhooks da Shopify atualizam automaticamente o estado da encomenda e enviam o link de rastreio assinado ao cliente. O cliente acompanha tudo em `/rastreio?token=…`, sem registo nem palavra-passe. O antigo painel interno foi removido.”

**Transição:** “Tudo isto funciona também no bolso.”

---

### Slide 11 — Mobile

**Título:** A mesma experiência, no bolso.  
**Visual:** home, catálogo e produto a 390 px.

**Notas do orador:**

> “O site foi validado a 390 px. Header e menu próprios, filtros e grelha empilhados, galeria e tamanhos ao alcance do polegar. Carrinho, checkout e portal também são responsivos. A experiência mantém-se sem instalar nada.”

**Transição:** “E por trás desta experiência?”

---

### Slide 12 — Tecnologia

**Título:** Simples na demo, pronto para produção.  
**Visual:** comparação demo/produção.

**Notas do orador:**

> “A demo corre no browser com React 19, TanStack Start e dados locais. Em produção, a mesma interface passa a falar com uma API e PostgreSQL, com RLS, pagamentos reais, emails transacionais, transportador e auditoria. Muda a robustez, não a experiência.”

**Transição:** “Fechamos com o convite à demonstração.”

---

### Slide 13 — Fecho

**Título:** Obrigado.  
**Visual:** percurso sugerido e contactos.

**Notas do orador:**

> “O site cobre a jornada completa, da marca ao pós-compra. O percurso sugerido está no slide: home, catálogo, produto, checkout, confirmação e rastreio. Os e-mails automáticos fecham o ciclo. Obrigado.”

## 5. Preparação da demo

1. Confirmar que o dev server está a correr em `http://localhost:8080`.
2. Ao abrir o site, surge o aviso de versão demo; fechar com **Entendi, continuar**. A dispensa fica em `sessionStorage` (`uffa-demo-notice-v1`) e não volta a aparecer na mesma sessão.
3. Abrir previamente `/`, `/catalogo` e `/produto/porto-rose-low` em separadores.
4. Ter um código CTT de exemplo à mão para demonstrar `/rastreio`.
5. Se a rede ou o browser falharem, usar as capturas em `docs/assets/screenshots/`.
6. Terminar no link mágico de rastreio para mostrar o ciclo completo.

## 6. Perguntas frequentes

**É preciso criar conta?** Não. O rastreio público usa o código CTT; o envio traz um link assinado.

**Os pagamentos são reais?** O checkout é redirecionado para a Shopify. Os métodos disponíveis (cartão, MB WAY, Google Pay) dependem da configuração da loja; para demonstração, usar o ambiente de testes da Shopify.

**Os dados persistem?** Na demo, ficam no browser (`localStorage`/`sessionStorage`). Em produção, passam para backend com autenticação e auditoria.

**O aviso de demo volta a aparecer?** Só numa nova sessão ou aba; na mesma sessão fica dispensado com a chave `uffa-demo-notice-v1`.

**O painel é público?** O antigo `/operacoes` foi removido. A equipa gere encomendas e expedição na Shopify Admin; o cliente acompanha em `/rastreio`.
