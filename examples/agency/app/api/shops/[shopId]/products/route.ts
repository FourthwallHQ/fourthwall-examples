import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  decodeDataUrl,
  openApi,
  putBytes,
  resolveRenderRegion,
  type OfferFullV1,
} from "@/lib/fourthwall";
import { ensureConfigured, errorResponse } from "@/lib/http";
import { formatPrice } from "@/lib/format";
import type { CatalogPage, CatalogProduct, PublishRequest, PublishResult } from "@/lib/types";

export const dynamic = "force-dynamic";

function toCatalogProduct(o: OfferFullV1): CatalogProduct {
  const image = o.images[0]?.url ?? "";
  const firstVariant = o.variants[0];
  const price = firstVariant ? formatPrice(firstVariant.unitPrice) : "—";
  return {
    id: o.id,
    name: o.name,
    image,
    price,
    state: o.state.type,
    access: o.access.type,
  };
}

/** GET /api/shops/:shopId/products — subaccount catalog via open-api + X-ShopId. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> },
) {
  const notConfigured = ensureConfigured();
  if (notConfigured) return notConfigured;

  try {
    const { shopId } = await params;
    const sp = request.nextUrl.searchParams;
    const search = sp.get("search") ?? undefined;
    const page = sp.get("page") ? Number(sp.get("page")) : undefined;
    const size = sp.get("size") ? Number(sp.get("size")) : undefined;

    const page_ = await openApi.getProducts(shopId, { search, page, size });
    const body: CatalogPage = {
      results: page_.results.map(toCatalogProduct),
      page: page_.page ?? 0,
      size: page_.size ?? page_.results.length,
      total: page_.total ?? page_.results.length,
      totalPages: page_.totalPages ?? 1,
    };
    return NextResponse.json(body);
  } catch (e) {
    return errorResponse(e);
  }
}

/**
 * POST /api/shops/:shopId/products — register artwork on the subaccount, create
 * the design product, and publish (open-api + X-ShopId).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> },
) {
  const notConfigured = ensureConfigured();
  if (notConfigured) return notConfigured;

  try {
    const { shopId } = await params;
    const body = (await request.json()) as PublishRequest;
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Product name is required." }, { status: 400 });
    }
    if (!body.productTemplateId) {
      return NextResponse.json({ error: "A base product is required." }, { status: 400 });
    }

    const { bytes, contentType } = decodeDataUrl(body.artwork.dataUrl);

    // ── Register the artwork on the subaccount (open-api) ───────────────────
    // The design-create resolves the imageId on the X-ShopId shop, so a
    // bound-shop (channel-api) imageId won't satisfy it — register again here.
    const { uploadUrl, fileUrl } = await openApi.requestUploadUrl(shopId, {
      contentType,
      fileName: body.artwork.fileName,
      size: bytes.length,
    });
    await putBytes(uploadUrl, bytes, contentType);
    const image = await openApi.saveMediaImage(shopId, {
      fileUrl,
      width: body.artwork.width,
      height: body.artwork.height,
    });

    // ── Create the design product ───────────────────────────────────────────
    // No placementId + no fillAllPlacements ⇒ PlacementStrategy.AUTO: the
    // product's own placement automation (center-front for apparel, fill-all for
    // mugs/stickers). Forcing fillAllPlacements stamps every placement, wrong for
    // apparel — keep this in lockstep with the F4 preview region above.
    const region = {
      region: await resolveRenderRegion(body.productTemplateId, body.region, shopId),
      imageId: image.id,
      placementId: body.placementId,
    };
    const created = await openApi.createDesignProduct(shopId, {
      type: "design",
      productTemplateId: body.productTemplateId,
      regions: [region],
      colors: body.colors,
      sizes: body.sizes,
      name: body.name.trim(),
      publishOnCreate: body.publishOnCreate,
    });
    const productId = created.productId;
    if (!productId) {
      return NextResponse.json(
        { error: "Product was created but no productId was returned." },
        { status: 502 },
      );
    }

    // ── Publish when not published on create ────────────────────────────────
    let access = "PUBLIC";
    if (!body.publishOnCreate) {
      const published = await openApi.updateProductState(shopId, productId, "PUBLIC");
      access = published.access.type;
    }

    // Ensure the product is buyable (best-effort — never lose the product).
    try {
      await openApi.updateAvailability(shopId, productId, true);
    } catch {
      // Non-fatal: the product is live; sold-out can be toggled later.
    }

    const result: PublishResult = { productId, state: access };
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
