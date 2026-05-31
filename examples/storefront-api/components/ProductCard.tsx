"use client";

import { useState } from "react";
import { formatPrice, type Product, type Variant } from "../lib/fourthwall";
import { useCart } from "../lib/cart";

function uniqueBy<T>(items: (T | undefined)[], key: (t: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    if (!item) continue;
    const k = key(item);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
}

function variantLabel(v: Variant): string {
  return [v.attributes.color?.name, v.attributes.size?.name].filter(Boolean).join(" · ") || v.name;
}

export function ProductCard({ product }: { product: Product }) {
  const { add, lines } = useCart();
  const [picking, setPicking] = useState(false);

  const qtyInCart = lines
    .filter((l) => l.productId === product.id)
    .reduce((n, l) => n + l.quantity, 0);

  const image = product.images[0];
  const price = product.variants[0]?.unitPrice;

  const colors = uniqueBy(product.variants.map((v) => v.attributes.color), (c) => c.name);
  const sizes = uniqueBy(product.variants.map((v) => v.attributes.size), (s) => s.name);
  const [color, setColor] = useState<string | undefined>(colors[0]?.name);

  function variantFor(sizeName?: string): Variant {
    return (
      product.variants.find(
        (v) =>
          (colors.length === 0 || v.attributes.color?.name === color) &&
          (sizes.length === 0 || v.attributes.size?.name === sizeName),
      ) ?? product.variants[0]
    );
  }

  function commit(variant: Variant) {
    add({
      variantId: variant.id,
      productId: product.id,
      name: product.name,
      variantName: variantLabel(variant),
      image: image?.transformedUrl || image?.url,
      price: variant.unitPrice,
    });
    setPicking(false);
  }

  function onAddClick() {
    // No size/color choices to make — add the only variant straight away.
    if (sizes.length === 0) {
      commit(variantFor());
      return;
    }
    setPicking((p) => !p);
  }

  return (
    <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-muted shadow-sm">
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image.transformedUrl || image.url}
          alt={product.name}
          className="size-full object-cover"
        />
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 pr-14 pt-10">
        <p className="text-lg font-bold leading-tight text-white">{product.name}</p>
        {price && <p className="mt-0.5 text-sm font-medium text-white/80">{formatPrice(price)}</p>}
      </div>

      <button
        type="button"
        aria-label={
          qtyInCart > 0 ? `${product.name} (${qtyInCart} in cart) — add more` : `Add ${product.name} to cart`
        }
        onClick={onAddClick}
        className="absolute bottom-3 right-3 flex size-10 items-center justify-center rounded-full bg-card text-foreground shadow-md transition hover:scale-105"
      >
        {qtyInCart > 0 ? (
          <span className="text-sm font-bold">{qtyInCart}</span>
        ) : (
          <svg viewBox="0 0 24 24" className="size-5" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {picking && (
        <div className="absolute inset-0 flex flex-col bg-card/95 p-4 backdrop-blur-sm">
          <div className="flex items-start justify-between">
            <p className="text-sm font-semibold leading-tight">{product.name}</p>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setPicking(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {colors.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {colors.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  aria-label={c.name}
                  onClick={() => setColor(c.name)}
                  style={{ backgroundColor: c.swatch }}
                  className={`size-6 rounded-full border transition ${
                    color === c.name ? "ring-2 ring-ring ring-offset-1" : "border-border"
                  }`}
                />
              ))}
            </div>
          )}

          <p className="mt-3 text-xs font-medium text-muted-foreground">Select a size</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5 overflow-y-auto">
            {sizes.map((s) => (
              <button
                key={s.name}
                type="button"
                onClick={() => commit(variantFor(s.name))}
                className="min-w-9 rounded-control border border-border px-2.5 py-1.5 text-sm font-medium transition hover:bg-foreground hover:text-background"
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
