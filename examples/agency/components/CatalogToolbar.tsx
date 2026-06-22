import Link from "next/link";
import { Button, Input } from "@fourthwall-examples/ui";

interface CatalogToolbarProps {
  shopId: string;
  search: string;
  onSearch: (value: string) => void;
}

/** Search box + the Create product CTA that crosses into F4 (OFFER_WRITE). */
export function CatalogToolbar({ shopId, search, onSearch }: CatalogToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="w-full max-w-sm">
        <Input
          type="search"
          placeholder="Search products…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      <Link href={`/shops/${shopId}/products/new`}>
        <Button appearance="primary">Create product</Button>
      </Link>
    </div>
  );
}
