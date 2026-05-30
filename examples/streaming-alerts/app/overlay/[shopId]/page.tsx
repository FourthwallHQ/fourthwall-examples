"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import type { AlertPayload } from "@/lib/alert";
import { AlertCard } from "@/components/AlertCard";
import { useAlertStream } from "./useAlertStream";

// Card lifecycle, in ms. ENTER/EXIT mirror the CSS keyframe durations.
const ENTER_MS = 420;
const HOLD_MS = 4000;
const EXIT_MS = 360;

/**
 * /overlay/:shopId — the OBS browser source.
 *
 * Subscribes to the shop's SSE channel, queues incoming alerts, and animates
 * them strictly one at a time (card in → hold → card out) so two never overlap.
 * Each new card plays the default sound. The page background is transparent so
 * only the card composites over the stream.
 *
 * The animation is a small state machine driven by event callbacks and timers
 * (not effects): incoming alerts land in `queueRef`; `playNext` shows one and
 * schedules its exit, then pulls the following one when it's done. `current` /
 * `exiting` exist only to render the active card.
 */
export default function OverlayPage() {
  const { shopId } = useParams<{ shopId: string }>();

  const [current, setCurrent] = useState<AlertPayload | null>(null);
  const [exiting, setExiting] = useState(false);

  const queueRef = useRef<AlertPayload[]>([]);
  const processingRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  // Held in a ref so the timer-driven recursion and the SSE callback always call
  // the latest implementation without re-subscribing the stream. Assigned in an
  // effect (refs must not be mutated during render).
  const playNextRef = useRef<() => void>(() => {});

  useEffect(() => {
    playNextRef.current = () => {
      if (processingRef.current) return;
      const next = queueRef.current.shift();
      if (!next) return;

      processingRef.current = true;
      setExiting(false);
      setCurrent(next);

      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        // Autoplay can be blocked outside OBS until the page is interacted with.
        audio.play().catch(() => {});
      }

      const exitAt = ENTER_MS + HOLD_MS;
      timersRef.current.push(
        setTimeout(() => setExiting(true), exitAt),
        setTimeout(() => {
          setCurrent(null);
          setExiting(false);
          processingRef.current = false;
          playNextRef.current();
        }, exitAt + EXIT_MS),
      );
    };
    // Drain anything that arrived before this assignment landed.
    playNextRef.current();
  }, []);

  // Stable callback so the SSE connection isn't torn down on every render.
  const enqueue = useCallback((payload: AlertPayload) => {
    queueRef.current.push(payload);
    playNextRef.current();
  }, []);
  useAlertStream(shopId, enqueue);

  // Transparent page while the overlay is mounted; clear timers on unmount.
  useEffect(() => {
    document.body.classList.add("overlay");
    const timers = timersRef.current;
    return () => {
      document.body.classList.remove("overlay");
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 flex justify-center px-6 pt-10">
      <audio ref={audioRef} src="/alert.wav" preload="auto" />
      {current && <AlertCard key={current.id} payload={current} exiting={exiting} />}
    </div>
  );
}
