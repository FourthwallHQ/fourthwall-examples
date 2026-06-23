import { getChannelToken, listProducts } from '@/lib/fourthwall';
import { handleError } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * GET /api/links — the dashboard's product list. Shop-bound.
 *
 * The browser holds the shop id (localStorage) and sends it as `x-shop-id`.
 * Until the first publish there is no shop, so the header is absent and we
 * return an empty list — the dashboard shows the EmptyState, which is the
 * intended first-run experience, not an error.
 */
export async function GET(request: Request): Promise<Response> {
  try {
    const shopId = request.headers.get('x-shop-id');
    if (!shopId) {
      return Response.json([]);
    }
    const token = await getChannelToken();
    const links = await listProducts(token, shopId);
    return Response.json(links);
  } catch (error) {
    return handleError(error);
  }
}
