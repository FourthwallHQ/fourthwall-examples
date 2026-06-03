import { addEntry, shopWithOpenDraw } from '@/lib/draw';

export const dynamic = 'force-dynamic';

interface ChatMessage {
  userId?: string;
  userName?: string;
  text?: string;
}

/**
 * The mock-chat ingress — the deliberately-swappable collection layer. While a
 * draw is open, an `!enter` message adds `(userId, userName)` to that draw's
 * deduped participant set (entering twice counts once). Messages with no open
 * draw are ignored.
 *
 * A real integration replaces this route with Twitch EventSub
 * `channel.chat.message`, a Discord reaction, or a web form — the Fourthwall
 * calls (Create / Finish Giveaway) stay unchanged.
 */
export async function POST(request: Request) {
  const message = (await request.json()) as ChatMessage;
  const { userId, userName, text } = message;

  if (!userId || !userName || typeof text !== 'string') {
    return Response.json({ error: 'userId, userName and text are required' }, { status: 400 });
  }

  const shopId = shopWithOpenDraw();
  // Exact, case-insensitive `!enter` — same match the real Twitch gifting bot uses.
  const isEnter = text.trim().toLowerCase() === '!enter';

  // No open draw, or not the `!enter` command → ignored.
  if (!shopId || !isEnter) {
    return Response.json({ entered: false, entrants: 0 });
  }

  const result = addEntry(shopId, { userId, userName });
  return Response.json(result);
}
