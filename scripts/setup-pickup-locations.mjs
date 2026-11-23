import { readFile } from "node:fs/promises";

/** Locais de recolha em mão e as respetivas moradas públicas dos centros comerciais. */
const PICKUP_LOCATIONS = [
  {
    name: "NorteShopping",
    address: {
      address1: "Rua Sara Afonso, 105-117",
      city: "Senhora da Hora",
      zip: "4460-841",
      countryCode: "PT",
    },
  },
  {
    name: "Maia Jardim",
    address: {
      address1: "Rua Agostinho da Silva Rocha, 1048",
      city: "Nogueira",
      zip: "4475-451",
      countryCode: "PT",
    },
  },
  {
    name: "MarShopping",
    address: {
      address1: "Avenida Dr. Óscar Lopes",
      city: "Leça da Palmeira",
      zip: "4450-337",
      countryCode: "PT",
    },
  },
];

/** Antigo local de expedição: mantém-se como stock, mas deixa de ser ponto de recolha. */
const LEGACY_PICKUP_LOCATION = "Rua Alcino de Araújo";

const DRY_RUN = process.argv.includes("--dry-run");
const envRaw = await readFile(new URL("../.env", import.meta.url), "utf8");
const get = (key) =>
  process.env[key] ?? envRaw.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim();

const shopDomain = get("SHOPIFY_ADMIN_STORE_DOMAIN") || "uffastore.myshopify.com";
const token = get("SHOPIFY_ADMIN_ACCESS_TOKEN") || get("SHOPIFY_ADMIN_TOKEN");
if (!token) throw new Error("Falta SHOPIFY_ADMIN_ACCESS_TOKEN no .env");

const gql = async (query, variables = {}) => {
  const response = await fetch(`https://${shopDomain}/admin/api/2025-01/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({ query, variables }),
  });
  const json = await response.json();
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join("; "));
  return json.data;
};

const listLocations = async () => {
  const data = await gql(`{
    locations(first: 50) {
      nodes { id name isActive fulfillsOnlineOrders address { address1 city zip countryCode } }
    }
  }`);
  return data.locations.nodes;
};

const byName = (locations, name) =>
  locations.find((location) => location.name.trim().toLowerCase() === name.toLowerCase());

const addLocation = async ({ name, address }) => {
  const data = await gql(
    `mutation Add($input: LocationAddInput!) {
      locationAdd(input: $input) {
        location { id name }
        userErrors { field message }
      }
    }`,
    { input: { name, address, fulfillsOnlineOrders: true } },
  );
  const { location, userErrors } = data.locationAdd;
  if (userErrors.length) throw new Error(`${name}: ${userErrors.map((e) => e.message).join("; ")}`);
  return location;
};

const setLocalPickup = async (locationId, enabled) => {
  const query = enabled
    ? `mutation Enable($settings: DeliveryLocationLocalPickupEnableInput!) {
        locationLocalPickupEnable(localPickupSettings: $settings) {
          userErrors { field message }
        }
      }`
    : `mutation Disable($locationId: ID!) {
        locationLocalPickupDisable(locationId: $locationId) {
          userErrors { field message }
        }
      }`;
  const variables = enabled
    ? { settings: { locationId, pickupTime: "TWENTY_FOUR_HOURS" } }
    : { locationId };
  const data = await gql(query, variables);
  const errors =
    data.locationLocalPickupEnable?.userErrors ?? data.locationLocalPickupDisable?.userErrors;
  if (errors?.length) throw new Error(errors.map((e) => e.message).join("; "));
};

let locations = await listLocations();

for (const wanted of PICKUP_LOCATIONS) {
  let location = byName(locations, wanted.name);
  if (!location) {
    if (DRY_RUN) {
      console.log(`[dry-run] Criar localização ${wanted.name}`);
      continue;
    }
    location = await addLocation(wanted);
    console.log(`✅ Criada localização ${wanted.name} — ${location.id}`);
    locations = await listLocations();
  } else {
    console.log(`✅ Já existe localização ${wanted.name} — ${location.id}`);
  }
  if (!DRY_RUN) {
    await setLocalPickup(location.id, true);
    console.log(`✅ Recolha ativa em ${wanted.name}`);
  }
}

const legacy = byName(locations, LEGACY_PICKUP_LOCATION);
if (legacy) {
  if (DRY_RUN) {
    console.log(`[dry-run] Desativar recolha em ${LEGACY_PICKUP_LOCATION}`);
  } else {
    await setLocalPickup(legacy.id, false);
    console.log(`✅ Recolha desativada em ${LEGACY_PICKUP_LOCATION} (local mantido para stock)`);
  }
}

console.log("\n=== Localizações finais ===");
for (const location of await listLocations()) {
  console.log(
    `${location.isActive ? "ativo" : "inativo"} · ${location.name} · ${location.address?.city ?? "—"} · ${location.id}`,
  );
}
