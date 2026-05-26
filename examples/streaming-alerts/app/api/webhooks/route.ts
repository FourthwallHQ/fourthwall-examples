import { handleDonation, handleOrder, type AlertPayload } from "@/lib/alert";
import { publish } from "@/lib/channel";
import { SIGNATURE_HEADER, verifySignature } from "@/lib/hmac";
import { getConnection, getCurrentConnection, listConnections, type Connection } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * A tiny in-memory dedupe set. Fourthwall may deliver the same event more than
 * once (at-least-once delivery); we drop repeats so an alert never fires twice.
 * Capped FIFO so it can't grow unbounded. On globalThis to survive dev reloads.
 */
const DEDUPE_CAP = 1000;
const globalForDedupe = globalThis as unknown as { __streamingAlertsSeen?: Set<string> };
const seen: Set<string> = globalForDedupe.__streamingAlertsSeen ?? (globalForDedupe.__streamingAlertsSeen = new Set());

function alreadySeen(eventId: string): boolean {
  if (seen.has(eventId)) return true;
  seen.add(eventId);
  if (seen.size > DEDUPE_CAP) {
    // Evict the oldest insertion (Set preserves insertion order).
    seen.delete(seen.values().next().value as string);
  }
  return false;
}

/** The bits of the raw webhook envelope we read (the rest passes through to shaping). */
interface WebhookBody {
  type?: string;
  id?: string;
  shopId?: string;
  shop?: { id?: string };
  data?: {
    id?: string;
    shopId?: string;
    shop?: { id?: string };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Resolve the shop a webhook belongs to. We try a few likely payload fields, then
 * fall back to the current connection (this single-creator example normally has
 * exactly one). The signature check below is what actually authenticates it.
 */
function resolveConnection(body: WebhookBody): Connection | undefined {
  const shopId = body?.shopId ?? body?.shop?.id ?? body?.data?.shopId ?? body?.data?.shop?.id;
  if (shopId) {
    const byId = getConnection(shopId);
    if (byId) return byId;
  }
  return getCurrentConnection() ?? listConnections()[0];
}

/**
 * POST /api/webhooks — the receiver Fourthwall calls on every order and tip.
 *
 * Order of operations matters:
 *   1. read the RAW body (HMAC is over the bytes as sent — parse later)
 *   2. resolve the owning shop + verify the signature → 401 on mismatch
 *   3. dedupe on event id
 *   4. shape the payload (privacy transform applied inside)
 *   5. publish to the in-memory channel, return 200 immediately
 *
 * Fire-and-forget: if no overlay is connected, publish drops it — still 200.
 */
export async function POST(request: Request): Promise<Response> {
  // 1. Raw body, untouched, for HMAC.
  const rawBody = await request.text();
  const signature = request.headers.get(SIGNATURE_HEADER);

  let body: WebhookBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  // 2. Resolve shop + verify signature against that shop's stored secret.
  const connection = resolveConnection(body);
  if (!connection) {
    return Response.json({ error: "no_connected_shop" }, { status: 401 });
  }
  if (!verifySignature(rawBody, signature, connection.webhookSecret)) {
    return Response.json({ error: "invalid_signature" }, { status: 401 });
  }

  // 3. Dedupe on event id (envelope id, falling back to the data id).
  const eventId = body.id ?? body.data?.id;
  if (eventId && alreadySeen(eventId)) {
    return Response.json({ received: true, deduped: true });
  }

  // 4. Shape — the privacy transform lives inside handleOrder/handleDonation.
  let payload: AlertPayload | null = null;
  if (body.type === "ORDER_PLACED" && body.data) {
    payload = handleOrder(body.data as never, connection.showName);
  } else if (body.type === "DONATION" && body.data) {
    payload = handleDonation(body.data as never, connection.showName);
  }

  // 5. Publish (or no-op for event types we don't render) and ack.
  if (payload) {
    publish(connection.shopId, payload);
  }
  return Response.json({ received: true });
}
