import { getChannelToken, setProductState } from '@/lib/fourthwall';
import { handleError, readJson } from '@/lib/api';

export const dynamic = 'force-dynamic';

interface StateRequest {
  visible: boolean;
}

/**
 * PUT /api/links/[id]/visibility — show or hide a product on the storefront.
 * Shop-bound: maps the dashboard's show/hide switch onto the open-api product
 * state (PUBLIC / HIDDEN).
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await params;
    const body = await readJson<StateRequest>(request);
    if (typeof body.visible !== 'boolean') {
      return Response.json({ error: 'invalid_request' }, { status: 400 });
    }
    const shopId = request.headers.get('x-shop-id');
    if (!shopId) return Response.json({ error: 'no_shop' }, { status: 409 });
    const token = await getChannelToken();
    await setProductState(token, shopId, id, body.visible);
    return Response.json({ id, visible: body.visible });
  } catch (error) {
    return handleError(error);
  }
}
