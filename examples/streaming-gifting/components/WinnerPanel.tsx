'use client';

import { useState } from 'react';
import { Alert, Button } from '@fourthwall-examples/ui';
import { Section } from '@/components/Section';
import type { Draw } from '@/lib/draw';

/**
 * After the draw closes: the picked winner(s) and the single redeem link to
 * broadcast. The per-winner gift links stay private — you post the redeem page to
 * chat and only the winners (by chat name) can claim there. Mirrors the real flow,
 * where the redeem page is public but gated by winner authentication.
 */
export function WinnerPanel({ draw }: { draw: Draw }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  if (draw.status !== 'finished') return null;

  if (draw.winners.length === 0) {
    return (
      <Section title="No winner">
        <Alert appearance="alert" title="Nobody entered">
          The draw closed with no entrants, so no gift was handed out.
        </Alert>
      </Section>
    );
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? '';
  const redeemUrl = `${base}/redeem`;
  const mentions = draw.winners.map((w) => `@${w.userName}`).join(', ');
  const announcement = `🎉 ${mentions} won ${draw.offerName}! Redeem your gift at ${redeemUrl}`;

  function copy(text: string, set: (v: boolean) => void) {
    navigator.clipboard.writeText(text);
    set(true);
    setTimeout(() => set(false), 1500);
  }

  return (
    <Section
      title={draw.winners.length > 1 ? 'Winners' : 'Winner'}
      description={`Drawn from ${draw.entrants.length} entrant${
        draw.entrants.length === 1 ? '' : 's'
      }. Broadcast the redeem link — only these winners can claim, by chat name.`}
    >
      <div className="space-y-5">
        <div className="rounded-panel border border-success/30 bg-success-subtle px-5 py-4">
          <p className="text-sm text-muted-foreground">
            {draw.winners.length > 1 ? `${draw.winners.length} winners` : 'Winner'}
          </p>
          <p className="text-2xl font-semibold">{draw.winners.map((w) => w.userName).join(', ')}</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Redeem link (post in chat)</p>
          <div className="flex items-center gap-3">
            <a
              href={redeemUrl}
              target="_blank"
              rel="noreferrer"
              className="min-w-0 flex-1 truncate rounded-control border border-border bg-muted px-3.5 py-2.5 font-mono text-sm text-text-brand underline"
            >
              {redeemUrl}
            </a>
            <Button appearance="secondary" onClick={() => copy(redeemUrl, setCopiedLink)}>
              {copiedLink ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Chat announcement</p>
          <div className="flex items-center gap-3">
            <p className="min-w-0 flex-1 truncate rounded-control border border-border bg-muted px-3.5 py-2.5 text-sm">
              {announcement}
            </p>
            <Button appearance="secondary" onClick={() => copy(announcement, setCopiedMsg)}>
              {copiedMsg ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}
