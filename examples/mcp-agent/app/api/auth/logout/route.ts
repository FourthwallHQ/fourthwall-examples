import { NextResponse } from "next/server";
import { clearSession, saveShopLabel } from "@/lib/oauth";

export const runtime = "nodejs";

export async function POST() {
  clearSession();
  saveShopLabel(undefined);
  return NextResponse.json({ ok: true });
}
