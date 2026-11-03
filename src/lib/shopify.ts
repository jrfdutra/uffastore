const domain = import.meta.env["VITE_SHOPIFY_STORE_DOMAIN"];
const token = import.meta.env["VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN"];

const API_VERSION = "2026-07";

export function isShopifyConfigured() {
  return Boolean(domain && token);
}

type ShopifyResponse<T> = { data?: T; errors?: { message: string }[] };

export async function shopifyFetch<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  if (!isShopifyConfigured()) {
    throw new Error("Shopify não configurado: falta o domain ou o token no .env");
  }

  const response = await fetch(`https://${domain}/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Shopify respondeu ${response.status}`);
  }

  const json = (await response.json()) as ShopifyResponse<T>;

  if (json.errors?.length) {
    throw new Error(json.errors.map((error) => error.message).join("\n"));
  }

  if (!json.data) {
    throw new Error("Resposta vazia da Shopify");
  }

  return json.data;
}

const PRODUCTS_QUERY = `
  query Products($first: Int!) {
    products(first: $first) {
      nodes {
        id
        handle
        title
        description
        productType
        tags
        featuredImage { url altText }
        priceRange { minVariantPrice { amount currencyCode } }
        variants(first: 50) {
          nodes {
            id
            title
            availableForSale
            quantityAvailable
            price { amount currencyCode }
            selectedOptions { name value }
          }
        }
      }
    }
  }
`;

export type ShopifyProductNode = {
  id: string;
  handle: string;
  title: string;
  description: string;
  productType: string;
  tags: string[];
  featuredImage: { url: string; altText: string | null } | null;
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
  variants: {
    nodes: {
      id: string;
      title: string;
      availableForSale: boolean;
      quantityAvailable: number | null;
      price: { amount: string; currencyCode: string };
      selectedOptions: { name: string; value: string }[];
    }[];
  };
};

export async function fetchShopifyProducts(first = 50) {
  const data = await shopifyFetch<{ products: { nodes: ShopifyProductNode[] } }>(PRODUCTS_QUERY, {
    first,
  });
  return data.products.nodes;
}

const PRODUCT_BY_HANDLE_QUERY = `
  query ProductByHandle($handle: String!) {
    product(handle: $handle) {
      id
      handle
      title
      description
      productType
      tags
      featuredImage { url altText }
      priceRange { minVariantPrice { amount currencyCode } }
      variants(first: 100) {
        nodes {
          id
          title
          availableForSale
          quantityAvailable
          price { amount currencyCode }
          selectedOptions { name value }
        }
      }
    }
  }
`;

export async function fetchShopifyProductByHandle(handle: string) {
  const data = await shopifyFetch<{ product: ShopifyProductNode | null }>(PRODUCT_BY_HANDLE_QUERY, {
    handle,
  });
  return data.product;
}
