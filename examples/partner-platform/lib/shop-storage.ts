/**
 * The app's CLIENT-side state — the shop the channel publishes to.
 *
 * Linkstand provisions its own shop the first time a creator publishes, then
 * reuses it forever after. The shop id + name are the only mutable state the app
 * keeps, and they live in the BROWSER's `localStorage` so they survive page
 * refreshes AND dev-server restarts (the previous server module-memory store was
 * lost on every restart). The server is now stateless about which shop is "the"
 * shop: the browser holds the id and sends it on every shop-bound request.
 *
 * Only the shop *id* + name cross into the browser. The channel credential stays
 * server-side and is never exposed here — the shop boundary is still respected.
 */

const STORAGE_KEY = 'linkstand:shop';

export interface StoredShop {
  id: string;
  name: string;
}

/** The provisioned shop, or `null` if none has been created yet (or on the server). */
export function getStoredShop(): StoredShop | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredShop;
  } catch {
    return null;
  }
}

/** Persist the provisioned shop so subsequent publishes / listing reuse it. */
export function setStoredShop(shop: StoredShop): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(shop));
}

/** Forget the provisioned shop. */
export function clearStoredShop(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}
