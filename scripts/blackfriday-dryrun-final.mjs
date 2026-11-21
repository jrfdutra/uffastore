import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const CSV_PATH = resolve(ROOT, "produtos_blackfriday_final.csv");
const ENV_PATH = resolve(ROOT, ".env");

async function loadEnv() {
  const raw = await readFile(ENV_PATH, "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = await loadEnv();
console.log("ENV loaded:", Object.keys(env));
console.log("SHOPIFY_ADMIN_STORE_DOMAIN:", env.SHOPIFY_ADMIN_STORE_DOMAIN);
console.log("SHOPIFY_ADMIN_ACCESS_TOKEN:", env.SHOPIFY_ADMIN_ACCESS_TOKEN ? "SET" : "NOT SET");

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
    throw new Error(`API Error: ${JSON.stringify(json.errors || response.statusText)}`);
  }
  return json.data;
}

async function getAllShopifyProducts() {
  const allProducts = [];
  let hasNextPage = true;
  let cursor = null;

  const QUERY = `
    query GetProducts($after: String) {
      products(first: 50, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          title
          vendor
          status
          options {
            name
            values
          }
          variants(first: 100) {
            nodes {
              id
              title
              price
              compareAtPrice
              selectedOptions {
                name
                value
              }
            }
          }
        }
      }
    }
  `;

  while (hasNextPage) {
    const data = await admin(QUERY, { after: cursor });
    const connection = data.products;
    allProducts.push(...connection.nodes);
    hasNextPage = connection.pageInfo.hasNextPage;
    cursor = connection.pageInfo.endCursor;
  }

  return allProducts;
}

function normalize(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function run() {
  console.log("\nCarregando dados da Shopify e CSV...");
  const shopifyProducts = await getAllShopifyProducts();
  console.log(`Total produtos na loja: ${shopifyProducts.length}`);

  const csvRaw = await readFile(CSV_PATH, "utf8");
  const lines = csvRaw.split(/\r?\n/).filter((l) => l.trim());

  const refMap = new Map();
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(";");
    const [ref, modelo, marca, opcao, valorOpcao, precoAtual, precoBF, price, compareAt, obs] =
      cols;
    if (!refMap.has(ref)) {
      refMap.set(ref, {
        ref,
        modelo: modelo?.trim(),
        marca: marca?.trim(),
        obs: obs?.trim() || "",
        variants: [],
      });
    }
    refMap.get(ref).variants.push({
      opcao: opcao?.trim() || "",
      valorOpcao: valorOpcao?.trim() || "",
      price: price?.trim() || "",
      compareAtPrice: compareAt?.trim() || "",
      obs: obs?.trim() || "",
    });
  }

  const results = [];

  for (const [ref, item] of refMap.entries()) {
    const mNorm = normalize(item.modelo);
    const vNorm = normalize(item.marca);

    // Match FLEXIBLE (Brand + Model or just Model)
    const matches = shopifyProducts.filter((sp) => {
      const spTitle = normalize(sp.title);
      const spVendor = normalize(sp.vendor);
      if (spVendor !== vNorm) return false;
      return spTitle === mNorm || spTitle === vNorm + " " + mNorm;
    });

    const isRepeatedInCsv =
      item.obs.toLowerCase().includes("título repetido") ||
      item.variants.some((v) => v.obs.toLowerCase().includes("título repetido"));

    let categoria = "";
    let acao = "";
    let motivo = "";
    let matchedProduct = null;

    if (isRepeatedInCsv || matches.length > 1) {
      categoria = "AMBÍGUO";
      acao = "IGNORAR";
      motivo = isRepeatedInCsv
        ? "Título repetido (CSV)"
        : "Múltiplos matches na loja (" + matches.length + ")";
    } else if (matches.length === 1) {
      categoria = "EXISTE";
      acao = "ATUALIZAR";
      matchedProduct = matches[0];
    } else {
      categoria = "NOVO";
      acao = "CRIAR";
    }

    const variantDiffs = [];
    for (const v of item.variants) {
      const varLabel = v.opcao ? v.opcao + ": " + v.valorOpcao : "Default Title";
      const newPrice = v.price;
      const newCompare = v.compareAtPrice;

      if (categoria === "EXISTE" && matchedProduct) {
        let foundVar = null;
        if (v.opcao) {
          foundVar = matchedProduct.variants.nodes.find(
            (sv) =>
              sv.selectedOptions &&
              sv.selectedOptions.some(
                (so) =>
                  normalize(so.name) === normalize(v.opcao) &&
                  normalize(so.value) === normalize(v.valorOpcao),
              ),
          );
        } else {
          foundVar = matchedProduct.variants.nodes[0];
        }

        if (foundVar) {
          const curP = foundVar.price;
          const curC = foundVar.compareAtPrice || "-";
          variantDiffs.push({
            variante: varLabel,
            atual: curP + " | " + curC,
            novo: newPrice + " | " + newCompare,
            status: "ATUALIZAR",
          });
        } else {
          variantDiffs.push({
            variante: varLabel,
            atual: "Nao existe",
            novo: newPrice + " | " + newCompare,
            status: "ADICIONAR",
          });
        }
      } else if (categoria === "NOVO") {
        variantDiffs.push({
          variante: varLabel,
          atual: "N/A",
          novo: newPrice + " | " + newCompare,
          status: "CRIAR",
        });
      } else {
        variantDiffs.push({
          variante: varLabel,
          atual: "Ignorado",
          novo: newPrice + " | " + newCompare,
          status: "IGNORAR",
        });
      }
    }

    results.push({
      ref,
      modelo: item.modelo,
      marca: item.marca,
      categoria,
      acao,
      motivo,
      variantDiffs,
    });
  }

  // Formatacao da Tabela
  console.log("\n" + "=".repeat(120));
  console.log("TABELA DE DRY RUN - Black Friday");
  console.log("=".repeat(120));

  const summary = { NOVO: 0, EXISTE: 0, AMBÍGUO: 0 };

  // Agrupar por categoria para exibir juntos
  const noivos = results.filter((r) => r.categoria === "NOVO");
  const existes = results.filter((r) => r.categoria === "EXISTE");
  const ambiguos = results.filter((r) => r.categoria === "AMBÍGUO");

  summary.NOVO = noivos.length;
  summary.EXISTE = existes.length;
  summary.AMBÍGUO = ambiguos.length;

  console.log("\n=== NOVOS (Criar) ===");
  console.log(
    "Ref   | Modelo (Marca)                           | Price         | Compare At   | Ação",
  );
  console.log("-".repeat(90));
  for (const r of noivos) {
    const v = r.variantDiffs[0];
    const novoParts = v.novo.split(" | ");
    console.log(
      r.ref +
        " | " +
        (r.modelo + " (" + r.marca + ")").substring(0, 38) +
        " | " +
        (novoParts[0] || "").padEnd(11) +
        " | " +
        (novoParts[1] || "-").padEnd(12) +
        " | " +
        r.acao,
    );
  }

  console.log("\n=== EXISTENTES (Atualizar) ===");
  console.log(
    "Ref   | Modelo (Marca)                           | Preço Atual        | Novo Preço      | Obs",
  );
  console.log("-".repeat(110));
  for (const r of existes) {
    const v = r.variantDiffs[0];
    const parts = v.atual.split(" | ");
    console.log(r.ref + " | " + (r.modelo + " (" + r.marca + ")").substring(0, 38));
    console.log(
      "      | Atual: " + parts[0] + " (antigo: " + parts[1] + ")            | Novo: " + v.novo,
    );
    if (r.variantDiffs.length > 1) {
      for (let i = 1; i < r.variantDiffs.length; i++) {
        const v2 = r.variantDiffs[i];
        console.log(
          "      | Variante extra: " +
            v2.variante +
            " | " +
            v2.atual +
            " -> " +
            v2.novo +
            " (" +
            v2.status +
            ")",
        );
      }
    }
  }

  console.log("\n=== AMBÍGUOS (Ignorar) ===");
  console.log("Ref   | Motivo");
  console.log("-".repeat(80));
  for (const r of ambiguos) {
    console.log(r.ref + " | " + r.motivo);
  }

  console.log("\n" + "=".repeat(120));
  console.log("RESUMO FINAL:");
  console.log("  NOVO:    " + summary.NOVO + " produtos a criar");
  console.log("  EXISTE:  " + summary.EXISTE + " produtos a atualizar");
  console.log("  AMBÍGUO: " + summary.AMBÍGUO + " produtos a ignorar");
  console.log("=".repeat(120));
}

run().catch(console.error);
