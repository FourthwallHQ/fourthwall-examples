import { NextResponse } from "next/server";
import { channelApi, decodeDataUrl, putBytes, resolveRenderRegion } from "@/lib/fourthwall";
import { ensureConfigured, errorResponse } from "@/lib/http";
import type { PreviewRequest, PreviewResult } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * POST /api/previews — render instant mockups on the channel's bound shop
 * (channel-api: upload-url → media/images → previews).
 */
export async function POST(request: Request) {
  const notConfigured = ensureConfigured();
  if (notConfigured) return notConfigured;

  try {
    const body = (await request.json()) as PreviewRequest;
    if (!body.productTemplateId) {
      return NextResponse.json({ error: "A base product is required." }, { status: 400 });
    }

    const { bytes, contentType } = decodeDataUrl(body.artwork.dataUrl);

    // ── Register the artwork on the channel's bound shop (channel-api) ───────
    const { uploadUrl, fileUrl } = await channelApi.requestUploadUrl({
      contentType,
      fileName: body.artwork.fileName,
      size: bytes.length,
    });
    await putBytes(uploadUrl, bytes, contentType);
    const image = await channelApi.registerMediaImage({
      fileUrl,
      width: body.artwork.width,
      height: body.artwork.height,
    });

    // ── Synchronous preview render ──────────────────────────────────────────
    // Resolve the real render region from the product (the design pipeline
    // validates it case-sensitively — e.g. `default`, not `front`).
    // colors/sizes are likewise case-sensitive against the product's variant labels.
    const region = await resolveRenderRegion(body.productTemplateId, body.region);
    const preview = await channelApi.createPreview({
      productId: body.productTemplateId,
      regions: [
        {
          region,
          imageId: image.id,
          // No placementId + no fillAllPlacements ⇒ the design-pipeline resolves
          // PlacementStrategy.AUTO, which uses the product's own placement
          // automation (center-front for apparel, fill-all for mugs/stickers).
          // Forcing fillAllPlacements stamps the art on EVERY placement, which is
          // wrong for apparel — only set placementId to target one explicitly.
          placementId: body.placementId,
        },
      ],
      colors: body.colors.length ? body.colors : undefined,
      sizes: body.sizes.length ? body.sizes : undefined,
    });

    const result: PreviewResult = { mockups: preview.images.map((i) => i.url) };
    return NextResponse.json(result);
  } catch (e) {
    return errorResponse(e);
  }
}
