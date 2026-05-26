/**
 * Webhook signature verification.
 *
 * Fourthwall signs each webhook delivery with the per-subscription secret
 * (returned by create-webhook). We recompute HMAC-SHA256 over the *raw* request
 * body and constant-time compare against the `X-Fourthwall-Hmac-Apps-SHA256`
 * header.
 *
 * Critical detail: verify against the raw bytes as received, BEFORE JSON-parsing.
 * Re-serializing parsed JSON would reorder/whitespace-shift the bytes and the
 * HMAC would never match.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

/** The header Fourthwall sends the hex HMAC-SHA256 digest in, lower-cased. */
export const SIGNATURE_HEADER = "x-fourthwall-hmac-apps-sha256";

/**
 * True iff `signature` matches HMAC-SHA256(rawBody, secret).
 *
 * The header is a hex digest. We compare constant-time to avoid leaking timing
 * information. A length mismatch (or missing header) is an immediate fail.
 */
export function verifySignature(
  rawBody: string,
  signature: string | null | undefined,
  secret: string,
): boolean {
  if (!signature || !secret) {
    return false;
  }

  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");

  const expectedBuf = Buffer.from(expected, "utf8");
  const providedBuf = Buffer.from(signature.trim(), "utf8");

  if (expectedBuf.length !== providedBuf.length) {
    return false;
  }
  return timingSafeEqual(expectedBuf, providedBuf);
}
