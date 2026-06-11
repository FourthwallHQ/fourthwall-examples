"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@fourthwall-examples/ui";

function initialsOf(label: string): string {
  return label
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

/** The logged-in shop pill; clicking it opens a small menu with Log out. */
export function UserMenu({
  shop,
  onLogout,
}: {
  shop: string | null;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const label = shop ?? "Connected";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex cursor-pointer items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3 transition-colors hover:bg-muted",
          open && "bg-muted",
        )}
      >
        <span className="flex size-6 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-muted-foreground">
          {initialsOf(shop ?? "Fourthwall")}
        </span>
        <span className="text-sm font-medium">{label}</span>
        <svg
          viewBox="0 0 16 16"
          className={cn("size-3 text-muted-foreground/70 transition-transform", open && "rotate-180")}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden
        >
          <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-10 mt-2 w-56 rounded-panel border border-border bg-background p-1.5 shadow-lg"
        >
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-muted-foreground">
              {initialsOf(shop ?? "Fourthwall")}
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium">{label}</span>
              <span className="text-xs text-muted-foreground">Fourthwall MCP session</span>
            </div>
          </div>
          <div className="my-1 border-t border-border" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="w-full cursor-pointer rounded-control px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
