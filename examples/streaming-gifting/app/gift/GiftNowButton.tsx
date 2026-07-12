'use client';

import { useState } from 'react';
import { Alert, Button } from '@fourthwall-examples/ui';

/**
 * The public gift page's single primary action. Posts the URL-supplied `offerId`
 * to `POST /api/checkout`, receives an absolute `checkoutUrl`, and hard-navigates
 * the browser straight to it. No modal, no variant picker — variant selection
 * happens in Fourthwall's checkout.
 *
 * Errors are supporter-safe: we never expose upstream diagnostic detail (which
 * could reveal internal-state issues to a random visitor); the operator sees the
 * real error in the server logs instead.
 */
export function GiftNowButton({ offerId }: { offerId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function giftNow() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId }),
      });
      if (!res.ok) {
        setError('We couldn’t start checkout. Please try again in a moment.');
        return;
      }
      const data = (await res.json()) as { checkoutUrl?: string };
      if (!data.checkoutUrl) {
        setError('We couldn’t start checkout. Please try again in a moment.');
        return;
      }
      // Hard-redirect out of the app — the supporter continues on Fourthwall's
      // shop domain. Don't use next/router: this is a cross-origin URL.
      window.location.href = data.checkoutUrl;
    } catch {
      setError('We couldn’t reach the gifting service. Please try again.');
    } finally {
      // Keep `busy` set once we've handed off to `window.location`; the page will
      // navigate away so the button state stops mattering.
      if (!error) setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <Alert appearance="critical" title="Couldn’t start checkout">
          {error}
        </Alert>
      )}
      <Button
        appearance="primary"
        size="large"
        fullWidth
        loading={busy}
        onClick={giftNow}
      >
        Gift now
      </Button>
    </div>
  );
}
