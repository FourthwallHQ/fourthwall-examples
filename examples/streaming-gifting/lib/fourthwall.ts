/**
 * The Fourthwall Platform API client. This is the ONLY module that reads
 * `FOURTHWALL_APP_SECRET` (inside the OAuth token exchange).
 *
 * The Create / Finish Giveaway endpoints are beta and subject to change — the
 * client is kept deliberately thin so a contract change is a one-file edit.
 */

/** The OAuth scopes this example requests. */
export const SCOPES = 'giveaway_write webhook_write offer_read';

export interface ProductVariant {
  /** The `offerId` a winner redeems. */
  id: string;
  name?: string;
}

export interface Product {
  id: string;
  name: string;
  variants: ProductVariant[];
}

export interface Shop {
  id: string;
  name?: string;
  domain?: string;
}

/** A single giveaway entrant, on the Twitch participant carrier. */
export interface FinishParticipant {
  userId: string;
  userName: string;
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
  results?: Array<{ id: string; name: string; variants?: Array<{ id: string; name?: string }> }>;
}

/** List the shop's products so the operator can pre-select the prize offer. */
export async function listProducts(accessToken: string): Promise<Product[]> {
  const res = await ensureOk(
    await fetch(`${apiUrl()}/open-api/v1.0/products`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
    'List products',
  );
  const data = (await res.json()) as RawProductsResponse;
  return (data.results ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    variants: (p.variants ?? []).map((v) => ({ id: v.id, name: v.name })),
  }));
}

/**
 * Create a giveaway for the pre-selected offer. Returns the `giveawayId` the
 * draw tracks. Beta endpoint; requires `giveaway_write`.
 */
export async function createGiveaway(
  accessToken: string,
  offerId: string,
  quantity = 1,
): Promise<{ id: string }> {
  const res = await ensureOk(
    await fetch(`${apiUrl()}/open-api/v1.0/giveaways/giveaways`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerId, quantity }),
    }),
    'Create giveaway',
  );
  const data = (await res.json()) as { id: string };
  return { id: data.id };
}

/**
 * Finish a giveaway with ONLY the winner in `participants` (an empty array
 * returns the prize to the shop). Fourthwall validates the participant and
 * returns the `redeemUrl`. Beta; requires `giveaway_write`.
 */
export async function finishGiveaway(
  accessToken: string,
  giveawayId: string,
  participants: FinishParticipant[],
): Promise<{ redeemUrl?: string }> {
  const res = await ensureOk(
    await fetch(
      `${apiUrl()}/open-api/v1.0/giveaways/giveaways/${encodeURIComponent(giveawayId)}/finish/twitch`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ participants }),
      },
    ),
    'Finish giveaway',
  );
  const data = (await res.json().catch(() => ({}))) as { redeemUrl?: string };
  return { redeemUrl: data.redeemUrl };
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
      body: JSON.stringify({ url, types }),
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
