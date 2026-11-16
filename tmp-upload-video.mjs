import { readFileSync } from "node:fs";
import { basename } from "node:path";

const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split(/\r?\n/)
    .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^"|"$/g, "")];
    }),
);

const VERSION = "2026-07";
const FILE = "C:/Users/devel/Desktop/video_2026-11-15_23-00-16.mp4";
const HANDLES = ["air-force-floral-w-rope-laces-gs", "air-force-floral-w-rope-laces-senior"];

async function gql(query, variables = {}) {
  const res = await fetch(
    `https://${env.SHOPIFY_ADMIN_STORE_DOMAIN}/admin/api/${VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": env.SHOPIFY_ADMIN_ACCESS_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    },
  );
  const json = await res.json();
  if (!res.ok || json.errors) throw new Error(JSON.stringify(json.errors ?? json));
  return json.data;
}

const bytes = readFileSync(FILE);
console.log("ficheiro:", basename(FILE), bytes.length, "bytes");

// 1. Upload temporário para a Shopify
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
        filename: basename(FILE),
        mimeType: "video/mp4",
        resource: "VIDEO",
        fileSize: String(bytes.length),
        httpMethod: "POST",
      },
    ],
  },
);
if (staged.stagedUploadsCreate.userErrors.length) {
  throw new Error(JSON.stringify(staged.stagedUploadsCreate.userErrors));
}
const target = staged.stagedUploadsCreate.stagedTargets[0];
console.log("staged ok");

// 2. Envia o ficheiro para o destino temporário
const form = new FormData();
for (const param of target.parameters) form.append(param.name, param.value);
form.append("file", new Blob([bytes], { type: "video/mp4" }), basename(FILE));

const upload = await fetch(target.url, { method: "POST", body: form });
if (!upload.ok) {
  throw new Error(`upload falhou: ${upload.status} ${await upload.text()}`);
}
console.log("upload ok:", upload.status);

// 3. Associa o vídeo a cada produto
for (const handle of HANDLES) {
  const d = await gql(
    `query($handle: String!) { productByHandle(handle: $handle) { id title } }`,
    { handle },
  );
  const product = d.productByHandle;
  if (!product) throw new Error(`Produto ${handle} não existe`);

  const created = await gql(
    `mutation($productId: ID!, $media: [CreateMediaInput!]!) {
      productCreateMedia(productId: $productId, media: $media) {
        media { id mediaContentType status }
        mediaUserErrors { field message }
      }
    }`,
    {
      productId: product.id,
      media: [
        {
          originalSource: target.resourceUrl,
          mediaContentType: "VIDEO",
          alt: "Air Force Floral Orange — vídeo do produto",
        },
      ],
    },
  );
  const errs = created.productCreateMedia.mediaUserErrors;
  if (errs.length) throw new Error(`${handle}: ${JSON.stringify(errs)}`);
  const media = created.productCreateMedia.media[0];
  console.log("adicionado:", handle, media.id, media.status);

  // 4. Espera que o vídeo fique processado
  for (let i = 0; i < 60; i++) {
    const st = await gql(`query($id: ID!) { node(id: $id) { ... on Video { status } } }`, {
      id: media.id,
    });
    if (st.node?.status === "READY") {
      console.log("  pronto:", handle);
      break;
    }
    if (st.node?.status === "FAILED") throw new Error(`vídeo falhou em ${handle}`);
    await new Promise((r) => setTimeout(r, 3000));
  }
}
