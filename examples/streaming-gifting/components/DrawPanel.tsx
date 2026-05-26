'use client';

import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Tag,
  type TagProps,
} from '@fourthwall-examples/ui';
import type { Draw } from '@/lib/draw';

const STATUS_LABEL: Record<Draw['status'], string> = {
  idle: 'Idle',
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
 * Live draw state — status, entrant count, countdown — plus the manual
 * `open` / `draw now` controls (POST `/api/draw/open`, `/api/draw/finish`).
 */
export function DrawPanel({
  shopId,
  draw,
  hasPrize,
}: {
  shopId: string;
  draw: Draw;
  hasPrize: boolean;
}) {
  const [busy, setBusy] = useState<null | 'open' | 'finish'>(null);
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

  async function act(action: 'open' | 'finish') {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(`/api/draw/${action}?shopId=${encodeURIComponent(shopId)}`, {
        method: 'POST',
      });
      if (!res.ok) {
        throw new Error(((await res.json()) as { error?: string }).error ?? `Failed to ${action} draw`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} draw`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Current draw</CardTitle>
          <CardDescription>
            {draw.prizeName ? `Prize: ${draw.prizeName}` : 'No prize selected yet'}
          </CardDescription>
        </div>
        <Tag appearance={STATUS_APPEARANCE[draw.status]}>{STATUS_LABEL[draw.status]}</Tag>
      </CardHeader>
      <CardBody className="space-y-4">
        {error && (
          <Alert appearance="critical" title="Something went wrong">
            {error}
          </Alert>
        )}
        {!hasPrize && (
          <Alert appearance="alert" title="Pick a prize first">
            Select a prize above before opening a draw.
          </Alert>
        )}
        <div className="flex items-center gap-10">
          <Stat label="Entrants" value={String(draw.entrants.length)} />
          {secondsLeft !== null && <Stat label="Closes in" value={`${secondsLeft}s`} />}
        </div>
      </CardBody>
      <CardFooter>
        <Button
          appearance="secondary"
          loading={busy === 'open'}
          disabled={draw.status === 'open' || !hasPrize}
          onClick={() => act('open')}
        >
          Open draw
        </Button>
        <Button
          appearance="primary"
          loading={busy === 'finish'}
          disabled={draw.status !== 'open'}
          onClick={() => act('finish')}
        >
          Draw now
        </Button>
      </CardFooter>
    </Card>
  );
}
