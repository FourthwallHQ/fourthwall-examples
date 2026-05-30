/**
 * HMAC verification — two independent signatures, two distinct purposes.
 *
 * 1. WEBHOOK delivery (`verifyWebhookSignature`). Fourthwall signs each webhook
 *    POST with the per-subscription secret returned by create-webhook. We
 *    recompute HMAC-SHA256 over the *raw* request body and constant-time compare
 *    against the `X-Fourthwall-Hmac-Apps-SHA256` header. Verify the raw bytes as
 *    received, BEFORE JSON-parsing — re-serializing parsed JSON shifts bytes and
 *    the HMAC would never match.
 *
 * 2. EMBEDDED SETTINGS (`verifyEmbeddedSettings`). When Fourthwall iframes this
 *    app's settings page inside the creator dashboard, it appends signed query
 *    params (`shop_id`, `hmac`, `timestamp`) so we can trust *which shop* is
 *    viewing without a separate login. We recompute HMAC-SHA512 over a fixed
 *    canonical string with the shared app secret and constant-time compare
 *    against the `hmac` param. This is the only thing that authenticates the
 *    embedded surface — there is no OAuth round-trip on the settings page.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

/** The header Fourthwall sends the hex HMAC-SHA256 webhook digest in, lower-cased. */
export const SIGNATURE_HEADER = "x-fourthwall-hmac-apps-sha256";

/** Constant-time compare of two same-encoding digest strings; length mismatch fails. */
function safeEqual(expected: string, provided: string | null | undefined): boolean {
  if (!provided) return false;
  const expectedBuf = Buffer.from(expected, "utf8");
  const providedBuf = Buffer.from(provided.trim(), "utf8");
  if (expectedBuf.length !== providedBuf.length) return false;
  return timingSafeEqual(expectedBuf, providedBuf);
}

/** True iff `signature` matches HMAC-SHA256(rawBody, secret). Webhook delivery. */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null | undefined,
  secret: string,
): boolean {
  if (!signature || !secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  return safeEqual(expected, signature);
}

/**
 * The canonical string Fourthwall signs for the embedded settings handoff. The
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
 * with the shared app secret. This authenticates an iframe load of the settings
 * page and every signed API call the settings UI then makes.
 *
 * Fourthwall sends the digest **Base64-encoded** (the order service does
 * `base64Encoder.encodeToString(hmacSha512(...))`), so we compare Base64, not hex.
 */
export function verifyEmbeddedSettings(params: {
  shopId: string;
  appId: string;
  timestamp: string;
  hmac: string | null | undefined;
  secret: string;
}): boolean {
  if (!params.hmac || !params.secret) return false;
  const expected = createHmac("sha512", params.secret)
    .update(embeddedSettingsPayload(params), "utf8")
    .digest("base64");
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
  return createHmac("sha512", params.secret)
    .update(embeddedSettingsPayload(params), "utf8")
    .digest("base64");
}
