"use client";

import { useCallback, useEffect, useState } from "react";
import type { AgencyChannel, Shop } from "@/lib/types";

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}

/** F1 — identify the agency and list its fleet (channel-api). */
export function useFleet() {
  const [channel, setChannel] = useState<AgencyChannel | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Bumping nonce re-runs the fetch; setLoading(true) happens in refresh (an
  // event handler), never synchronously inside the effect.
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;

    Promise.all([fetch("/api/channel"), fetch("/api/shops")])
      .then(async ([chRes, shRes]) => {
        if (!chRes.ok) throw new Error(await readError(chRes, `channel → ${chRes.status}`));
        if (!shRes.ok) throw new Error(await readError(shRes, `shops → ${shRes.status}`));
        return Promise.all([
          chRes.json() as Promise<AgencyChannel>,
          shRes.json() as Promise<Shop[]>,
        ]);
      })
      .then(([ch, sh]) => {
        if (!active) return;
        setChannel(ch);
        setShops(sh);
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
  }, [nonce]);

  const refresh = useCallback(() => {
    setLoading(true);
    setNonce((n) => n + 1);
  }, []);

  return { channel, shops, loading, error, refresh };
}
