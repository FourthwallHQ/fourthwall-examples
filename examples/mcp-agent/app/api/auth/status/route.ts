import { NextResponse } from "next/server";
import { isConnected } from "@/lib/oauth";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ connected: isConnected() });
}
