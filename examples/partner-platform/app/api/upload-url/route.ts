import { getChannelToken, requestUploadUrl } from '@/lib/fourthwall';
import { handleError, readJson } from '@/lib/api';
import type { UploadTicket } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface UploadUrlRequest {
  contentType: string;
  fileName: string;
  size: number;
}

/**
 * POST /api/upload-url — request a presigned upload URL for artwork. Shop-less.
 * The browser PUTs the raw file to the returned `uploadUrl` (straight to
 * storage), then hands the `fileUrl` to POST /api/media to register it.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const body = await readJson<UploadUrlRequest>(request);
    if (!body.contentType || !body.fileName || typeof body.size !== 'number') {
      return Response.json({ error: 'invalid_request' }, { status: 400 });
    }
    const token = await getChannelToken();
    const ticket: UploadTicket = await requestUploadUrl(token, body);
    return Response.json(ticket);
  } catch (error) {
    return handleError(error);
  }
}
