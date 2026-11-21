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
const locationId = "gid://shopify/Location/123726889308";

const APPLY = process.argv.includes("--apply");

const SIZES_ADIDAS_CRIANCA = ["28", "29", "30", "31", "32", "33", "34", "35"];
const SIZES_ADIDAS_GS = ["35 ⅓", "36", "36 ⅔", "37 ⅓", "38", "38 ⅔", "39 ⅓"];
const SIZES_ADIDAS_SENIOR = [
  "40",
  "40 ⅔",
  "41 ⅓",
  "42",
  "42 ⅔",
  "43 ⅓",
  "44",
  "44 ⅔",
  "45 ⅓",
  "46",
  "46 ⅔",
  "47 ⅓",
  "48",
  "48 ⅔",
  "49 ⅓",
];

const SIZES_NIKE_CRIANCA = [
  "27.5",
  "28",
  "28.5",
  "29",
  "29.5",
  "30",
  "30.5",
  "31",
  "31.5",
  "32",
  "32.5",
  "33",
  "33.5",
  "34",
  "34.5",
  "35",
];
const SIZES_NIKE_GS = ["35.5", "36", "36.5", "37", "37.5", "38", "38.5", "39"];
const SIZES_NIKE_SENIOR = [
  "40",
  "40.5",
  "41",
  "41.5",
  "42",
  "42.5",
  "43",
  "43.5",
  "44",
  "44.5",
  "45",
  "45.5",
  "46",
  "46.5",
  "47",
  "47.5",
  "48",
  "48.5",
  "49",
  "49.5",
  "50",
];

const STOCK = 20;

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

const GET = `
  query {
    products(first: 100) {
      nodes {
        id
        title
        handle
        vendor
        options { name values }
        variants(first: 100) {
          nodes {
            title
            price
            compareAtPrice
            sku
            selectedOptions { name value }
          }
        }
      }
    }
  }
`;

const SET = `
  mutation ProductSet($input: ProductSetInput!) {
    productSet(input: $input) {
      product { id title }
      userErrors { field message }
    }
  }
`;

function slug(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const data = await admin(GET);
const products = data.products.nodes;
console.log(`Produtos: ${products.length} | modo: ${APPLY ? "APLICAR" : "ENSAIO"}`);

for (const p of products) {
  const isChild = /crian[cç]a/i.test(p.title);
  const isGS = /GS/i.test(p.title);
  const isAdidas = /adidas/i.test(p.title);
  const isNike = /nike/i.test(p.title);

  let sizes;
  if (isAdidas) {
    // Criança 28–35 · GS 35⅓–39⅓ · Sénior 40–49⅓
    sizes = isChild
      ? SIZES_ADIDAS_CRIANCA
      : isGS
        ? SIZES_ADIDAS_GS
        : [...SIZES_ADIDAS_GS, ...SIZES_ADIDAS_SENIOR];
  } else if (isNike) {
    // Criança 27.5–35 · GS 35.5–39 · Sénior 40–50
    sizes = isChild
      ? SIZES_NIKE_CRIANCA
      : isGS
        ? SIZES_NIKE_GS
        : [...SIZES_NIKE_GS, ...SIZES_NIKE_SENIOR];
  } else {
    // Outras marcas: grelha adulto padrão
    sizes = isChild
      ? ["34", "35"]
      : [
          "36",
          "36.5",
          "37.5",
          "38",
          "38.5",
          "39",
          "40",
          "40.5",
          "41",
          "42",
          "42.5",
          "43",
          "44",
          "44.5",
          "45",
        ];
  }

  const sizeOption = p.options.find((o) => /tamanho|size|escal/i.test(o.name));
  const otherOptions = p.options.filter((o) => o !== sizeOption && !/^title$/i.test(o.name.trim()));

  // Combinações existentes (cor, cute cord, ...) sem o tamanho.
  const combos = [];
  for (const v of p.variants.nodes) {
    const opts = v.selectedOptions.filter((so) => otherOptions.some((o) => o.name === so.name));
    const key = opts
      .map((o) => `${o.name}=${o.value}`)
      .sort()
      .join("|");
    if (combos.some((c) => c.key === key)) continue;
    combos.push({ key, opts, price: v.price, compareAtPrice: v.compareAtPrice, sku: v.sku });
  }
  if (combos.length === 0) {
    combos.push({
      key: "",
      opts: [],
      price: p.variants.nodes[0]?.price,
      compareAtPrice: p.variants.nodes[0]?.compareAtPrice,
      sku: p.variants.nodes[0]?.sku,
    });
  }

  const productOptions = [
    ...otherOptions.map((o) => ({ name: o.name, values: o.values.map((name) => ({ name })) })),
    { name: "Tamanho", values: sizes.map((name) => ({ name })) },
  ];

  const variants = [];
  for (const combo of combos) {
    for (const size of sizes) {
      const baseSku = combo.sku ? combo.sku.replace(/-\d+(\.\d+)?$/, "") : slug(p.handle);
      variants.push({
        optionValues: [
          ...combo.opts.map((o) => ({ optionName: o.name, name: o.value })),
          { optionName: "Tamanho", name: size },
        ],
        price: combo.price,
        ...(combo.compareAtPrice ? { compareAtPrice: combo.compareAtPrice } : {}),
        sku: `${baseSku}-${size.replace(/\./g, "-").replace(/\s+/g, "").replace(/⅓/g, "1-3").replace(/⅔/g, "2-3")}`,
        inventoryPolicy: "DENY",
        inventoryItem: { tracked: true },
        inventoryQuantities: [{ locationId, name: "available", quantity: STOCK }],
      });
    }
  }

  const label = isChild ? "CRIANÇA (34,35)" : "ADULTO (GS+Sénior)";
  console.log(
    `- ${p.title} | ${label} | opções: ${productOptions.map((o) => o.name).join(" × ")} | variantes: ${variants.length}`,
  );

  if (!APPLY) continue;

  const res = await admin(SET, {
    input: { id: p.id, productOptions, variants },
  });
  const errs = res.productSet.userErrors;
  if (errs.length) console.error(`  ✘ ${p.title}:`, JSON.stringify(errs));
  else console.log(`  ✅ atualizado`);
}
