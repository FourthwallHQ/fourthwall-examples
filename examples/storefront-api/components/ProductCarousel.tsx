"use client";

import { useRef } from "react";
import type { Collection } from "../lib/fourthwall";
import { ProductCard } from "./ProductCard";

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-5">
      <path
        d={dir === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProductCarousel({ collection }: { collection: Collection }) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollBy(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * (track.clientWidth * 0.6), behavior: "smooth" });
  }

  return (
    <section className="space-y-3">
      <div className="flex justify-center">
        <span className="rounded-full bg-card px-5 py-2 text-base font-semibold shadow-sm">
          {collection.name}
        </span>
      </div>

      <div className="relative">
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scrollBy(-1)}
          className="absolute -left-3 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-card text-foreground shadow-md transition hover:scale-105"
        >
          <Chevron dir="left" />
        </button>

        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {collection.products.map((product) => (
            <div key={product.id} className="w-[60%] shrink-0 snap-start sm:w-[45%]">
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scrollBy(1)}
          className="absolute -right-3 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-card text-foreground shadow-md transition hover:scale-105"
        >
          <Chevron dir="right" />
        </button>
      </div>
    </section>
  );
}
