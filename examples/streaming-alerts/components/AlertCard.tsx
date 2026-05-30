import type { AlertPayload } from "@/lib/alert";

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2 3h2.2l2.1 12.4a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.2L20 7H5.3" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden fill="currentColor">
      <path d="M12 20.7 4.5 13a4.6 4.6 0 0 1 6.5-6.5l1 .9 1-.9A4.6 4.6 0 0 1 19.5 13Z" />
    </svg>
  );
}

/** Initials from a display name, e.g. "Alex R." → "AR". */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const letters = parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
  return letters || "?";
}

/**
 * One alert card: a thumbnail (or initials chip), an eyebrow with an icon, and a
 * line of "{name} · {amount}" over the product (order) or message (tip).
 *
 * Pure/presentational — the overlay drives the in/out animation by toggling the
 * `exiting` flag, which swaps the CSS keyframe class.
 */
export function AlertCard({ payload, exiting }: { payload: AlertPayload; exiting: boolean }) {
  const isOrder = payload.kind === "order";

  return (
    <div
      className={`${exiting ? "alert-card-exit" : "alert-card-enter"} flex w-[420px] max-w-[90vw] items-center gap-4 rounded-panel border border-border bg-card p-4 text-card-foreground shadow-[var(--shadow-300)]`}
    >
      {payload.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={payload.image}
          alt=""
          className="size-16 shrink-0 rounded-[var(--radius-brand)] object-cover"
        />
      ) : (
        <div className="flex size-16 shrink-0 items-center justify-center rounded-[var(--radius-brand)] bg-primary text-xl font-semibold text-primary-foreground">
          {initials(payload.name)}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-text-brand">
          {isOrder ? <CartIcon /> : <HeartIcon />}
          <span className="text-xs font-semibold uppercase tracking-wide">
            {isOrder ? "New order" : "New tip"}
          </span>
        </div>

        <p className="mt-1 truncate text-lg font-semibold">
          {payload.name}
          {payload.amount && (
            <span className="text-text-success"> · {payload.amount}</span>
          )}
        </p>

        <p className="truncate text-sm text-muted-foreground">{payload.detail}</p>
      </div>
    </div>
  );
}
