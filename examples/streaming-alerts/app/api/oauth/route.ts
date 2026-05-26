import { NextResponse } from "next/server";
import {
  apiUrlFromBase,
  createWebhook,
  exchangeToken,
  getCurrentShop,
} from "@/lib/fourthwall";
import { setConnection } from "@/lib/store";

// This route reads/writes the in-memory store and must never be cached.
export const dynamic = "force-dynamic";

/**
 * GET /api/oauth — the server glue for connect.
 *
 * Fourthwall redirects the creator's browser to /oauth?code=…, which forwards
 * here. We:
 *   1. exchange the code for an access token (the one place we read the secret),
 *   2. resolve the shop,
 *   3. register the ORDER_PLACED + DONATION webhooks pointed at /api/webhooks,
 *   4. stash (shopId, accessToken, webhookSecret, webhookIds, showName=true),
 * then 302 the browser back to / in a connected state. On failure we redirect to
 * / with an ?error flag rather than dumping a stack trace at the creator.
 */
export async function GET(request: Request): Promise<Response> {
  const appId = process.env.NEXT_PUBLIC_FOURTHWALL_APP_ID;
  const clientSecret = process.env.FOURTHWALL_APP_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const fourthwallBaseUrl = process.env.NEXT_PUBLIC_FOURTHWALL_BASE_URL;

  const homeUrl = new URL("/", baseUrl ?? request.url);

  function fail(reason: string): Response {
    console.error(`[oauth] ${reason}`);
    homeUrl.searchParams.set("error", reason);
    return NextResponse.redirect(homeUrl);
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

    // 3. Register both webhooks at this app's receiver. Each create returns a
    //    signing secret; for a given shop they share one per-shop secret, so we
    //    keep the first and collect both ids for clean teardown on disconnect.
    const webhookUrl = `${baseUrl}/api/webhooks`;
    const [orderHook, donationHook] = await Promise.all([
      createWebhook({ apiUrl, accessToken, url: webhookUrl, types: ["ORDER_PLACED"] }),
      createWebhook({ apiUrl, accessToken, url: webhookUrl, types: ["DONATION"] }),
    ]);

    // 4. Stash everything later steps key off.
    setConnection({
      shopId: shop.id,
      accessToken,
      webhookSecret: orderHook.secret || donationHook.secret,
      webhookIds: [orderHook.id, donationHook.id],
      showName: true,
    });

    return NextResponse.redirect(homeUrl);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "connect_failed");
  }
}
