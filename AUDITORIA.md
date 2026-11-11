# Auditoria UFFA Store — GitHub, Vercel, Segurança, Limpeza e Bug das Imagens

**Data:** 11/11/2026  
**Branch de trabalho:** `auditoria/uffa` (criada a partir de `main`, sem commits)  
**Âmbito:** repositório `jrfdutra/uffastore`, site `https://www.uffastore.pt`, deploy Vercel, código Vite + React + TanStack Start (origem Lovable).  
**Modo:** análise apenas de leitura. Nenhum ficheiro do projeto foi alterado, apagado ou commitado. Este relatório é a única entrega.

---

## 1. Resumo executivo (10 linhas)

1. O site está no ar, em HTTPS, com redirect 308 de `uffastore.pt` para `www.uffastore.pt` e rotas diretas a responder 200.
2. O build de produção passa (`npm run build`), mas o projeto **não tem CI**: `npx tsc --noEmit` falha e `npm run lint` falha com 460 erros.
3. O erro de TypeScript já está **em produção**: clicar em “Adicionar” dispara `ReferenceError: tr is not defined` (bug crítico de compra).
4. O bug das imagens tem causa identificada: a Shopify devolve 3 imagens por produto, mas o site usa **apenas a imagem destacada**; nos 5 produtos a destacada é a mesma foto floral da Air Force 1, e a galeria é ignorada.
5. O repositório GitHub é **público** e contém a chave do painel `/operacoes`, códigos demo e um contrato com nomes e valores — tudo legível por qualquer pessoa.
6. O painel `/operacoes` está público, com password hardcoded e uma afirmação falsa de “autenticação e registo de auditoria”.
7. `npm audit` reporta 2 vulnerabilidades altas (`vite`, `zod`) e 8 moderadas; não há vulnerabilidades críticas.
8. Faltam CSP, política de privacidade, termos, dados legais da empresa, livro de reclamações e o direito legal de devolução de 14 dias; a política atual “sem trocas nem devoluções” é ilegal para vendas à distância na UE.
9. Há 38 de 46 componentes UI não usados, dependências não usadas, dois lockfiles concorrentes (`bun.lock` + `package-lock.json`), ficheiros Netlify/WordPress esquecidos e ~31,7 MB de documentação no repositório.
10. Lighthouse: Acessibilidade 92, Boas Práticas 100, SEO 100; falham contraste de cor e tamanho de alvos táteis.

---

## 2. Tabela de problemas (ordenada por gravidade)

| N.º | Gravidade | Área | Problema | Evidência | Risco | Correção proposta | Esforço |
|---|---|---|---|---|---|---|---|
| 1 | **Crítico** | Funcional / Compra | `tr` não está importado em `shop-context.tsx`; o toast de “Adicionado ao carrinho” rebenta em produção | `src/lib/shop-context.tsx:206` e `:208` usam `tr(...)`; não há import de `@/lib/i18n`. `npx tsc --noEmit` → `TS2304: Cannot find name 'tr'`. Consola do site em produção ao clicar em “Adicionar”: `ReferenceError: tr is not defined` | Fluxo de compra lança exceção não tratada; UX de carrinho quebrada e possível quebra do handler | Importar `tr` de `@/lib/i18n` e adicionar `tsc --noEmit` ao CI/prebuild | Baixo |
| 2 | **Alto** | Segurança / Acesso | Painel `/operacoes` público com credenciais hardcoded num repositório público | `src/routes/operacoes.tsx:89` (`OPS_ACCESS_KEY`), `:142` (emails aceites), `:154` (comparação da password); `README.md:86`; `docs/guia-apresentacao-site.md:57`; `docs/manual-site.md:628`; `https://www.uffastore.pt/operacoes` responde 200 | Qualquer pessoa entra no painel, altera catálogo/stock/encomendas demo e vê a falsa alegação de auditoria (`operacoes.tsx:244`) | Remover a chave do código/docs, desativar a rota em produção ou implementar auth real server-side; rodar a chave | Médio |
| 3 | **Alto** | Imagens / Catálogo | A imagem destacada dos produtos é a mesma foto floral; a galeria de imagens da Shopify nunca é usada | `src/lib/catalog.ts:79` usa só `node.featuredImage?.url`; `shopify.ts:47` e `:249` pedem `images(first: 10)` mas `toProduct` (`catalog.ts:71-83`) ignora-as; `src/routes/produto.$productId.tsx:85-104` repete `p.image` 3 vezes. A API Storefront devolve, por produto, `[floral, photo_2026-11-09_15-00-57, photo_2026-11-09_15-01-02]`; no DOM, 4 dos 5 cartões mostram a mesma floral | Clientes não veem as fotos reais do par; parece “imagem errada/em falta”; perda de confiança e de conversão | Mapear `node.images.nodes` para `Product.images`; renderizar galeria real no produto; no Shopify Admin, reordenar a media para a foto correta ficar em primeiro (featured) | Médio |
| 4 | **Alto** | Processo / CI | Não há CI nem typecheck no build; o erro do ponto 1 passou para produção | Não existe `.github/`; `package.json:8` (`build: vite build`, sem `tsc`); `npx tsc --noEmit` falha; `npm run lint` falha com 460 erros | Regressões de tipos e erros de runtime chegam a produção | Adicionar workflow GitHub Actions (`npm ci`, `tsc --noEmit`, `lint`, `build`) e `prebuild`/`prepush` com typecheck | Médio |
| 5 | **Alto** | Legal / RGPD | Política “sem trocas nem devoluções” e ausência de privacidade, termos, dados legais e livro de reclamações | `src/lib/shop-data.ts:251` (“Sem trocas nem devoluções”); `src/routes/ajuda.tsx:97` e `:103`; `src/routes/index.tsx:25`; rodapé `src/components/site-shell.tsx:472-528` sem links legais | Violação do direito de livre resolução de 14 dias (Diretiva 2011/83/UE), coimas, reclamações e chargebacks | Rever a política de devoluções, publicar Política de Privacidade, Termos, dados da empresa (NIF/morada), link do Livro de Reclamações Eletrónico | Alto |
| 6 | **Alto** | Privacidade / Repositório | Repositório público expõe contrato com nomes e valores e credenciais demo | API GitHub: `visibility=public`, `private=false`; `docs/termo_prestacao_servicos_uffa_store.docx` contém “Hugo Brandão”, “Júnior Dutra” e valor de 300 €; `README.md:75-86` e `docs/guia-apresentacao*.md` contêm códigos e chave | Exposição de dados pessoais/comerciais e de acessos demo; risco reputacional e de RGPD | Tornar o repositório privado ou remover/redigir `docs/termo*` e credenciais; rodar chaves demo | Baixo |
| 7 | **Médio** | Dependências | `npm audit`: 2 altas e 8 moderadas | `vite` high (8.0.0–8.1.5; correção 8.3.8), `zod` high (<4.6.6; correção 4.6.7), `seroval` moderate (injeção de código), `minimatch`/`typescript-eslint` moderate | DoS por `zod` em validação de input, execução de comandos no dev server (`vite`), injeção via serialização (`seroval`) | `npm audit fix` para `vite`; mitigar `zod` (subir para 4.x ou substituir a validação simples de `catalogo.tsx`); atualizar `typescript-eslint` | Médio |
| 8 | **Médio** | Segurança / Headers | Não há Content-Security-Policy nem COOP/CORP | Headers reais de `https://www.uffastore.pt/`: HSTS, `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`; **sem** `Content-Security-Policy`; `vercel.json:15-33` não a define | Menor defesa contra XSS/injeção de scripts de terceiros | Adicionar CSP compatível (Shopify CDN, Google Fonts, formsubmit) e `Cross-Origin-Opener-Policy`/`Cross-Origin-Resource-Policy` | Médio |
| 9 | **Médio** | Formulários / RGPD | Newsletter envia emails para `formsubmit.co` com `_captcha: false` e sem política de privacidade | `src/components/newsletter.tsx:35-49`; `_captcha: "false"` na linha 41; honeypot simples nas linhas 29-31 | Spam/abuso, transferência de dados pessoais para terceiro sem base legal explícita | Usar endpoint próprio (server function) com rate limit e CAPTCHA; divulgar processador e base legal | Médio |
| 10 | **Médio** | Funcional / Formulários | Formulário de contacto de `/ajuda` finge que envia e não envia nada | `src/routes/ajuda.tsx:34-42`: só faz `setSubmitted(true)` e `toast.success`, sem `fetch`/email | Cliente pensa que contactou a loja; pedidos de apoio perdidos | Ligar a um endpoint real (email/CRM) ou remover o formulário e deixar só `mailto:` | Baixo |
| 11 | **Médio** | Segurança / Vercel | Variáveis `SHOPIFY_ADMIN_*` existem no `.env` mas não são usadas pelo código | `.env` tem 6 nomes; `grep` em `src/` só encontra `VITE_SHOPIFY_*` (`shopify.ts:1-2`); `.env.example:10-11` só documenta 2 | Credenciais administrativas desnecessárias e com privilégios excessivos; risco se estiverem também na Vercel | Remover `SHOPIFY_ADMIN_*` do `.env` e da Vercel se não forem usadas; documentar só as 2 públicas | Baixo |
| 12 | **Médio** | Segurança / Código | Token Storefront hardcoded como fallback | `src/lib/shopify.ts:2` tem um token público por omissão | Token público é de leitura, mas fica preso ao código e não é rotacionável sem deploy; pode ser abusado/limitado | Remover o fallback, exigir `VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN` e documentar rotação | Baixo |
| 13 | **Médio** | Performance / Imagens | Imagens grandes e sem cache | `public/images/nike-af1-floral-01/02/03.jpg` = 656/719/582 KB (1920×2560); `src/assets/Gemini_*.jpg` = 469/452 KB (896×1195). Header real de `/images/*`: `Cache-Control: public, must-revalidate, max-age=0`; `/assets/*` já é `immutable` | LCP lento e consumo de dados em mobile | Converter para WebP/AVIF, redimensionar, servir `srcset` e cache longo para `/images/*` | Médio |
| 14 | **Médio** | Repositório / Build | Dois lockfiles e ferramentas de gestores diferentes | `bun.lock` (143 KB) e `package-lock.json` (189 KB) tracked; `bunfig.toml` tracked; `bun` não está instalado; `node_modules/.package-lock.json` confirma npm | Builds não reprodutíveis e dependências divergentes | Escolher npm como oficial, apagar `bun.lock`/`bunfig.toml` e atualizar README | Baixo |
| 15 | **Médio** | Limpeza / Dependências | 38 de 46 componentes UI não usados e dependências sem uso | Script de imports: só `button`, `input`, `label`, `textarea`, `dialog`, `select`, `sheet`, `sonner` são usados (8 de 46); `date-fns`, `@hookform/resolvers` sem imports; `docx` só em `scripts/generate-termo-docx.mjs` | Bundle e manutenção maiores; superfície de ataque | Remover componentes/deps não usados e mover `docx` para `devDependencies` | Médio |
| 16 | **Médio** | SEO | Sem `sitemap.xml`, sem `og:image` e `lang="en"` fixo | `https://www.uffastore.pt/sitemap.xml` → 404; `__root.tsx:107` `<html lang="en">`; nenhuma rota define `og:image` | Indexação e partilhas sociais piores; acessibilidade/idioma errado no SSR | Gerar `sitemap.xml`, adicionar `og:image`, definir `lang` dinâmico (pt/en/es) | Baixo |
| 17 | **Médio** | SEO / Segurança | `robots.txt` permite tudo, incluindo `/operacoes` e `/manual` | `public/robots.txt` só tem `Allow: /`; `/manual` e `/operacoes` respondem 200 | Painel e documentação interna indexáveis | `Disallow: /operacoes` e `/manual`; adicionar `Sitemap:` | Baixo |
| 18 | **Médio** | Privacidade / Terceiros | Google Fonts e logos de pagamento carregados de terceiros | `__root.tsx:90-95` (Google Fonts); `checkout.tsx:379-383` (Wikimedia) | Transferência de IP para Google/Wikimedia; dependência externa pode falhar | Self-host das fontes e logos locais | Baixo |
| 19 | **Médio** | Repositório | ~31,7 MB de documentação e histórico de 42,26 MB | `git ls-files docs` ≈ 31,7 MB; `.git` 42,26 MB; `docs/apresentacao-site-uffa.pptx` 5,5 MB e versões antigas no histórico | Clones lentos e ruído no repositório | Mover apresentações/screenshots para Releases ou armazenamento externo; limpar histórico só com aprovação | Médio |
| 20 | **Baixo** | Build / Vercel | Versão de Node não fixada | `package.json` sem `engines`; Vercel usa a versão por omissão | Diferenças entre local (v24.13.0) e produção | Adicionar `engines.node` e/ou `.nvmrc` | Baixo |
| 21 | **Baixo** | Código | `console.log` de debug em produção | `src/lib/shopify.ts:184-185` (`DEBUG: domain`, `DEBUG: token being used`) | Ruído e fuga de metadados na consola | Remover os dois `console.log` | Baixo |
| 22 | **Baixo** | Limpeza | Ficheiros de Netlify/WordPress esquecidos | `netlify.toml:1-3` (`bun run build`), `functions.php:1-15` (tema WordPress) | Confusão de deploy e manutenção | Apagar os dois ficheiros (após confirmação) | Baixo |
| 23 | **Baixo** | Limpeza | README de template do TanStack dentro de `src/routes` | `src/routes/README.md` (convenções genéricas) | Ruído; não afeta runtime | Apagar após confirmação | Baixo |
| 24 | **Baixo** | Acessibilidade | Lighthouse 92: contraste de cor e alvos táteis | Lighthouse em `/` e `/catalogo`: `color-contrast` e `target-size` | Dificulta uso em mobile/baixa visão | Ajustar contraste e tamanho mínimo de botões (44×44) | Baixo |
| 25 | **Baixo** | Segurança / Código | `dangerouslySetInnerHTML` num componente não usado | `src/components/ui/chart.tsx:73`; `chart` não é importado por nenhuma rota | Sem impacto atual, mas é um padrão de risco | Remover o componente não usado | Baixo |
| 26 | **Baixo** | UX | Aviso demo bloqueia o scroll no primeiro acesso | `src/components/demo-notice.tsx:52` (Radix Dialog) faz `body { overflow: hidden }`; imagens do catálogo usam `loading="lazy"` e ficam abaixo da dobra | Utilizador pode pensar que a página “não anda” ou que as imagens não carregam | Manter o modal, mas garantir fecho fácil e/ou não bloquear scroll em rotas de catálogo | Baixo |
| 27 | **Baixo** | Repositório | Sem `LICENSE` e sem proteção de branch verificável | API GitHub: `license=null`; endpoints de proteção/segurança devolvem 401 sem autenticação | Falta de clareza legal e de governação | Definir licença (ou manter privado) e ativar branch protection | Baixo |
| 28 | **Baixo** | Limpeza | `.gitignore` não cobre `design/` e `.opencode/` | `git status` mostra `?? design/` (11,17 MB, 17 ficheiros) e `?? .opencode/skills/` | Risco de commit acidental de assets locais | Adicionar ao `.gitignore` ou manter fora do repo | Baixo |

---

## 3. Diagnóstico do bug das imagens (Fase 5)

### 3.1 Causa principal — a galeria da Shopify é ignorada e a imagem destacada está errada

**Evidência objetiva:**

- A query da Storefront API pede a galeria: `shopify.ts:47` e `shopify.ts:249` (`images(first: 10) { nodes { url altText } }`).
- O mapeamento para o modelo interno usa **apenas** `featuredImage`: `catalog.ts:79`
  ```ts
  image: node.featuredImage?.url ?? imageByHandle[node.handle] ?? fallback?.image ?? grey,
  ```
- O tipo `Product` já prevê galeria (`shop-data.ts:30`, `images?: string[]`), mas `toProduct` nunca a preenche (`catalog.ts:71-83`).
- A página de produto repete a mesma imagem 3 vezes em vez de mostrar a galeria: `produto.$productId.tsx:85-104` (`<img src={p.image} …>` dentro de `[0, -10, 10].map`).
- Resposta real da Storefront API (produtos publicados): cada produto tem 3 media, por esta ordem:
  1. `nike-af1-floral-01_<hash>.jpg` (featured)
  2. `photo_2026-11-09_15-00-57_<hash>.jpg`
  3. `photo_2026-11-09_15-01-02_<hash>.jpg`
- No DOM do site, 4 dos 5 cartões mostram a mesma `nike-af1-floral-01_*`; só o “Photon Dust” mostra `photo_2026-11-09_15-00-57.jpg`.
- No Shopify Admin, o produto “Nike Dunk Low Grey Fog” tem 3 imagens distintas; a floral é a primeira (featured). Ou seja, **as fotos corretas existem, mas nunca são mostradas**.

**Conclusão:** não é um 404 nem um problema de maiúsculas/minúsculas. Os URLs respondem 200 (`image/jpeg`, ~671 KB). O bug é de **dados + código**: a imagem destacada na Shopify é uma foto genérica (floral) e o site não usa a galeria.

**Correção:**
1. Código: preencher `images: node.images.nodes.map(i => i.url)` em `toProduct` e usar `p.images ?? [p.image]` na galeria do produto (e, se desejado, no cartão).
2. Dados (Shopify Admin): em cada produto, arrastar a foto correta para a primeira posição (featured). Isto é manual e não se resolve com deploy.

### 3.2 Causa secundária — troca de imagem entre SSR e cliente

- O SSR do produto renderiza a imagem local de `src/assets` (ex.: `Gemini_Generated_Image_wmmzi1wmmzi1wmmz.jpg`), e após a hidratação o catálogo da Shopify substitui por CDN. Na rede veem-se os dois pedidos: o asset local e a imagem `cdn.shopify.com`.
- Isto provoca um “flash” de imagem errada e, em ligações lentas, a sensação de imagem que “não aparece”.
- Correção: alinhar o loader SSR com o catálogo cliente (ou usar `loaderData` como fallback estável) e reservar espaço (`aspect-ratio`) para evitar layout shift.

### 3.3 Causa terciária — aviso demo + lazy loading

- No primeiro acesso, o `DemoNotice` abre um Radix Dialog (`demo-notice.tsx:52`) que aplica `overflow: hidden` ao `body`. Com `scrollY: 0` e imagens `loading="lazy"` abaixo da dobra, as imagens só carregam depois de fechar o aviso e fazer scroll.
- Não é a causa principal (as imagens carregam depois), mas agrava a perceção de “imagens que não aparecem”.
- Correção: manter o aviso, mas garantir que o fecho é óbvio e que o scroll é reposto; opcionalmente `loading="eager"` na primeira dobra.

---

## 4. Evidências dos comandos e verificações

| Verificação | Resultado |
|---|---|
| `node -v` / `npm -v` / `bun -v` | `v24.13.0` / `11.21.1` / bun não instalado |
| `npm run build` | Passa; Nitro gera `.vercel/output`; sem warnings |
| `npx tsc --noEmit` | Falha: `shop-context.tsx(206,21)` e `(208,18)`: `TS2304: Cannot find name 'tr'` |
| `npm run lint` | Falha: 460 erros (maioria Prettier), 1 warning |
| `npm audit --json` | 0 críticas, 2 altas, 8 moderadas, 0 baixas |
| `git branch -a` / `git tag` | Só `main` + `origin/main`; sem tags; sem branches mortos |
| API GitHub `repos/jrfdutra/uffastore` | `visibility=public`, `private=false`, `default_branch=main`, sem licença |
| API GitHub proteção/segurança | 401 sem autenticação → verificar manualmente |
| Headers de produção | HSTS, `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`; **sem CSP** |
| Redirect `http(s)://uffastore.pt/` | 308 → `https://www.uffastore.pt/` |
| Rotas diretas | `/produto/...`, `/catalogo`, `/checkout`, `/favoritos`, `/rastreio`, `/verificar`, `/ajuda` → 200 |
| `robots.txt` / `sitemap.xml` | `robots.txt` 200 (sem `Sitemap:`); `sitemap.xml` 404 |
| `/operacoes` / `/manual` | 200 (públicos) |
| Lighthouse `/` e `/catalogo` | A11y 0.92, Best Practices 1.00, SEO 1.00; falhas `color-contrast` e `target-size` |
| Consola de produção (add-to-cart) | `ReferenceError: tr is not defined` |
| Imagens Shopify | 200 `image/jpeg`, ~671 KB; 4 produtos com a mesma floral |
| `/assets/*` | `Cache-Control: public, max-age=31536000, immutable` |
| `/images/*` | `Cache-Control: public, must-revalidate, max-age=0` |
| Bundle cliente | `index-*.js` ≈ 467 KB; sem source maps |
| `.env` | 6 nomes; só os 2 `VITE_*` são usados; 4 `SHOPIFY_ADMIN_*` sem uso |
| Bundle cliente | Nenhuma ocorrência de `SHOPIFY_ADMIN`, `shpat_`, `client_secret` (bom) |
| `.git` | 42,26 MB; 241 ficheiros tracked; `docs/` ≈ 31,7 MB |
| `.gitignore` | Cobre `node_modules`, `dist`, `.env*`, logs, `.DS_Store`, editores; não cobre `design/`/`.opencode/` |

---

## 4.1 Notas de segurança adicionais (verificadas)

- **Backend:** não existe Supabase nem backend próprio. Catálogo, carrinho, favoritos, encomendas demo e sessões vivem em `localStorage`/`sessionStorage` (`src/lib/storage.ts`, `src/lib/orders.ts`). Não há RLS a verificar; a persistência real terá de ser feita num backend com autenticação e auditoria.
- **Pagamentos:** não há campos de cartão, CVV ou IBAN no código. O checkout recolhe apenas variantes e redireciona para o checkout alojado da Shopify (`src/lib/shopify.ts:132-230`; `src/routes/checkout.tsx:113-159`). Os métodos (MB WAY, cartão, PayPal, Apple/Google Pay) são apenas texto informativo.
- **Scripts de terceiros:** não foram encontrados analytics, pixels, GTM, Hotjar, Clarity ou similares. Os terceiros presentes são Shopify (catálogo/checkout), Google Fonts (`__root.tsx:90-95`), `formsubmit.co` (newsletter), Wikimedia (logos de pagamento) e WhatsApp (partilha via `window.open`).
- **Source maps:** não existem `.map` em `.vercel/output` nem em `dist`.
- **XSS:** não há `dangerouslySetInnerHTML` em código usado; só em `src/components/ui/chart.tsx:73`, que não é importado. Não há `eval`/`new Function`.
- **Links externos:** `site-shell.tsx:494-502` usa `rel="noreferrer"`; `ajuda.tsx:131-132` usa `rel="noopener noreferrer"`; `rastreio.tsx:1224-1225` usa `rel="noreferrer"`.
- **Bundle cliente:** não contém `SHOPIFY_ADMIN`, `shpat_`, `shpa_`, `client_secret` nem chaves privadas. Contém apenas o token público da Storefront API (por desenho, é público).

## 5. Verificar manualmente (sem acesso ao dashboard/CLI)

> A Vercel CLI (`vercel`) e o GitHub CLI (`gh`) não estão instalados/autenticados. O `.vercel/project.json` não existe. Os pontos abaixo têm de ser confirmados por ti.

### 5.1 GitHub (https://github.com/jrfdutra/uffastore)

1. **Visibilidade:** já confirmado por API que é **público**. Se a intenção é privado: `Settings → General → Danger Zone → Change repository visibility → Private`.
2. **Proteção da `main`:** `Settings → Branches → Add branch protection rule` → `main` → ativar “Require a pull request before merging”, “Require status checks”, “Do not allow bypassing”.
3. **Segurança do código:** `Settings → Code security and analysis` → ativar **Dependabot alerts**, **Dependabot security updates**, **Secret scanning**, **Push protection**, **CodeQL**.
4. **Colaboradores:** `Settings → Collaborators and teams` → confirmar quem tem acesso e com que permissão.
5. **Actions:** `Settings → Actions → General` → confirmar permissões do `GITHUB_TOKEN` (Read repository contents) e se há workflows externos.
6. **Histórico de segredos:** com `gitleaks`/`trufflehog` instalados, correr `gitleaks detect --source . --report-format json`. Não foram encontrados segredos privados por pesquisa manual de padrões (`AKIA`, `sk_live`, `ghp_`, `shpat_`, chaves privadas), mas a pesquisa manual não substitui a ferramenta.

### 5.2 Vercel (https://vercel.com/dashboard)

1. **Projeto → Settings → General:** confirmar Framework Preset (`Nitro`), Build Command (`npm run build`), Output Directory (`.vercel/output`), Install Command (`npm install`) e **Node.js Version**.
2. **Settings → Environment Variables:** listar apenas nomes e ambientes. Confirmar:
   - `VITE_SHOPIFY_STORE_DOMAIN` e `VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN` em Production/Preview/Development;
   - se `SHOPIFY_ADMIN_STORE_DOMAIN`, `SHOPIFY_ADMIN_ACCESS_TOKEN`, `SHOPIFY_ADMIN_CLIENT_ID`, `SHOPIFY_ADMIN_CLIENT_SECRET` existem — se não são usadas, **apagar**;
   - confirmar que nenhuma variável privada tem prefixo `VITE_`.
3. **Settings → Deployment Protection:** confirmar se Preview Deployments estão protegidos (Vercel Authentication/Password) ou públicos.
4. **Settings → Git:** confirmar Production Branch = `main`, auto-deploy do GitHub e se existe integração Lovable a fazer push direto.
5. **Deployments:** ver os últimos 10 deploys, falhas, warnings e tempos de build.
6. **Domains:** confirmar `uffastore.pt` e `www.uffastore.pt`, qual é o domínio principal, redirect e DNS (A/CNAME). Confirmar HTTPS e HSTS.
7. **Logs:** `Deployments → Functions → Logs` para erros SSR (ex.: falhas da Storefront API no servidor).

### 5.3 Shopify Admin

1. **Produtos → cada produto → Media:** arrastar a foto correta para a primeira posição (featured) e confirmar que a galeria tem as 3 fotos.
2. **Produtos → Variantes:** confirmar preços, stock e `variantId` usados no checkout.
3. **Apps e canais → Headless → Storefront API:** confirmar o token público usado e os scopes (`unauthenticated_read_product_listings`, `unauthenticated_write_checkouts`).
4. **Configurações → Pagamentos:** confirmar que o checkout Shopify está ativo e que não há dados de cartão no site.

### 5.4 Legal / RGPD (com apoio jurídico)

1. Confirmar denominação social, NIF, sede e contactos a publicar no rodapé.
2. Publicar Política de Privacidade, Termos e Condições, Política de Devoluções (14 dias) e link do **Livro de Reclamações Eletrónico**.
3. Confirmar base legal e processadores para a newsletter (`formsubmit.co`, Shopify, Vercel, Google Fonts).
4. Rever a afirmação “sem trocas nem devoluções” com advogado — é incompatível com o direito de livre resolução da UE.

### 5.5 Performance / SEO

1. Correr **PageSpeed Insights** mobile em `https://www.uffastore.pt/` e `/catalogo` (o Lighthouse local não emula dispositivo).
2. Depois de criar o `sitemap.xml`, submetê-lo no **Google Search Console** e **Bing Webmaster Tools**.
3. Confirmar previews de partilha (WhatsApp/Facebook/X) depois de adicionar `og:image`.

---

## 6. Plano de correção (commits pequenos, um por tema)

> Ordem de prioridade. Cada passo termina com `npm run build` + `npx tsc --noEmit` + `npm run lint` verdes. Nada será aplicado sem a tua aprovação.

| Ordem | Commit proposto | Itens | Conteúdo | Esforço |
|---|---|---|---|---|
| 1 | `fix(cart): importar tr e corrigir toast de adicionar` | 1 | Importar `tr` em `shop-context.tsx`; teste manual de add-to-cart | Baixo |
| 2 | `chore(ci): typecheck, lint e build obrigatórios` | 4 | `.github/workflows/ci.yml` + `prebuild` com `tsc --noEmit`; corrigir os 460 erros de Prettier | Médio |
| 3 | `fix(images): galeria Shopify e imagem destacada` | 3, 13 | Mapear `images.nodes`; galeria no produto; `srcset`/WebP; cache `/images/*`; instruções Shopify Admin | Médio |
| 4 | `fix(security): remover credenciais do painel /operacoes` | 2, 6 | Remover `OPS_ACCESS_KEY` do código/docs; desativar rota ou auth real; rodar chave demo | Médio |
| 5 | `chore(security): token Storefront e logs` | 12, 21 | Remover fallback do token; remover `console.log`; exigir env | Baixo |
| 6 | `feat(legal): privacidade, termos, devoluções e dados legais` | 5 | Páginas legais, rodapé com NIF/morada, link Livro de Reclamações, corrigir política de devoluções | Alto |
| 7 | `fix(forms): newsletter e contacto` | 9, 10 | Endpoint server-side com rate limit/CAPTCHA; corrigir formulário de contacto | Médio |
| 8 | `chore(deps): npm audit e limpeza de dependências` | 7, 15 | `npm audit fix` (vite); mitigar zod; remover deps/componentes não usados; mover `docx` para dev | Médio |
| 9 | `chore(cleanup): Netlify, WordPress, lockfiles e README` | 14, 22, 23, 28 | Apagar `netlify.toml`, `functions.php`, `src/routes/README.md`, `bun.lock`/`bunfig.toml`; atualizar README; `.gitignore` | Baixo |
| 10 | `feat(seo): sitemap, og:image, lang e robots` | 16, 17 | `sitemap.xml`, `og:image`, `lang` dinâmico, `Disallow` de `/operacoes` e `/manual` | Baixo |
| 11 | `chore(privacy): self-host de fontes e logos` | 18 | Fontes locais e logos de pagamento em `public/` | Baixo |
| 12 | `chore(headers): CSP e headers adicionais` | 8 | CSP + COOP/CORP em `vercel.json`, testada em Preview | Médio |
| 13 | `chore(a11y): contraste e alvos táteis` | 24 | Corrigir falhas Lighthouse | Baixo |
| 14 | `chore(repo): reduzir documentação e histórico` | 19 | Mover `docs/` pesado para Releases; limpeza de histórico **só com aprovação explícita** | Médio |
| 15 | `chore(build): fixar Node` | 20 | `engines.node`/`.nvmrc` | Baixo |

**Notas importantes:**
- O ponto 3 tem uma parte que **não é código**: reordenar a media no Shopify Admin. Sem isso, o site continuará a mostrar a floral como imagem principal.
- O ponto 14 envolve reescrever histórico (`git filter-repo`/BFG). Só será feito com autorização explícita, porque viola a regra de não reescrever histórico sem aprovação.
- Nenhum ficheiro será apagado sem lista e confirmação prévia.

---

## 7. Itens que não consegui verificar

- Definições do dashboard da Vercel (env vars, preview protection, framework preset, Node version, deploys, domínios) — sem CLI/projeto ligado.
- Proteção da branch `main`, Dependabot, secret scanning, colaboradores e permissões de Actions — API devolve 401 sem autenticação.
- Se o deploy automático do Lovable escreve diretamente na `main` — não há evidência no histórico (todos os commits são de “Júnior Ferreira”; não há commits de bot).
- Se existem preview deployments antigos públicos com dados — precisa de lista de URLs no dashboard.
- Se o token Storefront foi rotacionado recentemente — confirmar no Shopify Admin.
- PageSpeed/Lighthouse mobile real — a ferramenta local não emula dispositivo.

---

## 8. Decisão pedida

Não apliquei nenhuma correção. O relatório está em `AUDITORIA.md` na branch `auditoria/uffa`, **sem commit**.

**Diz-me quais itens aprovas** (por número ou por tema). Sugestão de primeira ronda: **1, 4, 3 (parte código), 5, 12, 21, 22, 23, 14, 16, 17** — os de esforço baixo/médio que resolvem o bug de compra, o bug das imagens, a exposição de credenciais e a falta de CI. Os itens legais (5) e de histórico (19) devem ser tratados com mais cuidado e, no caso do histórico, com autorização explícita.
