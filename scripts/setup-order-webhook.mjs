import { readFile } from "node:fs/promises";

const envRaw = await readFile(new URL("../.env", import.meta.url), "utf8");
const get = (key) => envRaw.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim();
const domain = get("SHOPIFY_ADMIN_STORE_DOMAIN") || "uffastore.myshopify.com";
const token = get("SHOPIFY_ADMIN_TOKEN") || get("SHOPIFY_ADMIN_ACCESS_TOKEN");
const secret = get("SHOPIFY_WEBHOOK_SECRET");
const callbackUrl = "https://www.uffastore.pt/api/webhooks/shopify/orders-paid";

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
const existing = list.webhookSubscriptions.edges
  .map((e) => e.node)
  .filter((n) => n.topic === "ORDERS_PAID" && n.callbackUrl === callbackUrl);

if (existing.length) {
  console.log("Webhook já existe:", existing[0].id, existing[0].callbackUrl);
} else {
  const created = await gql(
    `mutation($sub: WebhookSubscriptionInput!) {
      webhookSubscriptionCreate(topic: ORDERS_PAID, webhookSubscription: $sub) {
        webhookSubscription { id topic callbackUrl }
        userErrors { field message }
      }
    }`,
    { sub: { callbackUrl, format: "JSON" } },
  );
  const result = created.webhookSubscriptionCreate;
  if (result.userErrors.length) throw new Error(JSON.stringify(result.userErrors));
  console.log("Webhook criado:", result.webhookSubscription.id, result.webhookSubscription.callbackUrl);
}
