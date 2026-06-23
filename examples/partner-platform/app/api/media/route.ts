import { getChannelToken, registerMediaImage } from '@/lib/fourthwall';
import { handleError, readJson } from '@/lib/api';
import type { RegisteredImage } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface MediaRequest {
  /** The object URL the uploaded file landed at (from POST /api/upload-url). */
  fileUrl: string;
  width: number;
  height: number;
}

/**
 * POST /api/media — register an uploaded image into the media library.
 * Shop-less. Returns the `imageId` reused by preview and publish so the
 * previewed design is the design that ships.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const body = await readJson<MediaRequest>(request);
    if (!body.fileUrl || typeof body.width !== 'number' || typeof body.height !== 'number') {
      return Response.json({ error: 'invalid_request' }, { status: 400 });
    }
    const token = await getChannelToken();
    const image: RegisteredImage = await registerMediaImage(token, body);
    return Response.json(image);
  } catch (error) {
    return handleError(error);
  }
}
