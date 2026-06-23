'use client';

import { useEffect, useState } from 'react';
import { Alert, Button, Checkbox, Select } from '@fourthwall-examples/ui';
import { usePreview, useProductOptions } from '@/lib/hooks';
import type { WizardData } from './AddProductWizard';

/**
 * Step 3 — Preview. Shop-less: renders live preview images synchronously
 * through POST /api/previews (the channel-api preview endpoint) with no shop in
 * existence. The exact inputs here — productId + imageId + colors + sizes + the
 * design region — are what publish later reuses, so what the creator sees is
 * what goes live. Colors / sizes / regions are the product's REAL options
 * (`/api/templates/{id}`); create-product rejects anything not on the product.
 */
export function StepPreview({ data, patch }: { data: WizardData; patch: (p: Partial<WizardData>) => void }) {
  const { preview, loading, error, data: result } = usePreview();
  const { data: options, loading: optionsLoading, error: optionsError } = useProductOptions(
    data.blueprint?.productId,
  );
  const [colors, setColors] = useState<string[]>(data.colors);
  const [sizes, setSizes] = useState<string[]>(data.sizes);

  const regions = options?.regions ?? [];
  const colorOptions = options?.colors ?? [];
  const sizeOptions = options?.sizes ?? [];

  const shown = result ?? data.preview;
  const mainImage = shown?.images[0];

  // When the product's options arrive: default the region (prefer a `front*`
  // one) and drop any previously-selected color/size that isn't on this product
  // (e.g. the creator went back and changed the product).
  useEffect(() => {
    if (!options) return;
    if (!data.region || !regions.some((r) => r.regionId === data.region)) {
      const fallback = regions.find((r) => r.regionId.startsWith('front')) ?? regions[0];
      if (fallback) patch({ region: fallback.regionId });
    }
    setColors((prev) => prev.filter((c) => colorOptions.some((o) => o.name === c)));
    setSizes((prev) => prev.filter((s) => sizeOptions.includes(s)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  function toggle(list: string[], value: string): string[] {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  }

  async function render() {
    if (!data.blueprint || !data.artwork || !data.region) return;
    patch({ colors, sizes });
    const res = await preview({
      productId: data.blueprint.productId,
      colors: colors.length ? colors : undefined,
      sizes: sizes.length ? sizes : undefined,
      regions: [{ region: data.region, imageId: data.artwork.imageId }],
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
        {optionsError && <Alert appearance="critical">{optionsError}</Alert>}

        <div className="flex w-full flex-col gap-2.5">
          <span className="text-sm font-semibold">Design area</span>
          <Select
            size="small"
            value={data.region ?? ''}
            disabled={optionsLoading || regions.length === 0}
            onChange={(e) => patch({ region: e.target.value })}
          >
            {regions.map((r) => (
              <option key={r.regionId} value={r.regionId}>
                {r.name}
              </option>
            ))}
          </Select>
          <span className="text-xs text-muted-foreground">
            Where your artwork is placed on the product.
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          <span className="text-sm font-semibold">Color</span>
          <div className="flex flex-wrap gap-2.5">
            {colorOptions.map((c) => {
              const active = colors.includes(c.name);
              return (
                <button
                  key={c.name}
                  type="button"
                  title={c.name}
                  onClick={() => setColors((s) => toggle(s, c.name))}
                  className={`size-7 rounded-full border border-border ${active ? 'outline outline-2 outline-offset-2 outline-primary' : ''}`}
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
          {sizeOptions.map((s) => (
            <Checkbox
              key={s}
              label={s}
              checked={sizes.includes(s)}
              onChange={() => setSizes((list) => toggle(list, s))}
            />
          ))}
          <span className="text-xs text-muted-foreground">Optional — leave empty to use all available sizes.</span>
        </div>

        <Button size="small" loading={loading} disabled={!data.region} onClick={render}>
          Re-render preview
        </Button>
      </div>
    </div>
  );
}
