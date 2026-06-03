'use client';

import { useEffect, useState } from 'react';
import { Alert, Button, Tag } from '@fourthwall-examples/ui';
import { Section } from '@/components/Section';
import type { EmbeddedAuth } from '@/lib/embeddedSettings';

/**
 * Live-status control. The gift offer only appears on the storefront while the
 * shop is live, so this lets the operator go live (and offline) to exercise the
 * gift-while-live flow.
 *
 * In production the creator's streaming platform drives this status and the
 * gifting app never sets it — this manual toggle exists only so the flow is
 * testable without a real live stream. Reads/writes through the signed
 * `/api/streaming` route.
 */
export function StreamStatus({ auth }: { auth: EmbeddedAuth }) {
  const [live, setLive] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signed = new URLSearchParams({
    shop_id: auth.shopId,
    hmac: auth.hmac,
    timestamp: auth.timestamp,
  }).toString();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/streaming?${signed}`);
      const data = (await res.json().catch(() => ({}))) as { live?: boolean; error?: string };
      if (cancelled) return;
      if (typeof data.live === 'boolean') setLive(data.live);
      else setError(data.error ?? 'Failed to read streaming status');
    })();
    return () => {
      cancelled = true;
    };
    // auth is stable for the lifetime of the cockpit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggle() {
    const next = !live;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/streaming?${signed}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ live: next }),
      });
      if (!res.ok) throw new Error(((await res.json()) as { error?: string }).error ?? 'Failed');
      setLive(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update streaming status');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section
      title="Stream status"
      description="The gift offer is only purchasable while you're live. In a real integration your streaming platform sets this — here it's a manual switch for testing."
      aside={
        live === null ? (
          <Tag appearance="neutral">Loading…</Tag>
        ) : (
          <Tag appearance={live ? 'success' : 'neutral'}>{live ? 'Live' : 'Offline'}</Tag>
        )
      }
      footer={
        <Button
          appearance={live ? 'secondary' : 'primary'}
          loading={busy}
          disabled={live === null}
          onClick={toggle}
        >
          {live ? 'End stream' : 'Go live'}
        </Button>
      }
    >
      {error && (
        <Alert appearance="critical" title="Couldn’t update stream status">
          {error}
        </Alert>
      )}
    </Section>
  );
}
