'use client';

import { useState } from 'react';
import { Alert, Avatar, Button } from '@fourthwall-examples/ui';
import { useChannel, useLinks } from '@/lib/hooks';
import type { ProductLink } from '@/lib/types';
import { AddProductWizard } from './AddProductWizard';
import { EmptyState } from './EmptyState';
import { LinkList } from './LinkList';

/**
 * Dashboard — the links admin. A neutral page header, a single primary
 * Add-a-product action, and the product link list. The channel bearer is
 * resolved server-side via the client-credentials grant, so there is no connect
 * step — the dashboard renders straight into the product list.
 */
export function Dashboard() {
  const channel = useChannel();
  const links = useLinks();
  const [wizardOpen, setWizardOpen] = useState(false);

  if (channel.loading) {
    return (
      <main className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading…
      </main>
    );
  }
  if (channel.error) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <Alert appearance="critical" title="Couldn&apos;t load your channel">{channel.error}</Alert>
      </main>
    );
  }

  const name = channel.data?.name ?? 'your channel';
  const initials = name.slice(0, 2).toUpperCase();

  function handlePublished(link: ProductLink) {
    // Optimistically prepend the new row and refresh to pull the real offer.
    setWizardOpen(false);
    void links.refresh();
    void link;
  }

  function handleDeleted(id: string) {
    // The list refreshes from the source of truth; a local filter avoids a flash.
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
          <span className="text-base font-semibold">{name}</span>
          <span className="text-sm text-muted-foreground">Your product links</span>
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
        onClose={() => setWizardOpen(false)}
        onPublished={handlePublished}
      />
    </main>
  );
}
