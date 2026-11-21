import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const raw = await readFile(resolve(ROOT, ".env"), "utf8");
const env = {};
for (const line of raw.split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const domain = env.SHOPIFY_ADMIN_STORE_DOMAIN;
const token = env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const version = env.SHOPIFY_ADMIN_API_VERSION || "2026-07";
const storefrontDomain = env.VITE_SHOPIFY_STORE_DOMAIN;
const storefrontToken = env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const HANDLE = "produto-teste-uffa";

async function admin(query, variables = {}) {
  const r = await fetch(`https://${domain}/admin/api/${version}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({ query, variables }),
  });
  const j = await r.json();
  if (!r.ok || j.errors) throw new Error(JSON.stringify(j.errors || j));
  return j.data;
}

async function storefrontHasProduct() {
  if (!storefrontDomain || !storefrontToken) return null;
  const r = await fetch(`https://${storefrontDomain}/api/${version}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": storefrontToken,
    },
    body: JSON.stringify({
      query: `query($handle: String!) { product(handle: $handle) { id title } }`,
      variables: { handle: HANDLE },
    }),
  });
  const j = await r.json();
  return j.data?.product ?? null;
}

const mode = process.argv[2];

if (mode === "create") {
  const loc = await admin(`{ locations(first: 5) { nodes { id name isActive } } }`);
  const location = loc.locations.nodes.find((l) => l.isActive) ?? loc.locations.nodes[0];

  const created = await admin(
    `mutation Create($input: ProductSetInput!) {
      productSet(input: $input) {
        product { id title handle status }
        userErrors { field message }
      }
    }`,
    {
      input: {
        title: "PRODUTO TESTE — UFFA",
        handle: HANDLE,
        status: "ACTIVE",
        vendor: "UFFA",
        productType: "Lifestyle",
        tags: ["Black Friday", "Teste"],
        descriptionHtml:
          "<p>Produto de teste temporário. Será removido automaticamente após 50 segundos.</p>",
        productOptions: [{ name: "Tamanho", values: [{ name: "42" }] }],
        variants: [
          {
            optionValues: [{ optionName: "Tamanho", name: "42" }],
            price: "1.00",
            compareAtPrice: "2.00",
            sku: "TESTE-UFFA-42",
            inventoryPolicy: "DENY",
            inventoryItem: { tracked: true },
            inventoryQuantities: [{ locationId: location.id, name: "available", quantity: 20 }],
          },
        ],
      },
    },
  );

  const errs = created.productSet.userErrors;
  if (errs.length) throw new Error(JSON.stringify(errs));
  const product = created.productSet.product;
  console.log(`Criado: ${product.title} (${product.id}) — ${product.status}`);

  const pubs = await admin(`{ publications(first: 20) { nodes { id name } } }`);
  const published = await admin(
    `mutation Publish($id: ID!, $input: [PublicationInput!]!) {
      publishablePublish(id: $id, input: $input) { userErrors { field message } }
    }`,
    {
      id: product.id,
      input: pubs.publications.nodes.map((pub) => ({ publicationId: pub.id })),
    },
  );
  const pubErrs = published.publishablePublish.userErrors;
  if (pubErrs.length) console.error("Erros ao publicar:", pubErrs);
  else console.log(`Publicado em: ${pubs.publications.nodes.map((p) => p.name).join(", ")}`);

  // Confirma que a Storefront API (usada pelo site) já devolve o produto.
  let visible = null;
  for (let i = 0; i < 10; i += 1) {
    visible = await storefrontHasProduct();
    if (visible) break;
    await new Promise((r) => setTimeout(r, 2000));
  }
  console.log(
    visible
      ? `Visível na Storefront API: ${visible.title}`
      : "Aviso: ainda não visível na Storefront API (pode demorar alguns segundos).",
  );
  console.log(`URL: http://localhost:8082/produto/${HANDLE}`);
  console.log(`ID para remoção: ${product.id}`);
} else if (mode === "delete") {
  const id = process.argv[3];
  if (!id) throw new Error("Falta o ID do produto a remover.");
  await new Promise((r) => setTimeout(r, 50000));
  const res = await admin(
    `mutation Delete($input: ProductDeleteInput!) {
      productDelete(input: $input) { deletedProductId userErrors { field message } }
    }`,
    { input: { id } },
  );
  const errs = res.productDelete.userErrors;
  if (errs.length) {
    console.error("Erro ao remover produto de teste:", errs);
    process.exit(1);
  }
  console.log(`Produto de teste removido após 50 segundos: ${res.productDelete.deletedProductId}`);
} else {
  console.log("Uso: node scripts/test-product.mjs create | delete <productId>");
}
