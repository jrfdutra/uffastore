import { readFile } from "node:fs/promises";

const envRaw = await readFile(new URL("../.env", import.meta.url), "utf8");
const get = (key) => envRaw.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim();
const domain = get("SHOPIFY_ADMIN_STORE_DOMAIN") || "uffastore.myshopify.com";
const token = get("SHOPIFY_ADMIN_TOKEN") || get("SHOPIFY_ADMIN_ACCESS_TOKEN");

const webhooks = [
  {
    topic: "ORDERS_PAID",
    callbackUrl: "https://www.uffastore.pt/api/webhooks/shopify/orders-paid",
  },
  {
    topic: "ORDERS_FULFILLED",
    callbackUrl: "https://www.uffastore.pt/api/webhooks/shopify/orders-fulfilled",
  },
  {
    topic: "ORDERS_UPDATED",
    callbackUrl: "https://www.uffastore.pt/api/webhooks/shopify/orders-fulfilled",
  },
];

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

const list = await gql(`{
  webhookSubscriptions(first: 50) {
    edges { node { id topic callbackUrl } }
  }
}`);
const existing = list.webhookSubscriptions.edges.map((edge) => edge.node);

for (const webhook of webhooks) {
  const found = existing.find(
    (node) => node.topic === webhook.topic && node.callbackUrl === webhook.callbackUrl,
  );

  if (found) {
    console.log("Webhook já existe:", found.id, found.topic, found.callbackUrl);
    continue;
  }

  const created = await gql(
    `mutation($topic: WebhookSubscriptionTopic!, $sub: WebhookSubscriptionInput!) {
      webhookSubscriptionCreate(topic: $topic, webhookSubscription: $sub) {
        webhookSubscription { id topic callbackUrl }
        userErrors { field message }
      }
    }`,
    { topic: webhook.topic, sub: { callbackUrl: webhook.callbackUrl, format: "JSON" } },
  );
  const result = created.webhookSubscriptionCreate;
  if (result.userErrors.length) throw new Error(JSON.stringify(result.userErrors));
  console.log(
    "Webhook criado:",
    result.webhookSubscription.id,
    result.webhookSubscription.topic,
    result.webhookSubscription.callbackUrl,
  );
}
