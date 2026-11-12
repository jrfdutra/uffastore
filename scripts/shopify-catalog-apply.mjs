// Sincronização real do catálogo UFFA com a Shopify (Admin API).
//
// Por omissão corre em modo DRY-RUN e apenas mostra o plano.
// Para aplicar: node scripts/shopify-catalog-apply.mjs --apply
//
// O que faz:
//  1. Arquiva os produtos antigos (deixam de aparecer na loja, mantendo histórico).
//  2. Cria/atualiza os 6 produtos novos com variantes Cor × Tamanho.
//  3. Aplica os preços por escalão e 5 unidades de stock por variante.
//  4. Associa a fotografia padrão fornecida pela UFFA.
//  5. Publica na Online Store e exporta os variantId para o site.
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { consolidatedProducts, FOTO_PADRAO } from "../src/lib/consolidated-catalog.ts";

const ROOT = resolve(import.meta.dirname, "..");
const APPLY = process.argv.includes("--apply");

async function loadEnv() {
  const raw = await readFile(resolve(ROOT, ".env"), "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = await loadEnv();
const domain = env.SHOPIFY_ADMIN_STORE_DOMAIN;
const token = env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const version = env.SHOPIFY_ADMIN_API_VERSION || "2026-07";

if (!domain || !token) {
  console.error("Falta SHOPIFY_ADMIN_STORE_DOMAIN ou SHOPIFY_ADMIN_ACCESS_TOKEN no .env");
  process.exit(1);
}

async function admin(query, variables = {}) {
  const response = await fetch(`https://${domain}/admin/api/${version}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({ query, variables }),
  });
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Resposta não-JSON (${response.status}): ${text.slice(0, 300)}`);
  }
  if (!response.ok || json.errors?.length) {
    throw new Error(
      `HTTP ${response.status}: ${(json.errors ?? []).map((e) => e.message).join(" | ") || text.slice(0, 300)}`,
    );
  }
  return json.data;
}

const LIST_PRODUCTS = `
  query ListProducts {
    products(first: 100) {
      nodes { id handle title status }
    }
  }
`;

const LOCATIONS = `query { locations(first: 10) { nodes { id name isActive } } }`;
const PUBLICATIONS = `query { publications(first: 20) { nodes { id name } } }`;

const PRODUCT_SET = `
  mutation ProductSet($input: ProductSetInput!, $synchronous: Boolean) {
    productSet(input: $input, synchronous: $synchronous) {
      product { id handle title status }
      userErrors { field message }
    }
  }
`;

const PRODUCT_UPDATE = `
  mutation ProductUpdate($product: ProductUpdateInput!) {
    productUpdate(product: $product) {
      product { id handle status }
      userErrors { field message }
    }
  }
`;

const PUBLISH = `
  mutation Publish($id: ID!, $input: [PublicationInput!]!) {
    publishablePublish(id: $id, input: $input) {
      userErrors { field message }
    }
  }
`;

const PRODUCT_BY_HANDLE = `
  query ByHandle($handle: String!) {
    product(handle: $handle) {
      id
      handle
      title
      status
      options { name values }
      variants(first: 100) {
        nodes {
          id
          sku
          price
          inventoryQuantity
          selectedOptions { name value }
        }
      }
    }
  }
`;

const STAGED_UPLOAD = `
  mutation StagedUpload($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
      stagedTargets { url resourceUrl parameters { name value } }
      userErrors { field message }
    }
  }
`;

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uploadImage() {
  const filePath = resolve(ROOT, "public", FOTO_PADRAO.replace(/^\//, ""));
  const bytes = await readFile(filePath);

  const data = await admin(STAGED_UPLOAD, {
    input: [
      {
        resource: "IMAGE",
        filename: "uffa-modelo-padrao.webp",
        mimeType: "image/webp",
        fileSize: String(bytes.length),
        httpMethod: "POST",
      },
    ],
  });

  const errors = data.stagedUploadsCreate.userErrors ?? [];
  if (errors.length) throw new Error(`stagedUploadsCreate: ${errors[0].message}`);

  const target = data.stagedUploadsCreate.stagedTargets[0];
  if (!target) throw new Error("A Shopify não devolveu destino de upload.");

  const form = new FormData();
  for (const parameter of target.parameters) {
    form.append(parameter.name, parameter.value);
  }
  form.append("file", new Blob([bytes], { type: "image/webp" }), "uffa-modelo-padrao.webp");

  const upload = await fetch(target.url, { method: "POST", body: form });
  if (!upload.ok) {
    const body = await upload.text();
    throw new Error(`Upload da imagem falhou (${upload.status}): ${body.slice(0, 200)}`);
  }

  return target.resourceUrl;
}

function buildInput(produto, imageUrl, existingId, locationId) {
  const temCores = produto.colors.length > 0;
  const tamanhos = [...new Set(produto.sizes.map((variante) => variante.size))].sort(
    (a, b) => a - b,
  );

  const productOptions = [];
  if (temCores) {
    productOptions.push({
      name: "Cor",
      values: produto.colors.map((cor) => ({ name: cor.colorName })),
    });
  }
  productOptions.push({
    name: "Tamanho",
    values: tamanhos.map((tamanho) => ({ name: String(tamanho) })),
  });

  const variants = produto.sizes
    .slice()
    .sort((a, b) => {
      if (a.size !== b.size) return a.size - b.size;
      return (a.color ?? "").localeCompare(b.color ?? "");
    })
    .map((variante) => {
      const optionValues = [];
      if (temCores) {
        const cor = produto.colors.find((item) => item.colorSlug === variante.color);
        if (!cor) throw new Error(`Variante sem cor válida em ${produto.handle}`);
        optionValues.push({ optionName: "Cor", name: cor.colorName });
      }
      optionValues.push({ optionName: "Tamanho", name: String(variante.size) });

      return {
        optionValues,
        price: variante.price.toFixed(2),
        sku: variante.sku,
        inventoryPolicy: "DENY",
        inventoryItem: { tracked: true },
        inventoryQuantities: [{ locationId, name: "available", quantity: variante.stock }],
      };
    });

  return {
    ...(existingId ? { id: existingId } : { handle: produto.handle }),
    title: produto.name,
    descriptionHtml: `<p>${produto.description.pt}</p>`,
    vendor: "Uffa Store",
    productType: produto.category,
    tags: ["UffaCatalog", produto.category, produto.modeloId],
    status: "ACTIVE",
    productOptions,
    variants,
    files: [{ originalSource: imageUrl, alt: produto.name, contentType: "IMAGE" }],
  };
}

async function main() {
  const current = await admin(LIST_PRODUCTS);
  const currentByHandle = new Map(current.products.nodes.map((p) => [p.handle, p]));
  const targetHandles = new Set(consolidatedProducts.map((produto) => produto.handle));
  const toArchive = current.products.nodes.filter((p) => !targetHandles.has(p.handle));

  console.log("=== SINCRONIZAÇÃO DO CATÁLOGO UFFA ↔ SHOPIFY ===");
  console.log(`Modo: ${APPLY ? "APLICAÇÃO REAL" : "DRY-RUN (sem alterações)"}`);
  console.log(`Loja: ${domain}`);
  console.log("");

  console.log(`Produtos a arquivar (${toArchive.length}):`);
  for (const p of toArchive) console.log(`  - ${p.handle} [${p.status}] ${p.title}`);
  if (toArchive.length === 0) console.log("  (nenhum)");

  console.log("");
  console.log(`Produtos a criar/atualizar (${consolidatedProducts.length}):`);
  for (const produto of consolidatedProducts) {
    const existente = currentByHandle.get(produto.handle);
    const cores = produto.colors.map((cor) => cor.colorName).join(", ") || "cor única";
    console.log(
      `  - ${produto.handle} → ${existente ? "atualizar" : "criar"} | cores: ${cores} | variantes: ${produto.sizes.length}`,
    );
  }

  if (!APPLY) {
    console.log("");
    console.log("Nada foi alterado. Para aplicar: node scripts/shopify-catalog-apply.mjs --apply");
    return;
  }

  const locations = await admin(LOCATIONS);
  const primaryLocation =
    locations.locations.nodes.find((location) => location.isActive) ?? locations.locations.nodes[0];
  if (!primaryLocation) throw new Error("Nenhuma localização de inventário encontrada.");
  console.log(`\nLocalização de inventário: ${primaryLocation.name}`);

  const publications = await admin(PUBLICATIONS);
  const onlineStore = publications.publications.nodes.find((p) => /online store/i.test(p.name));
  console.log(`Publicação: ${onlineStore ? onlineStore.name : "(não encontrada)"}`);

  console.log("\nA carregar a fotografia padrão…");
  const imageUrl = await uploadImage();
  console.log(`Imagem carregada: ${imageUrl}`);

  console.log("\nA arquivar produtos antigos…");
  for (const p of toArchive) {
    const data = await admin(PRODUCT_UPDATE, { product: { id: p.id, status: "ARCHIVED" } });
    const errors = data.productUpdate.userErrors ?? [];
    if (errors.length) {
      console.warn(`  ! ${p.handle}: ${errors.map((e) => e.message).join("; ")}`);
    } else {
      console.log(`  ✓ ${p.handle} arquivado`);
    }
  }

  console.log("\nA criar/atualizar produtos novos…");
  const idsPorHandle = new Map();
  for (const produto of consolidatedProducts) {
    const existente = currentByHandle.get(produto.handle);
    const input = buildInput(produto, imageUrl, existente?.id, primaryLocation.id);
    const data = await admin(PRODUCT_SET, { input, synchronous: true });
    const errors = data.productSet.userErrors ?? [];
    if (errors.length) {
      throw new Error(`${produto.handle}: ${errors.map((e) => e.message).join("; ")}`);
    }
    const product = data.productSet.product;
    idsPorHandle.set(produto.handle, product.id);
    console.log(`  ✓ ${produto.handle} (${product.status})`);
  }

  if (onlineStore) {
    console.log("\nA publicar na Online Store…");
    for (const [handle, id] of idsPorHandle) {
      const data = await admin(PUBLISH, { id, input: [{ publicationId: onlineStore.id }] });
      const errors = data.publishablePublish.userErrors ?? [];
      if (errors.length) console.warn(`  ! ${handle}: ${errors.map((e) => e.message).join("; ")}`);
    }
    console.log("  ✓ publicado");
  }

  console.log("\nA exportar variantId para o site…");
  const mapa = {};
  for (const produto of consolidatedProducts) {
    const data = await admin(PRODUCT_BY_HANDLE, { handle: produto.handle });
    const node = data.product;
    if (!node) {
      console.warn(`  ! ${produto.handle} não encontrado após sincronização`);
      continue;
    }
    mapa[produto.handle] = {};
    for (const variante of node.variants.nodes) {
      const corValor = variante.selectedOptions.find((o) => /cor|color/i.test(o.name))?.value;
      const tamanhoValor = variante.selectedOptions.find((o) =>
        /tamanho|size/i.test(o.name),
      )?.value;
      const slugCor = corValor ? slugify(corValor) : "_";
      const tamanho = Number.parseInt(tamanhoValor ?? "", 10);
      if (!Number.isFinite(tamanho)) continue;
      mapa[produto.handle][slugCor] ??= {};
      mapa[produto.handle][slugCor][String(tamanho)] = variante.id;
    }
  }

  await writeFile(
    resolve(ROOT, "src/data/shopify-variants.json"),
    `${JSON.stringify(mapa, null, 2)}\n`,
    "utf8",
  );
  console.log("  ✓ src/data/shopify-variants.json atualizado");

  console.log("\n=== VERIFICAÇÃO ===");
  let problemas = 0;
  for (const produto of consolidatedProducts) {
    const data = await admin(PRODUCT_BY_HANDLE, { handle: produto.handle });
    const node = data.product;
    if (!node) {
      console.log(`✗ ${produto.handle}: não existe`);
      problemas += 1;
      continue;
    }
    const stockTotal = node.variants.nodes.reduce((n, v) => n + (v.inventoryQuantity ?? 0), 0);
    const esperado = produto.sizes.reduce((n, v) => n + v.stock, 0);
    const ok = node.variants.nodes.length === produto.sizes.length && stockTotal === esperado;
    if (!ok) problemas += 1;
    console.log(
      `${ok ? "✓" : "✗"} ${produto.handle}: ${node.status} | variantes ${node.variants.nodes.length}/${produto.sizes.length} | stock ${stockTotal}/${esperado}`,
    );
  }

  const recheck = await admin(LIST_PRODUCTS);
  const aindaAtivos = recheck.products.nodes.filter(
    (p) => !targetHandles.has(p.handle) && p.status === "ACTIVE",
  );
  if (aindaAtivos.length) {
    problemas += 1;
    console.log(`✗ Produtos antigos ainda ativos: ${aindaAtivos.map((p) => p.handle).join(", ")}`);
  } else {
    console.log("✓ Nenhum produto antigo ativo");
  }

  console.log(
    problemas === 0
      ? "\nSincronização concluída sem problemas."
      : `\n${problemas} problema(s) encontrado(s).`,
  );
  process.exitCode = problemas === 0 ? 0 : 1;
}

await main();
