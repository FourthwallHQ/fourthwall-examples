/**
 * Embedded-settings request auth — the server gate every settings API route
 * shares.
 *
 * Fourthwall loads this app's settings page (and the calls it makes) carrying
 * `shop_id`, `hmac`, and `timestamp` query params signed with the shared app
 * secret. `getVerifiedShopId` pulls those three out of a request, HMAC-verifies
 * them, and hands back the trusted `shopId` — or a ready-to-return error
 * Response. There is no other login: the signature *is* the auth.
 */

import { NextRequest } from "next/server";
import { verifyEmbeddedSettings } from "./hmac";

type Verified = { shopId: string } | { response: Response };

export function getVerifiedShopId(request: NextRequest): Verified {
  const shopId = request.nextUrl.searchParams.get("shop_id");
  const hmac = request.nextUrl.searchParams.get("hmac");
  const timestamp = request.nextUrl.searchParams.get("timestamp");

  const appId = process.env.NEXT_PUBLIC_FOURTHWALL_APP_ID;
  const secret = process.env.FOURTHWALL_APP_HMAC_SECRET;

  if (!appId || !secret) {
    return {
      response: Response.json(
        { error: "server_not_configured" },
        { status: 500 },
      ),
    };
  }

  if (!shopId || !hmac || !timestamp) {
    return {
      response: Response.json(
        { error: "missing_embedded_settings_auth" },
        { status: 400 },
      ),
    };
  }

  if (!verifyEmbeddedSettings({ shopId, appId, timestamp, hmac, secret })) {
    return {
      response: Response.json({ error: "invalid_signature" }, { status: 401 }),
    };
  }

  return { shopId };
}
