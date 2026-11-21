import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

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

async function admin(query, variables = {}) {
  const response = await fetch(`https://${domain}/admin/api/${version}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({ query, variables }),
  });
  const json = await response.json();
  if (!response.ok || json.errors?.length) throw new Error(JSON.stringify(json.errors || json));
  return json.data;
}

const FIND = `query { collections(first: 50) { nodes { id title handle } } }`;
const CREATE = `
  mutation CollectionCreate($input: CollectionInput!) {
    collectionCreate(input: $input) {
      collection { id title handle }
      userErrors { field message }
    }
  }
`;
const UPDATE = `
  mutation CollectionUpdate($input: CollectionInput!) {
    collectionUpdate(input: $input) {
      collection { id title handle }
      userErrors { field message }
    }
  }
`;
const PUBLISH = `
  mutation Publish($id: ID!, $input: [PublicationInput!]!) {
    publishablePublish(id: $id, input: $input) { userErrors { field message } }
  }
`;
const PUBLICATIONS = `query { publications(first: 20) { nodes { id name } } }`;

const CATEGORIES = [
  {
    title: "Limitada",
    handle: "limitada",
    productType: "Limitada",
    desc: "<p>Modelos em edição limitada da UFFA Store.</p>",
  },
  {
    title: "Lifestyle",
    handle: "lifestyle",
    productType: "Lifestyle",
    desc: "<p>Modelos Lifestyle da UFFA Store.</p>",
  },
  {
    title: "Running",
    handle: "running",
    productType: "Running",
    desc: "<p>Modelos Running da UFFA Store.</p>",
  },
];

async function main() {
  const existing = (await admin(FIND)).collections.nodes;
  const pubs = (await admin(PUBLICATIONS)).publications.nodes;

  for (const cat of CATEGORIES) {
    const found = existing.find((c) => c.handle === cat.handle);
    const input = {
      title: cat.title,
      handle: cat.handle,
      descriptionHtml: cat.desc,
      sortOrder: "BEST_SELLING",
      ruleSet: {
        appliedDisjunctively: false,
        rules: [{ column: "TYPE", relation: "EQUALS", condition: cat.productType }],
      },
    };

    let collection;
    if (found) {
      const res = await admin(UPDATE, { input: { ...input, id: found.id } });
      if (res.collectionUpdate.userErrors.length)
        throw new Error(JSON.stringify(res.collectionUpdate.userErrors));
      collection = res.collectionUpdate.collection;
      console.log(`↻ Atualizada: ${collection.title}`);
    } else {
      const res = await admin(CREATE, { input });
      if (res.collectionCreate.userErrors.length)
        throw new Error(JSON.stringify(res.collectionCreate.userErrors));
      collection = res.collectionCreate.collection;
      console.log(`✅ Criada: ${collection.title}`);
    }

    const pub = await admin(PUBLISH, {
      id: collection.id,
      input: pubs.map((p) => ({ publicationId: p.id })),
    });
    if (pub.publishablePublish.userErrors.length) {
      console.error("  avisos:", pub.publishablePublish.userErrors);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
