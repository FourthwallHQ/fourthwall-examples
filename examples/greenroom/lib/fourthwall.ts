/**
 * Greenroom credential core — one confidential `channel.*` secret that
 * authenticates three different ways.
 *
 *   channel-api   → bearer token alone
 *   open-api      → bearer token + `X-ShopId` header
 *   publicToken   → browser-safe storefront token (minted per shop, see F5)
 *
 * The agency secret never reaches the browser: every channel-api / open-api
 * call goes through this server module, which mints the token and attaches it.
 */

// ── Configuration ───────────────────────────────────────────────────────────

const CLIENT_ID = process.env.FOURTHWALL_CHANNEL_CLIENT_ID;
const CLIENT_SECRET = process.env.FOURTHWALL_CHANNEL_CLIENT_SECRET;
const TOKEN_URL = process.env.FOURTHWALL_TOKEN_URL;
const API_URL = process.env.FOURTHWALL_API_URL ?? "https://api.fourthwall.com";

export function isConfigured(): boolean {
  return Boolean(CLIENT_ID && CLIENT_SECRET && TOKEN_URL && API_URL);
}

/** Error thrown when a Fourthwall API call fails — carries the upstream status. */
export class FourthwallError extends Error {
  constructor(
    public readonly status: number,
    public readonly path: string,
    public readonly detail: string,
  ) {
    super(`${path} → ${status}: ${detail.slice(0, 300)}`);
    this.name = "FourthwallError";
  }
}

// ── Token mint (client_credentials, HTTP Basic) ─────────────────────────────
//
// `client_secret_basic` — the id/secret go in an HTTP Basic Authorization
// header, NOT the request body. Posting the secret in the body returns
// `401 invalid_client`; this is the first thing integrators get wrong.

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getChannelAccessToken(): Promise<string> {
  // Reuse the token until a minute before it expires.
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  if (!CLIENT_ID || !CLIENT_SECRET || !TOKEN_URL) {
    throw new FourthwallError(
      500,
      "token",
      "Greenroom is not configured: set FOURTHWALL_CHANNEL_CLIENT_ID, FOURTHWALL_CHANNEL_CLIENT_SECRET, and FOURTHWALL_TOKEN_URL.",
    );
  }

  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new FourthwallError(res.status, "token", await res.text());
  }

  const body = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: body.access_token,
    expiresAt: Date.now() + body.expires_in * 1000,
  };
  return body.access_token;
}

// ── Low-level request helpers ───────────────────────────────────────────────

interface RequestOptions {
  method?: string;
  /** When set, attaches the `X-ShopId` header (the open-api face). */
  shopId?: string;
  /** JSON-serializable request body. */
  body?: unknown;
  /** Override the API base (unused here, reserved). */
  signal?: AbortSignal;
}

async function apiRequest<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const token = await getChannelAccessToken();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  if (opts.shopId) headers["X-ShopId"] = opts.shopId;
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
    signal: opts.signal,
  });

  if (!res.ok) {
    throw new FourthwallError(res.status, path, await res.text().catch(() => ""));
  }
  // 204 No Content
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/**
 * PUT raw artwork bytes to a presigned upload URL (S3-style). No auth header —
 * the URL itself is the credential.
 */
export async function putBytes(
  uploadUrl: string,
  bytes: Uint8Array<ArrayBuffer>,
  contentType: string,
): Promise<void> {
  // The presigned GCS URL is signed with `withContentType()` and an
  // `x-goog-content-length-range: 0,<size>` extension header, where <size> is
  // the byte length we declared in the upload-url request. The PUT must echo
  // both exactly or GCS returns 403 SignatureDoesNotMatch.
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "x-goog-content-length-range": `0,${bytes.length}`,
    },
    body: new Blob([bytes], { type: contentType }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new FourthwallError(res.status, uploadUrl, await res.text().catch(() => ""));
  }
}

/** Decode a base64 data URL to bytes (a fresh Uint8Array over a plain ArrayBuffer). */
export function decodeDataUrl(dataUrl: string): { bytes: Uint8Array<ArrayBuffer>; contentType: string } {
  const match = /^data:([^;]+);base64,([\s\S]*)$/.exec(dataUrl);
  if (!match) throw new FourthwallError(400, "artwork", "Artwork must be a base64 data URL.");
  return { bytes: new Uint8Array(Buffer.from(match[2], "base64")), contentType: match[1] };
}

// ── Wire types: channel-api ─────────────────────────────────────────────────

interface ChannelXResponse {
  id: string;
  name: string;
  keycloakClientId: string;
  createdAt: string;
}

interface ShopSummaryXResponse {
  shopId: string;
  name: string;
}

interface GetShopsXResponse {
  shops: ShopSummaryXResponse[];
}

interface PayoutXRequest {
  country?: string;
  businessType?: string;
  returnUrl: string;
  refreshUrl: string;
}

interface CreateShopXRequest {
  name: string;
  ownerEmail?: string;
  payout?: PayoutXRequest;
}

interface CreateShopXResponse {
  shopId: string;
  shopName: string;
  publicToken: string;
  invitationStatus?: string;
  invitationEmail?: string;
  payoutOnboardingUrl?: string;
}

interface UploadUrlRequest {
  contentType: string;
  fileName: string;
  size: number;
}

interface UploadUrlResponse {
  uploadUrl: string;
  fileUrl: string;
}

interface RegisterMediaImageRequest {
  fileUrl: string;
  width: number;
  height: number;
}

interface RegisterMediaImageResponse {
  id: string;
  uri: string;
  width: number;
  height: number;
}

interface PreviewRegionInput {
  region: string;
  imageId: string;
  placementId?: string;
  fillAllPlacements?: boolean;
}

interface CreatePreviewXRequest {
  productId: string;
  regions: PreviewRegionInput[];
  colors?: string[];
  sizes?: string[];
}

interface PreviewImage {
  url: string;
  color: string;
  size?: string;
  region?: string;
  style: string;
  width: number;
  height: number;
}

interface CreatePreviewXResponse {
  images: PreviewImage[];
  pipelineId: string;
  customizationId?: string;
}

// ── Wire types: open-api ────────────────────────────────────────────────────

interface SaveMediaImageRequestV1 {
  fileUrl: string;
  width: number;
  height: number;
}

interface MediaImageV1 {
  id: string;
  uri: string;
  width: number;
  height: number;
}

interface ProductDesignRegionV1 {
  region: string;
  imageId: string;
  placementId?: string;
  fillAllPlacements?: boolean;
}

interface CreateDesignProductRequestV1 {
  type: "design";
  productTemplateId: string;
  regions: ProductDesignRegionV1[];
  colors?: string[];
  sizes?: string[];
  name: string;
  description?: string;
  publishOnCreate?: boolean;
}

interface CreateProductResponseV1 {
  productId?: string;
  customizationId?: string;
}

interface UpdateProductStateV1Request {
  state: "PUBLIC" | "HIDDEN";
}

interface UpdateOfferAvailabilityV1Request {
  available: boolean;
}

interface PublicTokenResponse {
  token: string;
}

interface Money {
  value: number;
  currency: string;
}

interface OfferImage {
  id: string;
  url: string;
  width: number;
  height: number;
}

interface OfferVariantV1 {
  id: string;
  name: string;
  unitPrice: Money;
}

/** `state`/`access` are discriminated objects: `{ type: "AVAILABLE" }`. */
export interface OfferFullV1 {
  id: string;
  name: string;
  slug: string;
  description: string;
  state: { type: "AVAILABLE" | "SOLD_OUT" };
  access: { type: "PUBLIC" | "HIDDEN" | "PRIVATE" | "ARCHIVED" };
  images: OfferImage[];
  variants: OfferVariantV1[];
}

export interface OpenApiPageResponse<T> {
  results: T[];
  page?: number;
  size?: number;
  total?: number;
  totalPages?: number;
}

interface ProductTemplateSummaryWire {
  productId: string;
  name: string;
  productionMethod: string;
  supportsBackendRendering: boolean;
}

/** One customizable area of a product-template detail — `regionId` is the value
 * the design pipeline validates `region` against (case-sensitive). */
interface CustomizableAreaWire {
  regionId: string | null;
  available: boolean;
  supportsBackendRendering: boolean | null;
}

interface ProductTemplateDetailWire {
  productId: string;
  customizableAreas: CustomizableAreaWire[];
}

/**
 * The render `region` is template-specific (the renderer rejects an invalid
 * region and returns the valid ones). It follows the production method, so we
 * derive a sensible default front region from it.
 */
export function defaultRegionFor(productionMethod: string): string {
  switch (productionMethod) {
    case "DTFX":
      return "front_dtf";
    case "DTG":
    case "SUBLIMATION":
    case "EMBROIDERY":
    default:
      return "front";
  }
}

// ── channel-api client (token alone) ────────────────────────────────────────

export const channelApi = {
  /** F1 — identify the connected agency. */
  async getCurrentChannel(): Promise<ChannelXResponse> {
    return apiRequest<ChannelXResponse>("/channel-api/v1.0/channel/current");
  },

  /** F1 — the fleet roster (only { shopId, name } per shop). */
  async listShops(): Promise<GetShopsXResponse> {
    return apiRequest<GetShopsXResponse>("/channel-api/v1.0/shops");
  },

  /** F2 — create the subaccount shop (+ owner invite, optional payout). */
  async createShop(body: CreateShopXRequest): Promise<CreateShopXResponse> {
    return apiRequest<CreateShopXResponse>("/channel-api/v1.0/shops", {
      method: "POST",
      body,
    });
  },

  /** F4 — signed upload URL on the channel's bound shop (for the preview). */
  async requestUploadUrl(body: UploadUrlRequest): Promise<UploadUrlResponse> {
    return apiRequest<UploadUrlResponse>("/channel-api/v1.0/upload-url", {
      method: "POST",
      body,
    });
  },

  /** F4 — register artwork for the preview render. */
  async registerMediaImage(body: RegisterMediaImageRequest): Promise<RegisterMediaImageResponse> {
    return apiRequest<RegisterMediaImageResponse>("/channel-api/v1.0/media/images", {
      method: "POST",
      body,
    });
  },

  /** F4 — synchronous mockup render. */
  async createPreview(body: CreatePreviewXRequest): Promise<CreatePreviewXResponse> {
    return apiRequest<CreatePreviewXResponse>("/channel-api/v1.0/previews", {
      method: "POST",
      body,
    });
  },
};

// ── open-api client (token + X-ShopId) ──────────────────────────────────────

export const openApi = {
  /** F3 — browse the subaccount catalog. */
  async getProducts(
    shopId: string,
    params: { search?: string; page?: number; size?: number } = {},
  ): Promise<OpenApiPageResponse<OfferFullV1>> {
    const url = new URLSearchParams();
    if (params.search) url.set("search", params.search);
    if (params.page !== undefined) url.set("page", String(params.page));
    if (params.size !== undefined) url.set("size", String(params.size));
    const qs = url.toString();
    return apiRequest<OpenApiPageResponse<OfferFullV1>>(
      `/open-api/v1.0/products${qs ? `?${qs}` : ""}`,
      { shopId },
    );
  },

  /** F4 — signed upload URL on the target subaccount (needs CUSTOMIZATION_WRITE). */
  async requestUploadUrl(shopId: string, body: UploadUrlRequest): Promise<UploadUrlResponse> {
    return apiRequest<UploadUrlResponse>("/open-api/v1.0/media/upload-url", {
      method: "POST",
      shopId,
      body,
    });
  },

  /** F4 — register artwork on the subaccount → imageId (needs CUSTOMIZATION_WRITE). */
  async saveMediaImage(shopId: string, body: SaveMediaImageRequestV1): Promise<MediaImageV1> {
    return apiRequest<MediaImageV1>("/open-api/v1.0/media/images", {
      method: "POST",
      shopId,
      body,
    });
  },

  /** F4 — create the design product from the registered imageId. */
  async createDesignProduct(
    shopId: string,
    body: CreateDesignProductRequestV1,
  ): Promise<CreateProductResponseV1> {
    return apiRequest<CreateProductResponseV1>("/open-api/v1.0/products", {
      method: "POST",
      shopId,
      body,
    });
  },

  /** F4 — publish (→ PUBLIC) when not published on create. */
  async updateProductState(
    shopId: string,
    productId: string,
    state: "PUBLIC" | "HIDDEN",
  ): Promise<OfferFullV1> {
    return apiRequest<OfferFullV1>(
      `/open-api/v1.0/products/${encodeURIComponent(productId)}/state`,
      { method: "PUT", shopId, body: { state } satisfies UpdateProductStateV1Request },
    );
  },

  /** F4 — toggle sold-out. */
  async updateAvailability(
    shopId: string,
    productId: string,
    available: boolean,
  ): Promise<OfferFullV1> {
    return apiRequest<OfferFullV1>(
      `/open-api/v1.0/products/${encodeURIComponent(productId)}/availability`,
      {
        method: "PUT",
        shopId,
        body: { available } satisfies UpdateOfferAvailabilityV1Request,
      },
    );
  },

  /** F5 — get-or-create the shop's storefront publicToken (needs SHOP_READ). */
  async getOrCreatePublicToken(shopId: string): Promise<PublicTokenResponse> {
    return apiRequest<PublicTokenResponse>("/open-api/v1.0/public-token", {
      method: "PUT",
      shopId,
    });
  },

  /** F4 — list base-product templates the design pipeline can render. */
  async listProductTemplates(
    shopId: string,
  ): Promise<OpenApiPageResponse<ProductTemplateSummaryWire>> {
    return apiRequest<OpenApiPageResponse<ProductTemplateSummaryWire>>(
      "/open-api/v1.0/product-templates?size=50",
      { shopId },
    );
  },

  /** The product-template detail — carries `customizableAreas` (the real render
   * regions). Catalog-global (a public endpoint); `shopId` is optional. */
  async getProductTemplate(
    productId: string,
    shopId?: string,
  ): Promise<ProductTemplateDetailWire> {
    return apiRequest<ProductTemplateDetailWire>(
      `/open-api/v1.0/product-templates/${encodeURIComponent(productId)}`,
      shopId ? { shopId } : {},
    );
  },
};

/**
 * Resolve the render `region` from the product's customizable areas instead of
 * guessing from the production method. The design pipeline validates `region`
 * case-sensitively against these ids (e.g. a single-area product is `default`,
 * not `front`), so we read the real ids and prefer a renderable one. A caller's
 * `requested` region is honored only if it's actually valid for the product.
 */
export async function resolveRenderRegion(
  productId: string,
  requested?: string,
  shopId?: string,
): Promise<string> {
  const { customizableAreas } = await openApi.getProductTemplate(productId, shopId);
  const renderable = customizableAreas
    .filter((a) => a.regionId && a.available && a.supportsBackendRendering !== false)
    .map((a) => a.regionId as string);
  if (requested && renderable.includes(requested)) return requested;
  if (renderable.length) return renderable[0];
  const anyRegion = customizableAreas.find((a) => a.regionId)?.regionId;
  if (anyRegion) return anyRegion;
  throw new FourthwallError(
    400,
    `/open-api/v1.0/product-templates/${productId}`,
    "Product has no backend-renderable region.",
  );
}

// ── Convenience: register artwork on a face ─────────────────────────────────

export interface RegisteredImage {
  imageId: string;
  uri: string;
}

/**
 * Upload artwork bytes to a presigned URL and register it in a media library.
 * Returns the registered image id. Shared by both faces — the caller picks
 * channel-api or open-api by passing the right upload/register pair.
 */
export async function registerArtwork(
  bytes: Uint8Array<ArrayBuffer>,
  contentType: string,
  fileName: string,
  width: number,
  height: number,
  upload: (req: UploadUrlRequest) => Promise<UploadUrlResponse>,
  put: (uploadUrl: string, bytes: Uint8Array<ArrayBuffer>, contentType: string) => Promise<void>,
  register: (req: RegisterMediaImageRequest) => Promise<{ id: string; uri: string }>,
): Promise<RegisteredImage> {
  const { uploadUrl, fileUrl } = await upload({ contentType, fileName, size: bytes.length });
  await put(uploadUrl, bytes, contentType);
  const image = await register({ fileUrl, width, height });
  return { imageId: image.id, uri: image.uri };
}
