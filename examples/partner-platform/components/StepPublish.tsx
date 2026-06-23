'use client';

import { useEffect, useRef } from 'react';
import { Alert, Button } from '@fourthwall-examples/ui';
import { usePublish } from '@/lib/hooks';
import type { WizardData } from './AddProductWizard';

/**
 * StepPublish — the shop-bound create. Renders while /api/publish runs: it
 * looks up the channel's shops, provisions one on first publish, then creates
 * the product scoped to it (X-ShopId) — all behind the scenes. The product is
 * built from the exact productId + imageId (+ colors/sizes) the preview was
 * rendered from, so the previewed design is the design that ships.
 */
export function StepPublish({ data, onDone, onCancel }: {
  data: WizardData;
  onDone: (link: import('@/lib/types').ProductLink) => void;
  onCancel: () => void;
}) {
  const { publish, loading, error, data: link } = usePublish();
  // Publish exactly once. Without this, React strict mode (dev) double-invokes
  // the effect → two concurrent /api/publish → a shop-creation race (both pass
  // the check-then-insert domain check, the second 500s on the unique domain).
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    const { blueprint, artwork, region } = data;
    if (!blueprint || !artwork || !region) return;
    fired.current = true;

    // Multipart, because publish re-uploads the RAW artwork bytes into the shop
    // it provisions (the channel-api preview imageId is bound to a different
    // shop and can't be reused). The BFF does the signed GCS PUT server-side.
    const form = new FormData();
    form.append('file', artwork.file, artwork.fileName || artwork.file.name);
    form.append('productId', blueprint.productId);
    form.append('region', region);
    if (data.shopName.trim()) form.append('shopName', data.shopName.trim());
    form.append('name', data.title);
    if (data.description) form.append('description', data.description);
    if (data.profitMargin.trim()) form.append('profitMargin', data.profitMargin.trim());
    form.append('colors', JSON.stringify(data.colors));
    form.append('sizes', JSON.stringify(data.sizes));
    form.append('width', String(artwork.width));
    form.append('height', String(artwork.height));

    // Fire-and-forget once; the result lands in `link` below.
    void publish(form);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (link) onDone(link);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [link]);

  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <div
        aria-hidden
        className="size-8 animate-spin rounded-full border-2 border-border border-t-foreground"
      />
      <p className="text-muted-foreground">
        {loading ? 'Publishing your product…' : 'Done.'}
      </p>
      {error && (
        <Alert appearance="critical" title="Publish failed">
          {error}
        </Alert>
      )}
      {error && <Button onClick={onCancel}>Close</Button>}
    </div>
  );
}
