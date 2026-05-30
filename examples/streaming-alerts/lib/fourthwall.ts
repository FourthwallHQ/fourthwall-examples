/**
 * The Fourthwall Platform API client.
 *
 * Four calls, in the order the connect flow uses them:
 *   1. exchangeToken   — OAuth code → access token (reads the app secret)
 *   2. getCurrentShop  — access token → shopId
 *   3. createWebhook   — register a subscription, get its signing secret
 *   4. deleteWebhook   — tear a subscription down on disconnect
 *
 * This is the only module that touches FOURTHWALL_APP_SECRET (passed in by the
 * /api/oauth route). The webhook signing secret is NOT a secret we hold ahead of
 * time — it comes back from createWebhook and is stashed in the in-memory store.
 */

const API_PREFIX = "open-api/v1.0";

/** Derive the API host from the configured Fourthwall base, e.g. api.fourthwall.com. */
export function apiUrlFromBase(fourthwallBaseUrl: string): string {
  return `https://api.${fourthwallBaseUrl}`;
}

export interface TokenResult {
  accessToken: string;
  expiresIn: number;
}

/** Step 1 — exchange the OAuth authorization code for an access token. */
export async function exchangeToken(props: {
  appId: string;
  clientSecret: string;
  redirectUri: string;
  apiUrl: string;
  code: string;
}): Promise<TokenResult> {
  const { appId, clientSecret, redirectUri, apiUrl, code } = props;

  const form = new URLSearchParams({
    client_id: appId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
    scope: "webhook_write",
    code,
  });

  const response = await fetch(`${apiUrl}/${API_PREFIX}/platform/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed (${response.status}): ${await response.text()}`);
  }

  const data = await response.json();
  return { accessToken: data.access_token, expiresIn: data.expires_in };
}

export interface Shop {
  id: string;
  name?: string;
  domain?: string;
}

/** Step 2 — resolve the connected shop from the access token. */
export async function getCurrentShop(props: {
  apiUrl: string;
  accessToken: string;
}): Promise<Shop> {
  const response = await fetch(`${props.apiUrl}/${API_PREFIX}/shops/current`, {
    headers: { Authorization: `Bearer ${props.accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`shops/current failed (${response.status}): ${await response.text()}`);
  }

  return response.json();
}

export interface Webhook {
  id: string;
  url: string;
  secret: string;
}

/**
 * Step 3 — register a webhook subscription pointed at this app's /api/webhooks.
 * The response carries the per-subscription signing `secret` the receiver
 * HMAC-verifies against. Requires the `webhook_write` scope.
 */
export async function createWebhook(props: {
  apiUrl: string;
  accessToken: string;
  url: string;
  types: string[];
}): Promise<Webhook> {
  const response = await fetch(`${props.apiUrl}/${API_PREFIX}/webhooks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${props.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url: props.url, types: props.types }),
  });

  if (!response.ok) {
    throw new Error(`create webhook failed (${response.status}): ${await response.text()}`);
  }

  return response.json();
}

/** Step 4 — remove a registered webhook subscription on disconnect. */
export async function deleteWebhook(props: {
  apiUrl: string;
  accessToken: string;
  id: string;
}): Promise<void> {
  const response = await fetch(`${props.apiUrl}/${API_PREFIX}/webhooks/${props.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${props.accessToken}` },
  });

  // 404 means it's already gone — treat that as success (idempotent teardown).
  if (!response.ok && response.status !== 404) {
    throw new Error(`delete webhook failed (${response.status}): ${await response.text()}`);
  }
}
