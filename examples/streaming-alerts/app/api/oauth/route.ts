import { NextResponse } from "next/server";
import {
  apiUrlFromBase,
  createWebhook,
  deleteWebhook,
  exchangeToken,
  getCurrentShop,
} from "@/lib/fourthwall";
import { getSettings, upsertSettings } from "@/lib/store";

// This route reads/writes the in-memory store and must never be cached.
export const dynamic = "force-dynamic";

// PLATFORM_APP_DISCONNECTED rides the same receiver: it's how the app learns the
// creator uninstalled it (and how we forget their row). The order/donation hooks
// are the actual alert triggers.
const ORDER_TYPE = "ORDER_PLACED";
const DONATION_TYPE = "DONATION";
const DISCONNECT_TYPE = "PLATFORM_APP_DISCONNECTED";

/**
 * GET /api/oauth — the install callback.
 *
 * In an embed-first app, this runs once when the creator installs the platform
 * app (Fourthwall redirects here with ?code). We:
 *   1. exchange the code for an access token (the one place we read the secret),
 *   2. resolve the shop,
 *   3. tear down any webhooks a prior install left (idempotent re-install),
 *   4. register ORDER_PLACED+PLATFORM_APP_DISCONNECTED and DONATION webhooks,
 *   5. upsert the shop's settings row (keeping the token only this long),
 * then hand the browser to /installed. After this the creator manages the app
 * from Fourthwall's embedded settings page — there is no in-app connect button.
 */
export async function GET(request: Request): Promise<Response> {
  const appId = process.env.NEXT_PUBLIC_FOURTHWALL_APP_ID;
  const clientSecret = process.env.FOURTHWALL_APP_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const fourthwallBaseUrl = process.env.NEXT_PUBLIC_FOURTHWALL_BASE_URL;

  const doneUrl = new URL("/installed", baseUrl ?? request.url);

  function fail(reason: string): Response {
    console.error(`[oauth] ${reason}`);
    doneUrl.searchParams.set("error", reason);
    return NextResponse.redirect(doneUrl);
  }

  if (!appId) return fail("missing_app_id");
  if (!clientSecret) return fail("missing_app_secret");
  if (!baseUrl) return fail("missing_base_url");
  if (!fourthwallBaseUrl) return fail("missing_fourthwall_base_url");

  const code = new URL(request.url).searchParams.get("code");
  if (!code) return fail("missing_code");

  const apiUrl = apiUrlFromBase(fourthwallBaseUrl);

  try {
    // 1. Code → access token (the only place the app secret is read).
    const { accessToken } = await exchangeToken({
      appId,
      clientSecret,
      redirectUri: `${baseUrl}/oauth`,
      apiUrl,
      code,
    });

    // 2. Access token → shopId.
    const shop = await getCurrentShop({ apiUrl, accessToken });

    // 3. Best-effort teardown of a previous install's subscriptions so a
    //    re-install doesn't leave duplicates delivering to the same receiver.
    const previous = getSettings(shop.id);
    if (previous) {
      await Promise.all(
        previous.webhookIds.map((id) =>
          deleteWebhook({ apiUrl, accessToken, id }).catch((error) => {
            console.error(`[oauth] failed to delete stale webhook ${id}:`, error);
          }),
        ),
      );
    }

    // 4. Register the receivers. Both creates return the same per-shop signing
    //    secret; we keep the first and collect both ids for clean teardown.
    const webhookUrl = `${baseUrl}/api/webhooks`;
    const [orderHook, donationHook] = await Promise.all([
      createWebhook({ apiUrl, accessToken, url: webhookUrl, types: [ORDER_TYPE, DISCONNECT_TYPE] }),
      createWebhook({ apiUrl, accessToken, url: webhookUrl, types: [DONATION_TYPE] }),
    ]);

    // 5. Persist the row. The token is intentionally NOT stored — it has done
    //    its job (registering the webhooks) and the embedded settings page
    //    re-proves identity by HMAC, not by holding a token.
    upsertSettings({
      shopId: shop.id,
      webhookSecret: orderHook.secret || donationHook.secret,
      webhookIds: [orderHook.id, donationHook.id],
    });

    return NextResponse.redirect(doneUrl);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "install_failed");
  }
}
