import { NextResponse } from "next/server";
import { channelApi } from "@/lib/fourthwall";
import { ensureConfigured, errorResponse } from "@/lib/http";
import type { CreateShopRequest, OnboardResult, Shop } from "@/lib/types";

export const dynamic = "force-dynamic";

/** GET /api/shops — the fleet roster, one channel token enumerates every managed shop. */
export async function GET() {
  const notConfigured = ensureConfigured();
  if (notConfigured) return notConfigured;

  try {
    const { shops } = await channelApi.listShops();
    const body: Shop[] = shops.map((s) => ({ shopId: s.shopId, name: s.name }));
    return NextResponse.json(body);
  } catch (e) {
    return errorResponse(e);
  }
}

/** POST /api/shops — onboard a creator: create the subaccount shop (+ invite, optional payout). */
export async function POST(request: Request) {
  const notConfigured = ensureConfigured();
  if (notConfigured) return notConfigured;

  try {
    const body = (await request.json()) as CreateShopRequest;
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Shop name is required." }, { status: 400 });
    }

    // Greenroom supplies the payout return/refresh URLs (the creator returns
    // here from Fourthwall's hosted onboarding) — the operator only fills
    // country + businessType. channel-api requires these to be HTTPS, so coerce
    // the local http://localhost origin to https (passes validation; set
    // FOURTHWALL_ONBOARDING_BASE_URL to a real HTTPS URL for a clickable return).
    const base =
      process.env.FOURTHWALL_ONBOARDING_BASE_URL ??
      new URL(request.url).origin.replace(/^http:\/\//, "https://");
    const payout = body.payout
      ? {
          country: body.payout.country,
          businessType: body.payout.businessType,
          returnUrl: `${base}/`,
          refreshUrl: `${base}/`,
        }
      : undefined;

    const created = await channelApi.createShop({
      name: body.name.trim(),
      ownerEmail: body.ownerEmail?.trim() || undefined,
      payout,
    });

    const result: OnboardResult = {
      shopId: created.shopId,
      shopName: created.shopName,
      invitationStatus: created.invitationStatus,
      invitationEmail: created.invitationEmail,
      payoutOnboardingUrl: created.payoutOnboardingUrl,
      publicToken: created.publicToken,
    };
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
