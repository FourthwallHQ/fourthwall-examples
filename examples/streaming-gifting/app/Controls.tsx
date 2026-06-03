'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert } from '@fourthwall-examples/ui';
import { StreamStatus } from '@/components/StreamStatus';
import { GiftingSettings } from '@/components/GiftingSettings';
import { DrawPanel } from '@/components/DrawPanel';
import { WinnerPanel } from '@/components/WinnerPanel';
import { useDrawStream } from '@/lib/useDrawStream';
import { idleDraw, type Draw } from '@/lib/draw';
import type { GiftingConfig, Product } from '@/lib/fourthwall';
import type { EmbeddedAuth } from '@/lib/embeddedSettings';

interface Snapshot {
  connected: boolean;
  shopId?: string;
  domain?: string;
  products?: Product[];
  config?: GiftingConfig;
  webhooksActive?: boolean;
  draw?: Draw;
  /** Set when the bootstrap loaded the connection but an upstream API call failed. */
  error?: string;
}

/**
 * The embedded operator cockpit. Rendered only after the server has HMAC-verified
 * the embedded-settings params. Loads the bootstrap snapshot (signed), streams
 * live draw state, lets the creator edit the gifting rules, and surfaces the
 * in-flight draw + winners. Every write carries the signed params.
 */
export function Controls({ auth }: { auth: EmbeddedAuth }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const liveDraw = useDrawStream(auth.shopId);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const signed = new URLSearchParams({
        shop_id: auth.shopId,
        hmac: auth.hmac,
        timestamp: auth.timestamp,
      }).toString();
      const res = await fetch(`/api/state?${signed}`);
      const data = (await res.json().catch(() => ({ connected: false }))) as Snapshot;
      if (!cancelled) setSnapshot(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [auth]);

  // Keep the embedding Fourthwall iframe sized to our content.
  useEffect(() => {
    const send = () =>
      parent.postMessage(
        { type: 'SET_HEIGHT', data: { height: document.documentElement.scrollHeight } },
        '*',
      );
    send();
    const observer = new ResizeObserver(send);
    observer.observe(document.body);
    return () => observer.disconnect();
  }, [snapshot, liveDraw]);

  if (!snapshot) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  // Signature is valid but we hold no connection — the in-memory store was reset
  // (e.g. a dev restart). Re-installing from the dashboard re-registers it.
  if (snapshot.connected === false) {
    return (
      <Alert appearance="alert" title="App needs reinstalling">
        This shop isn’t connected on the server (in-memory state resets on restart). Reinstall the
        Gifting app from your Fourthwall dashboard.
      </Alert>
    );
  }

  const draw = liveDraw ?? snapshot.draw ?? idleDraw();

  return (
    <div className="space-y-8">
      {snapshot.webhooksActive === false && (
        <Alert appearance="alert" title="Gift-purchase webhook not registered">
          This app couldn’t register the <code className="font-mono">GIFT_PURCHASE</code> webhook, so
          no draws will open. Reinstall from your Fourthwall dashboard to re-register it.
        </Alert>
      )}

      {snapshot.error && (
        <Alert appearance="critical" title="Couldn’t load gifting settings">
          {snapshot.error} — check the app has the <code className="font-mono">offer_read</code> +{' '}
          <code className="font-mono">giveaway_write</code> scopes and the gifting-config endpoint is
          available.
        </Alert>
      )}

      <StreamStatus auth={auth} />

      {snapshot.config && (
        <GiftingSettings
          auth={auth}
          products={snapshot.products ?? []}
          initial={snapshot.config}
          onSaved={(config) => setSnapshot((prev) => (prev ? { ...prev, config } : prev))}
        />
      )}

      <DrawPanel auth={auth} draw={draw} />

      {draw.status === 'finished' && <WinnerPanel draw={draw} />}

      <p className="text-sm text-muted-foreground">
        Entries come from chat. This example uses a{' '}
        <Link href="/chat?user=alice" className="font-medium text-text-brand underline">
          mock chat
        </Link>{' '}
        — open it (with <code className="font-mono">?user=</code> names) and post{' '}
        <code className="font-mono">!enter</code> while a draw is open.
      </p>
    </div>
  );
}
