"use client";

import { Button } from "@fourthwall-examples/ui";
import { useCart } from "../lib/cart";
import { useCheckout } from "../lib/checkout";
import { formatPrice } from "../lib/fourthwall";

export function CartDrawer() {
  const { lines, subtotal, open, setOpen, setQuantity, remove } = useCart();
  const { checkout, loading } = useCheckout();

  return (
    <div
      className={`absolute inset-0 z-50 transition ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        onClick={() => setOpen(false)}
        className={`absolute inset-0 bg-overlay transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        className={`absolute right-0 top-0 flex h-full w-full flex-col bg-card shadow-2xl transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold">Your cart</h2>
          <button
            type="button"
            aria-label="Close cart"
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        {lines.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-5 text-center text-muted-foreground">
            Your cart is empty.
          </div>
        ) : (
          <ul className="flex-1 divide-y divide-border overflow-y-auto px-5">
            {lines.map((line) => (
              <li key={line.variantId} className="flex gap-3 py-4">
                <div className="size-16 shrink-0 overflow-hidden rounded-control bg-muted">
                  {line.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={line.image} alt={line.name} className="size-full object-cover" />
                  )}
                </div>
                <div className="flex flex-1 flex-col">
                  <p className="text-sm font-medium leading-tight">{line.name}</p>
                  <p className="text-sm text-muted-foreground">{line.variantName}</p>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => setQuantity(line.variantId, line.quantity - 1)}
                        className="flex size-7 items-center justify-center rounded-control border border-border hover:bg-muted"
                      >
                        −
                      </button>
                      <span className="w-5 text-center text-sm">{line.quantity}</span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() => setQuantity(line.variantId, line.quantity + 1)}
                        className="flex size-7 items-center justify-center rounded-control border border-border hover:bg-muted"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm font-medium">
                      {formatPrice({ value: line.price.value * line.quantity, currency: line.price.currency })}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Remove item"
                  onClick={() => remove(line.variantId)}
                  className="self-start text-muted-foreground hover:text-text-critical"
                >
                  <svg viewBox="0 0 24 24" className="size-4" fill="none">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}

        <footer className="space-y-3 border-t border-border px-5 py-4">
          <div className="flex items-center justify-between font-medium">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <Button
            appearance="primary"
            fullWidth
            size="large"
            loading={loading}
            disabled={lines.length === 0}
            onClick={checkout}
          >
            Checkout
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Secure checkout on Fourthwall
          </p>
        </footer>
      </aside>
    </div>
  );
}
