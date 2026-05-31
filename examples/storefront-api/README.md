# Storefront API — link-in-bio shop embed

A creator "link in bio" page with an embeddable Fourthwall shop widget: a
profile header (the host page) plus a framed widget that shows a horizontal,
scrollable product carousel pulled live from a collection — in the style of
[Pillar](https://pillar.io).

Two embed variants are shown, both powered by the Storefront API:

1. **Cart + checkout** — add products to an in-widget cart, then check out
   (creates a cart via `POST /v1/carts` and redirects to hosted checkout).
2. **Direct checkout** — each card links straight to hosted checkout via the
   [cart-checkout endpoint](https://docs.fourthwall.com/shop-apis/cart-checkout-endpoint),
   no cart needed.

## How it works

The Storefront API is public-read: each request is authorized by a
`storefront_token` query parameter (not a bearer header). That token is the
**public token** you mint with `PUT /open-api/v1.0/public-token`. The
[`public-token`](../public-token) example walks through the OAuth flow that
produces it.

`lib/fourthwall.ts` calls, server-side:

- `GET /v1/shop` — shop name + public domain (used to build checkout links)
- `GET /v1/collections` — to pick the featured collection
- `GET /v1/collections/{slug}/products` — the products in the carousel
- `POST /v1/carts` — create a cart at checkout time (cart variant)

## Setup

1. Mint a public (storefront) token for your shop — see the
   [`public-token`](../public-token) example.
2. Create `examples/storefront-api/.env.local`:

   ```
   FOURTHWALL_STOREFRONT_TOKEN=<your public token>
   # Optional — defaults to the shop's first collection:
   FOURTHWALL_COLLECTION_SLUG=<collection slug>
   # Optional — override for staging:
   # FOURTHWALL_STOREFRONT_API_URL=https://storefront-api.staging.fourthwall.com
   ```

3. Edit `lib/profile.ts` to set the avatar, name, and socials.
4. Run the app and open [http://localhost:3000](http://localhost:3000):

   ```
   pnpm --filter storefront-api dev
   ```
