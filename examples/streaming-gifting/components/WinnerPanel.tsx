'use client';

import { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@fourthwall-examples/ui';
import type { Draw } from '@/lib/draw';

/**
 * After finish: the winner, the copyable `redeemUrl`, and a pre-formatted chat
 * announcement. Copy-only — the example never posts on the operator's behalf.
 */
export function WinnerPanel({ draw }: { draw: Draw }) {
  const [copied, setCopied] = useState<null | 'url' | 'announcement'>(null);

  if (draw.status !== 'finished') return null;

  const winner = draw.winner;
  if (!winner) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No winner</CardTitle>
        </CardHeader>
        <CardBody>
          <Alert appearance="alert" title="Nobody entered">
            The draw closed with no entrants, so the prize returned to the shop.
          </Alert>
        </CardBody>
      </Card>
    );
  }

  const announcement = `🎉 @${winner.userName} won ${draw.prizeName}! Claim your free prize: ${
    draw.redeemUrl ?? ''
  }`;

  function copy(kind: 'url' | 'announcement', value: string) {
    navigator.clipboard.writeText(value);
    setCopied(kind);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Winner</CardTitle>
        <CardDescription>
          Drawn from {draw.entrants.length} entrant{draw.entrants.length === 1 ? '' : 's'}.
        </CardDescription>
      </CardHeader>
      <CardBody className="space-y-5">
        <div className="rounded-panel border border-success/30 bg-success-subtle px-5 py-4">
          <p className="text-sm text-muted-foreground">Winner</p>
          <p className="text-2xl font-semibold">{winner.userName}</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Redeem URL</p>
          <div className="flex items-center gap-3">
            <code className="min-w-0 flex-1 truncate rounded-control border border-border bg-muted px-3.5 py-2.5 font-mono text-sm">
              {draw.redeemUrl ?? 'Not returned'}
            </code>
            <Button
              appearance="secondary"
              disabled={!draw.redeemUrl}
              onClick={() => draw.redeemUrl && copy('url', draw.redeemUrl)}
            >
              {copied === 'url' ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Chat announcement</p>
          <div className="flex items-center gap-3">
            <p className="min-w-0 flex-1 truncate rounded-control border border-border bg-muted px-3.5 py-2.5 text-sm">
              {announcement}
            </p>
            <Button appearance="secondary" onClick={() => copy('announcement', announcement)}>
              {copied === 'announcement' ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
