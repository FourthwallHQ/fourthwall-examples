'use client';

import { useEffect, useState } from 'react';
import type { Draw } from './draw';

/**
 * Opens an `EventSource` to `GET /api/events/:shopId` and exposes the current
 * `Draw` state to the overlay and control page. Relies on the browser's built-in
 * SSE auto-reconnect — paste the overlay URL into OBS once and it stays live.
 */
export function useDrawStream(shopId?: string): Draw | null {
  const [draw, setDraw] = useState<Draw | null>(null);

  useEffect(() => {
    if (!shopId) return;
    const source = new EventSource(`/api/events/${shopId}`);
    source.onmessage = (event) => {
      try {
        setDraw(JSON.parse(event.data) as Draw);
      } catch {
        // Ignore keepalive comments / malformed frames.
      }
    };
    return () => source.close();
  }, [shopId]);

  return draw;
}
