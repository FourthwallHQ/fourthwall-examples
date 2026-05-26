import { getCurrentConnection, setShowName } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * POST /api/privacy — toggle the connected shop's `showName` flag.
 *
 * When off, the receiver replaces the supporter's real name with "Anonymous"
 * before publishing, so the overlay never receives it. The transform happens
 * server-side in lib/alert.ts — flipping this flag is all the client does.
 */
export async function POST(request: Request): Promise<Response> {
  const connection = getCurrentConnection();
  if (!connection) {
    return Response.json({ error: "not_connected" }, { status: 400 });
  }

  let showName: boolean;
  try {
    const body = await request.json();
    showName = Boolean(body.showName);
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  setShowName(connection.shopId, showName);
  return Response.json({ showName });
}
