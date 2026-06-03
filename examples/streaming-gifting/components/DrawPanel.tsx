'use client';

import { useEffect, useState } from 'react';
import { Alert, Button, Tag, type TagProps } from '@fourthwall-examples/ui';
import { Section } from '@/components/Section';
import type { Draw } from '@/lib/draw';
import type { EmbeddedAuth } from '@/lib/embeddedSettings';

const STATUS_LABEL: Record<Draw['status'], string> = {
  idle: 'Waiting',
  open: 'Open',
  finished: 'Finished',
};

const STATUS_APPEARANCE: Record<Draw['status'], TagProps['appearance']> = {
  idle: 'neutral',
  open: 'success',
  finished: 'brand',
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-3xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

/**
 * Live draw state — status, entrant count, countdown, and the chat announcement.
 * Draws open automatically when a gift is purchased (the GIFT_PURCHASE webhook);
 * "Draw now" just closes the window early (POST `/api/draw/finish`).
 */
export function DrawPanel({ auth, draw }: { auth: EmbeddedAuth; draw: Draw }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Tick once a second while the window is counting down.
  useEffect(() => {
    if (draw.status !== 'open' || !draw.endsAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [draw.status, draw.endsAt]);

  const secondsLeft =
    draw.status === 'open' && draw.endsAt ? Math.max(0, Math.ceil((draw.endsAt - now) / 1000)) : null;

  async function drawNow() {
    setBusy(true);
    setError(null);
    try {
      const signed = new URLSearchParams({
        shop_id: auth.shopId,
        hmac: auth.hmac,
        timestamp: auth.timestamp,
      }).toString();
      const res = await fetch(`/api/draw/finish?${signed}`, { method: 'POST' });
      if (!res.ok) {
        throw new Error(((await res.json()) as { error?: string }).error ?? 'Failed to draw');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to draw');
    } finally {
      setBusy(false);
    }
  }

  const description =
    draw.status === 'idle'
      ? 'Waiting for a gift purchase — each one opens a draw.'
      : draw.quantity > 1
        ? `${draw.offerName} · ${draw.quantity} winners`
        : draw.offerName;

  return (
    <Section
      title="Current draw"
      description={description}
      aside={<Tag appearance={STATUS_APPEARANCE[draw.status]}>{STATUS_LABEL[draw.status]}</Tag>}
      footer={
        draw.status === 'open' ? (
          <Button appearance="primary" loading={busy} onClick={drawNow}>
            Draw now
          </Button>
        ) : null
      }
    >
      <div className="space-y-4">
        {error && (
          <Alert appearance="critical" title="Something went wrong">
            {error}
          </Alert>
        )}
        {draw.announcement && draw.status === 'open' && (
          <p className="rounded-control border border-border bg-muted px-4 py-2.5 text-sm">
            {draw.announcement}
          </p>
        )}
        <div className="flex items-center gap-10">
          <Stat label="Entrants" value={String(draw.entrants.length)} />
          {secondsLeft !== null && <Stat label="Closes in" value={`${secondsLeft}s`} />}
        </div>
      </div>
    </Section>
  );
}
