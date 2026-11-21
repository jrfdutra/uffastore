import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const CSV_PATH = resolve(ROOT, "produtos_blackfriday_final.csv");

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
    throw new Error(`API Error: ${JSON.stringify(json.errors || response.statusText)}`);
  }
  return json.data;
}

// Passo 1: Listar todos os produtos da loja com paginação
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
            id
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

async function runDryRun() {
  const csvRaw = await readFile(CSV_PATH, "utf8");
  const lines = csvRaw.split(/\r?\n/).filter((l) => l.trim());
  const header = lines[0].split(";");

  // Agrupar linhas do CSV por Ref
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
      precoAtual: precoAtual?.trim() || "",
      precoBF: precoBF?.trim() || "",
      price: price?.trim() || "",
      compareAtPrice: compareAt?.trim() || "",
      obs: obs?.trim() || "",
    });
  }

  // Contagem de títulos repetidos na própria planilha
  const csvTitleCounts = new Map();
  for (const item of refMap.values()) {
    const key = `${normalize(item.modelo)}|${normalize(item.marca)}`;
    csvTitleCounts.set(key, (csvTitleCounts.get(key) || 0) + 1);
  }

  const shopifyProducts = await getAllShopifyProducts();

  // Indexar produtos da loja por título normalizado + marca normalizada
  const shopifyMap = new Map();
  for (const sp of shopifyProducts) {
    const key = `${normalize(sp.title)}|${normalize(sp.vendor)}`;
    if (!shopifyMap.has(key)) {
      shopifyMap.set(key, []);
    }
    shopifyMap.get(key).push(sp);
  }

  const dryRunRows = [];

  for (const [ref, item] of refMap.entries()) {
    const key = `${normalize(item.modelo)}|${normalize(item.marca)}`;
    const shopifyMatches = shopifyMap.get(key) || [];
    const countInCsv = csvTitleCounts.get(key) || 0;

    let categoria = "";
    let acao = "";
    let motivo = "";
    let matchedProduct = null;

    // Regras de classificação:
    // c) AMBÍGUO: a Observação diz "Título repetido", ou há mais de um produto com esse título na planilha ou na loja.
    const hasRepeatedTitleObs =
      item.obs.toLowerCase().includes("título repetido") ||
      item.variants.some((v) => v.obs.toLowerCase().includes("título repetido"));

    if (hasRepeatedTitleObs || countInCsv > 1 || shopifyMatches.length > 1) {
      categoria = "AMBÍGUO";
      acao = "IGNORAR";
      if (hasRepeatedTitleObs) motivo = "Observação indica título repetido";
      else if (countInCsv > 1) motivo = `Título repetido na planilha (${countInCsv} ocorrências)`;
      else motivo = `Múltiplos produtos correspondentes na loja (${shopifyMatches.length})`;
    } else if (shopifyMatches.length === 1) {
      categoria = "EXISTE";
      acao = "ATUALIZAR";
      matchedProduct = shopifyMatches[0];
    } else {
      categoria = "NOVO";
      acao = "CRIAR";
    }

    // Calcular diferenças de preço para cada variante
    const diffs = [];
    for (const v of item.variants) {
      const varName = v.opcao ? `${v.opcao}: ${v.valorOpcao}` : "Default Title";
      const targetPrice = v.price;
      const targetCompareAt = v.compareAtPrice;

      if (categoria === "EXISTE" && matchedProduct) {
        // Procurar variante correspondente na loja
        let matchVar = null;
        if (v.opcao) {
          matchVar = matchedProduct.variants.nodes.find((sv) =>
            sv.selectedOptions?.some(
              (so) =>
                normalize(so.name) === normalize(v.opcao) &&
                normalize(so.value) === normalize(v.valorOpcao),
            ),
          );
        } else {
          matchVar = matchedProduct.variants.nodes[0];
        }

        if (matchVar) {
          const currentPrice = matchVar.price || "0.00";
          const currentCompare = matchVar.compareAtPrice || "-";
          diffs.push({
            variante: varName,
            atual: `${currentPrice} € (comp: ${currentCompare})`,
            novo: `${targetPrice} € (comp: ${targetCompareAt} €)`,
            mudanca: `Price: ${currentPrice} -> ${targetPrice} | Compare: ${currentCompare} -> ${targetCompareAt}`,
            statusVariante: "EXISTENTE",
          });
        } else {
          diffs.push({
            variante: varName,
            atual: "Não existe na loja",
            novo: `${targetPrice} € (comp: ${targetCompareAt} €)`,
            mudanca: `Nova variante a acrescentar`,
            statusVariante: "ACRESCENTAR",
          });
        }
      } else if (categoria === "NOVO") {
        diffs.push({
          variante: varName,
          atual: "N/A (produto novo)",
          novo: `${targetPrice} € (comp: ${targetCompareAt} €)`,
          mudanca: `Criar com Price: ${targetPrice} € | Compare: ${targetCompareAt} €`,
          statusVariante: "NOVA",
        });
      } else {
        diffs.push({
          variante: varName,
          atual: "Ignorado",
          novo: `${targetPrice} € (comp: ${targetCompareAt} €)`,
          mudanca: `Sem alteração (${motivo})`,
          statusVariante: "IGNORADO",
        });
      }
    }

    dryRunRows.push({
      ref,
      modelo: item.modelo,
      marca: item.marca,
      categoria,
      acao,
      motivo,
      shopifyId: matchedProduct ? matchedProduct.id : "-",
      diffs,
    });
  }

  return { dryRunRows, totalShopifyProducts: shopifyProducts.length };
}

const res = await runDryRun();
console.log(JSON.stringify(res, null, 2));
