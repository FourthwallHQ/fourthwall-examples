import { getConnection } from '@/lib/store';
import { getVerifiedShopId } from '@/lib/embeddedSettings';
import { finishDraw } from '@/lib/draw';

export const dynamic = 'force-dynamic';

/**
 * Manually close the entry window early: pick up to one winner per gift at random
 * and pair each with their gift's redemption link (an empty pool closes with no
 * winners). The auto-close timer does the same when the window elapses. The winner
 * reveal — with each `/gifts/{giftId}` link — is published over SSE.
 */
export async function POST(request: Request) {
  const verified = getVerifiedShopId(request);
  if ('response' in verified) return verified.response;

  const shopId = verified.shopId;
  if (!getConnection(shopId)) {
    return Response.json({ error: 'Shop is not connected' }, { status: 404 });
  }

  try {
    const draw = await finishDraw(shopId);
    return Response.json({ status: draw.status, winners: draw.winners });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to finish draw';
    return Response.json({ error: message }, { status: 502 });
  }
}
