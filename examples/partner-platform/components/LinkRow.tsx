'use client';

import { useState } from 'react';
import { Button, Switch } from '@fourthwall-examples/ui';
import { useDeleteLink, useToggleVisibility } from '@/lib/hooks';
import type { ProductLink } from '@/lib/types';

/**
 * LinkRow — one product link. Thumbnail · title · price · show/hide switch ·
 * drag handle (reorder is app-local, not yet persisted). Delete archives the
 * product through the open-api. The visibility switch is applied optimistically.
 */
export function LinkRow({ link, onDeleted }: {
  link: ProductLink;
  onDeleted: (id: string) => void;
}) {
  const toggle = useToggleVisibility();
  const del = useDeleteLink();
  const [visible, setVisible] = useState(link.visible);
  const [confirming, setConfirming] = useState(false);

  async function handleToggle(next: boolean) {
    setVisible(next); // optimistic
    try {
      await toggle.toggle(link.id, next);
    } catch {
      setVisible(!next); // roll back
    }
  }

  async function handleDelete() {
    try {
      await del.remove(link.id);
      onDeleted(link.id);
    } catch {
      setConfirming(false);
    }
  }

  return (
    <div
      className={`flex items-center gap-4 rounded-panel border border-border bg-background p-4 ${!visible ? 'opacity-60' : ''}`}
    >
      <span aria-hidden className="cursor-grab text-base leading-none text-muted-foreground">⠿</span>
      <div className="size-13 shrink-0 overflow-hidden rounded-md bg-muted">
        {link.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={link.thumbnail} alt={link.title} className="size-full object-cover" />
        ) : (
          <div className="size-full bg-gradient-to-br from-muted to-muted/50" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-sm font-semibold">{link.title}</span>
        <span className="text-xs text-muted-foreground">
          {link.price || '—'}
          {!visible ? ' · Hidden' : ''}
        </span>
      </div>
      <Switch
        aria-label={`Show or hide ${link.title}`}
        checked={visible}
        disabled={toggle.loadingId === link.id}
        onChange={(e) => void handleToggle(e.target.checked)}
      />
      {confirming ? (
        <div className="flex items-center gap-2">
          <Button size="xsmall" appearance="destructive" loading={del.loadingId === link.id} onClick={handleDelete}>
            Confirm
          </Button>
          <Button size="xsmall" onClick={() => setConfirming(false)}>Cancel</Button>
        </div>
      ) : (
        <Button size="xsmall" aria-label="Delete" onClick={() => setConfirming(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          </svg>
        </Button>
      )}
    </div>
  );
}
