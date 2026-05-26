import { subscribe } from "@/lib/channel";

export const dynamic = "force-dynamic";
// SSE must stream from the Node runtime, not be statically optimized.
export const runtime = "nodejs";

/**
 * GET /api/events/:shopId — the SSE push transport.
 *
 * Opens a `text/event-stream`, registers a listener on the shop's in-memory
 * channel, and writes one `data: {AlertPayload}\n\n` line per published event.
 * When the browser source disconnects, the request signal aborts and we
 * unsubscribe + close — so a closed overlay leaks no listener.
 *
 * One-way and auto-reconnecting (the browser's EventSource handles reconnect);
 * we never replay events missed while disconnected.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> },
): Promise<Response> {
  const { shopId } = await params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;

      const send = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          closed = true;
        }
      };

      // Open the stream with a comment so proxies flush headers immediately.
      send(": connected\n\n");

      const unsubscribe = subscribe(shopId, (payload) => {
        send(`data: ${JSON.stringify(payload)}\n\n`);
      });

      // Comment heartbeat keeps intermediaries from idling the connection shut.
      const heartbeat = setInterval(() => send(": ping\n\n"), 25_000);

      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      request.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
