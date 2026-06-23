import { createPreview, getChannelToken } from '@/lib/fourthwall';
import { handleError, readJson } from '@/lib/api';
import type { PreviewRequest, PreviewResult } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/previews — render live preview images, synchronously, with no shop.
 * Forwards to the channel-api preview endpoint with the channel bearer alone.
 * This is the shop-less high point: the creator sees a real render before any
 * shop exists.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const body = await readJson<PreviewRequest>(request);
    if (!body.productId || !Array.isArray(body.regions) || body.regions.length === 0) {
      return Response.json({ error: 'invalid_request' }, { status: 400 });
    }
    const token = await getChannelToken();
    const result: PreviewResult = await createPreview(token, body);
    return Response.json(result);
  } catch (error) {
    return handleError(error);
  }
}
