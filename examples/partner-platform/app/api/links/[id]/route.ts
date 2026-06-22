import { deleteProduct, getChannelToken, listShops } from '@/lib/fourthwall';
import { handleError } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/links/[id] — archive a product. Shop-bound: maps the dashboard's
 * delete affordance onto the open-api product archive.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await params;
    const token = await getChannelToken();
    const shops = await listShops(token);
    const shopId = shops[0]?.shopId;
    if (!shopId) return Response.json({ error: 'no_shop' }, { status: 409 });
    await deleteProduct(token, shopId, id);
    return Response.json({ id });
  } catch (error) {
    return handleError(error);
  }
}
