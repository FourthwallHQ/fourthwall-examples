/**
 * The in-memory store. Holds, per connected shop: the access token, the webhook
 * signing secret + ids, the product list, the pre-selected prize offer + display
 * name, the trigger threshold N, the qualifying-purchase counter, and the current
 * `Draw`. Everything resets on restart — no database, by design.
 *
 * Stashed on `globalThis` so it survives Next.js dev hot-reloads (the same
 * primitive the alerts example uses for its in-memory state).
 */
import type { Draw } from './draw';
import type { Product } from './fourthwall';

export interface Connection {
  shopId: string;
  domain?: string;
  accessToken: string;
  /** From the create-webhook response. Held in memory, never an env var. */
  webhookSecret?: string;
  webhookIds: string[];
  products: Product[];
  /** The pre-selected prize — the `offerId` winners redeem. */
  offerId?: string;
  prizeName?: string;
  /** N — every Nth qualifying purchase opens a draw. */
  threshold: number;
  purchaseCount: number;
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
