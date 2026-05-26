import { NextResponse } from 'next/server';
import {
  createWebhook,
  exchangeToken,
  getCurrentShop,
  listProducts,
} from '@/lib/fourthwall';
import { idleDraw } from '@/lib/draw';
import { setConnection } from '@/lib/store';

export const dynamic = 'force-dynamic';

/**
 * Connect glue. Exchanges `?code` for a token, resolves the shop, pulls the
 * product list (for prize selection), registers the purchase webhooks, and
 * stores the connection in memory, then 302-redirects the browser back to the
 * control page connected (`/?shopId=…`). On failure we redirect to `/?error=…`
 * rather than dumping a stack trace at the operator.
 */
export async function GET(request: Request): Promise<Response> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const homeUrl = new URL('/', baseUrl ?? request.url);

  function fail(reason: string): Response {
    console.error(`[oauth] ${reason}`);
    homeUrl.searchParams.set('error', reason);
    return NextResponse.redirect(homeUrl, 302);
  }

  if (!baseUrl) return fail('missing_base_url');

  const code = new URL(request.url).searchParams.get('code');
  if (!code) return fail('missing_code');

  try {
    const { accessToken } = await exchangeToken(code, `${baseUrl}/oauth`);
    const shop = await getCurrentShop(accessToken);
    const products = await listProducts(accessToken);

    // Register the purchase webhooks. Best-effort: on a localhost base URL (no
    // public tunnel) Fourthwall can't reach this app, so we don't fail the
    // connect — the operator can still drive draws manually + via mock chat.
    let webhookSecret: string | undefined;
    const webhookIds: string[] = [];
    try {
      const webhook = await createWebhook(
        accessToken,
        `${baseUrl}/api/webhooks?shopId=${encodeURIComponent(shop.id)}`,
        ['ORDER_PLACED', 'GIFT_PURCHASE'],
      );
      webhookSecret = webhook.secret;
      webhookIds.push(webhook.id);
    } catch (error) {
      console.warn(
        'Webhook registration skipped (purchase triggers disabled). ' +
          'Point NEXT_PUBLIC_BASE_URL at a public URL to receive purchase events.',
        error,
      );
    }

    setConnection({
      shopId: shop.id,
      domain: shop.domain,
      accessToken,
      webhookSecret,
      webhookIds,
      products,
      threshold: 5,
      purchaseCount: 0,
      draw: idleDraw(),
    });

    homeUrl.searchParams.set('shopId', shop.id);
    return NextResponse.redirect(homeUrl, 302);
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'connect_failed');
  }
}
