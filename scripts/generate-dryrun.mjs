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

export async function generateDryRun(matchingMode = "both") {
  const csvRaw = await readFile(CSV_PATH, "utf8");
  const lines = csvRaw.split(/\r?\n/).filter(l => l.trim());
  
  // Agrupar por Ref
  const refMap = new Map();
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(";");
    const [ref, modelo, marca, opcao, valorOpcao, precoAtual, precoBF, price, compareAt, obs] = cols;
    if (!refMap.has(ref)) {
      refMap.set(ref, {
        ref,
        modelo: modelo?.trim(),
        marca: marca?.trim(),
        obs: obs?.trim() || "",
        variants: []
      });
    }
    refMap.get(ref).variants.push({
      opcao: opcao?.trim() || "",
      valorOpcao: valorOpcao?.trim() || "",
      precoAtual: precoAtual?.trim() || "",
      precoBF: precoBF?.trim() || "",
      price: price?.trim() || "",
      compareAtPrice: compareAt?.trim() || "",
      obs: obs?.trim() || ""
    });
  }

  const shopifyProducts = await getAllShopifyProducts();

  function evaluate(mode) {
    const rows = [];
    for (const [ref, item] of refMap.entries()) {
      const mNorm = normalize(item.modelo);
      const vNorm = normalize(item.marca);

      // Procurar produto na loja
      const matches = shopifyProducts.filter(sp => {
        const spTitle = normalize(sp.title);
        const spVendor = normalize(sp.vendor);
        if (spVendor !== vNorm) return false;
        if (mode === "prefix") {
          return spTitle === mNorm || spTitle === `${vNorm} ${mNorm}`;
        } else {
          return spTitle === mNorm;
        }
      });

      const isRepeatedInCsv = item.obs.toLowerCase().includes("título repetido") || 
        item.variants.some(v => v.obs.toLowerCase().includes("título repetido"));

      let categoria = "";
      let acao = "";
      let motivo = "";
      let matchedProduct = null;

      if (isRepeatedInCsv || matches.length > 1) {
        categoria = "AMBÍGUO";
        acao = "IGNORAR";
        if (isRepeatedInCsv) {
          motivo = item.obs || "Título repetido na planilha";
        } else {
          motivo = `Múltiplos produtos encontrados na loja (${matches.length})`;
        }
      } else if (matches.length === 1) {
        categoria = "EXISTE";
        acao = "ATUALIZAR";
        matchedProduct = matches[0];
      } else {
        categoria = "NOVO";
        acao = "CRIAR";
      }

      // Detalhes das variantes e diferenças de preço
      const variantDiffs = [];
      for (const v of item.variants) {
        const varLabel = v.opcao ? `${v.opcao}: ${v.valorOpcao}` : "Default Title";
        const newPrice = v.price;
        const newCompare = v.compareAtPrice;

        if (categoria === "EXISTE" && matchedProduct) {
          // Procurar variante na loja
          let foundVariant = null;
          if (v.opcao) {
            foundVariant = matchedProduct.variants.nodes.find(sv => 
              sv.selectedOptions?.some(so => normalize(so.name) === normalize(v.opcao) && normalize(so.value) === normalize(v.valorOpcao))
            );
          } else {
            // Se o produto na loja tem variantes únicas ou múltiplas
            foundVariant = matchedProduct.variants.nodes[0];
          }

          if (foundVariant) {
            const curP = foundVariant.price || "0.00";
            const curC = foundVariant.compareAtPrice || "—";
            variantDiffs.push({
              variante: varLabel,
              lojaAtual: `${curP} BRL (antigo: ${curC})`,
              novo: `${newPrice} BRL (antigo: ${newCompare})`,
              mudanca: `${curP} -> ${newPrice} (Comp: ${curC} -> ${newCompare})`,
              acaoVariante: "Atualizar preço"
            });
          } else {
            variantDiffs.push({
              variante: varLabel,
              lojaAtual: "Não existe na loja",
              novo: `${newPrice} BRL (antigo: ${newCompare})`,
              mudanca: `Nova variante (${newPrice} BRL / ${newCompare} BRL)`,
              acaoVariante: "Acrescentar variante"
            });
          }
        } else if (categoria === "NOVO") {
          variantDiffs.push({
            variante: varLabel,
            lojaAtual: "Não existe (produto novo)",
            novo: `${newPrice} BRL (antigo: ${newCompare})`,
            mudanca: `Criar com ${newPrice} BRL (Comp: ${newCompare})`,
            acaoVariante: "Criar produto/variante"
          });
        } else {
          variantDiffs.push({
            variante: varLabel,
            lojaAtual: matchedProduct ? "Existe na loja" : "N/A",
            novo: `${newPrice} BRL (antigo: ${newCompare})`,
            mudanca: "Sem alteração (ignorado)",
            acaoVariante: "Ignorar"
          });
        }
      }

      rows.push({
        ref,
        modelo: item.modelo,
        marca: item.marca,
        categoria,
        acao,
        motivo,
        shopifyProductTitle: matchedProduct ? matchedProduct.title : "-",
        shopifyProductId: matchedProduct ? matchedProduct.id : "-",
        variantsCount: item.variants.length,
        variantDiffs
      });
    }
    return rows;
  }

  return {
    exact: evaluate("exact"),
    prefix: evaluate("prefix"),
    totalShopify: shopifyProducts.length
  };
}

const data = await generateDryRun();
console.log(JSON.stringify(data, null, 2));
