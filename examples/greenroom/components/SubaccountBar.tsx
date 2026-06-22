import Link from "next/link";
import { Avatar } from "@fourthwall-examples/ui";
import { initials } from "@/lib/format";

interface SubaccountBarProps {
  shopId: string;
  /** Shop name, when known from the roster link. */
  name?: string;
  /** The credential face this view operates through. */
  face: string;
}

/** Per-shop context bar — the load-bearing "acting as … · face" teaching cue. */
export function SubaccountBar({ shopId, name, face }: SubaccountBarProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border bg-card px-6 py-4">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Fleet
        </Link>
        <span className="text-border">/</span>
        <Avatar fallback={name ? initials(name) : "S"} size="medium" />
        <div className="leading-tight">
          <p className="text-base font-semibold text-foreground">{name ?? "Subaccount"}</p>
          <p className="font-mono text-xs text-muted-foreground">
            acting as {shopId} · {face}
          </p>
        </div>
      </div>
    </div>
  );
}
