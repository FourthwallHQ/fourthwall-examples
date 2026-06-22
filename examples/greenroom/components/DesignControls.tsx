"use client";

import { useState } from "react";
import { Alert, Button, Card, CardBody, CardFooter, Input, Select, Switch } from "@fourthwall-examples/ui";
import { ArtworkUpload } from "./ArtworkUpload";
import type { ArtworkInput, PreviewRequest, ProductTemplate, PublishRequest } from "@/lib/types";

function parseList(text: string): string[] {
  return text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

interface DesignControlsProps {
  templates: ProductTemplate[];
  templatesLoading: boolean;
  onPreview: (req: PreviewRequest) => void;
  onPublish: (req: PublishRequest) => void;
  previewLoading: boolean;
  publishLoading: boolean;
  publishError: string | null;
}

/** The left panel — artwork, base product, placement/colors/sizes, publish toggle. */
export function DesignControls({
  templates,
  templatesLoading,
  onPreview,
  onPublish,
  previewLoading,
  publishLoading,
  publishError,
}: DesignControlsProps) {
  const [artwork, setArtwork] = useState<ArtworkInput | null>(null);
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [colorsText, setColorsText] = useState("");
  const [sizesText, setSizesText] = useState("");
  const [publishOnCreate, setPublishOnCreate] = useState(false);

  // Derive the effective selection during render (no syncing effect): once the
  // template list loads, fall back to the first if the user hasn't picked one.
  const effectiveTemplateId =
    templates.some((t) => t.id === templateId) ? templateId : (templates[0]?.id ?? "");
  const selectedTemplate = templates.find((t) => t.id === effectiveTemplateId);
  const region = selectedTemplate?.region;

  const colors = parseList(colorsText);
  const sizes = parseList(sizesText);
  const canPreview = Boolean(artwork && effectiveTemplateId);
  const canPublish = canPreview && name.trim().length > 0;

  function handlePreview() {
    if (!artwork || !effectiveTemplateId) return;
    onPreview({ productTemplateId: effectiveTemplateId, region, colors, sizes, artwork });
  }

  function handlePublish() {
    if (!artwork || !effectiveTemplateId || !name.trim()) return;
    onPublish({
      name: name.trim(),
      productTemplateId: effectiveTemplateId,
      region,
      colors,
      sizes,
      publishOnCreate,
      artwork,
    });
  }

  return (
    <Card>
      <CardBody className="space-y-5">
        <ArtworkUpload value={artwork} onChange={setArtwork} />

        <Input label="Product name" required value={name} placeholder="My Awesome Design Tee" onChange={(e) => setName(e.target.value)} />

        <Select label="Base product" value={effectiveTemplateId} onChange={(e) => setTemplateId(e.target.value)}>
          {templatesLoading && <option value="">Loading products…</option>}
          {!templatesLoading && templates.length === 0 && <option value="">No renderable products</option>}
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </Select>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Colors"
            value={colorsText}
            placeholder="Black, White"
            onChange={(e) => setColorsText(e.target.value)}
          />
          <Input
            label="Sizes"
            value={sizesText}
            placeholder="S, M, L"
            onChange={(e) => setSizesText(e.target.value)}
          />
        </div>
        <p className="-mt-2 text-xs text-muted-foreground">
          Case-sensitive against the product&apos;s variant labels. Leave empty to use all
          available colors / sizes.
        </p>

        <div className="border-t border-border pt-4">
          <Switch
            checked={publishOnCreate}
            onChange={(e) => setPublishOnCreate(e.target.checked)}
            label="Publish live on create"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Off → created hidden, then published to PUBLIC. On → published immediately.
          </p>
        </div>

        {publishError && (
          <Alert appearance="critical" title="Couldn&apos;t publish">
            {publishError}
          </Alert>
        )}
      </CardBody>
      <CardFooter>
        <Button appearance="secondary" loading={previewLoading} disabled={!canPreview} onClick={handlePreview}>
          Preview
        </Button>
        <Button appearance="primary" loading={publishLoading} disabled={!canPublish} onClick={handlePublish}>
          Create &amp; publish
        </Button>
      </CardFooter>
    </Card>
  );
}
