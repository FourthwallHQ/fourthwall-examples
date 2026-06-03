/**
 * The Fourthwall Platform API client. This is the ONLY module that reads
 * `FOURTHWALL_APP_SECRET` (inside the OAuth token exchange).
 *
 * Mirrors the real Twitch gifting flow: the server mints a draw on each gift
 * purchase (delivered via the `GIFT_PURCHASE` webhook) and this app only reads
 * the gifting rules, finishes the draw with the picked winners, and manages its
 * webhook subscriptions — it never creates a giveaway. Kept thin so a contract
 * change is a one-file edit.
 */

/** The OAuth scopes this example requests. */
export const SCOPES = 'giveaway_write webhook_write offer_read';

export interface Product {
  /**
   * The offer id. This is what Create Giveaway wants as `offerId` — the
   * product/offer, NOT a variant (SKU) id. In the `/products` response the
   * product's own `id` is the offer id; `variants[].id` are SKU ids and are
   * rejected by the giveaway service ("Offer not found").
   */
  id: string;
  name: string;
}

export interface Shop {
  id: string;
  name?: string;
  domain?: string;
}

/** Derive the API host (`api.<base>`) from the configured Fourthwall instance. */
function apiUrl(): string {
  const base = process.env.NEXT_PUBLIC_FOURTHWALL_BASE_URL ?? 'fourthwall.com';
  return `https://api.${base}`;
}

async function ensureOk(res: Response, what: string): Promise<Response> {
  if (!res.ok) {
    throw new Error(`${what} failed (${res.status}): ${await res.text()}`);
  }
  return res;
}

/**
 * Exchange the OAuth `?code` for an access token. Reads the server-only client
 * secret; never returns it to the caller.
 */
export async function exchangeToken(
  code: string,
  redirectUri: string,
): Promise<{ accessToken: string; expiresIn: number }> {
  const appId = process.env.NEXT_PUBLIC_FOURTHWALL_APP_ID;
  const secret = process.env.FOURTHWALL_APP_SECRET;
  if (!appId) throw new Error('NEXT_PUBLIC_FOURTHWALL_APP_ID is not set');
  if (!secret) throw new Error('FOURTHWALL_APP_SECRET is not set');

  const body = new URLSearchParams({
    client_id: appId,
    client_secret: secret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
    scope: SCOPES,
    code,
  });

  const res = await ensureOk(
    await fetch(`${apiUrl()}/open-api/v1.0/platform/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    }),
    'Token exchange',
  );
  const data = (await res.json()) as { access_token: string; expires_in: number };
  return { accessToken: data.access_token, expiresIn: data.expires_in };
}

/** Resolve the connected shop (and its `shopId`). */
export async function getCurrentShop(accessToken: string): Promise<Shop> {
  const res = await ensureOk(
    await fetch(`${apiUrl()}/open-api/v1.0/shops/current`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
    'Get current shop',
  );
  return (await res.json()) as Shop;
}

interface RawProductsResponse {
  results?: Array<{ id: string; name: string }>;
}

/**
 * List the shop's products (offers) so the operator can pre-select the prize.
 * Each product's `id` is the offer id handed to Create Giveaway.
 */
export async function listProducts(accessToken: string): Promise<Product[]> {
  const res = await ensureOk(
    await fetch(`${apiUrl()}/open-api/v1.0/products`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
    'List products',
  );
  const data = (await res.json()) as RawProductsResponse;
  return (data.results ?? []).map((p) => ({ id: p.id, name: p.name }));
}

/** Who pays shipping on the won gift (mirrors the Twitch gifting settings). */
export type ShippingPolicy =
  | { type: 'ALL_WINNER' }
  | { type: 'ALL_CREATOR' }
  | { type: 'MAX_CREATOR'; max: number };

/** Which products are giftable. `SELECTED`/`EXCLUDED` carry offer ids (product ids). */
export type ProductsPolicy =
  | { type: 'ALL' }
  | { type: 'SELECTED'; offerIds: string[] }
  | { type: 'EXCLUDED'; offerIds: string[] };

/** The shop's gifting rules, as the public `/gifting/config` surface exposes them. */
export interface GiftingConfig {
  enabled: boolean;
  /** Entry window in seconds; validated 20–180 server-side. */
  entryTimeLimitSeconds: number;
  shipping: ShippingPolicy;
  products: ProductsPolicy;
  /**
   * Read-only. The platform owning the shop's single gifting slot —
   * `TWITCH`/`STREAMELEMENTS` means another integration owns it and the write
   * would be blocked; an Open API app operates on `OPEN_API`.
   */
  platform: 'TWITCH' | 'STREAMELEMENTS' | 'OPEN_API' | 'NOT_SELECTED';
}

/** The four creator-controlled fields the write path accepts (no `platform`). */
export type GiftingConfigUpdate = Omit<GiftingConfig, 'platform'>;

/** Read the shop's gifting rules so the settings page renders saved values. */
export async function getGiftingConfig(accessToken: string): Promise<GiftingConfig> {
  const res = await ensureOk(
    await fetch(`${apiUrl()}/open-api/v1.0/gifting/config`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
    'Get gifting config',
  );
  return (await res.json()) as GiftingConfig;
}

/**
 * Write the gifting rules. Operates on the shop's OPEN_API slot (the server keeps
 * the one-platform-per-shop mutex) and applies the same 20–180s / policy
 * validation the Twitch settings UI enforces. Requires `giveaway_write`.
 */
export async function updateGiftingConfig(
  accessToken: string,
  config: GiftingConfigUpdate,
): Promise<GiftingConfig> {
  const res = await ensureOk(
    await fetch(`${apiUrl()}/open-api/v1.0/gifting/config`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    }),
    'Update gifting config',
  );
  return (await res.json()) as GiftingConfig;
}

/**
 * The shop's live streaming status, as the public `/streaming` surface exposes it.
 *
 * The gift offer only appears on the storefront *while the shop is live* — the
 * checkout's giveaway gate calls `isStreamLive`. For an `OPEN_API` gifting app
 * that gate reads the `TWITCH` carrier's online flag, so this is the lever that
 * makes a gift purchasable.
 *
 * In a real integration the creator's streaming platform (Twitch EventSub, etc.)
 * drives this and the gifting app never touches it. This example exposes a manual
 * toggle purely so the gift-while-live flow is exercisable without a live stream.
 */
export interface StreamingStatus {
  live: boolean;
}

interface RawStreamingStatus {
  services?: Array<{ status?: 'ONLINE' | 'OFFLINE' }>;
}

/** Read whether the shop is currently live. Requires `giveaway_write` (GIFTING). */
export async function getStreamingStatus(accessToken: string): Promise<StreamingStatus> {
  const res = await ensureOk(
    await fetch(`${apiUrl()}/open-api/v1.0/streaming`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
    'Get streaming status',
  );
  const data = (await res.json()) as RawStreamingStatus;
  return { live: (data.services ?? []).some((s) => s.status === 'ONLINE') };
}

/**
 * Mark the shop live so the gift offer becomes purchasable. Sets the `TWITCH`
 * carrier online — the flag the `OPEN_API` live-gate reads. Broadcaster fields are
 * placeholders; the gate only checks the online status. Requires `giveaway_write`.
 */
export async function startStreaming(accessToken: string): Promise<void> {
  await ensureOk(
    await fetch(`${apiUrl()}/open-api/v1.0/streaming/start`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        services: [
          {
            type: 'TWITCH',
            broadcasterId: 'gifting-example',
            broadcasterLogin: 'gifting-example',
            thumbnailUrl: null,
          },
        ],
      }),
    }),
    'Start streaming',
  );
}

/** Mark the shop offline again. Requires `giveaway_write` (GIFTING). */
export async function endStreaming(accessToken: string): Promise<void> {
  await ensureOk(
    await fetch(`${apiUrl()}/open-api/v1.0/streaming/end`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ services: ['TWITCH'] }),
    }),
    'End streaming',
  );
}

/**
 * Register a purchase-webhook subscription pointed at this app. Returns the
 * subscription `id` (kept so we can delete it on disconnect). Inbound events are
 * verified with the app's HMAC key (see `lib/hmac.ts`), not a per-subscription
 * secret. Requires `webhook_write`.
 */
export async function createWebhook(
  accessToken: string,
  url: string,
  types: string[],
): Promise<{ id: string }> {
  const res = await ensureOk(
    await fetch(`${apiUrl()}/open-api/v1.0/webhooks`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      // Order's create payload field is `allowedTypes` (a misnamed `types` is
      // silently ignored → a subscription wired to nothing that never delivers).
      body: JSON.stringify({ url, allowedTypes: types }),
    }),
    'Create webhook',
  );
  const data = (await res.json()) as { id: string };
  return { id: data.id };
}

/** Remove a registered subscription (used on disconnect). Requires `webhook_write`. */
export async function deleteWebhook(accessToken: string, id: string): Promise<void> {
  await ensureOk(
    await fetch(`${apiUrl()}/open-api/v1.0/webhooks/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
    'Delete webhook',
  );
}
