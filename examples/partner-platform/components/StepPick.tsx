'use client';

import { Alert } from '@fourthwall-examples/ui';
import { useProductTemplates } from '@/lib/hooks';
import type { Blueprint } from '@/lib/types';
import type { WizardData } from './AddProductWizard';

/**
 * Step 1 — Pick a blank product. Shop-less: lists product templates straight
 * from GET /api/templates (the open-api product-templates list). Selecting one
 * is the only gate to advance.
 */
export function StepPick({ data, patch }: { data: WizardData; patch: (p: Partial<WizardData>) => void }) {
  const { data: templates, loading, error } = useProductTemplates();

  return (
    <div className="flex flex-col gap-4">
      {error && <Alert appearance="critical">{error}</Alert>}

      {loading && (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      )}

      {!loading && templates && templates.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {templates.map((t) => (
            <BlueprintCard
              key={t.productId}
              blueprint={t}
              selected={data.blueprint?.productId === t.productId}
              disabled={t.supportsBackendRendering === false}
              onSelect={() => patch({ blueprint: t })}
            />
          ))}
        </div>
      )}

      {!loading && templates && templates.length === 0 && (
        <p className="text-sm text-muted-foreground">No product templates available.</p>
      )}
    </div>
  );
}

function BlueprintCard({ blueprint, selected, disabled, onSelect }: {
  blueprint: Blueprint;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-disabled={disabled}
      title={disabled ? `${prettyMethod(blueprint.productionMethod)} products can't be previewed here` : undefined}
      className={`relative flex flex-col gap-2 rounded-panel border-2 p-3 text-left transition-colors ${
        disabled
          ? 'cursor-not-allowed border-border opacity-50'
          : `cursor-pointer ${selected ? 'border-primary' : 'border-border hover:border-input-hover'}`
      }`}
    >
      <div className="aspect-square overflow-hidden rounded-md bg-muted">
        {blueprint.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={blueprint.thumbnail} alt={blueprint.name} className="size-full object-cover" />
        ) : (
          <div className="size-full bg-gradient-to-br from-muted to-muted/50" />
        )}
      </div>
      <span className="text-sm font-semibold">{blueprint.name}</span>
      {disabled ? (
        <span className="text-xs text-muted-foreground">
          {prettyMethod(blueprint.productionMethod)} — preview unavailable
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">
          from {formatBasePrice(blueprint.basePrice, blueprint.currency)}
        </span>
      )}
    </button>
  );
}

/** `EMBROIDERY` → `Embroidery`; falls back to a generic label when unknown. */
function prettyMethod(method: string): string {
  if (!method) return 'This product type';
  return method.charAt(0).toUpperCase() + method.slice(1).toLowerCase();
}

function formatBasePrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}
