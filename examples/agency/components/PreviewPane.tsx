"use client";

import { Alert, Tag } from "@fourthwall-examples/ui";
import type { PreviewResult } from "@/lib/types";

interface PreviewPaneProps {
  loading: boolean;
  error: string | null;
  result: PreviewResult | null;
}

/** The live preview — synchronous mockups from the channel-api render. */
export function PreviewPane({ loading, error, result }: PreviewPaneProps) {
  return (
    <div className="flex h-full flex-col rounded-panel border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <p className="font-semibold text-foreground">Preview</p>
        {loading && <Tag appearance="brand">Rendering…</Tag>}
      </div>
      <div className="flex flex-1 items-center justify-center p-6">
        {error ? (
          <Alert appearance="critical" title="Preview failed">
            {error}
          </Alert>
        ) : loading ? (
          <div className="grid w-full grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-control bg-muted" />
            ))}
          </div>
        ) : result && result.mockups.length > 0 ? (
          <div className="grid w-full grid-cols-2 gap-4">
            {result.mockups.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url}
                alt={`Mockup ${i + 1}`}
                className="aspect-square w-full rounded-control border border-border object-contain"
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground">
            Upload artwork and choose a base product, then render a preview.
          </div>
        )}
      </div>
    </div>
  );
}
