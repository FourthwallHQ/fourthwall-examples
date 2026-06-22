import Link from "next/link";
import { Avatar, Button, Tag } from "@fourthwall-examples/ui";
import { initials } from "@/lib/format";
import type { Shop } from "@/lib/types";

interface ShopCardProps {
  shop: Shop;
}

/** A managed subaccount — avatar (initials), name, shopId, and per-shop actions. */
export function ShopCard({ shop }: ShopCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-panel border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <Avatar fallback={initials(shop.name)} size="large" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-foreground">{shop.name}</p>
          <p className="truncate font-mono text-xs text-muted-foreground">{shop.shopId}</p>
        </div>
        <Tag appearance="brand">Subaccount</Tag>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href={`/shops/${shop.shopId}/catalog?name=${encodeURIComponent(shop.name)}`}>
          <Button appearance="secondary" size="small">
            View catalog →
          </Button>
        </Link>
        <Link href={`/shops/${shop.shopId}/products/new?name=${encodeURIComponent(shop.name)}`}>
          <Button appearance="semi-transparent" size="small">
            Design
          </Button>
        </Link>
        <Link href={`/shops/${shop.shopId}/storefront?name=${encodeURIComponent(shop.name)}`}>
          <Button appearance="semi-transparent" size="small">
            Storefront
          </Button>
        </Link>
      </div>
    </div>
  );
}
