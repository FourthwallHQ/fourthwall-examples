import { getChannelToken, listProductTemplates } from '@/lib/fourthwall';
import { handleError } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * GET /api/templates — browse blank products. Shop-less: forwards to the
 * open-api product-templates list using the channel bearer alone.
 */
export async function GET(): Promise<Response> {
  try {
    const token = await getChannelToken();
    const templates = await listProductTemplates(token);
    return Response.json(templates);
  } catch (error) {
    return handleError(error);
  }
}
