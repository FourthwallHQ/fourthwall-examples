import { getConnection } from '@/lib/store';
import { getVerifiedShopId } from '@/lib/embeddedSettings';
import { updateGiftingConfig, type GiftingConfigUpdate } from '@/lib/fourthwall';

export const dynamic = 'force-dynamic';

/**
 * Save the shop's gifting rules through the public gifting-config API: the master
 * flag, entry time limit (20–180s), shipping policy, and giftable-products policy.
 * Authenticated by the signed embedded-settings params. Returns the saved config
 * (the server echoes the read-only `platform` slot) and caches the window length.
 */
export async function POST(request: Request) {
  const verified = getVerifiedShopId(request);
  if ('response' in verified) return verified.response;

  const connection = getConnection(verified.shopId);
  if (!connection) {
    return Response.json({ error: 'Shop is not connected' }, { status: 404 });
  }

  const body = (await request.json()) as GiftingConfigUpdate;
  try {
    const config = await updateGiftingConfig(connection.accessToken, body);
    connection.entryTimeLimitSeconds = config.entryTimeLimitSeconds;
    return Response.json(config);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save settings';
    return Response.json({ error: message }, { status: 502 });
  }
}
