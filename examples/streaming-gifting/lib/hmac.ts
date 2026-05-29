/**
 * Webhook signature verification. HMAC-SHA256 over the raw request body with the
 * app's HMAC key, base64-encoded, constant-time compared against the signature
 * header. The key is your Platform App's HMAC key from the app settings page —
 * one fixed value per app, NOT a per-shop or per-subscription secret.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

/** The header Fourthwall sends the request signature in (compared case-insensitively). */
export const SIGNATURE_HEADER = 'X-Fourthwall-Hmac-Apps-SHA256';

export function verifySignature(
  rawBody: string,
  appHmacKey: string,
  signature: string | null | undefined,
): boolean {
  if (!signature || !appHmacKey) return false;
  const digest = createHmac('sha256', appHmacKey).update(rawBody, 'utf8').digest('base64');
  return safeEqual(digest, signature);
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
