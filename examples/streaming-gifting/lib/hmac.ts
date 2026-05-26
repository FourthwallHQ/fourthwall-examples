/**
 * Webhook signature verification. HMAC-SHA256 over the raw request body with the
 * stored per-shop secret, constant-time compared against the signature header.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

/** The header Fourthwall sends the request signature in (compared case-insensitively). */
export const SIGNATURE_HEADER = 'X-Fourthwall-Hmac-Apps-SHA256';

export function verifySignature(
  rawBody: string,
  secret: string,
  signature: string | null | undefined,
): boolean {
  if (!signature || !secret) return false;
  const digest = createHmac('sha256', secret).update(rawBody, 'utf8').digest();
  // Accept either the base64 or hex encoding of the digest (confirm the exact
  // form against the Fourthwall signature docs when wiring a real shop).
  return (
    safeEqual(digest.toString('base64'), signature) ||
    safeEqual(digest.toString('hex'), signature)
  );
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
