"use client";

import { useState } from "react";
import { useCart } from "./cart";
import { startCheckout } from "../app/actions";

/** Turns the client cart into a Fourthwall cart and sends the buyer to checkout. */
export function useCheckout() {
  const { lines } = useCart();
  const [loading, setLoading] = useState(false);

  async function checkout() {
    if (lines.length === 0) return;
    setLoading(true);
    try {
      const url = await startCheckout(
        lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
      );
      window.location.href = url;
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  return { checkout, loading };
}
