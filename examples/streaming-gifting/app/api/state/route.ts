import { getConnection } from '@/lib/store';

export const dynamic = 'force-dynamic';

/**
 * Bootstrap snapshot for the control page: the product list (for prize
 * selection), the current settings, and the current draw. Live draw updates
 * after this initial load arrive over `GET /api/events/:shopId` (SSE), which
 * carries only the `Draw`; this endpoint supplies the connection-level data the
 * operator cockpit needs to render.
 */
export async function GET(request: Request) {
  const shopId = new URL(request.url).searchParams.get('shopId');
  const connection = shopId ? getConnection(shopId) : undefined;
  if (!connection) {
    return Response.json({ connected: false });
  }

  return Response.json({
    connected: true,
    shopId: connection.shopId,
    domain: connection.domain,
    products: connection.products,
    offerId: connection.offerId,
    prizeName: connection.prizeName,
    threshold: connection.threshold,
    webhooksActive: Boolean(connection.webhookSecret),
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL ?? '',
    draw: connection.draw,
  });
}
