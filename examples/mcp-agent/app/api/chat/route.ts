import { NextResponse } from "next/server";
import { runTurn } from "@/lib/agent";
import { McpAuthError } from "@/lib/mcp";
import type { ChatRequest, ChatResponse, StreamEvent } from "@/lib/types";

export const runtime = "nodejs";

function error(
  errorKind: "auth" | "config" | "other",
  message: string,
  status: number,
): NextResponse<ChatResponse> {
  return NextResponse.json({ type: "error", trace: [], errorKind, message }, { status });
}

/**
 * Responds with newline-delimited JSON: live `tool` / `text_delta` events as
 * the turn runs, then one terminal ChatResponse line. Early failures return a
 * plain JSON body — which is just a one-line stream to the client.
 */
export async function POST(request: Request): Promise<Response> {
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

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: StreamEvent) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        const outcome = await runTurn({
          messages: body.messages,
          decision: body.decision,
          emit,
        });
        emit(outcome);
      } catch (err) {
        if (err instanceof McpAuthError) {
          emit({ type: "error", trace: [], errorKind: "auth", message: err.message });
        } else {
          emit({
            type: "error",
            trace: [],
            errorKind: "other",
            message: err instanceof Error ? err.message : "Unexpected error.",
          });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
