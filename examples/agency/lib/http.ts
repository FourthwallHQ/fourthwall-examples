import { NextResponse } from "next/server";
import { FourthwallError, isConfigured } from "./fourthwall";

/** 500 response when the FOURTHWALL_* env vars are missing. */
export function ensureConfigured(): NextResponse | null {
  if (!isConfigured()) {
    return NextResponse.json(
      {
        error:
          "Greenroom is not configured. Copy .env.example to .env.local and fill in the FOURTHWALL_* values.",
      },
      { status: 500 },
    );
  }
  return null;
}

/** Map a thrown error to a JSON response, preserving the upstream status. */
export function errorResponse(e: unknown): NextResponse {
  if (e instanceof FourthwallError) {
    return NextResponse.json(
      { error: e.message, status: e.status, detail: e.detail },
      { status: e.status },
    );
  }
  const message = e instanceof Error ? e.message : String(e);
  return NextResponse.json({ error: message }, { status: 500 });
}
