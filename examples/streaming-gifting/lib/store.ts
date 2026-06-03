/**
 * The in-memory store. Holds, per connected shop: the access token, the webhook
 * subscription ids, the last-known entry-window length (cached from the gifting
 * config so the webhook handler can size the window without a round-trip), and the
 * current `Draw`. Everything resets on restart — no database, by design.
 *
 * Stashed on `globalThis` so it survives Next.js dev hot-reloads (the same
 * primitive the alerts example uses for its in-memory state).
 */
import type { Draw } from './draw';

export interface Connection {
  shopId: string;
  domain?: string;
  accessToken: string;
  /** The registered webhook subscription ids (deleted on disconnect). */
  webhookIds: string[];
  /** Entry window seconds, cached from the gifting config (read on settings load/save). */
  entryTimeLimitSeconds?: number;
  draw: Draw;
  /** Non-serialized: the current draw's auto-close timer. */
  timer?: ReturnType<typeof setTimeout>;
}

const globalForStore = globalThis as unknown as {
  __sgConnections?: Map<string, Connection>;
};

const connections: Map<string, Connection> =
  globalForStore.__sgConnections ?? (globalForStore.__sgConnections = new Map());

export function getConnection(shopId: string): Connection | undefined {
  return connections.get(shopId);
}

export function setConnection(connection: Connection): void {
  connections.set(connection.shopId, connection);
}

/** Forget a shop (on uninstall). Clears any pending auto-close timer first. */
export function removeConnection(shopId: string): void {
  const connection = connections.get(shopId);
  if (connection?.timer) clearTimeout(connection.timer);
  connections.delete(shopId);
}

export function allConnections(): Connection[] {
  return [...connections.values()];
}

/** The single connected shop, for the demo's one-shop happy path. */
export function firstConnection(): Connection | undefined {
  return connections.values().next().value;
}

/** The connection (if any) that currently has an open draw collecting entries. */
export function connectionWithOpenDraw(): Connection | undefined {
  return allConnections().find((c) => c.draw.status === 'open');
}
