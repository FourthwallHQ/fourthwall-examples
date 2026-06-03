import { getConnection } from '@/lib/store';
import { getVerifiedShopId } from '@/lib/embeddedSettings';
import { getGiftingConfig, listProducts } from '@/lib/fourthwall';

export const dynamic = 'force-dynamic';

/**
 * Bootstrap snapshot for the embedded settings page: the product list (for the
 * giftable-products policy), the saved gifting config, and the current draw.
 * Authenticated by the signed embedded-settings params. Caches the entry-window
 * length on the connection so the webhook handler can size the window without a
 * round-trip. Live draw updates after this load arrive over `GET /api/events/:shopId`.
 */
export async function GET(request: Request) {
  const verified = getVerifiedShopId(request);
  if ('response' in verified) return verified.response;

  const connection = getConnection(verified.shopId);
  if (!connection) {
    return Response.json({ connected: false });
  }

  const base = {
    connected: true as const,
    shopId: connection.shopId,
    domain: connection.domain,
    webhooksActive: connection.webhookIds.length > 0,
    draw: connection.draw,
  };

  try {
    const [products, config] = await Promise.all([
      listProducts(connection.accessToken),
      getGiftingConfig(connection.accessToken),
    ]);
    connection.entryTimeLimitSeconds = config.entryTimeLimitSeconds;
    return Response.json({ ...base, products, config });
  } catch (error) {
    // Surface upstream failures (e.g. a scope 403 reading products/config) as a
    // clean JSON error the cockpit can render — never a 500 the client can't parse.
    const message = error instanceof Error ? error.message : 'Failed to load gifting config';
    return Response.json({ ...base, error: message });
  }
}
