import { NextResponse } from "next/server";
import { defaultRegionFor, openApi } from "@/lib/fourthwall";
import { ensureConfigured, errorResponse } from "@/lib/http";
import type { ProductTemplate } from "@/lib/types";

export const dynamic = "force-dynamic";

/** GET /api/shops/:shopId/product-templates — base products for the F4 studio. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shopId: string }> },
) {
  const notConfigured = ensureConfigured();
  if (notConfigured) return notConfigured;

  try {
    const { shopId } = await params;
    const { results } = await openApi.listProductTemplates(shopId);
    const templates: ProductTemplate[] = results
      .filter((t) => t.supportsBackendRendering)
      .map((t) => ({
        id: t.productId,
        label: t.name,
        region: defaultRegionFor(t.productionMethod),
        productionMethod: t.productionMethod,
      }));
    return NextResponse.json(templates);
  } catch (e) {
    return errorResponse(e);
  }
}
