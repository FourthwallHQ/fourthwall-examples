/**
 * The in-memory settings store.
 *
 * A single `Map<shopId, ShopSettings>`. A row is created at install time (the
 * OAuth callback) and removed when Fourthwall delivers PLATFORM_APP_DISCONNECTED.
 * It holds everything the runtime keys off: the per-shop webhook signing secret,
 * the registered subscription ids (for clean re-install teardown), and the two
 * creator-controlled toggles the embedded settings page edits.
 *
 * Note what is NOT here: the OAuth access token. In an embed-first app the token
 * is only needed transiently — during the install callback, to register the
 * webhooks — so we use it and let it go. The embedded settings page proves shop
 * identity by HMAC, not by holding a token.
 *
 * Deliberately NOT persisted: this resets on every server restart. A production
 * integration would back it with a database. Keeping it in memory is what keeps
 * the architecture legible (see the PRD non-goals).
 *
 * Stashed on `globalThis` so Next.js dev hot-reload (which re-evaluates modules)
 * doesn't silently spin up a second, empty store.
 */

export interface ShopSettings {
  shopId: string;
  /** Per-shop HMAC signing secret, returned by create-webhook. Verifies deliveries. */
  webhookSecret: string;
  /** The subscription ids registered on install, deleted on re-install. */
  webhookIds: string[];
  /** Master kill switch. When false, no event fires to any connected overlay. */
  enabled: boolean;
  /** When false, the receiver replaces the supporter's real name with "Anonymous". */
  showSupporterName: boolean;
}

const globalForStore = globalThis as unknown as { __streamingAlertsStore?: Map<string, ShopSettings> };

const settings: Map<string, ShopSettings> =
  globalForStore.__streamingAlertsStore ?? (globalForStore.__streamingAlertsStore = new Map());

/** Look up a shop's settings. */
export function getSettings(shopId: string): ShopSettings | undefined {
  return settings.get(shopId);
}

/** Every stored row (used to resolve a webhook's owning shop). */
export function listSettings(): ShopSettings[] {
  return [...settings.values()];
}

/**
 * Create or replace a shop's row at install. Preserves the creator's existing
 * toggles across a re-install, defaulting a fresh install to enabled + names-on.
 */
export function upsertSettings(input: {
  shopId: string;
  webhookSecret: string;
  webhookIds: string[];
}): ShopSettings {
  const existing = settings.get(input.shopId);
  const next: ShopSettings = {
    shopId: input.shopId,
    webhookSecret: input.webhookSecret,
    webhookIds: input.webhookIds,
    enabled: existing?.enabled ?? true,
    showSupporterName: existing?.showSupporterName ?? true,
  };
  settings.set(input.shopId, next);
  return next;
}

/**
 * Patch the creator-controlled toggles. Lazily creates a row if none exists yet
 * (a shop viewing settings before install, or a local preview) so the toggles
 * always persist — a row without a webhookSecret simply can't verify deliveries.
 */
export function updateSettings(
  shopId: string,
  patch: Partial<Pick<ShopSettings, "enabled" | "showSupporterName">>,
): ShopSettings {
  const row: ShopSettings =
    settings.get(shopId) ??
    { shopId, webhookSecret: "", webhookIds: [], enabled: true, showSupporterName: true };
  if (patch.enabled !== undefined) row.enabled = patch.enabled;
  if (patch.showSupporterName !== undefined) row.showSupporterName = patch.showSupporterName;
  settings.set(shopId, row);
  return row;
}

/** Forget a shop's row (called when the platform app is disconnected). */
export function removeSettings(shopId: string): void {
  settings.delete(shopId);
}
