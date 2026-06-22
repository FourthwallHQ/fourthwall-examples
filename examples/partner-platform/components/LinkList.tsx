'use client';

import { LinkRow } from './LinkRow';
import type { ProductLink } from '@/lib/types';

/**
 * LinkList — the creator's product links. The order shown is the creator's own
 * (drag handles are present; reordering is app-local until an ordering endpoint
 * is wired). Each row is a real Fourthwall product.
 */
export function LinkList({ links, onDeleted }: {
  links: ProductLink[];
  onDeleted: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {links.map((link) => (
        <LinkRow key={link.id} link={link} onDeleted={onDeleted} />
      ))}
    </div>
  );
}
