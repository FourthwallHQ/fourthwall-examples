"use client";

import { useState } from "react";
import { Button } from "@fourthwall-examples/ui";

/**
 * Shows the OBS browser-source URL (`/overlay/:shopId`) and copies it with one
 * click. The shopId lives in the path so an OBS reload can't strip it.
 */
export function OverlayUrlCopy({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be unavailable on insecure origins; the field is selectable.
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-muted-foreground">Overlay URL (OBS browser source)</span>
      <div className="flex gap-2">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="min-w-0 flex-1 rounded-control border border-border bg-muted px-4 py-3 font-mono text-sm text-foreground outline-none"
        />
        <Button appearance="secondary" onClick={copy}>
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>
    </div>
  );
}
