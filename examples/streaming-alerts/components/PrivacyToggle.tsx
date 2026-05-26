"use client";

import { useState } from "react";
import { Switch } from "@fourthwall-examples/ui";

/**
 * Toggles whether the supporter's real name is shown on the overlay or replaced
 * with "Anonymous". POSTs /api/privacy on change; the actual stripping happens
 * server-side in the receiver, so a name with privacy off never even reaches
 * the browser.
 */
export function PrivacyToggle({ initialShowName }: { initialShowName: boolean }) {
  const [showName, setShowName] = useState(initialShowName);
  const [saving, setSaving] = useState(false);

  async function onChange(next: boolean) {
    setShowName(next);
    setSaving(true);
    try {
      await fetch("/api/privacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showName: next }),
      });
    } catch {
      // Revert on failure so the toggle reflects server state.
      setShowName(!next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center justify-between border-t border-border pt-5">
      <div>
        <p className="text-base font-medium">Show supporter names</p>
        <p className="text-sm text-muted-foreground">
          When off, alerts show “Anonymous” instead of the real name.
        </p>
      </div>
      <Switch
        checked={showName}
        disabled={saving}
        onChange={(e) => onChange(e.currentTarget.checked)}
      />
    </div>
  );
}
