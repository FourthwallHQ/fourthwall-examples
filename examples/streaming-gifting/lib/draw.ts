/**
 * Draw orchestration — the lifecycle the Gifting guide leaves to the integrator:
 * the qualifying-purchase counter + Nth trigger, open/close of the entry window
 * (timer or manual), the deduped participant set, and the random winner pick.
 *
 * Entry collection (mock chat → `addEntry`) is the one surface a real integration
 * swaps for Twitch EventSub, Discord, or a web form. The only contract with
 * Fourthwall is the participant list handed to Finish Giveaway.
 */
import { connectionWithOpenDraw, getConnection, type Connection } from './store';
import { publish } from './channel';
import { createGiveaway, finishGiveaway } from './fourthwall';

export interface Participant {
  userId: string;
  userName: string;
}

export interface Draw {
  status: 'idle' | 'open' | 'finished';
  /** Set once Create Giveaway returns. */
  giveawayId?: string;
  /** The pre-selected prize. */
  offerId: string;
  /** Display name from the product list. */
  prizeName: string;
  /** The deduped entry set. */
  entrants: Participant[];
  /** Set at finish. */
  winner?: Participant;
  /** From the Finish response. */
  redeemUrl?: string;
  /** Epoch ms when the entry window auto-closes — drives the control countdown. */
  endsAt?: number;
}

/** How long an entry window stays open before the timer draws automatically. */
export const ENTRY_WINDOW_MS = 60_000;

export function idleDraw(offerId = '', prizeName = ''): Draw {
  return { status: 'idle', offerId, prizeName, entrants: [] };
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
 * Record a qualifying purchase (ORDER_PLACED / GIFT_PURCHASE) and, on every Nth,
 * open a draw. One draw at a time: a trigger while a draw is already open is
 * ignored (the in-flight draw keeps collecting).
 */
export async function recordPurchase(shopId: string): Promise<void> {
  const connection = getConnection(shopId);
  if (!connection) return;
  connection.purchaseCount += 1;

  if (connection.draw.status === 'open') return; // a draw is already collecting
  if (!connection.offerId) return; // no prize selected yet
  if (connection.threshold <= 0) return;
  if (connection.purchaseCount % connection.threshold !== 0) return;

  await openDraw(shopId);
}

/**
 * Open a draw: Create Giveaway for the pre-selected offer, start the entry
 * window, and schedule the auto-close timer. No-op if a draw is already open.
 */
export async function openDraw(shopId: string): Promise<Draw> {
  const connection = getConnection(shopId);
  if (!connection) throw new Error('Shop is not connected');
  if (connection.draw.status === 'open') return connection.draw; // already open
  if (!connection.offerId) throw new Error('No prize selected');

  const { id } = await createGiveaway(connection.accessToken, connection.offerId);

  connection.draw = {
    status: 'open',
    giveawayId: id,
    offerId: connection.offerId,
    prizeName: connection.prizeName ?? connection.offerId,
    entrants: [],
    endsAt: Date.now() + ENTRY_WINDOW_MS,
  };

  clearTimer(connection);
  connection.timer = setTimeout(() => {
    void finishDraw(shopId).catch((error) => console.error('auto-close finish failed', error));
  }, ENTRY_WINDOW_MS);

  publish(shopId, connection.draw);
  return connection.draw;
}

/**
 * Add an entrant while a draw is open. Dedupes by `userId` (entering twice counts
 * once). Ignored when no draw is open.
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

/**
 * Close the window and draw: pick one winner at random and Finish Giveaway with
 * only that participant (empty array if nobody entered → the prize returns to the
 * shop). The set is frozen atomically before the network call so a manual draw
 * and the auto-close timer can't double-fire.
 */
export async function finishDraw(shopId: string): Promise<Draw> {
  const connection = getConnection(shopId);
  if (!connection) throw new Error('Shop is not connected');
  if (connection.draw.status !== 'open') return connection.draw; // already drawn / idle

  clearTimer(connection);
  // Claim the draw synchronously (before any await) so a concurrent finish bails.
  connection.draw.status = 'finished';

  const { entrants, giveawayId } = connection.draw;
  const winner =
    entrants.length > 0 ? entrants[Math.floor(Math.random() * entrants.length)] : undefined;

  let redeemUrl: string | undefined;
  if (giveawayId) {
    const result = await finishGiveaway(
      connection.accessToken,
      giveawayId,
      winner ? [{ userId: winner.userId, userName: winner.userName }] : [],
    );
    redeemUrl = result.redeemUrl;
  }

  connection.draw = {
    ...connection.draw,
    status: 'finished',
    winner,
    redeemUrl,
    endsAt: undefined,
  };
  publish(shopId, connection.draw);
  return connection.draw;
}

/** Resolve the shop currently collecting entries — the mock chat's target. */
export function shopWithOpenDraw(): string | undefined {
  return connectionWithOpenDraw()?.shopId;
}
