"use client";

import { useCart } from "../lib/cart";

export function CartButton() {
  const { count, setOpen } = useCart();

  return (
    <button
      type="button"
      aria-label={`Open cart (${count} items)`}
      onClick={() => setOpen(true)}
      className="absolute right-4 top-4 z-40 flex size-11 items-center justify-center rounded-full bg-card text-foreground shadow-md transition hover:scale-105"
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none">
        <path
          d="M6 7h12l-1 12H7L6 7zm3 0a3 3 0 0 1 6 0"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground">
          {count}
        </span>
      )}
    </button>
  );
}
