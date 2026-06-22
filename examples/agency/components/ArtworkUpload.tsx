"use client";

import { useRef, useState } from "react";
import { Alert, Button } from "@fourthwall-examples/ui";
import type { ArtworkInput } from "@/lib/types";

interface ArtworkUploadProps {
  value: ArtworkInput | null;
  onChange: (artwork: ArtworkInput | null) => void;
}

/** Picks an artwork file and reads it (as a base64 data URL + dimensions). */
export function ArtworkUpload({ value, onChange }: ArtworkUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setError(null);
    setLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new window.Image();
      img.onload = () => {
        onChange({
          dataUrl,
          fileName: file.name,
          contentType: file.type,
          size: file.size,
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
        setLoading(false);
      };
      img.onerror = () => {
        setError("Couldn't read the image dimensions.");
        setLoading(false);
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      setError("Couldn't read the file.");
      setLoading(false);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">Artwork</label>
      {value ? (
        <div className="flex items-center gap-3 rounded-control border border-border bg-muted p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value.dataUrl} alt={value.fileName} className="size-12 rounded-control object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{value.fileName}</p>
            <p className="font-mono text-xs text-muted-foreground">
              {value.width}×{value.height} · registered
            </p>
          </div>
          <Button appearance="semi-transparent" size="small" onClick={() => inputRef.current?.click()}>
            Replace
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center gap-1 rounded-control border border-dashed border-border bg-muted px-4 py-8 text-sm text-muted-foreground transition-colors hover:border-input-hover hover:text-foreground"
        >
          {loading ? "Reading…" : "Click to upload artwork"}
          <span className="text-xs">PNG / JPG — the design to render on the product</span>
        </button>
      )}
      {error && <Alert appearance="critical">{error}</Alert>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
