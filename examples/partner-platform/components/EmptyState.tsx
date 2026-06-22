'use client';

/**
 * EmptyState — the first-run invitation, shown before the first publish
 * provisions a shop. Listing needs a shop, so an empty dashboard is the intended
 * first-run experience, not an error path.
 */
export function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-panel border border-dashed border-border bg-background px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-base font-semibold">No product links yet</span>
        <span className="text-sm text-muted-foreground">
          Add your first product — we&apos;ll set up your shop behind the scenes on publish.
        </span>
      </div>
    </div>
  );
}
