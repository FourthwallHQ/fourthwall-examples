# Streaming Alerts

On-stream alerts for Fourthwall **orders** and **tips** — the kind Streamlabs
shows for donations. This is the runnable code companion to the
[Alerts guide](https://docs.fourthwall.com/streaming/alerts): a developer
connects a shop with one OAuth click, drops an overlay URL into OBS, and every
order/tip the shop receives animates as an on-stream card.

It deliberately keeps **all state in memory** so the architecture stays legible:

```
Connect (OAuth) ──► Fourthwall ──► POST /api/webhooks ──► in-memory channel ──► GET /api/events/:shopId (SSE) ──► /overlay/:shopId (OBS)
```

A webhook lands on the server, but an OBS browser source is a long-lived page
that needs the event *pushed* to it. The transport here is the path of least
resistance: **one Server-Sent Events endpoint per shop**, an `EventSource` in
the overlay, and an in-memory per-shop channel fanning each verified webhook to
every connected overlay. Fire-and-forget — an event that arrives with no overlay
connected is dropped, never queued.

## How it fits together

| Piece | File | Role |
| --- | --- | --- |
| A. Connect | `app/oauth/page.tsx`, `app/api/oauth/route.ts` | OAuth → token → shop → register webhooks → store |
| B. Control page | `app/page.tsx` | Connect button, overlay URL, test alert, privacy toggle, disconnect |
| C. Receiver | `app/api/webhooks/route.ts` | HMAC-verify · dedupe · privacy · shape · publish |
| D. Push transport | `app/api/events/[shopId]/route.ts` | One SSE stream per shop |
| E. Overlay | `app/overlay/[shopId]/page.tsx` | Queue + serial animation + sound |
| lib | `lib/{store,fourthwall,hmac,channel,alert}.ts` | In-memory store, API client, signature check, pub/sub, payload shaping |

## Setup

1. **Create a Platform App** in Fourthwall: Settings → For developers → Platform
   Apps. Grant it the **`webhook_write`** scope.
   - In the app's **OAuth** tab, set the **redirect URI** to your `/oauth` route.
     For local dev that's `http://localhost:3000/oauth`. This must match
     `NEXT_PUBLIC_BASE_URL` + `/oauth` exactly — a mismatch is the most common
     first-run failure.
   - Note the app's **id** and **client secret** (OAuth tab).

2. **Make this app publicly reachable** so Fourthwall can deliver webhooks.
   `localhost` isn't reachable from the internet, so for real orders/tips run a
   tunnel and use its URL as `NEXT_PUBLIC_BASE_URL`:

   ```bash
   # e.g. with cloudflared or ngrok
   cloudflared tunnel --url http://localhost:3000
   # ngrok http 3000
   ```

   (You can skip this and still use the **test alert** button end-to-end — it
   publishes in-process and needs no inbound webhook.)

3. **Configure `.env.local`.** Copy the example and fill it in:

   ```bash
   cp .env.local.example .env.local
   ```

   | Key | Value |
   | --- | --- |
   | `NEXT_PUBLIC_FOURTHWALL_APP_ID` | Your Platform App's id |
   | `NEXT_PUBLIC_BASE_URL` | Where this app runs, e.g. `http://localhost:3000` or your tunnel URL |
   | `NEXT_PUBLIC_FOURTHWALL_BASE_URL` | `fourthwall.com` (or `staging.fourthwall.com`) |
   | `FOURTHWALL_APP_SECRET` | Your Platform App's client secret — **server-only** |

   The webhook signing secret is **not** an env var: it comes back from the
   create-webhook call at connect time and lives only in memory.

4. **Install + run** (from the monorepo root or this directory):

   ```bash
   pnpm install
   pnpm --filter streaming-alerts dev
   ```

5. **Open** [http://localhost:3000](http://localhost:3000) and click **Connect
   your Fourthwall shop**. After the OAuth round-trip you'll land back here
   connected, with an overlay URL, a test-alert button, and a name-privacy
   toggle.

6. **Add the overlay to OBS.** Copy the overlay URL and add it as a **Browser
   Source** (set a transparent background — the page already is). Click **Send
   test alert** to confirm it animates, then place a real order or send a tip.

7. **Disconnect** when you're done to unregister the webhooks and forget the
   token.

## Notes / scope

- **In-memory, by design.** The shop→token map and the fan-out channel reset on
  restart. A production integration would back the store with a database and the
  channel with a pub/sub broker (Redis, etc.). This example does not, to stay
  legible.
- **HMAC.** Every webhook is verified by recomputing HMAC-SHA256 over the *raw*
  body with the stored per-shop secret and constant-time comparing it to the
  `X-Fourthwall-Hmac-Apps-SHA256` header. Mismatch → `401`.
- **One look, one sound.** A single default card design and `public/alert.wav`.
  No history, replay, multi-instance scale-out, or platform-specific Twitch /
  YouTube / Kick integration — it's a generic browser source.
