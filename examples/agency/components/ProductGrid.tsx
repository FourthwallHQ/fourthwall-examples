import { ProductCard } from "./ProductCard";
import type { CatalogProduct } from "@/lib/types";

interface ProductGridProps {
  products: CatalogProduct[];
}

/** The catalog grid (read-only here — the credential carries OFFER_READ). */
export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-panel border border-dashed border-border bg-card px-6 py-16 text-center text-muted-foreground">
        No products in this catalog yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
