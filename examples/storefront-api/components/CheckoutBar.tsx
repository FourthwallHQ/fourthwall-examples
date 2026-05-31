"use client";

import { Button } from "@fourthwall-examples/ui";
import { useCart } from "../lib/cart";
import { useCheckout } from "../lib/checkout";
import { formatPrice } from "../lib/fourthwall";

export function CheckoutBar() {
  const { count, subtotal } = useCart();
  const { checkout, loading } = useCheckout();

  if (count === 0) return null;

  return (
    <Button appearance="primary" size="large" fullWidth loading={loading} onClick={checkout}>
      Checkout · {formatPrice(subtotal)}
    </Button>
  );
}
