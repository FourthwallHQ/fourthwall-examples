'use client';

import { useState } from 'react';
import { Alert, Avatar, Button } from '@fourthwall-examples/ui';
import { useLinks, useShop } from '@/lib/hooks';
import type { ProductLink } from '@/lib/types';
import { AddProductWizard } from './AddProductWizard';
import { EmptyState } from './EmptyState';
import { LinkList } from './LinkList';

/**
 * Dashboard — the links admin. A neutral page header, the creator's shop, a
 * single primary Add-a-product action, and the product link list. The channel
 * bearer is resolved server-side via the client-credentials grant, so there is
 * no connect step.
 *
 * The shop is provisioned on the first publish. Until then the header shows an
 * editable "Your shop" name the creator sets; that name is used to create the
 * shop, after which the header shows the live shop name (read-only).
 */
export function Dashboard() {
  const shop = useShop();
  const links = useLinks();
  const [wizardOpen, setWizardOpen] = useState(false);

  if (shop.loading) {
    return (
      <main className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading…
      </main>
    );
  }
  if (shop.error) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <Alert appearance="critical" title="Couldn&apos;t load your shop">{shop.error}</Alert>
      </main>
    );
  }

  const existing = shop.data;
  const displayName = existing?.name ?? 'Your shop';
  const initials = existing ? existing.name.slice(0, 2).toUpperCase() : '?';

  function handlePublished(link: ProductLink) {
    setWizardOpen(false);
    void shop.refresh(); // pull the freshly-created shop name
    void links.refresh();
    void link;
  }

  function handleDeleted(id: string) {
    void links.refresh();
    void id;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[600px] flex-col gap-6 bg-background p-6 sm:p-8">
      <header className="flex items-center justify-between">
        <span className="text-lg font-semibold tracking-denser">Linkstand</span>
      </header>

      <div className="flex items-center gap-4">
        <Avatar fallback={initials} size="large" />
        <div className="flex flex-col gap-1">
          <span className="text-base font-semibold">{displayName}</span>
          <span className="text-sm text-muted-foreground">
            {existing ? 'Your product links' : 'Named when you publish your first product'}
          </span>
        </div>
      </div>

      <Button appearance="primary" size="large" fullWidth onClick={() => setWizardOpen(true)}>
        +  Add a product
      </Button>

      {links.loading && <div className="text-sm text-muted-foreground">Loading your links…</div>}
      {links.error && (
        <Alert appearance="critical" title="Couldn&apos;t load your links">{links.error}</Alert>
      )}
      {!links.loading && links.data && links.data.length === 0 && <EmptyState />}
      {!links.loading && links.data && links.data.length > 0 && (
        <LinkList links={links.data} onDeleted={handleDeleted} />
      )}

      <AddProductWizard
        open={wizardOpen}
        hasShop={!!existing}
        onClose={() => setWizardOpen(false)}
        onPublished={handlePublished}
      />
    </main>
  );
}
