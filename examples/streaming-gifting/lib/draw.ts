/**
 * Draw orchestration — the integrator's half of the gifting flow, with a mock
 * chat standing in for live stream chat.
 *
 * The server mints the gifts when a supporter buys a gift offer and delivers them
 * on the `GIFT_PURCHASE` webhook — each gift carries a `gft_` id. This app opens a
 * short entry window, collects `!enter` from chat (deduped by user), and when the
 * window closes picks up to one winner per gift at random and hands each winner
 * their gift's **redemption link** (`/gifts/{giftId}` on the storefront) to claim.
 *
 * The integrator selects the winners itself and routes each to their redemption
 * page — it never calls finish-draw. Entry collection (mock chat → `addEntry`) is
 * the one surface a real integration swaps for live chat, Discord, or a web form.
 */
import { connectionWithOpenDraw, getConnection, type Connection } from './store';
import { publish } from './channel';

export interface Participant {
  userId: string;
  userName: string;
}

/** A picked winner, paired with the gift they get and where to redeem it. */
export interface Winner extends Participant {
  /** The gift id (`gft_…`) assigned to this winner, from the purchase payload. */
  giftId: string;
  /** The storefront redemption page for that gift — send the winner here. */
  redeemUrl: string;
}

export interface Draw {
  status: 'idle' | 'open' | 'finished';
  /** The gift ids (`gft_…`) from the `GIFT_PURCHASE` webhook — one per gift. */
  giftIds: string[];
  /** The gifted offer's display name. */
  offerName: string;
  /** Number of gifts purchased = the max number of winners. */
  quantity: number;
  /** Who funded the gift (for the chat announcement). */
  supporterName?: string;
  /** The deduped entry set. */
  entrants: Participant[];
  /** The picked winners (≤ gift count), each with their redemption link. */
  winners: Winner[];
  /** Epoch ms when the entry window auto-closes — drives the countdown. */
  endsAt?: number;
  /** The "!ENTER to win" chat announcement, shown when the draw opens. */
  announcement?: string;
}

/** Fallback entry window when the gifting config hasn't been read yet. */
export const DEFAULT_ENTRY_SECONDS = 60;

export function idleDraw(): Draw {
  return { status: 'idle', giftIds: [], offerName: '', quantity: 0, entrants: [], winners: [] };
}

export function getDraw(shopId: string): Draw {
  return getConnection(shopId)?.draw ?? idleDraw();
}

function clearTimer(connection: Connection): void {
  if (connection.timer) {
    clearTimeout(connection.timer);
    connection.timer = undefined;
  }
}

/**
 * The storefront redemption page for a gift. shop-renderer serves `/gifts/{id}`
 * (route `gifts#show`) at the shop's storefront domain (`<slug>.<base>`); sending
 * the winner there lets them pick a variant and check out the prepaid gift.
 */
function giftRedeemUrl(connection: Connection, giftId: string): string {
  const base = process.env.NEXT_PUBLIC_FOURTHWALL_BASE_URL ?? 'fourthwall.com';
  return `https://${connection.domain}.${base}/gifts/${giftId}`;
}

/** The open announcement, matching the real gifting bot's wording. */
function openAnnouncement(offerName: string, quantity: number, supporter: string, seconds: number): string {
  const gifted = quantity > 1 ? `gifted ${quantity} ${offerName}` : `gifted a ${offerName}`;
  return `NEW GIVEAWAY - !ENTER TO WIN. ${supporter} ${gifted} to the chat. Type !ENTER in the next ${seconds} seconds for a chance to win.`;
}

/**
 * Open a draw from a gift purchase: the server already minted the gifts, so we
 * just start the entry window and schedule the auto-close. One draw at a time — a
 * second gift purchase while a draw is open is ignored (the in-flight draw keeps
 * collecting).
 */
export async function openDrawFromPurchase(
  shopId: string,
  purchase: {
    giftIds: string[];
    offerName: string;
    quantity: number;
    supporterName?: string;
    durationSeconds: number;
  },
): Promise<void> {
  const connection = getConnection(shopId);
  if (!connection) return;
  if (connection.draw.status === 'open') return; // a draw is already collecting

  const supporter = purchase.supporterName?.trim() || 'Anonymous';
  const quantity = Math.max(1, purchase.quantity);
  connection.draw = {
    status: 'open',
    giftIds: purchase.giftIds,
    offerName: purchase.offerName,
    quantity,
    supporterName: supporter,
    entrants: [],
    winners: [],
    endsAt: Date.now() + purchase.durationSeconds * 1000,
    announcement: openAnnouncement(purchase.offerName, quantity, supporter, purchase.durationSeconds),
  };

  clearTimer(connection);
  connection.timer = setTimeout(() => {
    void finishDraw(shopId).catch((error) => console.error('auto-close finish failed', error));
  }, purchase.durationSeconds * 1000);

  publish(shopId, connection.draw);
}

/**
 * Add an entrant while a draw is open. `!enter` is matched case-insensitively by
 * the chat route; here we just dedupe by `userId` (entering twice counts once).
 */
export function addEntry(shopId: string, participant: Participant): { entered: boolean; entrants: number } {
  const connection = getConnection(shopId);
  if (!connection || connection.draw.status !== 'open') {
    return { entered: false, entrants: connection?.draw.entrants.length ?? 0 };
  }
  const already = connection.draw.entrants.some((e) => e.userId === participant.userId);
  if (!already) {
    connection.draw.entrants.push({ userId: participant.userId, userName: participant.userName });
    publish(shopId, connection.draw);
  }
  return { entered: !already, entrants: connection.draw.entrants.length };
}

/** Pick up to `count` unique winners at random from the entrant pool. */
function pickWinners(entrants: Participant[], count: number): Participant[] {
  const pool = [...entrants];
  const winners: Participant[] = [];
  while (winners.length < count && pool.length > 0) {
    const [picked] = pool.splice(Math.floor(Math.random() * pool.length), 1);
    winners.push(picked);
  }
  return winners;
}

/**
 * Close the window and pick winners: one winner per gift at random, each paired
 * with that gift's `gft_` id and storefront redemption link. We do NOT call
 * finish-draw — the integrator owns winner selection and just routes each winner
 * to `/gifts/{giftId}` to claim. Fewer entrants than gifts → the extra gifts go
 * unclaimed; an empty pool finishes with no winners. The status is flipped
 * synchronously before any async work so a manual draw and the auto-close timer
 * can't double-fire.
 */
export async function finishDraw(shopId: string): Promise<Draw> {
  const connection = getConnection(shopId);
  if (!connection) throw new Error('Shop is not connected');
  if (connection.draw.status !== 'open') return connection.draw; // already drawn / idle

  clearTimer(connection);
  connection.draw.status = 'finished'; // claim synchronously so a concurrent finish bails

  const { entrants, giftIds } = connection.draw;
  // One winner per available gift; each winner redeems their own gift.
  const winners: Winner[] = pickWinners(entrants, giftIds.length).map((participant, i) => ({
    ...participant,
    giftId: giftIds[i],
    redeemUrl: giftRedeemUrl(connection, giftIds[i]),
  }));

  connection.draw = { ...connection.draw, status: 'finished', winners, endsAt: undefined };
  publish(shopId, connection.draw);
  return connection.draw;
}

/** Resolve the shop currently collecting entries — the mock chat's target. */
export function shopWithOpenDraw(): string | undefined {
  return connectionWithOpenDraw()?.shopId;
}
