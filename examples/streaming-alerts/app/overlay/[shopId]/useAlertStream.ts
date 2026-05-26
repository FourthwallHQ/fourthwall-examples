import { useEffect } from "react";
import type { AlertPayload } from "@/lib/alert";

/**
 * Subscribes the overlay to its shop's SSE channel.
 *
 * Opens an `EventSource` to /api/events/:shopId and calls `onAlert` for each
 * parsed payload. We lean entirely on the browser's built-in EventSource
 * reconnect — and deliberately do NOT replay events missed while disconnected.
 *
 * `onAlert` must be referentially stable (the overlay wraps it in a
 * functional-update callback) so the effect doesn't tear the connection down
 * and reopen on every render.
 */
export function useAlertStream(shopId: string, onAlert: (payload: AlertPayload) => void): void {
  useEffect(() => {
    const source = new EventSource(`/api/events/${shopId}`);

    source.onmessage = (event) => {
      try {
        onAlert(JSON.parse(event.data) as AlertPayload);
      } catch {
        // Ignore non-JSON frames (e.g. the ": ping" heartbeat comments).
      }
    };

    // No custom handling needed on error: EventSource reconnects on its own.
    return () => source.close();
  }, [shopId, onAlert]);
}
