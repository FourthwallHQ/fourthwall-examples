import { getConnection } from '@/lib/store';
import { getVerifiedShopId } from '@/lib/embeddedSettings';
import { getStreamingStatus, startStreaming, endStreaming } from '@/lib/fourthwall';

export const dynamic = 'force-dynamic';

/**
 * Read or toggle the shop's live streaming status. The gift offer is only
 * purchasable on the storefront while the shop is live, so the operator cockpit
 * uses this to go live (and offline) when exercising the gift-while-live flow.
 * Authenticated by the signed embedded-settings params.
 *
 * NB: a real integration never sets this — the creator's streaming platform does.
 * It's a manual control here only so the flow is testable without a live stream.
 */
export async function GET(request: Request) {
  const verified = getVerifiedShopId(request);
  if ('response' in verified) return verified.response;

  const connection = getConnection(verified.shopId);
  if (!connection) {
    return Response.json({ error: 'Shop is not connected' }, { status: 404 });
  }

  try {
    return Response.json(await getStreamingStatus(connection.accessToken));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to read streaming status';
    return Response.json({ error: message }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const verified = getVerifiedShopId(request);
  if ('response' in verified) return verified.response;

  const connection = getConnection(verified.shopId);
  if (!connection) {
    return Response.json({ error: 'Shop is not connected' }, { status: 404 });
  }

  const { live } = (await request.json()) as { live: boolean };
  try {
    if (live) await startStreaming(connection.accessToken);
    else await endStreaming(connection.accessToken);
    return Response.json({ live });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update streaming status';
    return Response.json({ error: message }, { status: 502 });
  }
}
