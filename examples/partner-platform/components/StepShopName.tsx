'use client';

import { Input } from '@fourthwall-examples/ui';
import type { WizardData } from './AddProductWizard';

/**
 * Step — Name your shop. Shown only on the FIRST publish, when the creator has
 * no shop yet: publishing provisions a shop behind the scenes, and this is where
 * they name it. Once a shop exists this step is skipped entirely.
 */
export function StepShopName({ data, patch }: { data: WizardData; patch: (p: Partial<WizardData>) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-base font-semibold">Name your shop</span>
        <span className="text-sm text-muted-foreground">
          Publishing your first product creates your shop. Give it a name — you can
          change it later in shop settings.
        </span>
      </div>
      <Input
        label="Shop name"
        value={data.shopName}
        placeholder="e.g. Aurora Goods"
        onChange={(e) => patch({ shopName: e.target.value })}
      />
    </div>
  );
}
