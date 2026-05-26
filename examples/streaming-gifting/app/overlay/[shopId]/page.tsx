'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { GiveawayCard } from '@/components/GiveawayCard';
import { useDrawStream } from '@/lib/useDrawStream';

/**
 * The OBS browser source. Opens an `EventSource` to `/api/events/:shopId`, shows
 * the entry prompt + live count while a draw is open and the winner reveal when
 * it finishes; idle otherwise. The browser auto-reconnects the stream.
 */
export default function OverlayPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const draw = useDrawStream(shopId);

  // Make the page transparent so OBS composites it over the live scene.
  useEffect(() => {
    document.body.classList.add('overlay-page');
    return () => document.body.classList.remove('overlay-page');
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <GiveawayCard draw={draw} />
    </main>
  );
}
