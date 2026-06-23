import { getProductOptions } from '@/lib/fourthwall';
import { handleError } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * GET /api/templates/[productId] — the template's selectable options (renderable
 * regions + real colors + sizes). Like the template list this is a public
 * open-api endpoint, so it forwards anonymously (no channel bearer): a channel
 * token on an /open-api path would 403.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> },
): Promise<Response> {
  try {
    const { productId } = await params;
    const options = await getProductOptions(productId);
    return Response.json(options);
  } catch (error) {
    return handleError(error);
  }
}
