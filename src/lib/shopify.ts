const domain = import.meta.env["VITE_SHOPIFY_STORE_DOMAIN"] || "uffastore.myshopify.com";
const token = import.meta.env["VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN"] || "cabe7b9d813cad638ad8a2812fc84f20";

const API_VERSION = "2026-07";

export function isShopifyConfigured() {
  return Boolean(domain && token);
}

type ShopifyResponse<T> = { data?: T; errors?: { message: string }[] };

export async function shopifyFetch<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(`https://${domain}/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = (await response.json()) as ShopifyResponse<T>;

  if (!response.ok || json.errors?.length) {
    console.error("Shopify error:", response.status, json.errors?.map(e => e.message).join(", "));
    throw new Error(`Shopify API error: ${json.errors?.map((e) => e.message).join(", ") || response.statusText}`);
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
        images(first: 10) { nodes { url altText } }
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
  images: { nodes: { url: string; altText: string | null }[] };
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

const CART_CREATE_MUTATION = `
  mutation cartCreate($input: CartInput) {
    cartCreate(input: $input) {
      cart {
        checkoutUrl
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export async function createCheckoutUrl(
  items: { variantId: string; quantity: number }[],
  delivery: string = "pickup",
  couponCode?: string,
) {
  const isPickup = delivery === "pickup";
  let deliveryLabel = "Recolha em mão no Porto (0,00 €)";
  let portesValue = "0,00 €";
  let costText = "0,00 €";

  if (delivery === "continental") {
    deliveryLabel = "Portugal Continental (8,94 €)";
    portesValue = "8,94 €";
    costText = "8,94 €";
  } else if (delivery === "islands") {
    deliveryLabel = "Portugal - Ilhas / Regiões Autónomas (8,94 €)";
    portesValue = "8,94 €";
    costText = "8,94 €";
  } else if (delivery === "eu") {
    deliveryLabel = "União Europeia (24,00 €)";
    portesValue = "24,00 €";
    costText = "24,00 €";
  } else if (delivery === "switzerland") {
    deliveryLabel = "Suíça (34,00 €)";
    portesValue = "34,00 €";
    costText = "34,00 €";
  }

  const attributes = [
    {
      key: "Modalidade de Entrega",
      value: deliveryLabel,
    },
    {
      key: "Portes de Envio",
      value: portesValue,
    },
    {
      key: "Tipo de Envio",
      value: isPickup ? "PICK_UP" : "SHIPPING",
    },
    {
      key: "Destino / Zona",
      value: delivery,
    },
  ];

  const note = `MODALIDADE DE ENTREGA SELECIONADA: ${deliveryLabel}. Portes: ${costText}.`;

  const discountCodes = couponCode ? [couponCode] : [];

  console.log("DEBUG: domain being used:", domain);
  console.log("DEBUG: token being used:", token ? "YES" : "NO");

  const data = await shopifyFetch<{
    cartCreate: {
      cart: { checkoutUrl: string };
      userErrors: { message: string }[];
    };
  }>(CART_CREATE_MUTATION, {
    input: {
      lines: items.map((item) => ({
        merchandiseId: item.variantId,
        quantity: item.quantity,
      })),
      attributes,
      note,
      discountCodes,
      buyerIdentity: {
        preferences: {
          delivery: {
            deliveryMethod: [isPickup ? "PICK_UP" : "SHIPPING"],
          },
        },
      },
    },
  });

  if (data.cartCreate.userErrors && data.cartCreate.userErrors.length > 0) {
    throw new Error(data.cartCreate.userErrors[0]?.message ?? "Erro ao criar checkout");
  }

  return data.cartCreate.cart.checkoutUrl;
}

export async function createShopifyCheckout(
  items: { variantId: string; quantity: number }[],
  delivery: string = "pickup",
  couponCode?: string,
) {
  const url = await createCheckoutUrl(items, delivery, couponCode);
  const separator = url.includes("?") ? "&" : "?";
  return { webUrl: `${url}${separator}skip_shop_pay=true` };
}

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
      images(first: 10) { nodes { url altText } }
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