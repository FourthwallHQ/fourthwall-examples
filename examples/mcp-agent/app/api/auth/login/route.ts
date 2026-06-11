import { NextResponse } from "next/server";
import { beginLogin } from "@/lib/oauth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  try {
    const authorizeUrl = await beginLogin(origin);
    return NextResponse.redirect(authorizeUrl ?? new URL("/", origin));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Login failed.";
    const home = new URL("/", origin);
    home.searchParams.set("auth_error", message);
    return NextResponse.redirect(home);
  }
}
