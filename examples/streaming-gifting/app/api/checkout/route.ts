import { firstConnection } from '@/lib/store';
import { createGiftingCheckout } from '@/lib/fourthwall';

export const dynamic = 'force-dynamic';

/**
 * POST /api/checkout — the checkout bridge the public /gift page hits.
 *
 * Accepts the URL-supplied `offerId`, forwards it verbatim to Fourthwall's
 * `POST /open-api/v1.0/gifting/checkout` on behalf of the (single) connected
 * shop, and returns the absolute `checkoutUrl` for the browser to redirect to.
 * This route is intentionally unauthenticated — it is the public gift page's
 * server-side bridge. The single-shop resolution (`firstConnection`) matches the
 * README's "in-memory, single-shop demo" contract; a multi-shop deployment would
 * add a shop-scoped route param instead.
 *
 * We deliberately don't mint gifts here — the platform mints them after payment
 * and fires `GIFT_PURCHASE`, which the existing webhook path routes into the
 * draw lifecycle. This call only creates the checkout.
 *
 * Upstream errors are collapsed to a generic 502; the operator sees the real
 * message in the server logs while supporters get a safe error to render.
 */
export async function POST(request: Request) {
  let body: { offerId?: unknown };
  try {
    body = (await request.json()) as { offerId?: unknown };
  } catch {
    return Response.json({ error: 'invalid_body' }, { status: 400 });
  }

  const offerId = typeof body.offerId === 'string' ? body.offerId.trim() : '';
  if (!offerId) {
    return Response.json({ error: 'missing_offer_id' }, { status: 400 });
  }

  const connection = firstConnection();
  if (!connection) {
    return Response.json({ error: 'shop_not_connected' }, { status: 503 });
  }

  try {
    const checkout = await createGiftingCheckout(connection.accessToken, { offerId });
    return Response.json({
      checkoutId: checkout.checkoutId,
      checkoutUrl: checkout.checkoutUrl,
    });
  } catch (error) {
    // Log the real reason for the operator; give the supporter a generic 502.
    console.error('createGiftingCheckout failed:', error);
    return Response.json({ error: 'checkout_failed' }, { status: 502 });
  }
}
