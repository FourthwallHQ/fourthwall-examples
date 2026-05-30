/**
 * The in-memory per-shop pub/sub — the fan-out heart of the example.
 *
 * A `Map<shopId, Set<listener>>`. `publish` fans a payload to every listener
 * registered for that shop; `subscribe` adds a listener and returns an
 * unsubscribe. The SSE endpoint is the listener; the webhook receiver is the
 * publisher.
 *
 * Fire-and-forget: if a shop has no listeners (no overlay connected), the
 * payload is simply dropped — never queued, never replayed. That's the
 * deliberate non-goal. A production system would swap this for Redis pub/sub or
 * a message broker; the contract (publish / subscribe) would stay the same.
 *
 * On `globalThis` so dev hot-reload keeps a single set of channels.
 */

import type { AlertPayload } from "./alert";

type Listener = (payload: AlertPayload) => void;

const globalForChannel = globalThis as unknown as {
  __streamingAlertsChannels?: Map<string, Set<Listener>>;
};

const channels: Map<string, Set<Listener>> =
  globalForChannel.__streamingAlertsChannels ??
  (globalForChannel.__streamingAlertsChannels = new Map());

/** Register a listener for a shop's channel. Returns an unsubscribe fn. */
export function subscribe(shopId: string, listener: Listener): () => void {
  let listeners = channels.get(shopId);
  if (!listeners) {
    listeners = new Set();
    channels.set(shopId, listeners);
  }
  listeners.add(listener);

  return () => {
    const current = channels.get(shopId);
    if (!current) return;
    current.delete(listener);
    if (current.size === 0) {
      channels.delete(shopId);
    }
  };
}

/**
 * Fan a payload to every listener on a shop's channel. Returns the number of
 * listeners delivered to (0 means nobody was connected — dropped).
 */
export function publish(shopId: string, payload: AlertPayload): number {
  const listeners = channels.get(shopId);
  if (!listeners || listeners.size === 0) {
    return 0;
  }
  for (const listener of listeners) {
    try {
      listener(payload);
    } catch {
      // A broken listener must not stop the fan-out to the others.
    }
  }
  return listeners.size;
}
