import { NextResponse } from 'next/server';
import { createWebhook, deleteWebhook, exchangeToken, getCurrentShop } from '@/lib/fourthwall';
import { idleDraw } from '@/lib/draw';
import { getConnection, setConnection } from '@/lib/store';

export const dynamic = 'force-dynamic';

// GIFT_PURCHASE is the purchase trigger that opens a draw; PLATFORM_APP_DISCONNECTED
// rides the same receiver so the app learns when the creator uninstalls (and forgets
// their row). Both are handled in `app/api/webhooks/route.ts`.
const WEBHOOK_TYPES = ['GIFT_PURCHASE', 'PLATFORM_APP_DISCONNECTED'];

/**
 * GET /api/oauth — the install callback.
 *
 * In an embed-first app, this runs once when the creator installs the platform
 * app (Fourthwall redirects here with ?code). We exchange the code for a token,
 * resolve the shop, pull the product list (for prize selection), tear down any
 * webhooks a prior install left, register the purchase + disconnect webhooks, and
 * store the connection in memory — then hand the browser to /installed. After
 * this the creator manages the app from Fourthwall's embedded settings page;
 * there is no in-app connect button. On success we hand the creator back to the
 * app's page in the Fourthwall dashboard (`/admin/dashboard/apps/<appId>`, the
 * same place every platform app returns to); on failure we redirect to
 * /installed?error=… rather than dumping a stack trace at the operator.
 */
export async function GET(request: Request): Promise<Response> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const appId = process.env.NEXT_PUBLIC_FOURTHWALL_APP_ID;
  const fourthwallBaseUrl = process.env.NEXT_PUBLIC_FOURTHWALL_BASE_URL;
  const doneUrl = new URL('/installed', baseUrl ?? request.url);

  function fail(reason: string): Response {
    console.error(`[oauth] ${reason}`);
    doneUrl.searchParams.set('error', reason);
    return NextResponse.redirect(doneUrl, 302);
  }

  if (!baseUrl) return fail('missing_base_url');

  const code = new URL(request.url).searchParams.get('code');
  if (!code) return fail('missing_code');

  try {
    const { accessToken } = await exchangeToken(code, `${baseUrl}/oauth`);
    const shop = await getCurrentShop(accessToken);

    // Best-effort teardown of a previous install's subscriptions so a re-install
    // doesn't leave duplicates delivering to the same receiver.
    const previous = getConnection(shop.id);
    if (previous) {
      await Promise.all(
        previous.webhookIds.map((id) =>
          deleteWebhook(accessToken, id).catch((error) =>
            console.error(`[oauth] failed to delete stale webhook ${id}:`, error),
          ),
        ),
      );
    }

    // Register the receivers. Best-effort: if registration fails the install still
    // succeeds — the creator just won't get draws until it's re-registered.
    const webhookIds: string[] = [];
    try {
      const webhook = await createWebhook(
        accessToken,
        `${baseUrl}/api/webhooks?shopId=${encodeURIComponent(shop.id)}`,
        WEBHOOK_TYPES,
      );
      webhookIds.push(webhook.id);
    } catch (error) {
      console.warn('Webhook registration failed (no gift-purchase draws until re-registered).', error);
    }

    setConnection({
      shopId: shop.id,
      domain: shop.domain,
      accessToken,
      webhookIds,
      draw: idleDraw(),
    });

    // Hand the creator back to Fourthwall — the app's page in the dashboard,
    // where the embedded settings now live. `shop.domain` is the shop slug
    // (e.g. "jieren-shop"); the admin dashboard lives at <slug>.<fourthwall-base>,
    // so build the host from it (passing a full custom domain through unchanged).
    // Fall back to our own /installed confirmation only if we can't resolve it.
    if (shop.domain && appId && fourthwallBaseUrl) {
      const host = shop.domain.includes('.')
        ? shop.domain
        : `${shop.domain}.${fourthwallBaseUrl}`;
      return NextResponse.redirect(`https://${host}/admin/dashboard/apps/${appId}`, 302);
    }
    return NextResponse.redirect(doneUrl, 302);
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'install_failed');
  }
}
