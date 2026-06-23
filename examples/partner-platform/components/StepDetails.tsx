'use client';

import { Alert, Input, Textarea } from '@fourthwall-examples/ui';
import type { WizardData } from './AddProductWizard';

/**
 * Step 4 — Details & price, then Publish (the footer's Publish button calls
 * publish). This is the first step that needs a shop, but the creator never
 * sees a shop-setup flow — publish provisions one behind the scenes. Title is
 * the only gate; description and profit margin are optional.
 */
export function StepDetails({ data, patch }: { data: WizardData; patch: (p: Partial<WizardData>) => void }) {
  const color = data.preview?.images[0]?.color ?? '';
  return (
    <div className="flex flex-col gap-6">
      <div className="grid items-start gap-6 [grid-template-columns:auto_1fr]">
        <div className="flex w-40 flex-col gap-2">
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-panel border border-border bg-[radial-gradient(circle_at_50%_38%,#ffffff_0%,#eef2f7_60%,#e2e8f0_100%)]">
            {data.preview?.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.preview.images[0].url} alt="Preview" className="size-full object-contain" />
            ) : (
              <span className="text-xs text-muted-foreground">No preview</span>
            )}
          </div>
          <span className="text-center text-xs text-muted-foreground">
            {data.blueprint?.name}
            {color ? ` · ${color}` : ''}
          </span>
        </div>

        <div className="flex flex-col gap-4">
          <Input
            label="Title"
            value={data.title}
            placeholder="Name your product"
            onChange={(e) => patch({ title: e.target.value })}
          />
          <Textarea
            label="Description"
            value={data.description}
            placeholder="Tell fans about this product…"
            onChange={(e) => patch({ description: e.target.value })}
          />
          <Input
            label="Profit margin (USD)"
            value={data.profitMargin}
            inputMode="decimal"
            placeholder="Optional — added on top of the base cost"
            onChange={(e) => patch({ profitMargin: e.target.value })}
          />
        </div>
      </div>

      <Alert appearance="info">
        On publish, Linkstand sets up your shop behind the scenes and lists this product as your
        first link.
      </Alert>
    </div>
  );
}
