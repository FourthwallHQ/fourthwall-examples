import { NextRequest } from "next/server";
import { getVerifiedShopId } from "@/lib/embeddedSettings";
import { getSettings, updateSettings } from "@/lib/store";

// Reads/writes the in-memory store from signed requests; never cache.
export const dynamic = "force-dynamic";

interface SettingsDTO {
  installed: boolean;
  enabled: boolean;
  showSupporterName: boolean;
  shopId: string;
  overlayUrl: string;
}

function overlayUrl(shopId: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  return `${base}/overlay/${shopId}`;
}

/**
 * GET /api/settings — the verified shop's current settings.
 *
 * `installed` is false when there's no row yet (the page can render in a preview
 * state before the app is installed against this shop). Defaults mirror a fresh
 * install: enabled, names shown.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const auth = getVerifiedShopId(request);
  if ("response" in auth) return auth.response;

  const row = getSettings(auth.shopId);
  const dto: SettingsDTO = {
    installed: !!row,
    enabled: row?.enabled ?? true,
    showSupporterName: row?.showSupporterName ?? true,
    shopId: auth.shopId,
    overlayUrl: overlayUrl(auth.shopId),
  };
  return Response.json(dto);
}

/**
 * PATCH /api/settings — flip the verified shop's toggles.
 *
 * Both fields are optional and validated as booleans. `enabled` is the master
 * kill switch the receiver checks; `showSupporterName` drives the server-side
 * name-privacy transform so a hidden name never reaches the overlay.
 */
export async function PATCH(request: NextRequest): Promise<Response> {
  const auth = getVerifiedShopId(request);
  if ("response" in auth) return auth.response;

  let body: { enabled?: unknown; showSupporterName?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  if (body.enabled !== undefined && typeof body.enabled !== "boolean") {
    return Response.json({ error: "enabled must be a boolean" }, { status: 400 });
  }
  if (body.showSupporterName !== undefined && typeof body.showSupporterName !== "boolean") {
    return Response.json({ error: "showSupporterName must be a boolean" }, { status: 400 });
  }

  const updated = updateSettings(auth.shopId, {
    enabled: body.enabled as boolean | undefined,
    showSupporterName: body.showSupporterName as boolean | undefined,
  });

  const dto: SettingsDTO = {
    installed: true,
    enabled: updated.enabled,
    showSupporterName: updated.showSupporterName,
    shopId: auth.shopId,
    overlayUrl: overlayUrl(auth.shopId),
  };
  return Response.json(dto);
}
