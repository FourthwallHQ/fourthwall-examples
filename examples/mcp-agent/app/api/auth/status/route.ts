import { NextResponse } from "next/server";
import { isConnected, saveShopLabel, shopLabel } from "@/lib/oauth";
import { fetchShopLabel } from "@/lib/mcp";

export const runtime = "nodejs";

export async function GET() {
  const connected = isConnected();
  // Self-heal sessions that connected before the label existed (or where the
  // callback's fetch failed) — one extra MCP round-trip, then cached.
  if (connected && !shopLabel()) {
    saveShopLabel(await fetchShopLabel());
  }
  return NextResponse.json({ connected, shop: shopLabel() ?? null });
}
