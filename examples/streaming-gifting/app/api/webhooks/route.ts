import { SIGNATURE_HEADER, verifySignature } from '@/lib/hmac';
import { allConnections, getConnection, removeConnection } from '@/lib/store';
import { DEFAULT_ENTRY_SECONDS, openDrawFromPurchase } from '@/lib/draw';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** The `GIFT_PURCHASE` payload (`WebhookModel.data`), trimmed to what we use. */
interface GiftPurchaseV1 {
  id: string; // the gift-purchase id
  offer?: { name?: string };
  quantity?: number;
  username?: string; // supporter who funded the gift
  /** One entry per minted gift; each `id` is a `gft_…` we redeem at `/gifts/{id}`. */
  gifts?: Array<{ id: string }>;
}

/**
 * Webhook receiver. Verifies the HMAC signature against the app's HMAC key (401 on
 * mismatch), then: on `GIFT_PURCHASE` opens an entry-collection window for the
 * server-minted draw; on `PLATFORM_APP_DISCONNECTED` forgets the shop. The body is
 * a `WebhookModel` envelope — `{ type, data, version }`.
 */
export async function POST(request: Request) {
  const appHmacKey = process.env.FOURTHWALL_APP_HMAC_KEY;
  if (!appHmacKey) {
    return Response.json({ error: 'FOURTHWALL_APP_HMAC_KEY is not set' }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get(SIGNATURE_HEADER);

  // The signature is keyed on the app's single HMAC key — verify before anything else.
  if (!verifySignature(rawBody, appHmacKey, signature)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Resolve the connection from the registered ?shopId, falling back to the only
  // connected shop (the demo's single-shop happy path).
  const shopId = new URL(request.url).searchParams.get('shopId');
  const connections = allConnections();
  const connection =
    (shopId ? getConnection(shopId) : undefined) ??
    (connections.length === 1 ? connections[0] : undefined);

  if (!connection) {
    return Response.json({ error: 'Unknown shop' }, { status: 404 });
  }

  let event: { type?: string; data?: GiftPurchaseV1 } = {};
  try {
    event = JSON.parse(rawBody) as { type?: string; data?: GiftPurchaseV1 };
  } catch {
    // Non-JSON body — nothing to do.
  }

  if (event.type === 'GIFT_PURCHASE' && event.data) {
    const purchase = event.data;
    const giftIds = (purchase.gifts ?? []).map((gift) => gift.id).filter(Boolean);
    await openDrawFromPurchase(connection.shopId, {
      giftIds,
      offerName: purchase.offer?.name ?? 'a prize',
      quantity: purchase.quantity ?? giftIds.length ?? 1,
      supporterName: purchase.username,
      durationSeconds: connection.entryTimeLimitSeconds ?? DEFAULT_ENTRY_SECONDS,
    });
  } else if (event.type === 'PLATFORM_APP_DISCONNECTED') {
    // The creator uninstalled the app — forget the shop (and its open draw timer).
    removeConnection(connection.shopId);
  }

  return Response.json({ received: true });
}
