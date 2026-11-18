# Arquivos Old

Ficheiros retirados de `public/` por não terem **nenhuma referência** no site
(`src/`, rotas, CSS ou HTML de produção). Ficam aqui guardados em vez de serem
apagados, para o caso de virem a ser necessários.

Não são servidos pelo site nem entram no build da Vercel.

## Conteúdo

| Pasta | Ficheiros | Notas |
| --- | --- | --- |
| `images/` | `nike-af1-floral-01.jpg`, `-02.jpg`, `-03.jpg` | Fotografias antigas do modelo floral. A versão usada pelo site é `public/images/floral-air-force.webp`. O `-02.jpg` ainda é usado pelo artefacto de design `design/stories/story-comercial.html` (caminho atualizado para esta pasta). |
| `produtos/` | `material-heic-01..07.webp`, `material-01..05.webp`, `nike-vomero-5.webp` | Fotografias de material convertidas por `scripts/convert-images.mjs`. Esse script volta a gerá-las em `public/produtos/` se for executado. |
| `produtos/thumbs/` | versões reduzidas dos ficheiros acima | Idem. |
| `payments/` | `visa.svg` | Não usado: o logótipo Visa no checkout é SVG inline em `src/routes/checkout.tsx`. |

## Repor um ficheiro

```bash
git mv "Arquivos Old/produtos/nike-vomero-5.webp" public/produtos/
```
