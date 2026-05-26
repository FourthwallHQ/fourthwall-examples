import { SIGNATURE_HEADER, verifySignature } from '@/lib/hmac';
import { allConnections, getConnection } from '@/lib/store';
import { recordPurchase } from '@/lib/draw';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Purchase trigger. Verifies the HMAC signature against the stored per-shop
 * secret (401 on mismatch), counts qualifying purchases (ORDER_PLACED /
 * GIFT_PURCHASE), and on every Nth opens a draw via Create Giveaway.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get(SIGNATURE_HEADER);
  const shopId = new URL(request.url).searchParams.get('shopId');

  // Resolve the connection from the registered ?shopId, falling back to the only
  // connected shop (the demo's single-shop happy path).
  const connections = allConnections();
  const connection =
    (shopId ? getConnection(shopId) : undefined) ??
    (connections.length === 1 ? connections[0] : undefined);

  if (!connection?.webhookSecret) {
    return Response.json({ error: 'Unknown or unverifiable shop' }, { status: 401 });
  }

  if (!verifySignature(rawBody, connection.webhookSecret, signature)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: { type?: string } = {};
  try {
    event = JSON.parse(rawBody) as { type?: string };
  } catch {
    // Non-JSON body — nothing to count.
  }

  if (event.type === 'ORDER_PLACED' || event.type === 'GIFT_PURCHASE') {
    await recordPurchase(connection.shopId);
  }

  return Response.json({ received: true });
}
