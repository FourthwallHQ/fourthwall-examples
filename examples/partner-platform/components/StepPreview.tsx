'use client';

import { useState } from 'react';
import { Alert, Button, Checkbox } from '@fourthwall-examples/ui';
import { usePreview } from '@/lib/hooks';
import type { WizardData } from './AddProductWizard';

/**
 * Step 3 — Preview. Shop-less: renders live preview images synchronously
 * through POST /api/previews (the channel-api preview endpoint) with no shop in
 * existence. The exact inputs here — productId + imageId + colors + sizes — are
 * what publish later reuses, so what the creator sees is what goes live.
 */
const COLORS = [
  { label: 'Black', hex: '#1e293b' },
  { label: 'White', hex: '#ffffff' },
  { label: 'Grey', hex: '#64748b' },
  { label: 'Navy', hex: '#1e3a8a' },
];

const SIZES = ['S', 'M', 'L', 'XL'];

export function StepPreview({ data, patch }: { data: WizardData; patch: (p: Partial<WizardData>) => void }) {
  const { preview, loading, error, data: result } = usePreview();
  const [colors, setColors] = useState<string[]>(data.colors);
  const [sizes, setSizes] = useState<string[]>(data.sizes);

  const shown = result ?? data.preview;
  const mainImage = shown?.images[0];

  function toggle(list: string[], value: string): string[] {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  }

  async function render() {
    if (!data.blueprint || !data.artwork) return;
    patch({ colors, sizes });
    const res = await preview({
      productId: data.blueprint.productId,
      colors: colors.length ? colors : undefined,
      sizes: sizes.length ? sizes : undefined,
      regions: [{ region: 'front', imageId: data.artwork.imageId }],
    });
    patch({ preview: res });
  }

  return (
    <div className="grid items-start gap-6 [grid-template-columns:1.4fr_1fr]">
      <div className="flex flex-col gap-3">
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-panel border border-border bg-[radial-gradient(circle_at_50%_38%,#ffffff_0%,#eef2f7_60%,#e2e8f0_100%)]">
          {mainImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mainImage.url} alt="Preview" className="size-full object-contain" />
          ) : (
            <span className="text-sm text-muted-foreground">No preview yet</span>
          )}
        </div>
        <span className="text-center text-xs text-muted-foreground">
          Rendered live — no shop created yet
        </span>
      </div>

      <div className="flex flex-col items-start gap-5">
        {error && <Alert appearance="critical">{error}</Alert>}

        <div className="flex flex-col gap-2.5">
          <span className="text-sm font-semibold">Color</span>
          <div className="flex flex-wrap gap-2.5">
            {COLORS.map((c) => {
              const active = colors.includes(c.label);
              return (
                <button
                  key={c.label}
                  type="button"
                  title={c.label}
                  onClick={() => setColors((s) => toggle(s, c.label))}
                  className={`size-7 rounded-full border ${c.hex === '#ffffff' ? 'border-border' : 'border-transparent'} ${active ? 'outline outline-2 outline-offset-2 outline-primary' : ''}`}
                  style={{ backgroundColor: c.hex }}
                  aria-pressed={active}
                />
              );
            })}
          </div>
          <span className="text-xs text-muted-foreground">Optional — leave empty to use all available colors.</span>
        </div>

        <div className="flex flex-col gap-2.5">
          <span className="text-sm font-semibold">Sizes</span>
          {SIZES.map((s) => (
            <Checkbox
              key={s}
              label={s}
              checked={sizes.includes(s)}
              onChange={() => setSizes((list) => toggle(list, s))}
            />
          ))}
          <span className="text-xs text-muted-foreground">Optional — leave empty to use all available sizes.</span>
        </div>

        <Button size="small" loading={loading} onClick={render}>
          Re-render preview
        </Button>
      </div>
    </div>
  );
}
