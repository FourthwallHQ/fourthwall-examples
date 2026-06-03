/**
 * HMAC — two independent signatures, both keyed on the Platform App's single
 * HMAC key (one fixed value per app, NOT a per-shop or per-subscription secret).
 *
 * 1. WEBHOOK delivery (`verifySignature`). Fourthwall signs each webhook POST;
 *    we recompute HMAC-SHA256 over the *raw* body, Base64-encoded, and
 *    constant-time compare against the `X-Fourthwall-Hmac-Apps-SHA256` header.
 *    Verify the raw bytes as received, BEFORE JSON-parsing — re-serializing
 *    parsed JSON shifts bytes and the HMAC would never match.
 *
 * 2. EMBEDDED SETTINGS (`verifyEmbeddedSettings`). When Fourthwall iframes this
 *    app's settings page inside the creator dashboard, it appends signed query
 *    params (`shop_id`, `hmac`, `timestamp`) so we can trust *which shop* is
 *    viewing without a separate login. We recompute HMAC-SHA512 over a fixed
 *    canonical string and Base64-compare against the `hmac` param. This is the
 *    only thing that authenticates the embedded surface.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

/** The header Fourthwall sends the request signature in (compared case-insensitively). */
export const SIGNATURE_HEADER = 'X-Fourthwall-Hmac-Apps-SHA256';

/** True iff `signature` matches Base64 HMAC-SHA256(rawBody, appHmacKey). Webhook delivery. */
export function verifySignature(
  rawBody: string,
  appHmacKey: string,
  signature: string | null | undefined,
): boolean {
  if (!signature || !appHmacKey) return false;
  const digest = createHmac('sha256', appHmacKey).update(rawBody, 'utf8').digest('base64');
  return safeEqual(digest, signature);
}

/**
 * The canonical string Fourthwall signs for the embedded-settings handoff. The
 * field order is fixed and must match exactly on both sides.
 */
function embeddedSettingsPayload(params: {
  timestamp: string;
  shopId: string;
  appId: string;
}): string {
  return `timestamp=${params.timestamp}&shop_id=${params.shopId}&app_id=${params.appId}`;
}

/**
 * True iff `hmac` matches HMAC-SHA512 of the canonical embedded-settings string
 * with the app HMAC key. Authenticates an iframe load of the settings page and
 * every signed API call the settings UI then makes. Fourthwall sends the digest
 * Base64-encoded, so we compare Base64, not hex.
 */
export function verifyEmbeddedSettings(params: {
  shopId: string;
  appId: string;
  timestamp: string;
  hmac: string | null | undefined;
  secret: string;
}): boolean {
  if (!params.hmac || !params.secret) return false;
  const expected = createHmac('sha512', params.secret)
    .update(embeddedSettingsPayload(params), 'utf8')
    .digest('base64');
  return safeEqual(expected, params.hmac);
}

/**
 * Sign the canonical embedded-settings string ourselves, Base64-encoded to match
 * Fourthwall. Used ONLY by the dev-only signed-URL helper so the settings page is
 * reachable on localhost — in production Fourthwall is the signer.
 */
export function signEmbeddedSettings(params: {
  shopId: string;
  appId: string;
  timestamp: string;
  secret: string;
}): string {
  return createHmac('sha512', params.secret)
    .update(embeddedSettingsPayload(params), 'utf8')
    .digest('base64');
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
