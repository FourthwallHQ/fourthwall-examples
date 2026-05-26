import type { AlertPayload } from "@/lib/alert";
import { publish } from "@/lib/channel";
import { getCurrentConnection } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * POST /api/test-alert — fire a synthetic order onto the connected shop's
 * channel so the creator can confirm the OBS source is wired up before going
 * live. No external call; purely an in-process publish. Respects the privacy
 * toggle, and omits an image so the overlay exercises its initials-chip path.
 */
export async function POST(): Promise<Response> {
  const connection = getCurrentConnection();
  if (!connection) {
    return Response.json({ error: "not_connected" }, { status: 400 });
  }

  const payload: AlertPayload = {
    kind: "order",
    name: connection.showName ? "Test Supporter" : "Anonymous",
    amount: "$42.00",
    detail: "Tour Tee",
    id: `test_${Date.now()}`,
  };

  publish(connection.shopId, payload);
  return Response.json({ fired: true });
}
