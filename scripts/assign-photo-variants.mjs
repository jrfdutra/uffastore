import { readFile } from "node:fs/promises";

const APPLY = process.argv.includes("--apply");

const ITENS = [
  {
    slug: "campus-00-preta-e-branca-crianca",
    handle: "adidas-campus-00-crianca",
    cor: "Preto e Branco",
  },
  { slug: "campus-00-rosa-crianca", handle: "adidas-campus-00-crianca", cor: "Rosa" },
  { slug: "new-balance-530-branca-verde", handle: "new-balance-530", cor: "Branco e Verde" },
  { slug: "new-balance-530-branca-vermelha", handle: "new-balance-530", cor: "Branco e Vermelho" },
  { slug: "air-force-bege-e-rosa", handle: "nike-air-force-branco-laranja", cor: "Bege e Rosa" },
  {
    slug: "air-force-branca-laranja",
    handle: "nike-air-force-branco-laranja",
    cor: "Branco e Laranja",
  },
  { slug: "air-force-cinza-e-verde", handle: "nike-air-force-branco-laranja", cor: "Cinza Verde" },
  { slug: "nike-vomero-5-rnr-branco-e-prata", handle: "nike-vomero-5-rnr", cor: "Branca e Prata" },
  { slug: "p6000-bege-com-logo-rosa", handle: "nike-p6000", cor: "Bege com Logo Rosa" },
  { slug: "p6000-branca-com-logo-dourado", handle: "nike-p6000", cor: "Branca com Logo Dourado" },
  { slug: "vomero-5-bege", handle: "nike-vomero-5", cor: "BEGE" },
  { slug: "vomero-5-branco-e-azul", handle: "nike-vomero-5", cor: "BRANCA / AZUL" },
  { slug: "vomero-5-branco-e-azul-bebe", handle: "nike-vomero-5", cor: "BRANCA / AZUL BEBE" },
];

const envRaw = await readFile(".env", "utf8");
const get = (key) => envRaw.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim();
const domain = get("SHOPIFY_ADMIN_STORE_DOMAIN") || "uffastore.myshopify.com";
const token = get("SHOPIFY_ADMIN_ACCESS_TOKEN") || get("SHOPIFY_ADMIN_TOKEN");

async function gql(query, variables) {
  const res = await fetch(`https://${domain}/admin/api/2025-01/graphql.json`, {
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
      id handle
      media(first: 50) { nodes { id ... on MediaImage { image { url } } } }
      variants(first: 250) { nodes { id selectedOptions { name value } } }
    } }
  }
}`);
const produtos = new Map(data.products.edges.map((e) => [e.node.handle, e.node]));

let ok = 0;
let erros = 0;
for (const item of ITENS) {
  const p = produtos.get(item.handle);
  if (!p) {
    console.log(`ERRO: produto não encontrado: ${item.handle}`);
    erros++;
    continue;
  }
  const media = p.media.nodes.find((m) => m.image?.url?.includes(item.slug));
  const variantIds = p.variants.nodes
    .filter((v) =>
      v.selectedOptions.some(
        (o) => /cor|color/i.test(o.name) && o.value.trim() === item.cor.trim(),
      ),
    )
    .map((v) => v.id);

  if (!media || !variantIds.length) {
    console.log(`ERRO: ${item.slug} — media=${Boolean(media)} variantes=${variantIds.length}`);
    erros++;
    continue;
  }

  if (!APPLY) {
    console.log(`OK (dry-run): ${item.slug} [${item.cor}] -> ${variantIds.length} variantes`);
    ok++;
    continue;
  }

  const result = await gql(
    `mutation($productId: ID!, $variantMedia: [ProductVariantAppendMediaInput!]!) {
      productVariantAppendMedia(productId: $productId, variantMedia: $variantMedia) {
        productVariants { id }
        userErrors { field message }
      }
    }`,
    {
      productId: p.id,
      variantMedia: variantIds.map((variantId) => ({ variantId, mediaIds: [media.id] })),
    },
  );
  const errs = result.productVariantAppendMedia.userErrors;
  if (errs.length) {
    console.error(`FALHOU: ${item.slug}: ${JSON.stringify(errs)}`);
    erros++;
  } else {
    console.log(`OK: ${item.slug} [${item.cor}] -> ${variantIds.length} variantes`);
    ok++;
  }
}

console.log(`\n${ok} associações ${APPLY ? "aplicadas" : "simuladas"}, ${erros} erros.`);
if (!APPLY) console.log("Para aplicar: node scripts/assign-photo-variants.mjs --apply");
