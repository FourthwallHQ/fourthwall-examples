"use client";

import { useState } from "react";
import type { PublishRequest, PublishResult } from "@/lib/types";

/** F4 — register artwork, create, and publish a design product (open-api + X-ShopId). */
export function usePublish(shopId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PublishResult | null>(null);

  async function publish(req: PublishRequest): Promise<PublishResult | null> {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/shops/${shopId}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Failed (${res.status})`);
      setResult(data);
      return data as PublishResult;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setError(null);
  }

  return { publish, loading, error, result, reset };
}
