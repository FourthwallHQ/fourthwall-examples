"use client";

import { useEffect, useState } from "react";
import type { ProductTemplate } from "@/lib/types";

/** F4 — fetch the base-product templates the studio can render (open-api + X-ShopId). */
export function useProductTemplates(shopId: string) {
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetch(`/api/shops/${shopId}/product-templates`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `Failed (${res.status})`);
        }
        return res.json() as Promise<ProductTemplate[]>;
      })
      .then((list) => {
        if (!active) return;
        setTemplates(list);
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
  }, [shopId]);

  return { templates, loading, error };
}
