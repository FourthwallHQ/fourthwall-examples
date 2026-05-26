"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@fourthwall-examples/ui";

/**
 * Disconnects the shop (POST /api/disconnect → unregister webhooks + forget the
 * token), then refreshes so the control page falls back to the connect state.
 */
export function DisconnectButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function disconnect() {
    setBusy(true);
    try {
      await fetch("/api/disconnect", { method: "POST" });
      router.refresh();
    } catch {
      setBusy(false);
    }
  }

  return (
    <Button appearance="destructive" onClick={disconnect} loading={busy}>
      Disconnect
    </Button>
  );
}
