/**
 * Shared request / response shapes for Linkstand's BFF routes and client hooks.
 *
 * These are the app-facing contracts — the shapes the React components and
 * hooks exchange with `/api/*`. They are deliberately narrower than the raw
 * Fourthwall `order` payloads: each route handler translates the upstream
 * channel-api / open-api response into one of these so the client never sees
 * the backend's naming, and a contract change is a one-file edit in the route.
 */

/**
 * A blank product the creator can drop artwork onto — a Fourthwall product
 * template (`GET /open-api/v1.0/product-templates`). `productId` is the
 * template id (e.g. `pro_…`) threaded all the way through to publish, where it
 * becomes `productTemplateId` on the create-product call.
 */
export interface Blueprint {
  /** Template id, e.g. `pro_k66ZW4fsRm6c2def3itltA`. */
  productId: string;
  name: string;
  category: string;
  brand: string;
  /** Lowest renderable price, in minor-free units (e.g. `38.00`). */
  basePrice: number;
  currency: string;
  thumbnail: string | null;
  /**
   * Whether the design pipeline can render artwork onto this product
   * server-side. Templates with `false` (e.g. embroidery) can't be previewed or
   * published through this shop-less flow, so the picker disables them.
   */
  supportsBackendRendering: boolean;
  /** Production method, e.g. `DTG` / `EMBROIDERY` — shown as the reason a template is disabled. */
  productionMethod: string;
}

/** The presigned-upload ticket returned by `POST /api/upload-url`. */
export interface UploadTicket {
  /** Presigned URL the browser PUTs the raw file bytes to (goes straight to storage, not the BFF). */
  uploadUrl: string;
  /** The object URL the file lands at — passed back to `POST /api/media` to register it. */
  fileUrl: string;
}

/** A registered media-library image, returned by `POST /api/media`. */
export interface RegisteredImage {
  /** The media-library image id (e.g. `img_…`) — reused by preview and publish. */
  imageId: string;
  uri: string;
  width: number;
  height: number;
}

/**
 * A renderable design region on a product template — one of the surfaces
 * artwork can be placed on (e.g. `front_large_dtf`). Returned by
 * `GET /api/templates/{productId}`; `regionId` is the value sent as `region` in
 * preview and publish.
 */
export interface Region {
  regionId: string;
  name: string;
  placements: { id: string; name: string }[];
}

/** A selectable product color (name is what the create/preview APIs validate). */
export interface ProductColor {
  name: string;
  hex: string;
}

/**
 * A template's selectable options, from `GET /api/templates/{productId}`. Real
 * colors/sizes/regions for the picked product — the create-product call rejects
 * any color/size/region not on the product, so the wizard must use these.
 */
export interface ProductOptions {
  regions: Region[];
  colors: ProductColor[];
  sizes: string[];
}

/** One design region placed on the product. The same shape feeds preview and publish. */
export interface DesignRegion {
  /** Region name, e.g. `front` / `back`. */
  region: string;
  /** A registered media-library image id. */
  imageId: string;
}

/** Body for `POST /api/previews` — the exact inputs the preview is rendered from. */
export interface PreviewRequest {
  /** Template id the preview is rendered onto. */
  productId: string;
  /** Selected colors (hex/label as the channel-api expects); omitted ⇒ all. */
  colors?: string[];
  /** Selected sizes; omitted ⇒ all. */
  sizes?: string[];
  /** Artwork placements — at least one region with a registered imageId. */
  regions: DesignRegion[];
}

/** A single rendered preview image. */
export interface PreviewImage {
  url: string;
  color: string;
  size: string;
  style: string;
  region: string | null;
  width: number;
  height: number;
}

/** Result of `POST /api/previews`. */
export interface PreviewResult {
  /** Carried through to publish so what was previewed is what goes live. */
  customizationId: string | null;
  pipelineId: string;
  images: PreviewImage[];
}

/**
 * The shape `createProduct` builds for `POST /open-api/v1.0/products`.
 *
 * NOTE: `/api/publish` no longer receives this as a JSON body — the browser
 * sends multipart FormData carrying the raw artwork file, and the route
 * re-uploads it into the target shop and assembles this object internally (with
 * the freshly-registered, shop-scoped `imageId`). It remains the parameter shape
 * for `createProduct`.
 */
export interface PublishRequest {
  /** Template id (becomes `productTemplateId` on the open-api create). */
  productId: string;
  /** Artwork placements with shop-scoped media image ids (registered at publish time). */
  regions: DesignRegion[];
  colors?: string[];
  sizes?: string[];
  /** Product title. */
  name: string;
  description?: string;
  /**
   * Profit margin in USD applied on top of the template's base cost. Optional;
   * omitted ⇒ the creator takes the template default.
   */
  profitMargin?: number;
  /** List the product on the storefront immediately. Defaults to true for a links admin. */
  publishOnCreate?: boolean;
}

/**
 * A row on the dashboard — a live Fourthwall product. The dashboard model is
 * intentionally minimal: thumbnail · title · price · visible toggle · drag
 * handle. No analytics, no per-link stats.
 */
export interface ProductLink {
  id: string;
  title: string;
  description: string;
  /** Formatted price string, e.g. `$48.00`. */
  price: string;
  thumbnail: string | null;
  /** Whether the product is listed (`PUBLIC`) on the storefront. */
  visible: boolean;
}

/** The connected channel, surfaced by `GET /api/channel`. */
export interface Channel {
  id: string;
  name: string;
}

/** The shop this app has provisioned. Held client-side in localStorage (or `null`). */
export interface Shop {
  id: string;
  name: string;
}
