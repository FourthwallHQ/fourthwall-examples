# Streaming Gifting

A complete, runnable reference example: turn Fourthwall purchases into **on-stream
giveaways**. A purchase opens a giveaway, viewers enter in chat by typing
`!enter`, and one winner redeems a free product. This is the code companion to the
[Gifting guide](https://docs.fourthwall.com/streaming/gifting), modeled on Merch
Train.

The interesting part is the **lifecycle the API leaves to you**:

- **Which purchase starts a draw** — every Nth qualifying purchase (à la Merch
  Train), or a manual click.
- **How entries are collected** — the guide leaves this open. Here it's an in-app
  **mock chat**, deliberately isolated so a real integration can swap it.
- **When the window closes** — a timer, or the operator drawing early.
- **How the winner's `redeemUrl` gets back on stream** — surfaced on the control
  page and on an OBS overlay.

> ### The mock chat is the swappable seam
> Entry collection lives behind `POST /api/chat` + `lib/draw.ts`. A real
> integration replaces **just that surface** with Twitch EventSub
> (`channel.chat.message`), a Discord reaction, or a web form. The only contract
> with Fourthwall is the **participant list** handed to Finish Giveaway — the
> Create / Finish calls stay exactly the same.

## What's here

| Page | Purpose |
| --- | --- |
| `/` | **Control page** — connect, pick the prize + threshold, open/draw, read the winner + `redeemUrl` + a copyable announcement, copy the overlay URL. |
| `/chat` | **Mock chat** — post as different viewers; `!enter` joins an open draw. The swappable seam. |
| `/overlay/:shopId` | **OBS browser source** — entry prompt + live count while open, winner reveal when finished. Transparent; auto-reconnects. |

In-memory only — the token, prize, purchase counter, current draw, and participant
set live in memory and reset on restart. No database, no broker.

## Setup

1. **Register a Platform App** in Fourthwall (Settings → For developers / Platform
   Apps). Grant the scopes **`giveaway_write` + `webhook_write` + `offer_read`**,
   and set the OAuth **redirect URI** to this app's `/oauth` route — e.g.
   `http://localhost:3000/oauth` for local dev.

2. **Configure `.env.local`.** Copy `.env.local.example` to `.env.local` and fill
   it in:

   | Variable | What it is |
   | --- | --- |
   | `NEXT_PUBLIC_FOURTHWALL_APP_ID` | The Platform App's public id. |
   | `NEXT_PUBLIC_BASE_URL` | Where this app runs (`http://localhost:3000`), used for the OAuth redirect, the webhook URL, and the overlay URL. |
   | `NEXT_PUBLIC_FOURTHWALL_BASE_URL` | The Fourthwall instance — `fourthwall.com` (or `staging.fourthwall.com`). The API host is derived as `api.<base>`. |
   | `FOURTHWALL_APP_SECRET` | The Platform App's client secret. **Server-only** — read solely in the `/api/oauth` token exchange. Never prefix it with `NEXT_PUBLIC_`. |

   The webhook signing secret is **not** an env var — it's returned by
   create-webhook at connect time and held in memory.

3. **Run it** (from this folder, or `pnpm --filter streaming-gifting dev` from the
   repo root):

   ```bash
   pnpm install   # from the repo root, once
   pnpm dev
   ```

4. Open <http://localhost:3000>, click **Connect with Fourthwall**, and authorize.
   (If your shop lives on a subdomain like `my-shop.fourthwall.com`, use that host
   for the authorize page.)

## Driving a giveaway

1. On the control page, **pick the prize** (the offer winners redeem) and the
   **trigger threshold N**, then **Save settings**.
2. **Open a draw** — click **Open draw**, or let the Nth qualifying purchase open
   one automatically (see webhooks below).
3. Open `/chat` in another tab and post `!enter` as a few viewers. Watch the
   entrant count climb on the control page and the overlay.
4. **Draw now** (or wait for the timer). One winner is picked at random and Finish
   Giveaway returns a `redeemUrl`.
5. Copy the **redeem URL** and the **chat announcement** from the winner panel, and
   post them in your stream. (The example never posts to chat on your behalf.)
6. Paste the **overlay URL** into OBS as a browser source to show the prompt, the
   live count, and the winner reveal on stream.

## Purchase triggers (webhooks)

At connect time the app registers `ORDER_PLACED` + `GIFT_PURCHASE` webhooks
pointed at `POST /api/webhooks`, and the inbound signature is verified
(HMAC-SHA256 over the raw body, constant-time compared against the
`X-Fourthwall-Hmac-Apps-SHA256` header; 401 on mismatch). Every Nth qualifying
purchase opens a draw.

Fourthwall must be able to **reach your `/api/webhooks` URL**, so on plain
`localhost` registration is skipped (the control page tells you) — point
`NEXT_PUBLIC_BASE_URL` at a public HTTPS tunnel (e.g. ngrok / cloudflared) to
exercise the purchase trigger. Either way, **Open draw** and the mock chat work
without any tunnel.

## Notes

- **Beta endpoints.** Create / Finish Giveaway are beta and subject to change. The
  client (`lib/fourthwall.ts`) is intentionally thin so a contract change is a
  one-file edit. Finish exposes only a Twitch participant carrier today, so
  entrants ride it as `{ userId, userName }`.
- **One winner, one offer, one draw at a time.** A new Nth-purchase trigger while a
  draw is open is ignored (the open draw keeps collecting). An empty draw finishes
  with an empty participant array and the prize returns to the shop.
- **Reference code, not production.** No persistence, no anti-fraud beyond
  per-`userId` dedupe, no automated chat posting.

## Code map

```
app/
  page.tsx                  Control page (connect, prize, draw, winner, overlay URL)
  chat/page.tsx             Mock chat (the swappable entry seam)
  overlay/[shopId]/page.tsx OBS browser source
  oauth/page.tsx            OAuth callback → stores the connection, redirects home
  api/oauth/route.ts        Token exchange, products, register webhooks, store
  api/settings/route.ts     Pre-select prize offer + threshold N
  api/webhooks/route.ts     Verify HMAC, count purchases, Nth → Create Giveaway
  api/chat/route.ts         !enter → add to the open draw's participant set
  api/draw/open/route.ts    Manually open a draw
  api/draw/finish/route.ts  Pick winner → Finish Giveaway → redeemUrl
  api/events/[shopId]/route.ts  SSE draw-state stream (overlay + control)
  api/state/route.ts        Control-page bootstrap snapshot (products + settings)
lib/
  fourthwall.ts             Platform API client (token/shop/products/giveaway/webhook)
  store.ts                  In-memory per-shop connection state
  draw.ts                   Lifecycle: counter, trigger, window, entrants, winner pick
  channel.ts                In-memory per-shop pub/sub for SSE
  hmac.ts                   Webhook signature verification
  useDrawStream.ts          Client hook: EventSource → current Draw
```
