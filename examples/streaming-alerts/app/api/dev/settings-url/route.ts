import { NextRequest } from "next/server";
import { signEmbeddedSettings } from "@/lib/hmac";

export const dynamic = "force-dynamic";

/**
 * GET /api/dev/settings-url?shop_id=sh_xxx — DEV ONLY.
 *
 * In production Fourthwall signs the embedded-settings handoff and iframes the
 * page; you can't reach it from localhost. This helper mints a valid signed URL
 * for a shop using the local HMAC secret so you can open the *real* settings
 * page (full signature verification, no bypass) during development.
 *
 * Returns 404 when NODE_ENV is production so it never ships as a live endpoint.
 */
export async function GET(request: NextRequest): Promise<Response> {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const appId = process.env.NEXT_PUBLIC_FOURTHWALL_APP_ID;
  const secret = process.env.FOURTHWALL_APP_HMAC_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? request.nextUrl.origin;
  if (!appId || !secret) {
    return Response.json({ error: "set NEXT_PUBLIC_FOURTHWALL_APP_ID and FOURTHWALL_APP_HMAC_SECRET" }, { status: 500 });
  }

  const shopId = request.nextUrl.searchParams.get("shop_id");
  if (!shopId) {
    return Response.json({ error: "pass ?shop_id=sh_xxx" }, { status: 400 });
  }

  const timestamp = String(Date.now());
  const hmac = signEmbeddedSettings({ shopId, appId, timestamp, secret });
  // Base64 contains +/= — URL-encode so the query param round-trips intact.
  const qs = new URLSearchParams({ shop_id: shopId, hmac, timestamp }).toString();
  const url = `${baseUrl}/?${qs}`;

  return Response.json({ url });
}
