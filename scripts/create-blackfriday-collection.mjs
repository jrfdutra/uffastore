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
  if (!response.ok || json.errors?.length) {
    throw new Error(JSON.stringify(json.errors || json));
  }
  return json.data;
}

const FIND = `
  query {
    collections(first: 50) {
      nodes { id title handle ruleSet { appliedDisjunctively rules { column relation condition } } productsCount { count } }
    }
  }
`;

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
    publishablePublish(id: $id, input: $input) {
      userErrors { field message }
    }
  }
`;

const PUBLICATIONS = `query { publications(first: 20) { nodes { id name } } }`;

const ruleSet = {
  appliedDisjunctively: false,
  rules: [{ column: "TAG", relation: "EQUALS", condition: "Black Friday" }],
};

async function main() {
  const existing = (await admin(FIND)).collections.nodes;
  const found = existing.find(
    (c) => c.title.trim().toLowerCase() === "black friday" || c.handle === "black-friday",
  );

  let collection;
  if (found) {
    console.log(`Coleção já existe (${found.id}). A atualizar regras...`);
    const res = await admin(UPDATE, {
      input: {
        id: found.id,
        title: "Black Friday",
        handle: "black-friday",
        ruleSet,
        descriptionHtml:
          "<p>Todos os produtos da campanha de Black Friday da UFFA Store. Promoções por tempo limitado.</p>",
        sortOrder: "BEST_SELLING",
      },
    });
    if (res.collectionUpdate.userErrors.length) {
      throw new Error(JSON.stringify(res.collectionUpdate.userErrors));
    }
    collection = res.collectionUpdate.collection;
  } else {
    console.log("A criar coleção automática 'Black Friday' (tag = Black Friday)...");
    const res = await admin(CREATE, {
      input: {
        title: "Black Friday",
        handle: "black-friday",
        ruleSet,
        descriptionHtml:
          "<p>Todos os produtos da campanha de Black Friday da UFFA Store. Promoções por tempo limitado.</p>",
        sortOrder: "BEST_SELLING",
      },
    });
    if (res.collectionCreate.userErrors.length) {
      throw new Error(JSON.stringify(res.collectionCreate.userErrors));
    }
    collection = res.collectionCreate.collection;
  }

  console.log(`✅ Coleção: ${collection.title} (${collection.handle}) -> ${collection.id}`);

  const pubs = (await admin(PUBLICATIONS)).publications.nodes;
  const res = await admin(PUBLISH, {
    id: collection.id,
    input: pubs.map((p) => ({ publicationId: p.id })),
  });
  if (res.publishablePublish.userErrors.length) {
    console.error("Avisos de publicação:", res.publishablePublish.userErrors);
  } else {
    console.log(`Publicada em: ${pubs.map((p) => p.name).join(", ")}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
