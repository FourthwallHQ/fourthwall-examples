"use client";

import { useEffect, useState } from "react";
import type { CatalogPage } from "@/lib/types";

export interface CatalogQuery {
  search: string;
  page: number;
  size: number;
}

/** F3 — browse the subaccount catalog (open-api + X-ShopId). */
export function useCatalog(shopId: string, query: CatalogQuery) {
  const [data, setData] = useState<CatalogPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { search, page, size } = query;

  useEffect(() => {
    let active = true;

    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("page", String(page));
    params.set("size", String(size));

    fetch(`/api/shops/${shopId}/products?${params}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `Failed (${res.status})`);
        }
        return res.json() as Promise<CatalogPage>;
      })
      .then((page_) => {
        if (!active) return;
        setData(page_);
        setError(null);
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [shopId, search, page, size]);

  return { data, loading, error };
}
