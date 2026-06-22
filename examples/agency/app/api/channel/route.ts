import { NextResponse } from "next/server";
import { channelApi } from "@/lib/fourthwall";
import { ensureConfigured, errorResponse } from "@/lib/http";
import type { AgencyChannel } from "@/lib/types";

export const dynamic = "force-dynamic";

/** GET /api/channel — identify the connected agency (channel-api: channel/current). */
export async function GET() {
  const notConfigured = ensureConfigured();
  if (notConfigured) return notConfigured;

  try {
    const channel = await channelApi.getCurrentChannel();
    const body: AgencyChannel = { id: channel.id, name: channel.name };
    return NextResponse.json(body);
  } catch (e) {
    return errorResponse(e);
  }
}
