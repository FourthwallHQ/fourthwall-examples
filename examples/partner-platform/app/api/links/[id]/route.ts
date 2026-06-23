import { deleteProduct, getChannelToken } from '@/lib/fourthwall';
import { handleError } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/links/[id] — archive a product. Shop-bound: maps the dashboard's
 * delete affordance onto the open-api product archive, on this app's shop. The
 * browser holds the shop id (localStorage) and sends it as `x-shop-id`.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await params;
    const shopId = request.headers.get('x-shop-id');
    if (!shopId) return Response.json({ error: 'no_shop' }, { status: 409 });
    const token = await getChannelToken();
    await deleteProduct(token, shopId, id);
    return Response.json({ id });
  } catch (error) {
    return handleError(error);
  }
}
