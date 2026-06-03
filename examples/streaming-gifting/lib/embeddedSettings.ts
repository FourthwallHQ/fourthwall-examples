/**
 * Embedded-settings request auth — the server gate every operator API route
 * shares.
 *
 * Fourthwall loads this app's settings page (and the calls it makes) carrying
 * `shop_id`, `hmac`, and `timestamp` query params signed with the app HMAC key.
 * `getVerifiedShopId` pulls those three out of a request, HMAC-verifies them,
 * and hands back the trusted `shopId` — or a ready-to-return error Response.
 * There is no other login: the signature *is* the auth.
 *
 * The public surfaces don't go through this gate: webhook delivery has its own
 * signature (`verifySignature`), the mock chat and winner `/redeem` page are the
 * deliberately-open viewer-facing seams, and the draw SSE stream is read-only,
 * keyed by `shopId`.
 */
import { verifyEmbeddedSettings } from './hmac';

/** The signed params an embedded settings page was loaded with. */
export interface EmbeddedAuth {
  shopId: string;
  hmac: string;
  timestamp: string;
}

type Verified = { shopId: string } | { response: Response };

export function getVerifiedShopId(request: Request): Verified {
  const params = new URL(request.url).searchParams;
  const shopId = params.get('shop_id');
  const hmac = params.get('hmac');
  const timestamp = params.get('timestamp');

  const appId = process.env.NEXT_PUBLIC_FOURTHWALL_APP_ID;
  const secret = process.env.FOURTHWALL_APP_HMAC_KEY;

  if (!appId || !secret) {
    return { response: Response.json({ error: 'server_not_configured' }, { status: 500 }) };
  }

  if (!shopId || !hmac || !timestamp) {
    return {
      response: Response.json({ error: 'missing_embedded_settings_auth' }, { status: 400 }),
    };
  }

  if (!verifyEmbeddedSettings({ shopId, appId, timestamp, hmac, secret })) {
    return { response: Response.json({ error: 'invalid_signature' }, { status: 401 }) };
  }

  return { shopId };
}
