"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { Money } from "./fourthwall";

export interface CartLine {
  variantId: string;
  productId: string;
  name: string;
  variantName: string;
  image?: string;
  price: Money;
  quantity: number;
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotal: Money;
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((n, l) => n + l.quantity, 0);
    const subtotal: Money = {
      value: lines.reduce((sum, l) => sum + l.price.value * l.quantity, 0),
      currency: lines[0]?.price.currency ?? "USD",
    };

    return {
      lines,
      count,
      subtotal,
      open,
      setOpen,
      add: (line, quantity = 1) =>
        setLines((prev) => {
          const existing = prev.find((l) => l.variantId === line.variantId);
          if (existing) {
            return prev.map((l) =>
              l.variantId === line.variantId ? { ...l, quantity: l.quantity + quantity } : l,
            );
          }
          return [...prev, { ...line, quantity }];
        }),
      setQuantity: (variantId, quantity) =>
        setLines((prev) =>
          quantity <= 0
            ? prev.filter((l) => l.variantId !== variantId)
            : prev.map((l) => (l.variantId === variantId ? { ...l, quantity } : l)),
        ),
      remove: (variantId) => setLines((prev) => prev.filter((l) => l.variantId !== variantId)),
      clear: () => setLines([]),
    };
  }, [lines, open]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
