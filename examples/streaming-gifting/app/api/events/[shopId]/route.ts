import { subscribe } from '@/lib/channel';
import { getDraw } from '@/lib/draw';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * SSE transport feeding the operator cockpit. Opens a
 * `text/event-stream`, sends the current draw immediately, then writes one
 * `data:` line per draw-state change (opened / entrant-count / finished). Tears
 * down on disconnect; the browser's `EventSource` auto-reconnects.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ shopId: string }> },
) {
  const { shopId } = await context.params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const write = (payload: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch {
          // Controller already closed — the abort handler will clean up.
        }
      };

      write(getDraw(shopId)); // initial snapshot
      const unsubscribe = subscribe(shopId, write);

      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {
          // ignore
        }
      }, 25_000);

      request.signal.addEventListener('abort', () => {
        clearInterval(keepAlive);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
