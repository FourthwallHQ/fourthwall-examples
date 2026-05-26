import { getConnection } from '@/lib/store';
import { getDraw, openDraw } from '@/lib/draw';

export const dynamic = 'force-dynamic';

/**
 * Manually open a draw from the control page (the operator alternative to the
 * Nth-purchase trigger): Create Giveaway for the pre-selected offer and start an
 * entry window. No-op (returns the current draw) if a draw is already open or no
 * prize is selected yet.
 */
export async function POST(request: Request) {
  const shopId = new URL(request.url).searchParams.get('shopId');
  if (!shopId || !getConnection(shopId)) {
    return Response.json({ error: 'Shop is not connected' }, { status: 404 });
  }

  try {
    const draw = await openDraw(shopId);
    return Response.json({
      status: draw.status,
      giveawayId: draw.giveawayId,
      entrants: draw.entrants.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to open draw';
    // No prize selected yet → a no-op, not an error: return the current draw.
    if (message === 'No prize selected') {
      const draw = getDraw(shopId);
      return Response.json({
        status: draw.status,
        giveawayId: draw.giveawayId,
        entrants: draw.entrants.length,
      });
    }
    return Response.json({ error: message }, { status: 502 });
  }
}
