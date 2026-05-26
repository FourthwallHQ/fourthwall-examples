import { getConnection } from '@/lib/store';
import { finishDraw } from '@/lib/draw';

export const dynamic = 'force-dynamic';

/**
 * Close the entry window and draw: pick one winner at random and Finish Giveaway
 * with a single-element participants array (empty if nobody entered → the prize
 * returns to the shop). Stores the returned `redeemUrl` and publishes the
 * winner-reveal state over SSE.
 */
export async function POST(request: Request) {
  const shopId = new URL(request.url).searchParams.get('shopId');
  if (!shopId || !getConnection(shopId)) {
    return Response.json({ error: 'Shop is not connected' }, { status: 404 });
  }

  try {
    const draw = await finishDraw(shopId);
    return Response.json({
      status: draw.status,
      winner: draw.winner ?? null,
      redeemUrl: draw.redeemUrl ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to finish draw';
    return Response.json({ error: message }, { status: 502 });
  }
}
