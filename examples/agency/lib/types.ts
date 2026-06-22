/**
 * Greenroom app-level data shapes — the request/response bodies the route
 * handlers accept and return, and the hooks/components consume.
 *
 * These are Greenroom's own contract, deliberately leaner than the raw
 * `order` API: the route handlers translate between these and the channel-api /
 * open-api wire types (see `lib/fourthwall.ts`).
 */

// ── F1 · agency session & fleet roster ──────────────────────────────────────

/** The connected agency channel (from `GET /channel-api/v1.0/channel/current`). */
export interface AgencyChannel {
  id: string;
  name: string;
}

/** A managed subaccount shop. The channel-api shops list returns only this. */
export interface Shop {
  shopId: string;
  name: string;
}

// ── F2 · onboard a creator ──────────────────────────────────────────────────

/** Minimal payout input the operator fills in; Greenroom adds returnUrl/refreshUrl. */
export interface PayoutInput {
  country: string;
  businessType: string;
}

export interface CreateShopRequest {
  name: string;
  /** Optional owner email — sends an owner invitation. */
  ownerEmail?: string;
  /** When set, kicks off Fourthwall's hosted payout onboarding. */
  payout?: PayoutInput;
}

export interface OnboardResult {
  shopId: string;
  shopName: string;
  /** `Invited` / `Failed` when an owner email was supplied. */
  invitationStatus?: string;
  invitationEmail?: string;
  /** Hosted payout onboarding link to copy-and-send to the creator. */
  payoutOnboardingUrl?: string;
  /** Browser-safe storefront token — captured for F5. */
  publicToken: string;
}

// ── F3 · subaccount catalog ─────────────────────────────────────────────────

/** A read-only catalog card derived from an open-api `OfferFullV1`. */
export interface CatalogProduct {
  id: string;
  name: string;
  image: string;
  /** Formatted variant unit price, e.g. `$24.99`. */
  price: string;
  /** Availability: `AVAILABLE` | `SOLD_OUT`. */
  state: string;
  /** Visibility: `PUBLIC` | `HIDDEN` | `PRIVATE` | `ARCHIVED`. */
  access: string;
}

export interface CatalogPage {
  results: CatalogProduct[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

// ── F4 · design & publish ───────────────────────────────────────────────────

/**
 * Artwork carried from the browser as a base64 data URL. The route handlers
 * upload it (upload-url → PUT bytes → media/images) on each face — channel-api
 * for the preview, open-api for the publish — because the design-create
 * resolves the imageId on the X-ShopId shop.
 */
export interface ArtworkInput {
  dataUrl: string;
  fileName: string;
  contentType: string;
  size: number;
  width: number;
  height: number;
}

export interface PreviewRequest {
  productTemplateId: string;
  /** Template-specific region (e.g. `front` for DTG, `front_dtf` for DTFX). */
  region?: string;
  placementId?: string;
  colors: string[];
  sizes: string[];
  artwork: ArtworkInput;
}

export interface PreviewResult {
  mockups: string[];
}

export interface PublishRequest {
  name: string;
  productTemplateId: string;
  /** Template-specific region (e.g. `front` for DTG, `front_dtf` for DTFX). */
  region?: string;
  placementId?: string;
  colors?: string[];
  sizes?: string[];
  /** Publish immediately; otherwise created hidden then transitioned to PUBLIC. */
  publishOnCreate?: boolean;
  artwork: ArtworkInput;
}

/** A base-product template the studio can render a design onto. */
export interface ProductTemplate {
  id: string;
  label: string;
  /** Valid render region for this template's production method. */
  region: string;
  productionMethod: string;
}

export interface PublishResult {
  productId: string;
  /** Final visibility — `PUBLIC` once published. */
  state: string;
}

// ── F5 · creator storefront ─────────────────────────────────────────────────

export interface PublicTokenResult {
  publicToken: string;
}
