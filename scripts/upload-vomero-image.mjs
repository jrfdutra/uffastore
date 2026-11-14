// Substitui a imagem do produto promocional "NIKE VOMERO 5 RNR W/ CUTE CORD"
// pela fotografia real enviada pela loja.
// Uso: node scripts/upload-vomero-image.mjs <caminho-da-imagem>
import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

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
  const json = await response.json();
  if (!response.ok || json.errors?.length) {
    throw new Error(JSON.stringify(json.errors || json));
  }
  return json.data;
}

const HANDLE = "nike-vomero-5-rnr-w-cute-cord";
const imagePath = process.argv[2];

if (!imagePath) {
  console.error("Indica o caminho da imagem: node scripts/upload-vomero-image.mjs <imagem>");
  process.exit(1);
}

const MIME_BY_EXT = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const bytes = await readFile(resolve(imagePath));
const ext = basename(imagePath).slice(basename(imagePath).lastIndexOf(".")).toLowerCase();
const mimeType = MIME_BY_EXT[ext];

if (!mimeType) {
  console.error(`Extensão não suportada: ${ext}`);
  process.exit(1);
}

const PRODUCT = `
  query Product($query: String!) {
    products(first: 1, query: $query) {
      nodes {
        id
        title
        productType
        tags
        options { name values }
        media(first: 20) { nodes { id mediaContentType } }
        variants(first: 100) {
          nodes {
            id
            price
            sku
            selectedOptions { name value }
            inventoryQuantity
          }
        }
      }
    }
  }
`;

const STAGED_UPLOAD = `
  mutation Staged($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
      stagedTargets {
        url
        resourceUrl
        parameters { name value }
      }
      userErrors { field message }
    }
  }
`;

const PRODUCT_SET = `
  mutation ProductSet($input: ProductSetInput!, $synchronous: Boolean) {
    productSet(input: $input, synchronous: $synchronous) {
      product {
        id
        handle
        media(first: 20) {
          nodes {
            id
            mediaContentType
            ... on MediaImage { image { url } }
          }
        }
      }
      userErrors { field message }
    }
  }
`;

const productData = await admin(PRODUCT, { query: `handle:${HANDLE}` });
const product = productData.products.nodes[0];
if (!product) throw new Error(`Produto ${HANDLE} não encontrado.`);

console.log(`Produto: ${product.title}`);
console.log(`Media atual: ${product.media.nodes.length}`);

const staged = await admin(STAGED_UPLOAD, {
  input: [
    {
      resource: "IMAGE",
      filename: `nike-vomero-5${ext}`,
      mimeType,
      httpMethod: "POST",
      fileSize: String(bytes.length),
    },
  ],
});

const errors = staged.stagedUploadsCreate.userErrors ?? [];
if (errors.length) throw new Error(`stagedUploadsCreate: ${JSON.stringify(errors)}`);

const target = staged.stagedUploadsCreate.stagedTargets[0];
const form = new FormData();
for (const param of target.parameters) form.append(param.name, param.value);
form.append("file", new Blob([bytes], { type: mimeType }), `nike-vomero-5${ext}`);

const upload = await fetch(target.url, { method: "POST", body: form });
if (!upload.ok) {
  throw new Error(`Upload falhou: ${upload.status} ${await upload.text()}`);
}
console.log("Imagem enviada para o staging da Shopify.");

// Mantém as variantes e o stock atuais (o productSet é autoritativo nos campos enviados).
const locations = await admin(`query { locations(first: 10) { nodes { id name isActive } } }`);
const location = locations.locations.nodes.find((l) => l.isActive) ?? locations.locations.nodes[0];
if (!location) throw new Error("Nenhuma localização ativa na Shopify.");

const variants = product.variants.nodes.map((variant) => ({
  optionValues: variant.selectedOptions.map((o) => ({ optionName: o.name, name: o.value })),
  price: variant.price,
  ...(variant.sku ? { sku: variant.sku } : {}),
  inventoryPolicy: "DENY",
  inventoryItem: { tracked: true },
  inventoryQuantities: [
    {
      locationId: location.id,
      name: "available",
      quantity: Math.max(0, variant.inventoryQuantity ?? 0),
    },
  ],
}));

const productSet = await admin(PRODUCT_SET, {
  input: {
    id: product.id,
    title: product.title,
    productType: product.productType,
    tags: product.tags,
    productOptions: product.options.map((o) => ({
      name: o.name,
      values: o.values.map((v) => ({ name: v })),
    })),
    variants,
    files: [
      {
        originalSource: target.resourceUrl,
        alt: product.title,
        contentType: "IMAGE",
      },
    ],
  },
  synchronous: true,
});

const setErrors = productSet.productSet.userErrors ?? [];
if (setErrors.length) throw new Error(`productSet: ${JSON.stringify(setErrors)}`);

const media = productSet.productSet.product.media.nodes;
console.log(`\nOK — ${media.length} imagem(ns) no produto:`);
for (const m of media) console.log(` - ${m.image?.url ?? m.mediaContentType}`);
