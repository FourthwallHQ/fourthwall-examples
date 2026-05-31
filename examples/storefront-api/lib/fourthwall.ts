// Thin server-side client for the Fourthwall Storefront API.
//
// The Storefront API is public-read: every call is authorized by a
// `storefront_token` query parameter rather than a bearer header. That token is
// the "public token" you mint with `PUT /open-api/v1.0/public-token` — see the
// `public-token` example in this repo for the OAuth flow that obtains it.

const API_URL =
  process.env.FOURTHWALL_STOREFRONT_API_URL ?? "https://storefront-api.fourthwall.com";
const TOKEN = process.env.FOURTHWALL_STOREFRONT_TOKEN;

export interface Shop {
  id: string;
  name: string;
  domain: string;
  publicDomain: string;
}

export interface ProductImage {
  id: string;
  url: string;
  transformedUrl: string;
}

export interface Money {
  value: number;
  currency: string;
}

export interface Variant {
  id: string;
  name: string;
  unitPrice: Money;
  attributes: {
    description: string;
    color?: { name: string; swatch: string };
    size?: { name: string };
  };
  stock: { type: "LIMITED" | "UNLIMITED"; inStock?: number };
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  images: ProductImage[];
  variants: Variant[];
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  products: Product[];
}

interface Paged<T> {
  results: T[];
}

function withToken(path: string, params: Record<string, string> = {}): string {
  const url = new URL(`${API_URL}${path}`);
  url.searchParams.set("storefront_token", TOKEN ?? "");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  // Re-fetch at most once a minute so the link page stays cheap to serve.
  const res = await fetch(withToken(path, params), { next: { revalidate: 60 } });
  if (!res.ok) {
    throw new Error(`Fourthwall ${path} → ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export function isConfigured(): boolean {
  return Boolean(TOKEN);
}

export async function getShop(): Promise<Shop> {
  return get<Shop>("/v1/shop");
}

/**
 * The collection to feature in the carousel: the one named by
 * `FOURTHWALL_COLLECTION_SLUG`, or the shop's first collection otherwise.
 */
export async function getFeaturedCollection(slug?: string): Promise<Collection | null> {
  const { results } = await get<Paged<Omit<Collection, "products">>>("/v1/collections", {
    size: "50",
  });
  const collection = slug ? results.find((c) => c.slug === slug) : results[0];
  if (!collection) return null;

  const products = await get<Paged<Product>>(
    `/v1/collections/${collection.slug}/products`,
    { size: "12" },
  );
  return { ...collection, products: products.results };
}

export function productUrl(shop: Shop, product: Product): string {
  return `https://${shop.publicDomain}/products/${product.slug}`;
}

interface Cart {
  id: string;
}

/** Create a Fourthwall cart from line items. Returns the cart id. */
export async function createCart(
  items: { variantId: string; quantity: number }[],
  currency = "USD",
): Promise<string> {
  const res = await fetch(withToken("/v1/carts", { currency }), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Fourthwall create cart → ${res.status} ${await res.text()}`);
  }
  const cart = (await res.json()) as Cart;
  return cart.id;
}

function shopBase(shop: Shop): string {
  return shop.publicDomain
    ? `https://${shop.publicDomain}`
    : `https://${shop.domain}.fourthwall.com`;
}

/**
 * Fourthwall's hosted checkout lives on the shop's own domain. Send the buyer
 * there with the cart id and they complete payment/shipping on Fourthwall.
 */
export function checkoutUrl(shop: Shop, cartId: string, currency = "USD"): string {
  return `${shopBase(shop)}/checkout/?cartId=${cartId}&cartCurrency=${currency}`;
}

/**
 * Cart-checkout endpoint: build a checkout URL straight from variant ids — no
 * cart object needed. The buyer lands directly on hosted checkout.
 * https://docs.fourthwall.com/shop-apis/cart-checkout-endpoint
 */
export function directCheckoutUrl(
  shop: Shop,
  variantId: string,
  quantity = 1,
  currency = "USD",
): string {
  return `${shopBase(shop)}/cart/checkout?products=${variantId}:${quantity}&currency=${currency}`;
}

export function formatPrice({ value, currency }: Money): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
  } catch {
    return `${value} ${currency}`;
  }
}
