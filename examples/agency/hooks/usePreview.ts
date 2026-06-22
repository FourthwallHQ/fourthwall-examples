"use client";

import { useState } from "react";
import type { PreviewRequest, PreviewResult } from "@/lib/types";

/** F4 — render an instant preview on the channel's bound shop (channel-api). */
export function usePreview() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PreviewResult | null>(null);

  async function preview(req: PreviewRequest): Promise<PreviewResult | null> {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/previews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Failed (${res.status})`);
      setResult(data);
      return data as PreviewResult;
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

  return { preview, loading, error, result, reset };
}
