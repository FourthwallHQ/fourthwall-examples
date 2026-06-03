# Streaming Gifting

A complete, runnable reference for Fourthwall's **gift-purchase giveaway** flow,
built as a Platform App so you can read the code end to end. While a creator is
live, a supporter buys a **gift offer**; Fourthwall mints the gifts and fires
`GIFT_PURCHASE`; viewers enter in chat with `!enter`; when the window closes the
app **picks the winner(s) itself** and routes each to a redemption page to claim
their gift.

The key thing this models is the integrator's half of the flow:

- **The server mints the gifts.** They arrive on the `GIFT_PURCHASE` webhook, each
  with its own `gft_…` id — the app **never creates a giveaway**.
- **The app runs the draw and assigns winners.** It opens a short window (the
  config's entry time limit), gathers `!enter` from chat, picks up to one winner
  per gift at random, and hands each winner the redemption link for their gift.

> ### Two swappable seams
> - **Entry collection** lives behind `POST /api/chat` + `lib/draw.ts`. Swap it for
>   Twitch chat (EventSub `channel.chat.message`), Discord, or a web form.
> - **Winner redemption** lives behind `/redeem` + `POST /api/redeem`. This example
>   "authenticates" the winner by having them type their chat name; a real build
>   swaps that for the Twitch winner login. Either way the gift is claimed on the
>   storefront's real `/gifts/{giftId}` page.

## What's here

| Page | Purpose |
| --- | --- |
| `/` | **Embedded settings / operator cockpit** — iframed inside the Fourthwall dashboard and HMAC-verified. Set the gifting rules, flip the shop **live** (a test affordance — see below), watch the draw, and read the winner(s) + their redeem link. No connect button: the app is installed via OAuth and managed here. |
| `/installed` | **Install fallback** — on success the callback returns the creator to the app's page in the dashboard; this page only shows install errors. |
| `/chat?user=<name>` | **Mock chat** — post as the viewer named in `?user=`; `!enter` joins the open draw. Open several tabs with different names to enter as distinct viewers. The entry seam. |
| `/redeem` | **Winner redemption** — a fake-OAuth claim page: enter your chat name to prove you're a winner, then claim your gift on the storefront. The redemption seam. |

This is **embed-first**: the creator installs the app and manages it inside the
Fourthwall dashboard, the same shape as the Streaming Alerts example. In-memory
only — the token, the cached entry-window length, and the current draw (with its
winners) live in memory and reset on restart. No database, no broker.

## Setup

1. **Start a tunnel first** — Fourthwall must reach this app over the public
   internet (it delivers webhooks *and* iframes the settings page), and the app's
   redirect URI + embedded-settings URL are configured against this `<base-url>`.
   ```bash
   ngrok http 3000   # or: cloudflared tunnel --url http://localhost:3000
   ```
   > **Prefer a stable URL.** A free ngrok tunnel mints a new URL every restart.
   > Use a reserved ngrok domain (`ngrok http --url=<your>.ngrok.app 3000`) or a
   > named Cloudflare tunnel so `<base-url>` stays fixed.

2. **Register a Platform App** in Fourthwall (Settings → For developers / Platform
   Apps).
   - Grant the scopes **`giveaway_write` + `webhook_write` + `offer_read`**.
   - In the **OAuth** tab set the redirect URI to `<base-url>/oauth`.
   - Set the app's **embedded settings URL** to `<base-url>/` and note its **HMAC
     key**.

3. **Configure `.env.local`.** Copy `.env.local.example` to `.env.local` and fill
   it in:

   | Variable | What it is |
   | --- | --- |
   | `NEXT_PUBLIC_FOURTHWALL_APP_ID` | The Platform App's public id. |
   | `NEXT_PUBLIC_BASE_URL` | Where this app runs — your tunnel URL. The embedded-settings URL, OAuth redirect, webhook URL, and the `/redeem` link are all built from it. |
   | `NEXT_PUBLIC_FOURTHWALL_BASE_URL` | The Fourthwall instance — `fourthwall.com` (or `staging.fourthwall.com`). The API host is derived as `api.<base>`, and gift redemption links as `<shop>.<base>/gifts/{id}`. |
   | `FOURTHWALL_APP_SECRET` | The Platform App's client secret. **Server-only** — read solely in the `/api/oauth` token exchange. Never prefix it with `NEXT_PUBLIC_`. |
   | `FOURTHWALL_APP_HMAC_KEY` | The Platform App's single HMAC key, from the app's settings page. **Server-only.** Used for both signatures: inbound webhook delivery (`X-Fourthwall-Hmac-Apps-SHA256`) and the embedded-settings handoff. One fixed value per app. |

4. **Run it** (from this folder, or `pnpm --filter streaming-gifting dev` from the
   repo root):

   ```bash
   pnpm install   # from the repo root, once
   pnpm dev
   ```

5. **Install the app** from your Fourthwall dashboard. The OAuth callback registers
   the webhooks and returns you **to the app's page in the dashboard**
   (`/admin/dashboard/apps/<appId>`), where the settings page (`/`) loads embedded
   and HMAC-verified. (On an install error you land on this app's `/installed` page.)

## Local preview (no dashboard)

The settings page is signed by Fourthwall, so it can't load from a raw `localhost`
(or bare tunnel) URL — it shows a notice without valid `shop_id`/`hmac`/`timestamp`.
Mint a signed one (dev only) and open it:

```bash
curl "http://localhost:3000/api/dev/settings-url?shop_id=sh_xxx"
```

The verification path is identical to production — no bypass.

## Running a giveaway

1. In the embedded settings page, set the **gifting rules** — gift-while-live,
   entry time limit (20–180s), shipping policy, giftable products — and **Save**.
   These persist through `GET`/`PUT /open-api/v1.0/gifting/config`.
2. **Go live.** The gift offer is only purchasable while the shop is live. In
   production the creator's streaming platform sets this; this example exposes a
   **Go live** toggle in the cockpit (`PUT /open-api/v1.0/streaming/start`) purely
   so you can exercise the flow without a real stream.
3. A supporter buys a **gift offer** on the storefront. Fourthwall mints the gifts
   and fires `GIFT_PURCHASE`; the app opens an entry window and posts the
   `NEW GIVEAWAY — !ENTER TO WIN…` announcement.
4. Open `/chat?user=alice` in another tab and post `!enter`; open more tabs with
   different `?user=` names to enter as distinct viewers. Watch the entrant count
   climb on the settings page.
5. When the window elapses (or you hit **Draw now**), the app picks up to one
   winner per gift at random and pairs each with their gift's redemption link. The
   winner panel shows the winners and a single **redeem link** to broadcast.
6. Each winner opens `/redeem`, enters their chat name, and — if they're on the
   winners list — claims their gift on the storefront's `/gifts/{giftId}` page.

> **Draws open from `GIFT_PURCHASE`** — there's no manual "open" button. To
> exercise the full flow, make a real gift-offer purchase on the storefront while
> the shop is live.

## Webhooks

At install the app registers `GIFT_PURCHASE` + `PLATFORM_APP_DISCONNECTED` pointed
at `POST /api/webhooks`. Inbound delivery is HMAC-verified (HMAC-SHA256 over the
raw body, constant-time compared against `X-Fourthwall-Hmac-Apps-SHA256`; 401 on
mismatch). `GIFT_PURCHASE` carries the minted gifts (`gifts[].id`) and opens a
draw from them; the disconnect event forgets the shop on uninstall.

## Notes

- **The app owns winner selection.** Gifts are minted by the server and arrive on
  the webhook; the app picks winners and routes each to their gift's redemption
  page. It never calls Create Giveaway or finish-draw — the `gft_…` link is the
  only contract back to Fourthwall.
- **Redemption is gated by the winner, not the link.** The per-winner `gft_` links
  stay private; the app broadcasts only `/redeem`, which reveals a winner's gift
  link after they identify themselves. The fake "type your chat name" check stands
  in for the real Twitch winner authentication.
- **The Go-live toggle is a test affordance.** A real integration never sets
  streaming status — the creator's streaming platform does. It lives in the cockpit
  only so the gift-while-live flow is exercisable locally.
- **One platform per shop.** Gifting has a single slot — if another integration
  (`TWITCH`/`STREAMELEMENTS`) owns it, the settings page surfaces the conflict.
- **Reference code, not production.** No persistence, no anti-fraud beyond
  per-`userId` dedupe, no automated chat posting.

## Code map

```
app/
  page.tsx                  Embedded settings page — HMAC-verify, then render Controls
  Controls.tsx              Operator cockpit (stream status, settings, draw, winners); signed calls
  installed/page.tsx        Install fallback (errors / domain-less success)
  chat/page.tsx             Mock chat (the entry seam)
  redeem/page.tsx           Fake-OAuth winner redemption (the redemption seam)
  oauth/page.tsx            Install hand-off → forwards ?code to /api/oauth
  api/oauth/route.ts        Token exchange, register webhooks, store → back to dashboard
  api/dev/settings-url/route.ts  DEV ONLY: mint a signed settings URL for localhost
  api/settings/route.ts     Write the gifting config (signed)
  api/streaming/route.ts    Read/toggle the shop's live status (signed) — the Go-live affordance
  api/webhooks/route.ts     Verify HMAC; GIFT_PURCHASE → open draw; disconnect → forget shop
  api/chat/route.ts         !enter → add to the open draw's entrant set
  api/redeem/route.ts       Match a chat name against stored winners → return their gift link
  api/draw/finish/route.ts  Close the window early → pick winners + redeem links (signed)
  api/events/[shopId]/route.ts  SSE draw-state stream for the cockpit
  api/state/route.ts        Cockpit bootstrap — products + gifting config + draw (signed)
lib/
  fourthwall.ts             Platform API client (token/shop/products/gifting-config/streaming/webhook)
  store.ts                  In-memory per-shop connection state
  draw.ts                   Lifecycle: open-from-purchase, entry window, winner pick + redeem links
  channel.ts                In-memory per-shop pub/sub for SSE
  hmac.ts                   Webhook + embedded-settings HMAC (verify/sign)
  embeddedSettings.ts       getVerifiedShopId — the signed-request gate for operator routes
  useDrawStream.ts          Client hook: EventSource → current Draw
```
