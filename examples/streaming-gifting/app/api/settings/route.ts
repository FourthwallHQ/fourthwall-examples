import { getConnection } from '@/lib/store';
import { idleDraw } from '@/lib/draw';
import { publish } from '@/lib/channel';
import type { Product } from '@/lib/fourthwall';

export const dynamic = 'force-dynamic';

interface SettingsBody {
  offerId?: string;
  threshold?: number;
}

/** Build a human-readable prize name for the selected offer (variant) id. */
function prizeNameFor(products: Product[], offerId: string): string {
  for (const product of products) {
    const variant = product.variants.find((v) => v.id === offerId);
    if (variant) {
      return variant.name && variant.name !== product.name
        ? `${product.name} — ${variant.name}`
        : product.name;
    }
  }
  return offerId;
}

/**
 * Pre-select the giveaway prize (the `offerId` winners redeem) and the trigger
 * threshold N. Persists onto the in-memory store.
 */
export async function POST(request: Request) {
  const shopId = new URL(request.url).searchParams.get('shopId');
  const connection = shopId ? getConnection(shopId) : undefined;
  if (!connection) {
    return Response.json({ error: 'Shop is not connected' }, { status: 404 });
  }

  const body = (await request.json()) as SettingsBody;
  if (typeof body.offerId === 'string' && body.offerId.length > 0) {
    connection.offerId = body.offerId;
    connection.prizeName = prizeNameFor(connection.products, body.offerId);
  }
  if (typeof body.threshold === 'number' && Number.isFinite(body.threshold)) {
    connection.threshold = Math.max(1, Math.floor(body.threshold));
  }

  // Reflect the chosen prize in the idle draw so the control panel and overlay
  // show it before a draw opens (don't disturb an open or finished draw).
  if (connection.draw.status === 'idle' && connection.offerId) {
    connection.draw = idleDraw(connection.offerId, connection.prizeName ?? connection.offerId);
    publish(connection.shopId, connection.draw);
  }

  return Response.json({ offerId: connection.offerId, threshold: connection.threshold });
}
