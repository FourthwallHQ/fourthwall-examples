import {
  createProduct,
  createShop,
  getChannelToken,
  listShops,
  openApiRegisterMediaImage,
  openApiRequestUploadUrl,
} from '@/lib/fourthwall';
import { handleError } from '@/lib/api';
import type { DesignRegion, ProductLink, PublishRequest } from '@/lib/types';

export const dynamic = 'force-dynamic';

/** Fallback shop name when the creator didn't name their shop. */
const DEFAULT_SHOP_NAME = 'My shop';

/**
 * POST /api/publish — the shop boundary. The one route that needs a shop, and
 * the one that provisions it.
 *
 * The browser sends multipart FormData carrying the RAW artwork file plus the
 * design inputs; this route orchestrates everything server-side so the single
 * call yields a live product:
 *
 *   1. Resolve the shop. The browser holds the shop id (localStorage) and sends
 *      it as the `shopId` FormData field once it has one — we use it directly.
 *      On the first publish there is none, so `POST /channel-api/v1.0/shops`
 *      provisions one; the resolved shop is returned to the client to persist,
 *      and every later publish reuses it (no duplicates).
 *   2. Re-upload the artwork INTO that shop via the open-api media flow:
 *      `POST /open-api/v1.0/upload-url` (X-ShopId) → signed PUT of the bytes →
 *      `POST /open-api/v1.0/media/images` (X-ShopId) → a shop-scoped imageId.
 *
 *      Why re-upload? `order` registers media images per shop. The channel-api
 *      imageId used for the (shop-less) preview is bound to the channel's OWN
 *      fixed shop, so it is not valid for create-product on the shop we just
 *      created. Re-registering by the channel image's permanent `uri` 404s
 *      ("No such object"); the reliable path is a fresh upload of the raw bytes.
 *   3. `POST /open-api/v1.0/products` (X-ShopId) — create the live product from
 *      the template + the shop-scoped imageId (+ colors/sizes).
 *
 * The PUT to the presigned URL happens here, server-side, so it carries the
 * exact `Content-Type` + `x-goog-content-length-range` headers GCS signed for
 * (or it 403s SignatureDoesNotMatch).
 *
 * Returns `{ link, shop }` — the new ProductLink for the dashboard to render,
 * plus the resolved shop so the browser can persist it to localStorage.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const form = await request.formData();

    const file = form.get('file');
    const productId = stringField(form, 'productId');
    const region = stringField(form, 'region');
    const name = stringField(form, 'name');
    if (!(file instanceof File) || !productId || !region || !name) {
      return Response.json({ error: 'invalid_request' }, { status: 400 });
    }

    const description = stringField(form, 'description');
    const profitMargin = numberField(form, 'profitMargin');
    const colors = jsonArrayField(form, 'colors');
    const sizes = jsonArrayField(form, 'sizes');
    const width = numberField(form, 'width');
    const height = numberField(form, 'height');

    const token = await getChannelToken();

    // 1. Resolve the shop. If the browser already has a shop it sends its id as
    //    the `shopId` field — use it directly. Otherwise provision: the creator
    //    names their shop in the wizard; that name is used here. We don't blindly
    //    create — the channel derives the shop domain from the name and rejects a
    //    duplicate — so first reuse an agency shop with the same name (idempotent
    //    across restarts), and only create when none exists. (`order` has no
    //    field to pass an explicit/unique subdomain.)
    const providedShopId = stringField(form, 'shopId');
    let shop: { id: string; name: string };
    if (providedShopId) {
      // The browser already knows the name; name is best-effort for the response.
      shop = { id: providedShopId, name: stringField(form, 'shopName') ?? '' };
    } else {
      const desiredName = stringField(form, 'shopName') ?? DEFAULT_SHOP_NAME;
      const existing = (await listShops(token)).find((s) => s.name === desiredName);
      if (existing) {
        shop = { id: existing.shopId, name: existing.name };
      } else {
        const created = await createShop(token, desiredName);
        shop = { id: created.shopId, name: created.shopName || desiredName };
      }
    }
    const shopId = shop.id;

    // 2. Re-upload the raw artwork bytes into the target shop's media library.
    const buf = Buffer.from(await file.arrayBuffer());
    const size = buf.byteLength;
    const contentType = file.type || 'image/png';

    const { uploadUrl, fileUrl } = await openApiRequestUploadUrl(token, shopId, {
      fileName: file.name,
      contentType,
      size,
    });

    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'x-goog-content-length-range': `0,${size}`,
      },
      body: buf,
    });
    if (!putRes.ok) {
      throw new Error(`Upload artwork to shop failed (${putRes.status}): ${await putRes.text()}`);
    }

    const imageId = await openApiRegisterMediaImage(token, shopId, {
      fileUrl,
      width: width ?? 0,
      height: height ?? 0,
    });

    // 3. Create the live product on that shop from the shop-scoped imageId.
    const regions: DesignRegion[] = [{ region, imageId }];
    const publishRequest: PublishRequest = {
      productId,
      regions,
      colors: colors.length ? colors : undefined,
      sizes: sizes.length ? sizes : undefined,
      name,
      description: description || undefined,
      profitMargin: profitMargin,
      publishOnCreate: true,
    };
    const link: ProductLink = await createProduct(token, shopId, publishRequest);
    return Response.json({ link, shop: { id: shop.id, name: shop.name } });
  } catch (error) {
    return handleError(error);
  }
}

/** Read a string FormData field, or `undefined` if absent / not a string. */
function stringField(form: FormData, key: string): string | undefined {
  const value = form.get(key);
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/** Read a numeric FormData field, or `undefined` if absent / not finite. */
function numberField(form: FormData, key: string): number | undefined {
  const raw = stringField(form, key);
  if (raw === undefined) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

/** Read a JSON-encoded string-array FormData field, defaulting to `[]`. */
function jsonArrayField(form: FormData, key: string): string[] {
  const raw = stringField(form, key);
  if (raw === undefined) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}
