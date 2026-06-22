/**
 * The Fourthwall server client. This is the ONLY module that issues outbound
 * calls to the `order` service, and the ONLY place the channel bearer is
 * attached. Route handlers call these helpers; the browser never sees the
 * credentials.
 *
 * Auth is the **client-credentials** channel model. The channel is a
 * statically provisioned Keycloak client (id starts with `channel.`, e.g.
 * `channel.linktree`) — NOT a per-user Platform-App install. There is no
 * browser-side login round-trip, no redirect, and no connect step. The server
 * fetches its own bearer via the OAuth2 client-credentials grant against the
 * Keycloak token endpoint and caches it in module memory
 * (see {@link getChannelToken}).
 *
 * That single bearer has two faces:
 *
 *  • **channel-api** (`/channel-api/v1.0/…`) — shop-less. Driven by the
 *    channel bearer alone. Used for templates browsing (well, the open-api
 *    templates list — see below), artwork upload + registration, preview, and
 *    shop lookup/provisioning.
 *  • **open-api** (`/open-api/v1.0/…`) — the final product creation is
 *    shop-bound: the same channel bearer plus an `X-ShopId` header selects the
 *    just-provisioned shop (the channel is agency-credentialed).
 *
 * The shop boundary lives here: every helper below is shop-less except
 * `createProduct`, `listProducts`, `setProductState`, and `deleteProduct`,
 * which take a `shopId` and attach `X-ShopId`.
 *
 * Contracts are validated against the Fourthwall OpenAPI spec
 * (docs.fourthwall.com/open-api-docs/open-api.json) for the open-api calls and
 * against the order service's channel-api DTOs for the channel-api calls.
 */

import type {
  Blueprint,
  Channel,
  PreviewRequest,
  PreviewResult,
  ProductLink,
  PublishRequest,
  RegisteredImage,
  UploadTicket,
} from './types';

/** Derive the API host (`api.<base>`) from the configured Fourthwall instance. */
export function apiUrl(): string {
  const base = process.env.NEXT_PUBLIC_FOURTHWALL_BASE_URL ?? 'fourthwall.com';
  return `https://api.${base}`;
}

/** Derive the auth (Keycloak) host (`auth.<base>`) from the Fourthwall instance. */
export function authUrl(): string {
  const base = process.env.NEXT_PUBLIC_FOURTHWALL_BASE_URL ?? 'fourthwall.com';
  return `https://auth.${base}`;
}

async function ensureOk(res: Response, what: string): Promise<Response> {
  if (!res.ok) {
    throw new Error(`${what} failed (${res.status}): ${await res.text()}`);
  }
  return res;
}

/* ------------------------------------------------------------------ *
 * Channel bearer — OAuth2 client-credentials grant
 * ------------------------------------------------------------------ */

/**
 * Module-memory cache for the channel bearer. The token is fetched lazily and
 * refreshed when within ~30s of expiry — mirroring the reference
 * `ChannelApiClient.doRefreshToken`. Stashed on `globalThis` so it survives
 * Next.js dev hot-reloads. Nothing is ever sent to the browser.
 */
const globalForToken = globalThis as unknown as {
  __partnerPlatformToken?: { token: string; expiresAt: number };
  __partnerPlatformTokenInflight?: Promise<string>;
};

/**
 * Resolve the channel bearer via the OAuth2 client-credentials grant against
 * the Keycloak token endpoint, caching it in module memory. Returns the cached
 * token until ~30s before it expires. Reads the server-only channel client
 * credentials; never returns them.
 */
export async function getChannelToken(): Promise<string> {
  const cached = globalForToken.__partnerPlatformToken;
  if (cached && Date.now() < cached.expiresAt) {
    return cached.token;
  }
  // Coalesce concurrent refreshes behind a single in-flight request.
  if (globalForToken.__partnerPlatformTokenInflight) {
    return globalForToken.__partnerPlatformTokenInflight;
  }
  const inflight = refreshChannelToken().finally(() => {
    globalForToken.__partnerPlatformTokenInflight = undefined;
  });
  globalForToken.__partnerPlatformTokenInflight = inflight;
  return inflight;
}

async function refreshChannelToken(): Promise<string> {
  const clientId = process.env.FOURTHWALL_CHANNEL_CLIENT_ID;
  const clientSecret = process.env.FOURTHWALL_CHANNEL_CLIENT_SECRET;
  if (!clientId) throw new Error('FOURTHWALL_CHANNEL_CLIENT_ID is not set');
  if (!clientSecret) throw new Error('FOURTHWALL_CHANNEL_CLIENT_SECRET is not set');

  const res = await ensureOk(
    await fetch(`${authUrl()}/auth/realms/Fourthwall/protocol/openid-connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    }),
    'Channel token request',
  );
  const data = (await res.json()) as { access_token: string; expires_in: number };
  globalForToken.__partnerPlatformToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 30) * 1000,
  };
  return data.access_token;
}

/** Headers for a channel-api call: the channel bearer, no shop. */
function channelHeaders(accessToken: string): Record<string, string> {
  return { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
}

/** Headers for an open-api call scoped to a shop: channel bearer + X-ShopId. */
function shopHeaders(accessToken: string, shopId: string): Record<string, string> {
  return { Authorization: `Bearer ${accessToken}`, 'X-ShopId': shopId, 'Content-Type': 'application/json' };
}

/* ------------------------------------------------------------------ *
 * channel-api — shop-less
 * ------------------------------------------------------------------ */

/** Raw channel-api channel shape. */
interface ChannelXResponse {
  id: string;
  name: string;
  keycloakClientId?: string;
  createdAt?: string;
}

/** Resolve the connected channel. `GET /channel-api/v1.0/channel/current`. */
export async function getCurrentChannel(accessToken: string): Promise<Channel> {
  const res = await ensureOk(
    await fetch(`${apiUrl()}/channel-api/v1.0/channel/current`, {
      headers: channelHeaders(accessToken),
    }),
    'Get current channel',
  );
  const data = (await res.json()) as ChannelXResponse;
  return { id: data.id, name: data.name };
}

/** Raw shop summary from `GET /channel-api/v1.0/shops`. */
interface ShopSummaryXResponse {
  shopId: string;
  name: string;
}

/** List the shops attached to the channel (agency). `GET /channel-api/v1.0/shops`. */
export async function listShops(accessToken: string): Promise<ShopSummaryXResponse[]> {
  const res = await ensureOk(
    await fetch(`${apiUrl()}/channel-api/v1.0/shops`, {
      headers: channelHeaders(accessToken),
    }),
    'List shops',
  );
  const data = (await res.json()) as { shops?: ShopSummaryXResponse[] };
  return data.shops ?? [];
}

/** `POST /channel-api/v1.0/shops` — provision a shop. */
export async function createShop(
  accessToken: string,
  name: string,
): Promise<{ shopId: string; shopName: string }> {
  const res = await ensureOk(
    await fetch(`${apiUrl()}/channel-api/v1.0/shops`, {
      method: 'POST',
      headers: channelHeaders(accessToken),
      body: JSON.stringify({ name }),
    }),
    'Create shop',
  );
  const data = (await res.json()) as {
    shopId: string;
    shopName: string;
    publicToken?: string;
  };
  return { shopId: data.shopId, shopName: data.shopName };
}

/** `POST /channel-api/v1.0/upload-url` — request a presigned upload URL. */
export async function requestUploadUrl(
  accessToken: string,
  file: { contentType: string; fileName: string; size: number },
): Promise<UploadTicket> {
  const res = await ensureOk(
    await fetch(`${apiUrl()}/channel-api/v1.0/upload-url`, {
      method: 'POST',
      headers: channelHeaders(accessToken),
      body: JSON.stringify({
        contentType: file.contentType,
        fileName: file.fileName,
        size: file.size,
      }),
    }),
    'Request upload URL',
  );
  const data = (await res.json()) as { uploadUrl: string; fileUrl: string };
  return { uploadUrl: data.uploadUrl, fileUrl: data.fileUrl };
}

/** `POST /channel-api/v1.0/media/images` — register an uploaded image. */
export async function registerMediaImage(
  accessToken: string,
  image: { fileUrl: string; width: number; height: number },
): Promise<RegisteredImage> {
  const res = await ensureOk(
    await fetch(`${apiUrl()}/channel-api/v1.0/media/images`, {
      method: 'POST',
      headers: channelHeaders(accessToken),
      body: JSON.stringify({
        fileUrl: image.fileUrl,
        width: image.width,
        height: image.height,
      }),
    }),
    'Register media image',
  );
  const data = (await res.json()) as { id: string; uri: string; width: number; height: number };
  return { imageId: data.id, uri: data.uri, width: data.width, height: data.height };
}

/** `POST /channel-api/v1.0/previews` — render preview images synchronously, no shop. */
export async function createPreview(
  accessToken: string,
  request: PreviewRequest,
): Promise<PreviewResult> {
  const res = await ensureOk(
    await fetch(`${apiUrl()}/channel-api/v1.0/previews`, {
      method: 'POST',
      headers: channelHeaders(accessToken),
      body: JSON.stringify({
        productId: request.productId,
        colors: request.colors,
        sizes: request.sizes,
        regions: request.regions,
      }),
    }),
    'Create preview',
  );
  const data = (await res.json()) as {
    customizationId?: string;
    pipelineId: string;
    images?: Array<{
      url: string;
      color: string;
      size?: string;
      style: string;
      region?: string;
      width: number;
      height: number;
    }>;
  };
  return {
    customizationId: data.customizationId ?? null,
    pipelineId: data.pipelineId,
    images: (data.images ?? []).map((i) => ({
      url: i.url,
      color: i.color,
      size: i.size ?? '',
      style: i.style,
      region: i.region ?? null,
      width: i.width,
      height: i.height,
    })),
  };
}

/* ------------------------------------------------------------------ *
 * open-api — product templates (shop-less list) & shop-bound products
 * ------------------------------------------------------------------ */

/** `GET /open-api/v1.0/product-templates/page/{page}` — list blank products. */
export async function listProductTemplates(accessToken: string, page = 1): Promise<Blueprint[]> {
  const res = await ensureOk(
    await fetch(`${apiUrl()}/open-api/v1.0/product-templates/page/${page}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
    'List product templates',
  );
  const data = (await res.json()) as {
    results?: Array<{
      productId: string;
      name: string;
      category?: string;
      brand?: string;
      basePrice?: { amount: number; currency: string };
      thumbnail?: string;
    }>;
  };
  return (data.results ?? []).map((t) => ({
    productId: t.productId,
    name: t.name,
    category: t.category ?? '',
    brand: t.brand ?? '',
    basePrice: t.basePrice?.amount ?? 0,
    currency: t.basePrice?.currency ?? 'USD',
    thumbnail: t.thumbnail ?? null,
  }));
}

/** Raw open-api offer (product) shape, only the fields we read. */
interface OfferFullV1 {
  id: string;
  name: string;
  description: string;
  state: string;
  thumbnailImage?: { url?: string };
  variants?: Array<{ unitPrice?: { amount: number; currency: string } }>;
}

function formatPrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

function toProductLink(o: OfferFullV1): ProductLink {
  const price = o.variants?.[0]?.unitPrice;
  return {
    id: o.id,
    title: o.name,
    description: o.description ?? '',
    price: price ? formatPrice(price.amount, price.currency) : '',
    thumbnail: o.thumbnailImage?.url ?? null,
    visible: o.state === 'PUBLIC',
  };
}

/**
 * `GET /open-api/v1.0/products` — list the shop's products. Shop-bound
 * (the open-api client is the channel, so `X-ShopId` selects the shop).
 */
export async function listProducts(accessToken: string, shopId: string): Promise<ProductLink[]> {
  const res = await ensureOk(
    await fetch(`${apiUrl()}/open-api/v1.0/products?page=1&size=50`, {
      headers: shopHeaders(accessToken, shopId),
    }),
    'List products',
  );
  const data = (await res.json()) as { results?: OfferFullV1[] };
  return (data.results ?? []).map(toProductLink);
}

/**
 * `POST /open-api/v1.0/products` — create the live product. Shop-bound. The
 * product is built from the exact `productId` + `imageId` (+ colors/sizes) the
 * preview was rendered from, so what the creator saw is what goes live.
 */
export async function createProduct(
  accessToken: string,
  shopId: string,
  request: PublishRequest,
): Promise<ProductLink> {
  const res = await ensureOk(
    await fetch(`${apiUrl()}/open-api/v1.0/products`, {
      method: 'POST',
      headers: shopHeaders(accessToken, shopId),
      body: JSON.stringify({
        type: 'design',
        productTemplateId: request.productId,
        regions: request.regions,
        colors: request.colors,
        sizes: request.sizes,
        name: request.name,
        description: request.description,
        profitMargin: request.profitMargin,
        publishOnCreate: request.publishOnCreate ?? true,
      }),
    }),
    'Create product',
  );
  const data = (await res.json()) as {
    productId?: string;
    customizationId?: string;
    images?: Array<{ url: string }>;
  };
  // The create response carries the rendered images but not the full offer; map
  // the essentials so the dashboard can show the new row immediately.
  const image = data.images?.[0];
  return {
    id: data.productId ?? '',
    title: request.name,
    description: request.description ?? '',
    price: '',
    thumbnail: image?.url ?? null,
    visible: request.publishOnCreate ?? true,
  };
}

/**
 * `PUT /open-api/v1.0/products/{id}/state` — flip a product's storefront
 * visibility. `PUBLIC` lists it; `HIDDEN` unlists it.
 */
export async function setProductState(
  accessToken: string,
  shopId: string,
  productId: string,
  visible: boolean,
): Promise<void> {
  await ensureOk(
    await fetch(`${apiUrl()}/open-api/v1.0/products/${encodeURIComponent(productId)}/state`, {
      method: 'PUT',
      headers: shopHeaders(accessToken, shopId),
      body: JSON.stringify({ state: visible ? 'PUBLIC' : 'HIDDEN' }),
    }),
    'Update product state',
  );
}

/** `DELETE /open-api/v1.0/products/{id}` — archive a product. */
export async function deleteProduct(
  accessToken: string,
  shopId: string,
  productId: string,
): Promise<void> {
  await ensureOk(
    await fetch(`${apiUrl()}/open-api/v1.0/products/${encodeURIComponent(productId)}`, {
      method: 'DELETE',
      headers: shopHeaders(accessToken, shopId),
    }),
    'Delete product',
  );
}
