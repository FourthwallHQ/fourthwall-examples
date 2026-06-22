'use client';

import { useRef, useState } from 'react';
import { Alert, Button, Tag } from '@fourthwall-examples/ui';
import { useUploadArtwork } from '@/lib/hooks';
import type { WizardData } from './AddProductWizard';

/**
 * Step 2 — Add artwork. Shop-less: uploads through the channel-api (upload-url
 * presigned PUT, then register at /media/images). The registered imageId is
 * the one preview and publish reuse, so the previewed design is the design that
 * ships. Supports drag-and-drop and click-to-replace.
 */
export function StepArtwork({ data, patch }: { data: WizardData; patch: (p: Partial<WizardData>) => void }) {
  const { upload, loading, error, data: image } = useUploadArtwork();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const accepted =
    image
      ? { imageId: image.imageId, uri: image.uri, width: image.width, height: image.height, fileName: fileName ?? data.artwork?.fileName ?? '' }
      : data.artwork;

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const registered = await upload(file);
    setFileName(file.name);
    patch({
      artwork: {
        imageId: registered.imageId,
        uri: registered.uri,
        fileName: file.name,
        width: registered.width,
        height: registered.height,
      },
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {data.blueprint && (
        <div className="flex items-center gap-3 rounded-panel bg-muted p-3">
          <div className="size-9 shrink-0 overflow-hidden rounded-md bg-muted">
            {data.blueprint.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.blueprint.thumbnail} alt="" className="size-full object-cover" />
            ) : (
              <div className="size-full bg-muted" />
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            Adding artwork to <strong className="text-foreground">{data.blueprint.name}</strong>
          </span>
        </div>
      )}

      {error && <Alert appearance="critical">{error}</Alert>}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFile(e.dataTransfer.files?.[0]);
        }}
        className={`flex flex-col items-center gap-4 rounded-panel border-2 border-dashed p-8 ${
          dragging ? 'border-primary' : 'border-border'
        }`}
      >
        {accepted ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={accepted.uri}
              alt={accepted.fileName ?? 'artwork'}
              className="size-36 rounded-image object-cover shadow-lg"
            />
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold">{accepted.fileName}</span>
                <Tag appearance="success" size="small">Uploaded</Tag>
              </div>
              <span className="text-xs text-muted-foreground">
                {accepted.width} × {accepted.height} · registered to your media library
              </span>
            </div>
            <Button size="small" loading={loading} onClick={() => inputRef.current?.click()}>
              Replace artwork
            </Button>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center gap-2 text-center">
              <span className="text-base font-semibold">Drop artwork here</span>
              <span className="text-xs text-muted-foreground">PNG or JPG · the design printed on your product</span>
            </div>
            <Button loading={loading} onClick={() => inputRef.current?.click()}>
              Choose file
            </Button>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}
