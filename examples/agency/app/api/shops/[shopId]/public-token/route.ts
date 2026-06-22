import { NextResponse } from "next/server";
import { openApi } from "@/lib/fourthwall";
import { ensureConfigured, errorResponse } from "@/lib/http";
import type { PublicTokenResult } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/shops/:shopId/public-token — get-or-create the shop's browser-safe
 * storefront token (open-api: needs SHOP_READ).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shopId: string }> },
) {
  const notConfigured = ensureConfigured();
  if (notConfigured) return notConfigured;

  try {
    const { shopId } = await params;
    const { token } = await openApi.getOrCreatePublicToken(shopId);
    const result: PublicTokenResult = { publicToken: token };
    return NextResponse.json(result);
  } catch (e) {
    return errorResponse(e);
  }
}
