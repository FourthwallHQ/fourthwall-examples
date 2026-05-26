/**
 * In-memory per-shop pub/sub. Publishes draw-state changes to every SSE listener
 * for a shop. Listeners are kept on `globalThis` so they survive dev hot-reloads.
 */
type Listener = (data: unknown) => void;

const globalForChannel = globalThis as unknown as {
  __sgChannels?: Map<string, Set<Listener>>;
};

const channels: Map<string, Set<Listener>> =
  globalForChannel.__sgChannels ?? (globalForChannel.__sgChannels = new Map());

/** Subscribe to a shop's stream. Returns an unsubscribe function. */
export function subscribe(shopId: string, listener: Listener): () => void {
  let listeners = channels.get(shopId);
  if (!listeners) {
    listeners = new Set();
    channels.set(shopId, listeners);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Push a payload to every current listener for a shop. */
export function publish(shopId: string, data: unknown): void {
  const listeners = channels.get(shopId);
  if (!listeners) return;
  for (const listener of listeners) {
    try {
      listener(data);
    } catch (error) {
      console.error('channel listener error', error);
    }
  }
}
