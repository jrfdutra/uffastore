# Relatório final — Uffa Store

Data: 28 de novembro de 2026  
Site: https://www.uffastore.pt · Repositório: `main`

## 1. Resumo executivo

A loja foi auditada de ponta a ponta: código, rotas, integrações, dados da Shopify, formulários, SEO, segurança e artefactos de entrega. Foram removidos os sinais de demonstração visíveis ao público, os descontos simulados no cliente e o catálogo fictício. O catálogo passa a ser integralmente gerido na Shopify; o site-local deixou de inventar produtos, preços ou stock.

Estado final: **site limpo, funcional e seguro para operação real**. Pendem apenas dois dados legais que só o titular pode fornecer (NIF e telefone), já sinalizados no relatório.

## 2. Correções aplicadas

| Área | Antes | Depois |
|---|---|---|
| Aviso de demonstração | Diálogo «Site em desenvolvimento» e «nenhuma compra é real» | Removido |
| Testemunhos | Depoimentos falsos na home | Removidos |
| Catálogo local | Produtos fictícios com preço 0,20 € e assets gerados | Removido; Shopify é a fonte única |
| Cupões | UFFA10 / PORTO20 / VIP15 descontavam no browser | Código é apenas enviado à Shopify, que valida e aplica |
| Newsletter | POST direto ao FormSubmit com caixa exposta | Endpoint próprio `/api/newsletter` via Resend, com honeypot |
| Endpoints públicos | Sem limite de pedidos | Limite por IP: 6 mensagens / 10 min por endpoint |
| Logs | E-mails de clientes em `console.log` | Removidos; apenas número da encomenda e motivo |
| Textos de erro | 404 e erro geral em inglês | Traduzidos para português |
| Dependências | Vite 8.1.5 e Zod 3 com avisos de segurança | Vite 8.4.0, Zod 4.6.7, `npm audit` limpo |
| Configuração | Wrapper Lovable no Vite | Configuração explícita do projeto |
| Produto TESTE | Visível no catálogo a 0,50 € | Arquivado como rascunho na Shopify |
| Repositório | Backups de 115 MB, pastas antigas, dry-runs e scripts one-off | Artefactos obsoletos removidos |

## 3. Catálogo publicado

- **30 produtos** ativos na Shopify.
- **5 marcas**: Adidas, New Balance, Nike, Puma, Vans.
- **791 variantes**, das quais **324 disponíveis**.
- Quantidades de stock nunca são mostradas ao cliente; apenas os tamanhos disponíveis.
- Fotografias preferenciais: 4:5 (1600×2000 ou 2048×2560), WebP/JPEG com fundo limpo.

| Produto | Marca | Preço a partir de | Variantes disp./total | Handle |
|---|---|---:|---:|---|
| ADIDAS CAMPUS 00 | Adidas | 124,99 € | 22/22 | `adidas-campus-00` |
| ADIDAS CAMPUS 00 CRIANÇA | Adidas | 104,99 € | 16/16 | `adidas-campus-00-crianca` |
| ADIDAS CAMPUS 00 OFFWHITE | Adidas | 129,99 € | 22/22 | `adidas-campus-00-offwhite` |
| ADIDAS CAMPUS 00 W/ DOUBLE LACES | Adidas | 84,99 € | 22/22 | `adidas-campus-00-w-double-laces` |
| ADIDAS SUPERSTAR CRIANÇA | Adidas | 54,99 € | 8/8 | `adidas-superstar-crianca` |
| ADIDAS SUPERSTAR W/ ROPE LACE | Adidas | 124,99 € | 2/2 | `adidas-superstar-bege-rosa` |
| AIR FORCE FLORA W/ ROPE LACE | Nike | 179,99 € | 45/45 | `air-force-floral-w-rope-laces` |
| AIR FORCE ROPE LACE W LANVIN | Nike | 179,99 € | 30/30 | `air-force-with-rope-laces` |
| AIR FORCE SHINE | Nike | 179,99 € | 15/15 | `air-force-shine` |
| AIR FORCE W ROPE LACE | Nike | 139,99 € | 58/58 | `nike-air-force-chapa-dourada` |
| AIR FORCE W ROPE LACE OFFWHITE | Nike | 149,99 € | 13/13 | `air-force-w-rope-lace-offwhite` |
| AIR FORCE W/ PEARL DIAMONDS | Nike | 189,99 € | 15/15 | `air-force-w-pearl-diamonds` |
| NEW BALANCE 530 | New Balance | 29,99 € | 2/2 | `new-balance-530` |
| NIKE AIR FORCE | Nike | 69,99 € | 3/87 | `nike-air-force-branco-laranja` |
| NIKE AIR FORCE CRIANÇA | Nike | 100,00 € | 16/16 | `nike-air-force-crianca-azul-bebe` |
| NIKE AIR MORE UPTEMPO LOW | Nike | 159,99 € | 1/29 | `nike-air-more-uptempo-low` |
| NIKE DUNK LOW | Nike | 119,99 € | 1/29 | `nike-dunk-low` |
| NIKE DUNK LOW PANDA ULTIMATE | Nike | 104,99 € | 1/1 | `nike-dunk-low-panda-ultimate` |
| NIKE DUNK PANDA W/ ROPE LACES | Nike | 139,99 € | 3/29 | `nike-dunk-panda-w-rope-laces` |
| NIKE JORDAN 1º PAR DA LOJA | Nike | 699,99 € | 1/1 | `nike-jordan-1º-par-da-loja` |
| NIKE JORDAN SKYLINE W/ ROPE LACES | Nike | 124,99 € | 2/2 | `nike-jordan-skyline-w-rope-laces` |
| NIKE P6000 | Nike | 74,99 € | 2/58 | `nike-p6000` |
| NIKE P6000 ALL BLACK | Nike | 69,99 € | 1/29 | `nike-p6000-all-black` |
| NIKE VALENTINE DAY DUNK | Nike | 84,99 € | 1/1 | `nike-valentine-day-dunk` |
| NIKE VOMERO 5 | Nike | 79,99 € | 3/87 | `nike-vomero-5` |
| NIKE VOMERO 5 RNR W/ CUTE CORD | Nike | 69,99 € | 8/116 | `nike-vomero-5-rnr` |
| PEARL FORCE W/ ROPE LACES | Nike | 124,99 € | 4/29 | `nike-air-force-perolas-simbolo-w-rope-laces` |
| PUMA CA PRO CLASSIC | Puma | 69,99 € | 2/2 | `puma-ca-pro-classic` |
| PUMA CARINA STREET W/ ROPE LACE | Puma | 44,99 € | 4/4 | `puma-carina-street` |
| VANS KNU SKOOL W/ ROPE LACES | Vans | 99,98 € | 1/1 | `vans-knu-skool-w-rope-laces` |

## 4. Jornada do cliente

1. **Home** — proposta de valor, campanhas, categorias, destaques e newsletter.
2. **Catálogo** — filtros por marca, campanha, escalão, cor e preço; URL partilhável.
3. **Produto** — galeria, cor, tamanhos disponíveis, preço, personalização e favoritos.
4. **Carrinho** — resumo local, partilha e código de desconto opcional.
5. **Checkout** — recolha no Porto ou envio; pagamento seguro na Shopify.
6. **Confirmação** — resumo da encomenda e próximos passos.
7. **Rastreio** — código CTT ou link assinado enviado por e-mail.
8. **Pós-compra** — aviso de expedição e pesquisa de satisfação aos 8 dias.

## 5. Segurança e privacidade

- Webhooks Shopify com verificação HMAC, deduplicação e validação de loja/tópico.
- Links mágicos assinados, com validade configurável; tokens não aparecem em URL pública.
- Endpoints de contacto, pedido de produto e newsletter validam corpo, tipos, tamanhos, Origem/Referer e limite por IP.
- Nenhum token Admin da Shopify está versionado; todos os segredos vêm de `.env`.
- `npm audit`: 0 vulnerabilidades.

## 6. Validação

- `npm run typecheck`: OK.
- `npm run lint`: OK, sem avisos.
- `npm test`: 163/163 testes passam.
- `npm run build`: OK (Vercel/Nitro).
- Produção: `https://www.uffastore.pt/` e `/catalogo` com HTTP 200.

## 7. Pendências

1. **NIF e telefone de atendimento** — manter marcadores «A preencher» em `src/lib/legal.ts` até o titular fornecer os dados.
2. Caixa de e-mail confirmada: `atendimento@uffastore.pt`.
3. Conferir no Shopify os códigos de desconto que se pretende manter ativos; o site já não cria descontos fictícios.

## 8. Ficheiros de entrega

- `docs/RELATORIO.md` — este relatório.
- `docs/mapa-site.pdf` — mapa visual e documentação do site.
- `docs/apresentacao-site-uffa.pptx` — apresentação final.
- `docs/assets/instagram/slide-1.png` a `slide-7.png` — carrossel instrutivo para Instagram.
