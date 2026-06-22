import { getChannelToken, listProducts, listShops } from '@/lib/fourthwall';
import { handleError } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * GET /api/links — the dashboard's product list. Shop-bound.
 *
 * Listing needs a shop, so the dashboard shows the EmptyState until the first
 * publish provisions one — that is the intended first-run experience, not an
 * error. If no shop exists yet we return an empty list.
 */
export async function GET(): Promise<Response> {
  try {
    const token = await getChannelToken();
    // Shop lookup is shop-less; only the product list is shop-bound.
    const shops = await listShops(token);
    if (shops.length === 0) {
      return Response.json([]);
    }
    const links = await listProducts(token, shops[0].shopId);
    return Response.json(links);
  } catch (error) {
    return handleError(error);
  }
}
