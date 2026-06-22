import { Tag } from "@fourthwall-examples/ui";
import type { CatalogProduct } from "@/lib/types";

interface ProductCardProps {
  product: CatalogProduct;
}

/** A read-only catalog card — image, name, variant price, and a Live/Draft tag. */
export function ProductCard({ product }: ProductCardProps) {
  const isLive = product.access === "PUBLIC";
  const soldOut = product.state === "SOLD_OUT";

  return (
    <div className="flex flex-col overflow-hidden rounded-panel border border-border bg-card">
      <div className="aspect-square w-full bg-muted">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
            className="size-full object-cover"
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 text-sm font-semibold text-foreground">{product.name}</p>
          {isLive ? (
            <Tag appearance="success" size="small">
              Live
            </Tag>
          ) : (
            <Tag appearance="neutral" size="small">
              Draft
            </Tag>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-sm text-muted-foreground">{product.price}</span>
          {soldOut && (
            <Tag appearance="critical" size="small">
              Sold out
            </Tag>
          )}
        </div>
      </div>
    </div>
  );
}
