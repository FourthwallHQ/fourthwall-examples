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

function BlueprintCard({ blueprint, selected, onSelect }: {
  blueprint: Blueprint;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex cursor-pointer flex-col gap-2 rounded-panel border-2 p-3 text-left transition-colors ${
        selected ? 'border-primary' : 'border-border hover:border-input-hover'
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
      <span className="text-xs text-muted-foreground">
        from {formatBasePrice(blueprint.basePrice, blueprint.currency)}
      </span>
    </button>
  );
}

function formatBasePrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}
