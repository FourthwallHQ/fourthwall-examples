import { NextResponse } from "next/server";
import { completeLogin, saveShopLabel } from "@/lib/oauth";
import { fetchShopLabel } from "@/lib/mcp";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const home = new URL("/", url.origin);

  const oauthError = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  if (oauthError || !code) {
    home.searchParams.set(
      "auth_error",
      url.searchParams.get("error_description") ?? oauthError ?? "No authorization code.",
    );
    return NextResponse.redirect(home);
  }

  try {
    await completeLogin(code, url.searchParams.get("state"));
    saveShopLabel(await fetchShopLabel());
  } catch (err) {
    home.searchParams.set("auth_error", err instanceof Error ? err.message : "Login failed.");
  }
  return NextResponse.redirect(home);
}
