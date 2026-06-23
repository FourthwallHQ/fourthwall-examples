import { listProductTemplates } from '@/lib/fourthwall';
import { handleError } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * GET /api/templates — browse blank products. The template catalog is a public
 * open-api endpoint, so this forwards anonymously (no channel bearer): a
 * channel token on an /open-api path would 403 (order's gate requires a shop).
 * This is the one genuinely shop-less, credential-less route.
 */
export async function GET(): Promise<Response> {
  try {
    const templates = await listProductTemplates();
    return Response.json(templates);
  } catch (error) {
    return handleError(error);
  }
}
