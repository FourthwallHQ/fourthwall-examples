import { NextResponse } from "next/server";
import { isConnected, shopLabel } from "@/lib/oauth";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ connected: isConnected(), shop: shopLabel() ?? null });
}
