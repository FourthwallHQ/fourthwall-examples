'use client';

import { useState } from 'react';
import { Alert, Button, Input } from '@fourthwall-examples/ui';

type Result =
  | { won: true; offerName: string; redeemUrl: string }
  | { won: false }
  | { error: string };

/**
 * The fake-OAuth redeem page — the winner-facing claim surface. In the real flow
 * the winner authenticates with Twitch to prove they're the selected winner; here
 * that whole step is mocked by typing your chat name. A correct name reveals that
 * winner's gift redemption link (the real storefront `/gifts/{giftId}` page).
 *
 * This is the swappable seam on the redemption side: replace the name check with
 * the real Twitch winner authorization and the rest is unchanged.
 */
export default function RedeemPage() {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: name.trim() }),
      });
      setResult((await res.json()) as Result);
    } catch {
      setResult({ error: 'Something went wrong — try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-md space-y-6 px-6 py-16">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Redeem your gift</h1>
        <p className="text-muted-foreground">
          Sign in with your chat name to claim. (A stand-in for the real Twitch winner login.)
        </p>
      </header>

      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Chat name"
          placeholder="e.g. alice"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <Button type="submit" appearance="primary" loading={submitting} disabled={!name.trim()}>
          Redeem
        </Button>
      </form>

      {result && 'error' in result && (
        <Alert appearance="critical" title="Couldn’t redeem">
          {result.error}
        </Alert>
      )}

      {result && 'won' in result && result.won && (
        <Alert appearance="success" title={`🎉 You won ${result.offerName}!`}>
          <p className="mb-3">You’re on the winners list. Claim your gift on the storefront:</p>
          <a href={result.redeemUrl} target="_blank" rel="noreferrer">
            <Button appearance="primary">Claim your gift</Button>
          </a>
        </Alert>
      )}

      {result && 'won' in result && !result.won && (
        <Alert appearance="alert" title="Not on the winners list">
          “{name.trim()}” isn’t a winner of the current draw. Double-check the name you used in chat.
        </Alert>
      )}
    </main>
  );
}
