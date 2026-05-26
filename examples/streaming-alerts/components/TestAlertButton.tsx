"use client";

import { useState } from "react";
import { Button } from "@fourthwall-examples/ui";

/**
 * Fires a synthetic order alert (POST /api/test-alert) onto the connected shop's
 * channel, so the creator can confirm every connected overlay animates before
 * going live.
 */
export function TestAlertButton() {
  const [busy, setBusy] = useState(false);

  async function fire() {
    setBusy(true);
    try {
      await fetch("/api/test-alert", { method: "POST" });
    } catch {
      // Fire-and-forget; nothing actionable to surface here.
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button appearance="primary" onClick={fire} loading={busy}>
      Send test alert
    </Button>
  );
}
