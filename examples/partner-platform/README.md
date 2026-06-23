# Linkstand

A product-first **links admin** — every row on the page is a real Fourthwall
product the app creates through a single guided wizard. The brand is
deliberately blank: this is a showcase for the Fourthwall **channel-api**
integration, not a chrome exercise.

Linkstand lives in the `fourthwall-examples` monorepo as a standalone Next.js
(app-router) member at `examples/linkstand`, on the neutral
`@fourthwall-examples/ui` kit. It talks to one backend — the Fourthwall `order`
service — through two faces of the same client-credentials channel bearer.

---

## The defining move: when the shop appears

Browsing blank products, uploading artwork, and rendering a live preview are all
**shop-less** — they go straight through the channel-api. Only on **Publish**
does the app provision a shop behind the scenes and create the live product.

> Preview is shop-less; create is shop-bound.

The wizard makes the shop boundary visible:

| Wizard step | What happens | API call | Shop? |
| --- | --- | --- | --- |
| 1 · Pick a product | Browse blank product templates | `GET /open-api/v1.0/product-templates/page/{page}` | No |
| 2 · Add artwork | Presigned upload, then register the image | `POST /channel-api/v1.0/upload-url` → `POST /channel-api/v1.0/media/images` | No |
| 3 · Preview | Render preview images synchronously | `POST /channel-api/v1.0/previews` | No |
| 4 · Details & price → Publish | Provision a shop on first publish, then create the product | `GET /channel-api/v1.0/shops` → (first time) `POST /channel-api/v1.0/shops` → `POST /open-api/v1.0/products` | Creates / needs it |

---

## Auth: the client-credentials channel model

The channel-api is authorized by a Bearer JWT minted for a **statically
provisioned** Keycloak client whose id starts with `channel.` (e.g.
`channel.linktree`). Fourthwall provisions this client out-of-band — it is **not**
a per-user Platform-App OAuth install. There is no authorization-code round-trip,
no `?code`, no redirect, and no "Connect Fourthwall" button.

The server obtains the bearer itself via the OAuth2 **client-credentials** grant
against the Keycloak token endpoint (`POST
https://auth.<base>/auth/realms/Fourthwall/protocol/openid-connect/token`), caches
it in module memory, and refreshes it ~30s before expiry. The two channel
credentials (`FOURTHWALL_CHANNEL_CLIENT_ID` / `FOURTHWALL_CHANNEL_CLIENT_SECRET`)
are server-only and never reach the browser.

## Architecture: a thin backend-for-frontend

Linkstand is a **BFF**. Each `/api/*` route handler is a small proxy that
resolves the channel bearer (server-side, via the client-credentials grant) and
forwards to one (or, for publish, a few) `order` endpoints. The browser talks
only to the app's own routes; the bearer never leaves the server.

```
Creator → Linkstand (browser) → /api/* (server, holds the channel bearer) → order service
```

### Routes

| Route | Forwards to | Shop? | Notes |
| --- | --- | --- | --- |
| `GET  /api/templates` | `GET /open-api/v1.0/product-templates/page/1` | No | Browse blank products |
| `GET  /api/channel` | `GET /channel-api/v1.0/channel/current` | No | The connected channel (dashboard header) |
| `POST /api/upload-url` | `POST /channel-api/v1.0/upload-url` | No | Presigned upload URL |
| `POST /api/media` | `POST /channel-api/v1.0/media/images` | No | Register the uploaded image → `imageId` |
| `POST /api/previews` | `POST /channel-api/v1.0/previews` | No | Synchronous live preview |
| `POST /api/publish` | `GET /channel-api/v1.0/shops` → `POST /channel-api/v1.0/shops` (first only) → `POST /open-api/v1.0/products` | **Needs one** | The shop boundary |
| `GET  /api/links` | `GET /channel-api/v1.0/shops` → `GET /open-api/v1.0/products` | Needs one | Dashboard list (empty until first publish) |
| `PUT  /api/links/[id]/visibility` | `PUT /open-api/v1.0/products/[id]/state` | Needs one | Show / hide (`PUBLIC`/`HIDDEN`) |
| `DELETE /api/links/[id]` | `DELETE /open-api/v1.0/products/[id]` | Needs one | Archive |

The two credential faces:

- **channel-api** (`/channel-api/v1.0/…`) — authorized by the channel bearer
  alone. Shop-less: templates browsing, upload, preview, shop lookup, shop
  provisioning.
- **open-api** (`/open-api/v1.0/…`) — the product-templates list is shop-less;
  the product create/list/state/delete are **shop-bound**: the same channel
  bearer plus an `X-ShopId` header selects the just-provisioned shop.

### The publish route (the shop boundary)

`POST /api/publish` is the only route that needs a shop, and it owns the whole
shop lifecycle so the client makes a single call:

1. `GET /channel-api/v1.0/shops` — does the channel have a shop yet?
2. `POST /channel-api/v1.0/shops` — **only on first publish** (idempotent: a
   second publish reuses the same shop, never a duplicate).
3. `POST /open-api/v1.0/products` (with `X-ShopId`) — create the live product.

### Preview ↔ publish design continuity

The previewed design and the published product are the **same** design. The
publish route creates the product from the same `productId` + `imageId`
(+ colors/sizes) the preview was rendered from — threaded through wizard state,
never re-derived at publish.

### Dashboard mutations

Show/hide maps onto the open-api product **state** (`PUBLIC`/`HIDDEN`); delete
maps onto product **archive** (`DELETE`). Reorder drag handles are present in
the UI; ordering is app-local for now — the open-api has no per-shop ordering
attribute, so it is treated as a follow-up.

---

## Setup

1. Have Fourthwall provision a **channel** Keycloak client for you (a static
   `channel.<partner>` client, e.g. `channel.linktree`). This is done
   out-of-band by Fourthwall — there is no self-serve "Connect" / OAuth-install
   flow. You receive a client id and client secret.
2. Copy `.env.local.example` to `.env.local` and fill in:
   - `FOURTHWALL_CHANNEL_CLIENT_ID` — the `channel.<partner>` client id (server-only)
   - `FOURTHWALL_CHANNEL_CLIENT_SECRET` — its client secret (server-only)
   - `NEXT_PUBLIC_FOURTHWALL_BASE_URL` — `fourthwall.com` (or `staging.fourthwall.com`)
3. From the repo root: `pnpm install`, then `pnpm --filter linkstand dev`.
4. Open [http://localhost:3000](http://localhost:3000) — the dashboard loads
   straight away; the server fetches the channel bearer on the first `/api/*`
   call.

The channel bearer is fetched via the client-credentials grant and held in
memory for the lifetime of the server process (it survives Next.js dev
hot-reloads via `globalThis`), refreshed ~30s before expiry, and never
persisted — no database, by design.

---

## Structure

```
examples/linkstand/
  app/
    layout.tsx              # RootLayout
    page.tsx                # / — the dashboard (DashboardPage)
    globals.css
    api/
      templates/route.ts    # GET  — browse blank products
      channel/route.ts      # GET  — connected channel
      upload-url/route.ts   # POST — presigned upload URL
      media/route.ts        # POST — register image
      previews/route.ts     # POST — live preview
      publish/route.ts      # POST — shop boundary
      links/route.ts        # GET  — dashboard list
      links/[id]/route.ts            # DELETE — archive
      links/[id]/visibility/route.ts # PUT   — show/hide
  components/
    Dashboard.tsx           # the dashboard client component
    AddProductWizard.tsx     # stepped modal shell (owns step + design state)
    StepPick / StepArtwork / StepPreview / StepDetails / StepPublish
    LinkList / LinkRow / EmptyState
  lib/
    fourthwall.ts           # the ONLY module that calls order (fetches + attaches the channel bearer)
    hooks.ts                 # client data hooks — the only thing components touch
    types.ts                # shared request/response shapes
    api.ts                  # shared BFF helpers
```
