# Relatório de Auditoria — UFFA Store

**Branch:** `auditoria-limpeza` (a partir de `main` em `d9d4649`)
**Data:** 18 de novembro de 2026
**Âmbito:** limpeza, segurança, performance e testes E2E.
**Regra seguida:** nada foi removido sem confirmação por pesquisa de importações/referências; na dúvida, o ficheiro ficou e está listado nas decisões pendentes.

> **Estado:** `typecheck` OK · `lint` 0 erros (1 aviso pré-existente) · `npm test` 38/38 · `npm run build` OK · `test:e2e` 15/15.
> **Não foi feito merge para `main`.**

---

## 1. Resumo executivo

| Área | Antes | Depois |
| --- | --- | --- |
| Peso do site estático no build (`.vercel/output/static`) | 9,55 MB | **1,77 MB** (−81%) |
| Peso de `public/` | 6,79 MB | **0,68 MB** (−90%) |
| Peso das imagens otimizadas | 3,07 MB | **0,95 MB** (−2,06 MB) |
| Componentes shadcn existentes | 46 | **8** (os que são usados) |
| Dependências de produção (`dependencies`) | 53 | **22** (total 72 → 42, já com `@playwright/test` em dev) |
| CSS compilado | 104 KB | **69 KB** (−34%) |
| JS principal (`index-*.js`) | 472 KB raw / 143 KB gzip | 472 KB raw / **143 KB gzip** (igual) |
| Vulnerabilidades `npm audit` (produção) | 13 (12 high, 1 moderate) | **12 high** |
| Rotas internas | incluía `/operacoes` com password no browser | **removida** |
| Testes unitários | 38/38 | **38/38** |
| Testes E2E | não existiam | **15/15** (desktop + mobile) |

**Único achado que ainda exige decisão sua** (detalhe na secção 7):
1. **Todos os preços da Shopify estão a 0,00 €** — a loja mostra `0,00 €` em produção.

Já resolvidos nesta branch: o painel `/operacoes` (password no código) foi **removido**, e os 29 ficheiros órfãos de `public/` (~6,1 MB) foram **arquivados** em `Arquivos Old/`.

---

## 2. Ficheiros e dependências removidos

Tudo em commits separados, com build/typecheck/testes validados depois de cada um.

### 2.1 Artefactos mortos na raiz — `06095ff`
| Ficheiro | Porquê |
| --- | --- |
| `inventario-atual.csv` | Exportação manual antiga do catálogo; nada o referencia. |
| `revisao-agrupamento.html` | Página de trabalho estática, sem ligação ao site. |
| `src/style.css` | CSS legado de Tailwind v3 (`@tailwind base/...`) que já não é importado — o projeto usa `src/styles.css` (Tailwind v4). |

### 2.2 Componentes shadcn sem uso — `bf27622`
Removidos **38 componentes** de `src/components/ui/` + `src/hooks/use-mobile.tsx`, após confirmar zero importações (knip + grep):

`accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, drawer, dropdown-menu, form, hover-card, input-otp, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, separator, sidebar, skeleton, slider, switch, table, tabs, toggle, toggle-group, tooltip`

**Mantidos** (têm importações reais): `button, dialog, input, label, select, sheet, sonner, textarea`.

### 2.3 Dependências não usadas — `387474d`
**30 pacotes** removidos (confirmado por knip + grep a `src/` e `scripts/`):

`@hookform/resolvers`, `cmdk`, `date-fns`, `input-otp`, `react-day-picker`, `react-hook-form`, `react-resizable-panels`, `recharts`, `vaul` e 21 pacotes `@radix-ui/react-*` (accordion, alert-dialog, aspect-ratio, avatar, checkbox, collapsible, context-menu, dropdown-menu, hover-card, menubar, navigation-menu, popover, progress, radio-group, scroll-area, separator, slider, switch, tabs, toggle, toggle-group, tooltip).

**Mantidos de propósito** (são usados, embora o knip os marque como "não usados"):
- `@tanstack/router-plugin` — usado por `vite.config.ts` / plugin do TanStack Start.
- `docx`, `sharp`, `heic-convert`, `pptxgenjs` — usados por scripts de `scripts/` (documentados no `README`).
- `scripts/*` — ferramentas operacionais documentadas; não entram no bundle.

### 2.4 Imagens — `0b4f323`
- 6 JPG de `src/assets` convertidos para WebP e os originais removidos (cópias em `backup-fotos/originais-web/`).
- Imports atualizados em `src/lib/shop-data.ts`.
- `src/assets/uffastore-logo.jpg` foi reposto no commit `e1810e2` por ser um recurso de marca (não usado no código, mas mantido por segurança).

---

## 3. Segurança

### 3.1 Corrigido
| Item | Ação |
| --- | --- |
| `npm audit fix` sem breaking changes | Atualizados `seroval` (moderate), `minimatch`/`tinyglobby` (cadeia de tooling). Commit `b9f1fcd`. |
| Segredos no código | Confirmado: nenhum `shpat_`, `sk_live`, `AKIA`, chave privada, `client_secret` em `src/`. |
| Segredos no bundle cliente | Confirmado no build: o bundle **não** contém `SHOPIFY_ADMIN_*`, `RESEND_API_KEY` nem `client_secret`. Só o token público da Storefront API (é público por desenho). |
| Segredos no histórico git | Pesquisado `shpat_`, `sk_live`, `sk_test`, `AKIA`, `BEGIN ... PRIVATE KEY`. As únicas ocorrências são texto documental em `AUDITORIA.md` (commit `4ec8ab1`). |
| `.env` | Está no `.gitignore` e **não** está versionado (só `.env.example`). |
| XSS | Nenhum `dangerouslySetInnerHTML`, `innerHTML` ou `eval()` em `src/`. O HTML da descrição Shopify é limpo com `replace(/<[^>]*>/g, "")`. |
| Validação de inputs | Formulários usam `required` + `type="email"`/`type="tel"`; a validação de stock é refeita antes de criar o checkout. |

### 3.2 Pendente — requer decisão (por gravidade)

| # | Gravidade | Achado | Detalhe |
| --- | --- | --- | --- |
| 1 | ~~Alta~~ **Resolvido** | Password do painel interno no bundle | O painel `/operacoes` foi **removido** (commit `64a0bb6`). A rota devolve `NotFound`, a password `UFFA-OPS-2026` desapareceu do código e do bundle, e o `routeTree` foi regenerado. |
| 2 | **Alta** | `zod < 4.6.6` (GHSA-mrhx-c7xc-m3w5) | Consumo de memória ao validar coleções grandes. Correção exige `zod@4.6.7` (breaking). Usado em `validateSearch` de rotas. |
| 3 | **Alta** | `vite` (Windows) | `launch-editor` não escapa `%` nos argumentos → execução de comandos em dev no Windows. Só afeta desenvolvimento, não produção. |
| 4 | **Alta** | Cadeia `picomatch`/`fdir`/`tinyglobby`/`unplugin`/`@tanstack/*` | ReDoS em tooling de build. Correção exige subir a stack TanStack (breaking). Não vai para o bundle final. |
| 5 | Média | Sem CSP | `vercel.json` tem HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`. Falta `Content-Security-Policy`. **Não adicionei**: uma CSP mal calibrada (TanStack Start injeta scripts inline, Google Fonts, `cdn.shopify.com`) parte a loja em produção. Recomendo implementar com `report-only` primeiro. |
| 6 | Média | Sem webhooks de pagamento | O site cria o checkout na Shopify e delega o pagamento. Não há webhook, logo não há assinatura para validar. O preço é sempre calculado pela Shopify a partir do `variantId` + `quantity` — o cliente nunca envia preço. Correto. |
| 7 | Baixa | Rate limiting / CORS | Não aplicável: não existem endpoints próprios de API; o browser fala diretamente com a Storefront API pública. |
| 8 | Baixa | Cookies | O site não usa cookies; estado em `localStorage`/`sessionStorage` (não sensível). |

---

## 4. Performance

### 4.1 Imagens (a maior vitória)

| Ficheiro | Antes | Depois | Ganho |
| --- | --- | --- | --- |
| `public/capas/uffa-capa-home.webp` (hero desktop, LCP) | 339 KB (2400×1031) | **167 KB** (1920×825) | −51% |
| `public/capas/uffa-capa-home-mobile.webp` | 179 KB (1080×1800) | **106 KB** (900×1500) | −41% |
| `public/produtos/uffa-modelo-padrao.webp` | 428 KB (1664×2080) | **124 KB** (1200×1500) | −71% |
| `public/images/floral-air-force.webp` | 802 KB (1600×2000) | **281 KB** (1200×1500) | −65% |
| 6 fotos de `src/assets` (JPG → WebP) | 1,22 MB | **0,25 MB** | −80% |
| **Total** | **3,07 MB** | **0,95 MB** | **−2,06 MB** |

Verificação visual feita com screenshots da homepage e da página de produto após a compressão — sem artefactos visíveis.

### 4.2 LCP do hero
`src/components/hero-carousel.tsx`: o primeiro slide passou a `loading="eager"`, `fetchPriority="high"`, `decoding="sync"`; os restantes `lazy`/`low`/`async`. Antes nenhuma imagem do hero tinha prioridade declarada.

### 4.3 CSS e bundle
- CSS: **104 KB → 69 KB raw** (−34%) — consequência direta da remoção dos 38 componentes shadcn (o Tailwind v4 só gera as classes usadas).
- JS principal: 472 KB raw / 143 KB gzip — **sem alteração**. As rotas já eram code-split (`checkout`, `rastreio`, `catalogo`, etc. em chunks separados).

### 4.4 Peso do site estático
Depois de comprimir imagens **e** de arquivar os 29 ficheiros órfãos de `public/`, o diretório `.vercel/output/static` passou de **9,55 MB para 1,77 MB** (−81%). `public/` ficou com 12 ficheiros / 0,68 MB.

### 4.5 O que **não** mexi (e porquê)
- **Code splitting adicional**: o chunk `index-*.js` (472 KB raw) inclui React, router, `embla-carousel`, Radix select/dialog, `sonner` e `lucide-react`. Fazer split manual aqui é arriscado (dependências do shell) e o ganho estimado é moderado; fica como recomendação.
- **Fontes**: já usam `display=swap` via Google Fonts com `preconnect`. Não há `@font-face` local.
- **Cache**: a Vercel já serve `assets/*` com hash e cache longo por omissão. Não alterei headers para não arriscar cache negativo em HTML.

---

## 5. Testes E2E (Playwright)

**Novo:** `playwright.config.ts`, `e2e/loja.spec.ts`, script `npm run test:e2e`. Projetos `desktop` (1440×900) e `mobile` (Pixel 7).

**O checkout da Shopify é sempre simulado** por interceção da chamada GraphQL (`cartCreate`) — nenhum pagamento real, nenhum dado de cartão.

| # | Teste | Resultado |
| --- | --- | --- |
| 1 | Homepage carrega e o menu leva ao catálogo | ✅ |
| 2 | Catálogo lista produtos e a pesquisa filtra | ✅ |
| 3 | Página de produto mostra tamanhos e preço | ✅ |
| 4 | Produto inexistente não rebenta a app | ✅ |
| 5 | Carrinho: adicionar, aumentar quantidade, remover | ✅ |
| 6 | Carrinho sobrevive a refresh | ✅ |
| 7 | Cupão inválido rejeitado + cupão `UFFA10` aplica 10% | ✅ |
| 8 | Carrinho vazio mostra estado vazio e esconde pagamento | ✅ |
| 9 | Campos obrigatórios impedem envio | ✅ |
| 10 | E-mail inválido bloqueado | ✅ |
| 11 | Falha da Shopify mostra erro e mantém carrinho | ✅ |
| 12 | Sucesso guarda a compra e redireciona para a Shopify | ✅ |
| 13 | Confirmação mostra dados e códigos de par | ✅ |
| 14 | Confirmação sem compra pendente não parte | ✅ |
| 15 | Mobile: menu + compra completa até ao checkout | ✅ |

**Resultado:** `15 passed (≈2 min)`.

### Casos não cobertos (e porquê)
- **Pagamento real / cancelamento na Shopify**: exigiria credenciais de sandbox da Shopify e dados de cartão de teste. O fluxo testado cobre tudo o que é nosso (criação do checkout, `return_url`, gravação da compra, página de confirmação).
- **E-mail de confirmação**: não existe envio de e-mail no site; é a Shopify que o envia. `RESEND_API_KEY` está no `.env` mas não é usada no código do site.
- **Produto sem stock**: a loja atual tem stock em todas as variantes (verificado via API), por isso não há caso real para testar.

---

## 6. Comandos de validação

```bash
npm run typecheck   # OK
npm run lint        # 0 erros, 1 aviso pré-existente (react-refresh em checkout.tsx)
npm test            # 38/38
npm run build       # OK
npm run test:e2e    # 15/15 (precisa do dev server em :8080)
```

---

## 7. Riscos e decisões que preciso de ti

### 7.1 CRÍTICO — Todos os preços estão a 0,00 €
A Storefront API devolve `0.0 EUR` para **todos** os produtos e variantes, e a página de produto mostra `0,00 €` — **também em produção** (`www.uffastore.pt/produto/nike-air-force`).

- **Não é bug de código**: o site mostra o preço que a Shopify devolve. O preço do checkout também vem da Shopify.
- Causa provável: preços não preenchidos na Shopify, ou o mercado/`market` associado ao token não tem preços definidos.
- **Ação necessária:** preencher os preços no Admin da Shopify (ou corrigir o mercado) antes de abrir vendas. Não alterei nada aqui.

### 7.2 Autenticação do painel `/operacoes` — **resolvido**
O painel foi **removido** (commit `64a0bb6`) a teu pedido. Já não existe rota, ligação, chunk nem password no site. A documentação (`docs/manual-site.md`, `docs/portal-encomendas.md`, guias de apresentação e o comando `.opencode/commands/uffavercel.md`) foi atualizada para refletir a remoção. Se um dia for preciso gerir encomendas, deve nascer como backoffice separado, com autenticação no servidor.

### 7.3 Ficheiros em `public/` sem referências (~6,1 MB) — **arquivados**
Não foram apagados: foram movidos para **`Arquivos Old/`** (fora de `public/`, por isso não entram no deploy) com um `LEIA-ME.md` que explica o conteúdo e como repor cada ficheiro com `git mv`.

```
Arquivos Old/images/nike-af1-floral-01.jpg · -02.jpg · -03.jpg
Arquivos Old/produtos/material-heic-01..07.webp
Arquivos Old/produtos/thumbs/material-heic-01..07.webp + material-01..05.webp
Arquivos Old/produtos/nike-vomero-5.webp
Arquivos Old/produtos/material-01..05.webp
Arquivos Old/payments/visa.svg (a Visa é SVG inline no checkout)
```

A única referência externa era o artefacto `design/stories/story-comercial.html`, cujo caminho foi atualizado para `../../Arquivos Old/images/nike-af1-floral-02.jpg`. Commit `ae6cc42`.

### 7.4 `backup-fotos/` dentro do repositório (86,34 MB)
Está no `.gitignore`, mas os ficheiros **já foram commitados** antes disso, por isso continuam versionados (MOV/HEIC originais). Recomendo `git rm --cached` + manter localmente, mas isso reescreve o histórico do próximo clone (não o histórico passado). **Não mexi** — decide tu.

### 7.5 Vulnerabilidades que exigem breaking changes
`zod` (4.6.7), `vite` e a cadeia TanStack/`picomatch` só se resolvem com upgrades major. Nenhuma delas afeta o runtime do cliente final (exceto `zod`, usado em validação de search params). Recomendo um PR dedicado para o upgrade da stack.

### 7.6 CSP
Recomendo `Content-Security-Policy-Report-Only` primeiro, com recolha de violações, e só depois aplicar. Posso preparar isso num PR separado.

---

## 8. Commits nesta branch

| Commit | Descrição |
| --- | --- |
| `7664d44` | WIP do checkout: crachás de pagamento reais + correção do ícone invisível |
| `06095ff` | Remove artefactos mortos na raiz e CSS legado (Tailwind v3) |
| `bf27622` | Remove 38 componentes shadcn e o hook `use-mobile` sem importações |
| `387474d` | Remove 30 dependências não usadas |
| `b9f1fcd` | `npm audit fix` sem breaking changes |
| `0b4f323` | Comprime imagens, converte assets para WebP e prioriza o LCP do hero |
| `e1810e2` | Repõe o logotipo em `src/assets` (mantido por segurança) |
| `4bfeebe` | Suite E2E Playwright (desktop + mobile) |
| `e3ca4de` | Prettier no spec/config do Playwright |
| `bcfbcff` | Relatório final da auditoria |
| `64a0bb6` | Remove o painel interno `/operacoes` e atualiza a documentação |
| `ae6cc42` | Arquiva 29 ficheiros órfãos em `Arquivos Old/` (estático 7,92 → 1,77 MB) |

**`main` continua em `d9d4649`, intacta.**
