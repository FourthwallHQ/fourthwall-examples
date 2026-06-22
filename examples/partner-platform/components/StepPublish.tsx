'use client';

import { useEffect } from 'react';
import { Alert, Button } from '@fourthwall-examples/ui';
import { usePublish } from '@/lib/hooks';
import type { PublishRequest } from '@/lib/types';
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

  useEffect(() => {
    if (!data.blueprint || !data.artwork) return;
    const margin = data.profitMargin.trim() ? Number(data.profitMargin) : undefined;
    const request: PublishRequest = {
      productId: data.blueprint.productId,
      regions: [{ region: 'front', imageId: data.artwork.imageId }],
      colors: data.colors.length ? data.colors : undefined,
      sizes: data.sizes.length ? data.sizes : undefined,
      name: data.title,
      description: data.description || undefined,
      profitMargin: typeof margin === 'number' && !Number.isNaN(margin) ? margin : undefined,
      publishOnCreate: true,
    };
    // Fire-and-forget once; the result lands in `link` below.
    void publish(request);
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
