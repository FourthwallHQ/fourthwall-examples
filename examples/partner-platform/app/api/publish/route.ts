import { createProduct, createShop, getChannelToken, listShops } from '@/lib/fourthwall';
import { handleError, readJson } from '@/lib/api';
import type { ProductLink, PublishRequest } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/publish — the shop boundary. The one route that needs a shop.
 *
 * Sequence, all server-side so the client makes a single call:
 *   1. `GET /channel-api/v1.0/shops` — does the channel have a shop yet?
 *   2. `POST /channel-api/v1.0/shops` — only on first publish (idempotent: a
 *      second publish reuses the same shop, never a duplicate).
 *   3. `POST /open-api/v1.0/products` (X-ShopId) — create the live product from
 *      the exact `productId` + `imageId` (+ colors/sizes) the preview was
 *      rendered from.
 *
 * Returns the new ProductLink for the dashboard to render.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const body = await readJson<PublishRequest>(request);
    if (!body.productId || !body.name || !Array.isArray(body.regions) || body.regions.length === 0) {
      return Response.json({ error: 'invalid_request' }, { status: 400 });
    }

    const token = await getChannelToken();

    // 1. Look up the channel's shops first — only provision when none exist.
    const shops = await listShops(token);
    let shopId = shops[0]?.shopId;

    // 2. First publish: provision exactly one shop behind the scenes.
    if (!shopId) {
      const created = await createShop(token, 'Linkstand Shop');
      shopId = created.shopId;
    }

    // 3. Create the product scoped to that shop (X-ShopId).
    const link: ProductLink = await createProduct(token, shopId, body);
    return Response.json(link);
  } catch (error) {
    return handleError(error);
  }
}
