import { getChannelToken, getCurrentChannel } from '@/lib/fourthwall';
import { handleError } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * GET /api/channel — the connected channel. Shop-less: forwards to the
 * channel-api `current` endpoint using the client-credentials channel bearer.
 */
export async function GET(): Promise<Response> {
  try {
    const token = await getChannelToken();
    const channel = await getCurrentChannel(token);
    return Response.json(channel);
  } catch (error) {
    return handleError(error);
  }
}
