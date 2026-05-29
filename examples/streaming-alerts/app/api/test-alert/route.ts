import { NextRequest } from "next/server";
import type { AlertPayload } from "@/lib/alert";
import { publish } from "@/lib/channel";
import { getVerifiedShopId } from "@/lib/embeddedSettings";
import { getSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * POST /api/test-alert — fire a synthetic order onto the verified shop's channel
 * so the creator can confirm the OBS source is wired up before going live.
 *
 * No external call; purely an in-process publish. Authenticated by the embedded
 * settings signature, respects the name-privacy toggle, and omits an image so
 * the overlay exercises its initials-chip path.
 */
export async function POST(request: NextRequest): Promise<Response> {
  const auth = getVerifiedShopId(request);
  if ("response" in auth) return auth.response;

  const row = getSettings(auth.shopId);
  const showName = row?.showSupporterName ?? true;

  const payload: AlertPayload = {
    kind: "order",
    name: showName ? "Test Supporter" : "Anonymous",
    amount: "$42.00",
    detail: "Tour Tee",
    id: `test_${Date.now()}`,
  };

  publish(auth.shopId, payload);
  return Response.json({ fired: true });
}
