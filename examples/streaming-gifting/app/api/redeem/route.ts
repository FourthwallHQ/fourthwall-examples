import { firstConnection, getConnection } from '@/lib/store';

export const dynamic = 'force-dynamic';

/**
 * Mock winner-auth redemption. In the real flow the winner proves who they are by
 * logging in with Twitch (`/redeem` → `giveaway/winner/authorize`) before their
 * gift is revealed; here the "login" is just typing your chat name. If it matches
 * a stored winner of the current draw, we hand back that winner's gift redemption
 * link — so the `gft_` links stay private and only the picked winners can claim.
 *
 * Public surface — no embedded-settings signature (it's winner-facing, like the
 * mock chat). The fake OAuth is the deliberately-swappable seam: a real build
 * replaces the name check with the Twitch winner authorization.
 */
export async function POST(request: Request) {
  const { shopId, userName } = (await request.json().catch(() => ({}))) as {
    shopId?: string;
    userName?: string;
  };

  const name = (userName ?? '').trim();
  if (!name) {
    return Response.json({ error: 'Enter your chat name.' }, { status: 400 });
  }

  const connection = (shopId ? getConnection(shopId) : undefined) ?? firstConnection();
  if (!connection) {
    return Response.json({ error: 'No shop connected.' }, { status: 404 });
  }

  const draw = connection.draw;
  const winner =
    draw.status === 'finished'
      ? draw.winners.find((w) => w.userName.toLowerCase() === name.toLowerCase())
      : undefined;

  if (!winner) {
    // Don't leak who won or whether a draw is live — just "not you".
    return Response.json({ won: false });
  }

  return Response.json({ won: true, offerName: draw.offerName, redeemUrl: winner.redeemUrl });
}
