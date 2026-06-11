import { NextResponse } from "next/server";
import { runTurn } from "@/lib/agent";
import { McpAuthError } from "@/lib/mcp";
import type { ChatRequest, ChatResponse } from "@/lib/types";

export const runtime = "nodejs";

function error(
  errorKind: "auth" | "config" | "other",
  message: string,
  status: number,
): NextResponse<ChatResponse> {
  return NextResponse.json({ type: "error", trace: [], errorKind, message }, { status });
}

export async function POST(request: Request): Promise<NextResponse<ChatResponse>> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return error("config", "Set ANTHROPIC_API_KEY in .env.local (see .env.local.example).", 500);
  }

  let body: ChatRequest;
  try {
    body = await request.json();
  } catch {
    return error("other", "Invalid JSON body.", 400);
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return error("other", "Request must include a non-empty messages array.", 400);
  }

  try {
    const outcome = await runTurn({
      messages: body.messages,
      decision: body.decision,
    });
    return NextResponse.json(outcome);
  } catch (err) {
    if (err instanceof McpAuthError) return error("auth", err.message, 200);
    const message = err instanceof Error ? err.message : "Unexpected error.";
    return error("other", message, 500);
  }
}
