"use client";

import { useState } from "react";
import type { CreateShopRequest, OnboardResult } from "@/lib/types";

/** F2 — onboard a creator: create the subaccount shop (channel-api). */
export function useOnboard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OnboardResult | null>(null);

  async function onboard(req: CreateShopRequest): Promise<OnboardResult | null> {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/shops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Failed (${res.status})`);
      setResult(data);
      return data as OnboardResult;
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

  return { onboard, loading, error, result, reset };
}
