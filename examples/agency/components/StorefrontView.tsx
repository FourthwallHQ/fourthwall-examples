import { formatPrice } from "@/lib/format";
import type { StorefrontCollection, StorefrontShop } from "@/lib/storefront";

interface StorefrontViewProps {
  shop: StorefrontShop | null;
  collection: StorefrontCollection | null;
}

/** A shopper-style view of the live shop — no admin Live/Draft tags. */
export function StorefrontView({ shop, collection }: StorefrontViewProps) {
  const products = collection?.products ?? [];

  return (
    <div className="bg-background">
      <div className="border-b border-border px-6 py-10 text-center">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Official Store</p>
        <h2 className="text-2xl font-bold uppercase tracking-tight text-foreground">
          {shop?.name ?? "Store"}
        </h2>
      </div>

      {products.length === 0 ? (
        <p className="px-6 py-12 text-center text-sm text-muted-foreground">
          No products published yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-3">
          {products.map((product) => {
            const image = product.images[0]?.transformedUrl ?? product.images[0]?.url;
            const price = product.variants[0]?.unitPrice
              ? formatPrice(product.variants[0].unitPrice)
              : "—";
            return (
              <div key={product.id} className="space-y-2">
                <div className="aspect-square overflow-hidden rounded-control bg-muted">
                  {image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image}
                      alt={product.name}
                      className="size-full object-cover"
                    />
                  )}
                </div>
                <p className="text-sm font-medium text-foreground">{product.name}</p>
                <p className="text-sm text-muted-foreground">{price}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
