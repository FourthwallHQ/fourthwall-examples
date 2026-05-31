"use client";

import type { Collection } from "../lib/fourthwall";
import { CartProvider } from "../lib/cart";
import { ProductCarousel } from "./ProductCarousel";
import { CartButton } from "./CartButton";
import { CartDrawer } from "./CartDrawer";
import { CheckoutBar } from "./CheckoutBar";

/**
 * The Fourthwall shop embed: a self-contained widget holding the carousel, cart
 * icon, and checkout button. Everything cart-related is scoped here, so it
 * behaves like a real embed dropped onto a host "link in bio" page.
 */
export function EmbedWidget({ collection }: { collection: Collection }) {
  return (
    <CartProvider>
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
        <div className="space-y-4 p-4">
          <ProductCarousel collection={collection} />
          <CheckoutBar />
        </div>
        <CartButton />
        <CartDrawer />
      </div>
    </CartProvider>
  );
}
