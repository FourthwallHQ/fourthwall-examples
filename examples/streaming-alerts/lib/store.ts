/**
 * The in-memory connection store.
 *
 * A single `Map<shopId, Connection>` plus a pointer to the most-recently
 * connected shop (this example is single-creator in local dev). Everything the
 * later steps key off — the access token, the webhook signing secret, the
 * registered webhook ids, and the name-privacy flag — lives here.
 *
 * Deliberately NOT persisted: this resets on every server restart. A production
 * integration would back this with a database. Keeping it in memory is what
 * keeps the architecture legible (see the PRD non-goals).
 *
 * Stashed on `globalThis` so Next.js dev hot-reload (which re-evaluates modules)
 * doesn't silently spin up a second, empty store.
 */

export interface Connection {
  shopId: string;
  accessToken: string;
  /** Per-shop HMAC signing secret, returned by create-webhook. Never an env var. */
  webhookSecret: string;
  /** The subscription ids registered on connect, deleted on disconnect. */
  webhookIds: string[];
  /** When false, the receiver replaces the supporter's real name with "Anonymous". */
  showName: boolean;
}

interface StoreState {
  connections: Map<string, Connection>;
  currentShopId: string | null;
}

const globalForStore = globalThis as unknown as { __streamingAlertsStore?: StoreState };

const state: StoreState =
  globalForStore.__streamingAlertsStore ??
  (globalForStore.__streamingAlertsStore = {
    connections: new Map(),
    currentShopId: null,
  });

/** Store (or replace) a connection and mark it the current one. */
export function setConnection(connection: Connection): void {
  state.connections.set(connection.shopId, connection);
  state.currentShopId = connection.shopId;
}

/** Look up a specific shop's connection. */
export function getConnection(shopId: string): Connection | undefined {
  return state.connections.get(shopId);
}

/**
 * The most-recently connected shop. In this single-creator example the control
 * page, test-alert, privacy, and disconnect endpoints all act on "the connected
 * shop" — that's this one.
 */
export function getCurrentConnection(): Connection | undefined {
  return state.currentShopId ? state.connections.get(state.currentShopId) ?? undefined : undefined;
}

/** Every stored connection (used to resolve a webhook's owning shop). */
export function listConnections(): Connection[] {
  return [...state.connections.values()];
}

/** Forget a shop's token + webhook ids (called on disconnect). */
export function removeConnection(shopId: string): void {
  state.connections.delete(shopId);
  if (state.currentShopId === shopId) {
    state.currentShopId = null;
  }
}

/** Flip the name-privacy flag for a shop. Returns the updated connection. */
export function setShowName(shopId: string, showName: boolean): Connection | undefined {
  const connection = state.connections.get(shopId);
  if (connection) {
    connection.showName = showName;
  }
  return connection;
}
