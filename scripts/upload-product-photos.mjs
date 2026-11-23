import { readFile } from "node:fs/promises";
import { mkdtemp, readFile as readFileFs } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";

const APPLY = process.argv.includes("--apply");
const ONLY_ADIDAS = process.argv.includes("--adidas");
const ONLY_PUMA = process.argv.includes("--puma");
const ONLY_NIKE = process.argv.includes("--nike");
const ONLY_NIKE2 = process.argv.includes("--nike-2");
const ONLY_NIKE3 = process.argv.includes("--nike-3");
const ONLY_LOTE4 = process.argv.includes("--lote-4");
const FOTOS_DIR = "C:/Users/devel/Downloads/Fotos";

// ficheiro -> { handle, cor? }. Quando "cor" é indicado, a foto é associada
// apenas às variantes dessa cor (Shopify + site).
const MAPA_COMPLETO = [
  { file: "Adidas Campus 00 Offwhite.webp", handle: "adidas-campus-00-offwhite" },
  { file: "Adidas Campus 00.jpg", handle: "adidas-campus-00" },
  {
    file: "Adidas Superstar (limitadas) Offwhite.jpg",
    handle: "adidas-superstar-limitadas-offwhite",
  },
  { file: "ADIDAS SUPERSTAR BRANCA E PRETA CRIANÇA.jpg", handle: "adidas-superstar-crianca" },
  {
    file: "CAMPUS 00 PRETA E BRANCA CRIANÇA.jpg",
    handle: "adidas-campus-00-crianca",
    cor: "Preto e Branco",
  },
  { file: "CAMPUS 00 ROSA CRIANÇA.jpg", handle: "adidas-campus-00-crianca", cor: "Rosa" },
  { file: "New Balance 530 Branca Verde.jpg", handle: "new-balance-530", cor: "Branco e Verde" },
  {
    file: "New Balance 530 Branca Vermelha.jpg",
    handle: "new-balance-530",
    cor: "Branco e Vermelho",
  },
  { file: "Dunk Low.jpg", handle: "nike-dunk-low" },
  { file: "DUNK LOW  castanhas.jpg", handle: "nike-dunk-low" },
  {
    file: "Air Force Bege e Rosa.jpg",
    handle: "nike-air-force-branco-laranja",
    cor: "Bege e Rosa",
  },
  {
    file: "Air Force Branca Laranja.jpg",
    handle: "nike-air-force-branco-laranja",
    cor: "Branco e Laranja",
  },
  {
    file: "Air Force Cinza e Verde.jpg",
    handle: "nike-air-force-branco-laranja",
    cor: "Cinza Verde",
  },
  { file: "Air Force Chapa Dourada.jpg", handle: "nike-air-force-chapa-dourada-s-rope-laces" },
  { file: "Air Force Chapa Dourada.jpg", handle: "nike-air-force-chapa-dourada" },
  { file: "Nike Air Force 1 Low Branca com Cinza.jpg", handle: "nike-air-force-branca-com-cinza" },
  { file: "Nike AIR More Uptempo Low.jpg", handle: "nike-air-more-uptempo-low" },
  { file: "NIKE AIRFORCE CRIANÇA AZUL BEBE.jpg", handle: "nike-air-force-crianca-azul-bebe" },
  { file: "Nike P6000 AllBlack.jpg", handle: "nike-p6000-all-black" },
  { file: "NIKE VALENTINE DAY DUNK.jpg", handle: "nike-valentine-day-dunk" },
  {
    file: "NIKE VOMERO 5 RNR BRANCO E PRATA.jpg",
    handle: "nike-vomero-5-rnr",
    cor: "Branca e Prata",
  },
  { file: "P6000 Bege com logo rosa.jpg", handle: "nike-p6000", cor: "Bege com Logo Rosa" },
  {
    file: "P6000 Branca com Logo dourado.jpg",
    handle: "nike-p6000",
    cor: "Branca com Logo Dourado",
  },
  { file: "PUMA CA PRO CLASSIC.jpg", handle: "puma-ca-pro-classic" },
  { file: "CARINA STREET PRO CLASSIC SEM ROPE LACES.jpg", handle: "puma-carina-street" },
  { file: "VOMERO 5 BEGE.jpg", handle: "nike-vomero-5", cor: "BEGE" },
  { file: "VOMERO 5 BRANCO E AZUL.jpg", handle: "nike-vomero-5", cor: "BRANCA / AZUL" },
  { file: "VOMERO 5 BRANCO E AZUL BEBE.jpg", handle: "nike-vomero-5", cor: "BRANCA / AZUL BEBE" },

  // Fotos Adidas: o modelo vem do nome do ficheiro e a cor, quando existe
  // opção "Cor" na Shopify, é indicada em "cor" para associar à variante.
  {
    file: "Adidas Campus 00 Offwhite Verde.jpg",
    handle: "adidas-campus-00-offwhite",
    dir: "C:/Users/devel/Downloads/Adidas",
  },
  {
    file: "ADIDAS CAMPUS 00 W DOUBLE LACES BEGE VERDE.jpg",
    handle: "adidas-campus-00-w-double-laces",
    dir: "C:/Users/devel/Downloads/Adidas",
  },
  {
    file: "Adidas Campus 00 W Double Laces Cinza.jpg",
    handle: "adidas-campus-00-w-double-laces",
    dir: "C:/Users/devel/Downloads/Adidas",
  },
  {
    file: "Adidas Campus 00 W Double Laces Preto e Branco.jpg",
    handle: "adidas-campus-00-w-double-laces",
    dir: "C:/Users/devel/Downloads/Adidas",
  },
  {
    file: "ADIDAS SUPERSTAR BEGE ROSA W ROPE LACES.jpg",
    handle: "adidas-superstar-bege-rosa",
    cor: "Bege e Rosa",
    dir: "C:/Users/devel/Downloads/Adidas",
  },
  {
    file: "ADIDAS SUPERSTAR CRIANCA W DOUBLE LACES ROSA.jpg",
    handle: "adidas-superstar-crianca",
    dir: "C:/Users/devel/Downloads/Adidas",
  },

  // O nome do ficheiro indica a opção "Com Rope Laces".
  {
    file: "CARINA STREET W ROPE LACES.jpg",
    handle: "puma-carina-street",
    opcao: { name: "Rope Laces", value: "Com Rope Laces" },
    dir: "C:/Users/devel/Downloads/PUMA",
  },

  // Fotos Nike: o modelo e a cor vêm do nome do ficheiro. Quando o produto
  // não tem opção "Cor", a foto fica na galeria e aparece em todos os tamanhos.
  {
    file: "AIR FORCE LOW 1.jpg",
    handle: "nike-air-force-branca-com-cinza",
    dir: "C:/Users/devel/Downloads/NIKE",
  },
  {
    file: "VOMERO BEGE.jpg",
    handle: "nike-vomero-5",
    cor: "BEGE",
    dir: "C:/Users/devel/Downloads/NIKE",
  },
  {
    file: "Air Jordan 1 Low PRIMEIRO PAR DA LOJA.jpg",
    handle: "nike-jordan-1º-par-da-loja",
    dir: "C:/Users/devel/Downloads/NIKE",
  },
  {
    file: "AIR FORCE UPTEMPO CASTANHAS.jpg",
    handle: "nike-air-more-uptempo-low",
    dir: "C:/Users/devel/Downloads/NIKE",
  },
  {
    file: "VALENTINE DAY DUNK.jpg",
    handle: "nike-valentine-day-dunk",
    dir: "C:/Users/devel/Downloads/NIKE",
  },
  {
    file: "nike p6000 all black.jpg",
    handle: "nike-p6000-all-black",
    cor: "All Black",
    dir: "C:/Users/devel/Downloads/NIKE",
  },
  {
    file: "AIR FORCE GOLDEN (Chapa Dourada).jpg",
    handle: "nike-air-force-chapa-dourada",
    dir: "C:/Users/devel/Downloads/NIKE",
  },
  {
    file: "AIR FORCE GOLDEN (Chapa Dourada).jpg",
    handle: "nike-air-force-chapa-dourada-s-rope-laces",
    dir: "C:/Users/devel/Downloads/NIKE",
  },

  // Segundo lote Nike. "NIKE 2.jpg" não tem modelo/cor identificável e não
  // corresponde a nenhum produto da Shopify, por isso não é adicionado.
  {
    file: "nike dunk low rosa.jpg",
    handle: "nike-dunk-low",
    lote: 2,
    dir: "C:/Users/devel/Downloads/NIKE",
  },
  {
    file: "nike p6000 bege e rosa.jpg",
    handle: "nike-p6000",
    cor: "Bege com Logo Rosa",
    lote: 2,
    dir: "C:/Users/devel/Downloads/NIKE",
  },
  {
    file: "p6000 branco com logo dourado.jpg",
    handle: "nike-p6000",
    cor: "Branca com Logo Dourado",
    lote: 2,
    dir: "C:/Users/devel/Downloads/NIKE",
  },
  {
    file: "vomero 5 azul.jpg",
    handle: "nike-vomero-5",
    cor: "BRANCA / AZUL",
    lote: 2,
    dir: "C:/Users/devel/Downloads/NIKE",
  },
  {
    file: "air force bege e rosa.jpg",
    handle: "nike-air-force-branco-laranja",
    cor: "Bege e Rosa",
    // Slug próprio para não confundir com a foto antiga de mesmo nome.
    slug: "air-force-bege-e-rosa-nike",
    lote: 2,
    dir: "C:/Users/devel/Downloads/NIKE",
  },
  {
    file: "JORDAN SKYLINE W ROPE LACE.jpg",
    handle: "nike-jordan-skyline-w-rope-laces",
    lote: 2,
    dir: "C:/Users/devel/Downloads/NIKE",
  },

  // Terceiro lote Nike.
  {
    file: "VOMERO 5 RNR BEGE E CROMADO.jpg",
    handle: "nike-vomero-5-rnr",
    cor: "Bege/Cromado",
    lote: 3,
    dir: "C:/Users/devel/Downloads/NIKE",
  },
  {
    file: "AIR FORCE PRETA W ROPE LACE.jpg",
    handle: "air-force-with-rope-laces",
    cor: "Preta",
    lote: 3,
    dir: "C:/Users/devel/Downloads/NIKE",
  },

  // Quarto lote: fotos reenviadas com modelo, marca e cor. As que já estavam
  // aplicadas (Adidas/Puma/New Balance anteriores) não são duplicadas.
  {
    file: "VANS SKU.jpg",
    handle: "vans-knu-skool-w-rope-laces",
    lote: 4,
    dir: "C:/Users/devel/Downloads",
  },
  {
    file: "PUMA CARINA STREET W ROPE LACES.jpg",
    handle: "puma-carina-street",
    opcao: { name: "Rope Laces", value: "Com Rope Laces" },
    lote: 4,
    dir: "C:/Users/devel/Downloads/PUMA",
  },
  {
    file: "530 vermelha.jpg",
    handle: "new-balance-530",
    cor: "Branco e Vermelho",
    lote: 4,
    dir: "C:/Users/devel/Downloads/new balance",
  },
];

const MAPA = ONLY_LOTE4
  ? MAPA_COMPLETO.filter((item) => item.lote === 4)
  : ONLY_ADIDAS
    ? MAPA_COMPLETO.filter((item) => item.dir === "C:/Users/devel/Downloads/Adidas")
    : ONLY_PUMA
      ? MAPA_COMPLETO.filter((item) => item.dir === "C:/Users/devel/Downloads/PUMA")
      : ONLY_NIKE3
        ? MAPA_COMPLETO.filter((item) => item.lote === 3)
        : ONLY_NIKE2
          ? MAPA_COMPLETO.filter((item) => item.lote === 2)
          : ONLY_NIKE
            ? MAPA_COMPLETO.filter((item) => item.dir === "C:/Users/devel/Downloads/NIKE")
            : MAPA_COMPLETO;

const envRaw = await readFile(".env", "utf8");
const get = (key) => envRaw.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim();
const domain = get("SHOPIFY_ADMIN_STORE_DOMAIN") || "uffastore.myshopify.com";
const token = get("SHOPIFY_ADMIN_ACCESS_TOKEN") || get("SHOPIFY_ADMIN_TOKEN");
const API = `https://${domain}/admin/api/2025-01/graphql.json`;

async function gql(query, variables) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

const data = await gql(`{
  products(first: 100) {
    edges { node {
      id handle title
      variants(first: 250) { nodes { id selectedOptions { name value } } }
    } }
  }
}`);
const produtos = new Map(data.products.edges.map((e) => [e.node.handle, e.node]));

let erros = 0;
for (const item of MAPA) {
  const p = produtos.get(item.handle);
  if (!p) {
    console.log(`ERRO: handle não encontrado: ${item.handle} (${item.file})`);
    erros++;
    continue;
  }
  let variantes = [];
  if (item.cor || item.opcao) {
    variantes = p.variants.nodes.filter((v) =>
      v.selectedOptions.some((o) =>
        item.opcao
          ? o.name.trim() === item.opcao.name && o.value.trim() === item.opcao.value
          : /cor|color/i.test(o.name) && o.value.trim() === item.cor.trim(),
      ),
    );
    if (!variantes.length) {
      const alvo = item.opcao ? `${item.opcao.name}=${item.opcao.value}` : `cor "${item.cor}"`;
      console.log(`ERRO: ${alvo} não encontrada em ${item.handle}`);
      erros++;
      continue;
    }
  }
  let meta = null;
  try {
    meta = await sharp(join(item.dir ?? FOTOS_DIR, item.file)).metadata();
  } catch (err) {
    console.log(`ERRO: imagem ilegível: ${item.file} — ${err.message}`);
    erros++;
    continue;
  }
  const alvo = item.opcao ? `${item.opcao.name}=${item.opcao.value}` : (item.cor ?? "");
  console.log(
    `${item.file} -> ${item.handle}${alvo ? ` [${alvo}]` : ""} (${meta.width}x${meta.height})${variantes.length ? `, ${variantes.length} variantes` : ""}`,
  );
}

console.log(
  `\nMapeamento: ${MAPA.length} entradas, ${erros} erros. Modo: ${APPLY ? "APLICAR" : "dry-run"}`,
);
if (!APPLY) {
  console.log("Para aplicar: node scripts/upload-product-photos.mjs --apply");
  process.exit(erros ? 1 : 0);
}

// ---- aplicação ----
const tmp = await mkdtemp(join(tmpdir(), "uffa-photos-"));

async function removerFotosPadrao(productId) {
  const q = await gql(
    `query($id: ID!) {
      product(id: $id) {
        media(first: 50) {
          nodes { id ... on MediaImage { image { url } } }
        }
      }
    }`,
    { id: productId },
  );
  const ids = (q.product?.media?.nodes ?? [])
    .filter((m) => m.image?.url?.includes("uffa-modelo-padrao"))
    .map((m) => m.id);
  if (!ids.length) return 0;
  const deleted = await gql(
    `mutation($productId: ID!, $mediaIds: [ID!]!) {
      productDeleteMedia(productId: $productId, mediaIds: $mediaIds) {
        deletedMediaIds
        userErrors { field message }
      }
    }`,
    { productId, mediaIds: ids },
  );
  if (deleted.productDeleteMedia.userErrors.length) {
    throw new Error(JSON.stringify(deleted.productDeleteMedia.userErrors));
  }
  return ids.length;
}

async function uploadFoto(item) {
  const p = produtos.get(item.handle);
  const slug = (item.slug ?? item.file)
    .replace(/\.[^.]+$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .toLowerCase();
  const filename = `${slug}.webp`;
  const outPath = join(tmp, filename);
  await sharp(join(item.dir ?? FOTOS_DIR, item.file))
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(outPath);
  const buffer = await readFileFs(outPath);

  const staged = await gql(
    `mutation($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets { url resourceUrl parameters { name value } }
        userErrors { field message }
      }
    }`,
    {
      input: [
        {
          resource: "IMAGE",
          filename,
          mimeType: "image/webp",
          fileSize: String(buffer.length),
          httpMethod: "POST",
        },
      ],
    },
  );
  const target = staged.stagedUploadsCreate.stagedTargets[0];
  if (!target) throw new Error(JSON.stringify(staged.stagedUploadsCreate.userErrors));

  const form = new FormData();
  for (const param of target.parameters) form.append(param.name, param.value);
  form.append("file", new Blob([buffer], { type: "image/webp" }), filename);
  const put = await fetch(target.url, { method: "POST", body: form });
  if (!put.ok) throw new Error(`Upload falhou: ${put.status} ${await put.text()}`);

  const created = await gql(
    `mutation($productId: ID!, $media: [CreateMediaInput!]!) {
      productCreateMedia(productId: $productId, media: $media) {
        media { id }
        mediaUserErrors { field message code }
      }
    }`,
    { productId: p.id, media: [{ originalSource: target.resourceUrl, mediaContentType: "IMAGE" }] },
  );
  const errs = created.productCreateMedia.mediaUserErrors;
  if (errs.length) throw new Error(JSON.stringify(errs));
  const mediaId = created.productCreateMedia.media[0]?.id;
  await removerFotosPadrao(p.id);
  // A associação por cor é feita à parte, com:
  //   node scripts/assign-photo-variants.mjs --apply
  return mediaId;
}

let ok = 0;
for (const item of MAPA) {
  try {
    const id = await uploadFoto(item);
    ok++;
    console.log(`OK: ${item.file} -> ${item.handle} (${id})`);
  } catch (err) {
    erros++;
    console.error(`FALHOU: ${item.file} -> ${item.handle}: ${err.message}`);
  }
}
console.log(`\nConcluído: ${ok} fotos enviadas, ${erros} erros.`);
