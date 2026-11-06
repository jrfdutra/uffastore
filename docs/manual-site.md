# Manual do Site — UFFA Store

Manual funcional completo da loja online UFFA Store. Descreve cada ecrã, cada ação do cliente e cada ferramenta da equipa, com os dados necessários para operar e demonstrar o site.

- **Site:** `https://uffastore.pt` (produção) · `http://localhost:8080` (desenvolvimento)
- **Idiomas:** Português, Inglês e Espanhol
- **Temas:** claro e escuro
- **Stack:** React 19 + TanStack Start + Tailwind CSS + Shopify Storefront API

---

## 1. Visão geral

O site cobre a jornada completa da marca:

```text
Home → Catálogo → Produto → Carrinho → Checkout → Confirmação
                                                   ↓
                                   Portal de rastreio → Autenticidade
                                                   ↓
                                            Painel de operações
```

| Área | Rota | Público |
| --- | --- | --- |
| Home | `/` | Visitante |
| Catálogo | `/catalogo` | Visitante |
| Produto | `/produto/:id` | Visitante |
| Carrinho | camada lateral | Visitante |
| Checkout | `/checkout` | Cliente |
| Confirmação | `/confirmacao?order=UFFA-XXXXX` | Cliente |
| Portal de rastreio | `/rastreio` | Cliente |
| Verificação de autenticidade | `/verificar` | Público |
| Painel de operações | `/operacoes` | Equipa |
| Lista de desejos | `/favoritos` | Visitante |
| Ajuda e contactos | `/ajuda` | Público |

---

## 2. Navegação e identidade

### 2.1 Cabeçalho

O cabeçalho é fixo (`sticky`) e está presente em todas as páginas.

- **Logótipo UFFA STORE** — volta à home.
- **Menu principal** — Casual, Streetwear, Edições Limitadas, Promoções e Ajuda.
- **Categorias sincronizadas** — ao clicar numa categoria, o catálogo abre já filtrado. Se o cliente já estiver no catálogo, o filtro atualiza no momento, sem recarregar a página.
- **Sublinhado animado** — o item ativo e o item em `hover` mostram um sublinhado. A cor adapta-se ao tema: ameixa no modo claro e rosa UFFA no modo escuro.
- **Seletor de idioma** — PT / EN / ES. A escolha é imediata e mantém-se durante a sessão.
- **Tema** — botão sol/lua para alternar entre modo claro e escuro.
- **Lista de desejos** — ícone de coração com contador de favoritos.
- **Rastreio** — atalho para `/rastreio`.
- **Carrinho** — abre a camada lateral e mostra o número de artigos.

### 2.2 Menu mobile

Abaixo de `lg`, o menu passa para um painel lateral:

- logótipo e assinatura da marca;
- as quatro categorias com indicador da categoria ativa;
- lista de desejos, ajuda, rastreio e verificação de autenticidade;
- fecha automaticamente ao escolher uma opção.

### 2.3 Faixa de anúncio

No topo de todas as páginas aparece a mensagem:

> **Recolha em mãos grátis no Porto**

### 2.4 Temas e idiomas

- O tema é guardado em `localStorage` (`uffa-theme`).
- O idioma é guardado no contexto da loja.
- Todos os textos de interface usam `tr(language, pt, en, es)`.
- O modo escuro aplica-se a todo o site, incluindo catálogo, produto, checkout, portal e painel.

---

## 3. Home

A home é o primeiro contacto com a marca. Está dividida em blocos:

1. **Hero** — imagem de destaque, promessa da marca e botão para o catálogo.
2. **Faixa de confiança** — autenticidade, recolha no Porto e envio.
3. **Categorias** — Casual, Streetwear, Edições Limitadas e Promoções.
4. **Mais procurados** — produtos em destaque com preço, tamanhos e botão de compra.
5. **Bloco do portal** — convite para acompanhar a encomenda em `/rastreio`.
6. **Newsletter** — subscrição por email.

Cada bloco conduz ao passo seguinte: descoberta → escolha → compra → acompanhamento.

---

## 4. Catálogo

**Rota:** `/catalogo`

### 4.1 Filtros

- **Categoria** — Todas, Casual, Streetwear, Edições Limitadas e Promoções.
- **Tamanho** — 36 a 43, ou todos.
- **Preço máximo** — controlo deslizante.
- **Pesquisa** — filtra por nome em tempo real.

O filtro de categoria está ligado ao URL (`?category=sales`), pelo que pode ser partilhado e é atualizado automaticamente quando se clica no menu do cabeçalho.

### 4.2 Cartões de produto

Cada cartão mostra:

- imagem do par;
- selo **Verificado**;
- placa **PROMO** quando o produto está em promoção;
- nome e categoria;
- preço normal ou preço de oferta;
- tamanhos disponíveis;
- botão **Adicionar ao carrinho**;
- coração para adicionar/remover dos favoritos.

Os produtos esgotados aparecem com o estado **ESGOTADO** e o botão desativado.

---

## 5. Página de produto

**Rota:** `/produto/:id`

- **Galeria** — imagem principal e miniaturas.
- **Categoria e selo** — PROMO, ESGOTADO ou EM BREVE.
- **Nome e descrição** — em PT/EN/ES.
- **Preço** — preço normal ou preço de oferta com o preço original riscado.
- **Tamanhos** — apenas tamanhos com stock; tamanhos esgotados aparecem desativados.
- **Quantidade** — ajuste antes de adicionar.
- **Adicionar ao carrinho** — valida o tamanho e adiciona.
- **Favoritos** — guarda o par na lista de desejos.
- **Garantias** — autenticidade, recolha grátis no Porto e política de trocas.
- **Produtos relacionados** — sugestões da mesma categoria.

### 5.1 Stock

O stock é definido por tamanho em `src/lib/shop-data.ts`. O estado do produto é calculado automaticamente:

- sem stock em todos os tamanhos → **ESGOTADO**;
- stock disponível → **ATIVO**.

O catálogo local está configurado com **5 pares por tamanho** para todos os produtos.

---

## 6. Carrinho

O carrinho é uma camada lateral e não uma página.

- Lista de artigos com imagem, nome, tamanho, quantidade e preço.
- Alteração de quantidade com `+` / `-`.
- Remoção individual.
- Campo de **código de desconto**.
- Subtotal e total com desconto.
- **Partilhar no WhatsApp** — gera uma mensagem com o resumo.
- **Copiar carrinho** — copia o resumo para a área de transferência.
- **Finalizar encomenda** — leva ao checkout.

O carrinho persiste em `localStorage` (`uffa-cart`).

---

## 7. Checkout

**Rota:** `/checkout`

### 7.1 Entrega

| Opção | Preço |
| --- | --- |
| Recolha em mão no Porto | **Grátis (0,00 €)** |
| Portugal Continental | **8,94 €** |
| Portugal — Ilhas (Açores e Madeira) | **8,94 €** |
| União Europeia | **24,00 €** |
| Suíça | **34,00 €** |

### 7.2 Dados e pagamento

O checkout local recolhe a modalidade de entrega e apresenta o método de pagamento. Ao clicar em **Pagar agora**, o cliente é redirecionado para o checkout oficial da Shopify, onde completa:

- nome, email, telefone e morada;
- pagamento com cartão, MB WAY ou Google Pay, conforme a configuração da loja.

Não é criada uma conta UFFA. A Shopify pode pedir o email para enviar a confirmação da encomenda.

### 7.3 Integração Shopify

O botão de finalização cria um checkout na Shopify com:

- variantes dos produtos;
- quantidades;
- opção de entrega e respetivo custo, através dos atributos `Modalidade de Entrega`, `Portes de Envio`, `Tipo de Envio` e `Destino / Zona`;
- código de desconto, quando aplicável.

O cliente é redirecionado para o `checkoutUrl` devolvido pela Shopify. Se as variáveis de ambiente da Shopify não estiverem configuradas, o catálogo local continua a funcionar, mas o checkout Shopify não conclui.

### 7.4 Cupões

Os códigos de desconto são validados localmente e refletidos no resumo. O desconto é aplicado ao subtotal e passado à Shopify como `discountCodes`.

---

## 8. Confirmação

**Rota:** `/confirmacao?order=UFFA-XXXXX`

A confirmação é uma página de demonstração que lê as encomendas guardadas localmente (`uffa-orders-v1`). Para as encomendas demo, mostra:

- **Número da encomenda** — `UFFA-XXXXX`.
- **Código exclusivo** — `UFFA-XXXX-XXXX`, necessário para entrar no portal.
- **Código de rastreio** — para encomendas com envio.
- **Código de autenticidade por par** — `UFFA-AUTH-XXXX-XXXX`.
- **Resumo da encomenda** — artigos, entrega, subtotal, portes e total.
- **Próximos passos** — guardar o código e acompanhar em `/rastreio`.

Para encomendas concluídas na Shopify, a confirmação e o acompanhamento são enviados pela própria Shopify por email. A página local só encontra a encomenda se ela existir no armazenamento do browser.

---

## 9. Portal de rastreio

**Rota:** `/rastreio`

### 9.1 Acesso

O cliente entra com três dados:

| Fator | Exemplo |
| --- | --- |
| Número da encomenda | `UFFA-48217` (ou apenas `48217`) |
| Contacto | `demo@uffa.pt` |
| Código exclusivo | `UFFA-7K3M-9QX2` |

Regras:

- 5 tentativas falhadas por encomenda;
- bloqueio de 60 segundos;
- sessão de 30 minutos;
- botão **Terminar sessão**.

### 9.2 Dashboard

- Estado atual e linha temporal.
- Previsão de entrega ou data limite de recolha.
- Transportador e código de rastreio (envio).
- Morada da loja e nota pública (recolha).
- Resumo de valores.
- Itens com código de autenticidade.
- Botão **Confirmar receção** ou **Confirmar recolha**.

### 9.3 Fluxos de estado

**Envio:**

```text
Confirmada → Em preparação → Enviada → Em trânsito → Entregue
```

**Recolha:**

```text
Confirmada → Em preparação → Pronta para recolha → Recolhida
```

**Independente:** `Cancelada`

Cada mudança cria um evento com data/hora no histórico.

---

## 10. Verificação de autenticidade

**Rota:** `/verificar`

- Campo para introduzir o código `UFFA-AUTH-XXXX-XXXX`.
- Também aceita link direto: `/verificar?codigo=UFFA-AUTH-XXXX-XXXX`.
- Resultado válido: selo **UFFA Verified**, produto, tamanho, edição, número de série, data e loja emissora.
- Resultado inválido: mensagem clara e contacto da equipa.
- Nunca mostra nome, email, telefone ou morada do comprador.

---

## 11. Painel de operações

**Rota:** `/operacoes`

**Chave demo:** `UFFA-OPS-2026`

Funcionalidades:

- indicadores: total, em trânsito, prontas para recolha e concluídas;
- pesquisa por número, nome ou contacto;
- filtro por estado;
- fila de encomendas ordenada por atualização;
- editor de estado, previsão, rastreio, transportador e nota pública;
- botão **Avançar para…** para o estado seguinte;
- botão **Copiar** com credenciais e link do portal;
- histórico dos últimos movimentos;
- **Repor demo** para restaurar os dados;
- **Sair** para terminar a sessão.

O editor adapta-se ao tipo de entrega: campos de rastreio e transportador só aparecem em envios.

### 11.1 Dados de demonstração

| Encomenda | Contacto | Código exclusivo | Estado |
| --- | --- | --- | --- |
| `UFFA-48217` | `demo@uffa.pt` | `UFFA-7K3M-9QX2` | Em trânsito |
| `UFFA-73104` | `demo@uffa.pt` | `UFFA-2P8N-5RV6` | Pronta para recolha |

### 11.2 Códigos de autenticidade demo

| Código | Produto | Tamanho |
| --- | --- | --- |
| `UFFA-AUTH-4K7P-2M9Q` | Porto Rose Low | 39 |
| `UFFA-AUTH-8R3T-6N1W` | Cedofeita Court | 40 |
| `UFFA-AUTH-9C2L-7B4X` | Invicta 01 | 42 |

---

## 12. Lista de desejos

**Rota:** `/favoritos`

- Adicionar/remover com o coração nos cartões ou na página de produto.
- Contador no cabeçalho.
- Lista persistente em `localStorage`.
- Acesso rápido ao produto e ao carrinho.

---

## 13. Ajuda e contactos

**Rota:** `/ajuda`

- Perguntas frequentes sobre envios, recolha, tamanhos, autenticidade e devoluções.
- Tabela de portes atualizada: recolha grátis, 8,94 € Continente/Ilhas, 24,00 € UE e 34,00 € Suíça.
- Contactos da loja: email, Instagram e localização no Porto.
- Formulário de contacto com nome, email, número de encomenda opcional, assunto e mensagem.
- Ligação para o portal de rastreio e para a verificação.

---

## 14. Newsletter

- Formulário de email na secção final da home.
- Subscrição enviada para `atendimento@uffastore.pt`.
- Confirmação visual após submissão.

---

## 15. Gestão de stock e catálogo

### 15.1 Catálogo local

Ficheiro: `src/lib/shop-data.ts`

Cada produto tem:

```ts
{
  id: "porto-rose-low",
  name: "Porto Rose Low",
  category: "streetwear",
  price: 0.20,
  originalPrice: 120.0,
  sizes: [
    { size: 36, stock: 5, sku: "UFFA-PRL-01-36", variantId: "gid://shopify/ProductVariant/..." },
    // ...
  ],
}
```

O stock atual está definido em **5 pares por tamanho** para todos os produtos.

### 15.2 Catálogo Shopify

- Fonte principal: Storefront API (`src/lib/shopify.ts` + `src/lib/catalog.ts`).
- Fallback automático para os dados locais se a API falhar.
- O ficheiro `docs/shopify/produtos-uffa.csv` acompanha o catálogo demo e está configurado com **5 unidades por variante**.
- Variáveis necessárias:

| Variável | Descrição |
| --- | --- |
| `VITE_SHOPIFY_STORE_DOMAIN` | Domínio `xxxxx.myshopify.com` |
| `VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN` | Token público da Storefront API |

### 15.3 Atualizar stock

1. Editar `stock` do tamanho em `src/lib/shop-data.ts` (catálogo local) ou no admin da Shopify (catálogo remoto).
2. Confirmar que o estado do produto continua `active`.
3. Validar com `npm run build`.

---

## 16. Idiomas, temas e acessibilidade

- PT, EN e ES em toda a interface.
- Tema claro/escuro com persistência.
- Foco visível em botões, links e campos.
- Contraste validado para texto, badges e estados.
- Navegação por teclado nos menus, formulários e diálogos.
- Imagens com texto alternativo.

---

## 17. Responsividade

- Layout mobile-first.
- Cabeçalho e menu próprios abaixo de `lg`.
- Grelha de catálogo empilhada em mobile.
- Filtros acessíveis em ecrãs pequenos.
- Carrinho e checkout em largura total.
- Portal e painel com cartões empilhados.
- Validado a 390 px.

---

## 18. Resolução de problemas

| Problema | Causa provável | Solução |
| --- | --- | --- |
| O site mostra o catálogo local | Variáveis Shopify em falta | Configurar `.env` e reiniciar |
| Produto não aparece | Estado `inactive` ou sem stock | Verificar `status` e `stock` |
| Categoria não filtra no catálogo | URL sem `?category=` | Abrir `/catalogo?category=casual` ou clicar na categoria do menu |
| Checkout não abre na Shopify | Token/domínio inválidos | Validar variáveis e consola |
| Portal não aceita acesso | Dados ou código incorretos | Usar credenciais demo ou repor demo |
| Sessão expirou | Passaram 30 minutos | Voltar a entrar |
| Tema não guarda | `localStorage` bloqueado | Permitir armazenamento no browser |

---

## 19. Comandos e deploy

```bash
# desenvolvimento
npm install
npm run dev          # http://localhost:8080

# validação
npx tsc --noEmit
npm run build

# apresentações
npm install --no-save --package-lock=false pptxgenjs
node scripts/build-apresentacao-site.mjs
node scripts/build-apresentacao.mjs

# deploy
git add .
git commit -m "docs: atualizar documentação e manual"
git push origin main
```

O deploy de produção é automático na Vercel a cada push para `main`.

---

## 20. Ficheiros principais

| Ficheiro | Responsabilidade |
| --- | --- |
| `src/lib/shop-data.ts` | Produtos, preços, tamanhos, stock e textos |
| `src/lib/shopify.ts` | Checkout e integração Shopify |
| `src/lib/orders.ts` | Encomendas, códigos, estados e sessões |
| `src/lib/i18n.ts` | Traduções inline PT/EN/ES |
| `src/components/site-shell.tsx` | Cabeçalho, navegação, carrinho e footer |
| `src/components/product-card.tsx` | Cartão de produto, preços e badges |
| `src/routes/catalogo.tsx` | Catálogo e filtros |
| `src/routes/produto.$productId.tsx` | Página de produto |
| `src/routes/checkout.tsx` | Checkout e tarifas de envio |
| `src/routes/confirmacao.tsx` | Confirmação da encomenda |
| `src/routes/rastreio.tsx` | Portal do cliente |
| `src/routes/verificar.tsx` | Verificação de autenticidade |
| `src/routes/operacoes.tsx` | Painel de operações |
| `docs/manual-site.md` | Este manual |
| `docs/guia-apresentacao-site.md` | Guião da apresentação do site |
| `docs/portal-encomendas.md` | Documentação técnica do portal |

---

**UFFA Store** · Porto · `atendimento@uffastore.pt` · [@uffastore.legit](https://www.instagram.com/uffastore.legit/)
