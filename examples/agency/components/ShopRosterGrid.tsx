import { ShopCard } from "./ShopCard";
import type { Shop } from "@/lib/types";

interface ShopRosterGridProps {
  shops: Shop[];
}

/** The fleet roster — a full-width grid of shop cards (+ empty state). */
export function ShopRosterGrid({ shops }: ShopRosterGridProps) {
  if (shops.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-panel border border-dashed border-border bg-card px-6 py-20 text-center">
        <p className="text-lg font-semibold text-foreground">No managed shops yet</p>
        <p className="max-w-sm text-muted-foreground">
          Onboard your first creator to add a subaccount shop to the fleet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {shops.map((shop) => (
        <ShopCard key={shop.shopId} shop={shop} />
      ))}
    </div>
  );
}
