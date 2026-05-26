import { apiUrlFromBase, deleteWebhook } from "@/lib/fourthwall";
import { getCurrentConnection, removeConnection } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * POST /api/disconnect — disconnect the shop.
 *
 * Deletes the webhook subscriptions we registered on connect (so Fourthwall
 * stops delivering to a torn-down example), then forgets the in-memory token
 * entry. Deletes are best-effort: one failing shouldn't block forgetting the
 * token or deleting the others.
 */
export async function POST(): Promise<Response> {
  const connection = getCurrentConnection();
  if (!connection) {
    return Response.json({ disconnected: true });
  }

  const fourthwallBaseUrl = process.env.NEXT_PUBLIC_FOURTHWALL_BASE_URL;
  if (fourthwallBaseUrl) {
    const apiUrl = apiUrlFromBase(fourthwallBaseUrl);
    await Promise.all(
      connection.webhookIds.map((id) =>
        deleteWebhook({ apiUrl, accessToken: connection.accessToken, id }).catch((error) => {
          console.error(`[disconnect] failed to delete webhook ${id}:`, error);
        }),
      ),
    );
  }

  removeConnection(connection.shopId);
  return Response.json({ disconnected: true });
}
