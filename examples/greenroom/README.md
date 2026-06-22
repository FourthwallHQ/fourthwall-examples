# Greenroom — the agency Channel API example

Greenroom is a working agency console: a single integrator-facing app an operator
can read end-to-end to learn the **agency-credentialed Channel API**. One
confidential `channel.*` credential operates a whole fleet of subaccount shops,
and Greenroom demonstrates the model no existing example covers — **one secret
that authenticates three different ways** depending on the call.

| Face | Authenticates with | Operates on | Used by |
| --- | --- | --- | --- |
| **channel-api** | bearer token alone | the agency channel + its bound shop | F1, F2, F4 (preview) |
| **open-api** | bearer token + `X-ShopId` header | one ownership-checked subaccount | F3, F4 (publish), F5 (token) |
| **publicToken** | a browser-safe storefront token | the live shop, read-only | F5 |

The agency secret **never reaches the browser**. Every `channel-api` and
`open-api` call goes through a Next.js route handler that mints the token
server-side and attaches it; only the `publicToken` read runs from the browser.

## Five features, mapped to the three faces

1. **F1 — Fleet home** (`/`): identify the connected agency and list its fleet.
   `GET /channel-api/v1.0/channel/current` + `GET /channel-api/v1.0/shops`.
2. **F2 — Onboard a creator** (modal): create a subaccount shop, invite the
   owner, optionally start payout onboarding. `POST /channel-api/v1.0/shops`.
3. **F3 — Subaccount catalog** (`/shops/:shopId/catalog`): browse one shop's
   products, scoped by `X-ShopId`. `GET /open-api/v1.0/products`.
4. **F4 — Design & publish** (`/shops/:shopId/products/new`): the one flow that
   touches **two faces** — render an instant preview on the channel's bound shop
   (`channel-api`), then register the artwork again on the subaccount and publish
   (`open-api` + `X-ShopId`).
5. **F5 — Creator storefront** (`/shops/:shopId/storefront`): the live public
   shop, read from the browser with the shop's `publicToken`. `PUT
   /open-api/v1.0/public-token` (server) → Storefront API (browser).

## Setup

Copy `.env.example` to `.env.local` and fill in the staging `channel.*`
credentials:

```bash
cp .env.example .env.local
```

| Variable | Face | Purpose |
| --- | --- | --- |
| `FOURTHWALL_CHANNEL_CLIENT_ID` | channel-api / open-api | The agency client id |
| `FOURTHWALL_CHANNEL_CLIENT_SECRET` | channel-api / open-api | The agency client secret |
| `FOURTHWALL_TOKEN_URL` | channel-api / open-api | Keycloak `client_credentials` token endpoint |
| `FOURTHWALL_API_URL` | channel-api / open-api | Base URL for both APIs |
| `NEXT_PUBLIC_FOURTHWALL_STOREFRONT_API_URL` | publicToken | Storefront API base (browser) |

> F4's base products are fetched live from `GET /open-api/v1.0/product-templates`
> (filtered to `supportsBackendRendering`), so there's no template env var.

From the repo root:

```bash
pnpm install
pnpm --filter greenroom dev   # http://localhost:3000
```

## The credential core (`lib/fourthwall.ts`)

### The token mint — HTTP Basic, not body credentials

The `client_credentials` grant sends the id/secret as `client_secret_basic`
(HTTP Basic). Posting the secret in the request body returns `401
invalid_client` — the first thing integrators get wrong, so Greenroom pins it
down:

```ts
const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
fetch(TOKEN_URL, {
  method: "POST",
  headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ grant_type: "client_credentials" }),
});
```

The token is cached until a minute before it expires.

### The two clients

- `channelApi` — attaches `Authorization: Bearer <token>` only.
- `openApi` — attaches the bearer **and** the `X-ShopId` header for the target
  subaccount. `X-ShopId` is ownership-checked upstream: a missing or unowned shop
  id is rejected, so the catalog only ever shows a shop the agency manages.

## F4 — the two-face flow, and why artwork is registered twice

F4 is the load-bearing example. The artwork is registered **twice across two
faces**:

1. **Preview (channel-api):** `upload-url` → `PUT bytes` → `media/images` →
   `previews` on the channel's bound shop. Synchronous mockups come back.
2. **Publish (open-api + `X-ShopId`):** `media/upload-url` → `PUT bytes` →
   `media/images` **again on the subaccount** → `products` (type `design`) →
   `products/{id}/state` (`PUBLIC`).

The bound-shop `imageId` from the preview is **not** valid for the design-create —
that resolves the `imageId` on the `X-ShopId` shop, so the publish path must
register the media again on the subaccount.

Two gotchas the implementation handles:

- **The `region` is template-specific.** The renderer rejects an invalid region
  and returns the valid ones — `front` for DTG, `front_dtf` for DTFX, etc.
  Greenroom derives the region from the template's `productionMethod`.
- **`colors` / `sizes` are case-sensitive** against the product's variant labels,
  or the render comes back empty. Leave them empty to use all available.
- **`publishOnCreate`** controls whether the product is created `PUBLIC` or
  `HIDDEN`. When off, Greenroom transitions it to `PUBLIC` via
  `PUT /products/{id}/state` after creation.
- **The presigned upload PUT must echo two signed headers** — `Content-Type` and
  `x-goog-content-length-range: 0,<size>` (where `<size>` is the byte length
  declared in the `upload-url` request) — or GCS returns
  `403 SignatureDoesNotMatch`.

## F5 — the publicToken face

The `publicToken` is **browser-safe**. F5 resolves it server-side (`GET
/api/shops/:shopId/public-token` → `PUT /open-api/v1.0/public-token`) and then
reads the live shop directly from the browser against the Storefront API, with
no agency secret in play. The token comes from F2's creation response (in-session
shops) or the public-token endpoint (any shop) — the F1 shops list carries only
`{ shopId, name }`.

## Backend dependency (F4 / F5)

F4 and F5 depend on a backend role widening: the agency channel's `open-api`
role set must include `CUSTOMIZATION_*` (for the media steps) and `SHOP_READ`
(for the public-token endpoint). Until that change is live, **F1–F3 work but F4
media and F5 public-token calls will `403`**. Sequence the rollout so the backend
change is live before demoing F4/F5.

> Onboarding creates real shops and real payouts. Target **staging** by default,
> and treat the payout account as *pending* after the handoff — returning from
> `returnUrl` means the creator left the hosted flow, not that payouts are
> verified.
