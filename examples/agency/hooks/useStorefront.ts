"use client";

import { useEffect, useState } from "react";
import { getStorefront, type StorefrontCollection, type StorefrontShop } from "@/lib/storefront";

/**
 * F5 — resolve the shop's browser-safe publicToken (server route), then read
 * the live storefront directly from the browser via the Storefront API.
 */
export function useStorefront(shopId: string) {
  const [token, setToken] = useState<string | null>(null);
  const [shop, setShop] = useState<StorefrontShop | null>(null);
  const [collection, setCollection] = useState<StorefrontCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await fetch(`/api/shops/${shopId}/public-token`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `public-token → ${res.status}`);
        }
        const { publicToken } = (await res.json()) as { publicToken: string };

        // Browser-safe read — no agency secret in play.
        const { shop, collection } = await getStorefront(publicToken);
        if (!active) return;
        setToken(publicToken);
        setShop(shop);
        setCollection(collection);
        setError(null);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [shopId]);

  return { token, shop, collection, loading, error };
}
