/**
 * Browser-safe Storefront API client for F5.
 *
 * This is the third credential face: the reads here run client-side with the
 * shop's `publicToken` — no agency secret, no server proxy. The publicToken is
 * resolved server-side (GET /api/shops/:shopId/public-token) and passed in.
 */

const STOREFRONT_API_URL =
  process.env.NEXT_PUBLIC_FOURTHWALL_STOREFRONT_API_URL ?? "https://storefront-api.fourthwall.com";

export interface StorefrontShop {
  id: string;
  name: string;
  domain: string;
  publicDomain: string;
}

export interface StorefrontProduct {
  id: string;
  name: string;
  slug: string;
  images: { id: string; url: string; transformedUrl: string }[];
  variants: { unitPrice: { value: number; currency: string } }[];
}

export interface StorefrontCollection {
  id: string;
  name: string;
  slug: string;
  products: StorefrontProduct[];
}

function withToken(path: string, token: string, params: Record<string, string> = {}): string {
  const url = new URL(`${STOREFRONT_API_URL}${path}`);
  url.searchParams.set("storefront_token", token);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url.toString();
}

async function get<T>(path: string, token: string, params?: Record<string, string>): Promise<T> {
  const res = await fetch(withToken(path, token, params), { next: { revalidate: 60 } });
  if (!res.ok) {
    throw new Error(`Storefront ${path} → ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as T;
}

export async function getShop(token: string): Promise<StorefrontShop> {
  return get<StorefrontShop>("/v1/shop", token);
}

/** The shop's first collection with its products — a representative storefront slice. */
export async function getStorefront(token: string): Promise<{
  shop: StorefrontShop;
  collection: StorefrontCollection | null;
}> {
  const shop = await getShop(token);
  const { results } = await get<{ results: Omit<StorefrontCollection, "products">[] }>(
    "/v1/collections",
    token,
    { size: "50" },
  );
  const collection = results[0];
  if (!collection) return { shop, collection: null };

  const { results: products } = await get<{ results: StorefrontProduct[] }>(
    `/v1/collections/${collection.slug}/products`,
    token,
    { size: "12" },
  );
  return { shop, collection: { ...collection, products } };
}
