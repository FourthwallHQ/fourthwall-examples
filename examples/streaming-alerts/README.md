# Streaming Alerts

On-stream alerts for Fourthwall **orders** and **tips**, the kind Streamlabs shows
for donations. The creator installs the app, opens its settings **inside the
Fourthwall dashboard**, drops an overlay URL into OBS, and every order/tip
animates as an on-stream card. Embed-first and entirely in-memory, to stay
legible. Companion to the [Alerts guide](https://docs.fourthwall.com/streaming/alerts).

## Setup

1. Create a new app in Fourthwall: [Platform Apps Settings](https://my-shop.fourthwall.com/admin/dashboard/settings/platform-apps/)
   - Grant the **`webhook_write`** scope.
   - In the **OAuth** tab set the redirect URI to `<base-url>/oauth`.
   - Set the app's **embedded settings URL** to `<base-url>/` and note its **HMAC secret**.
2. Make the app publicly reachable (Fourthwall delivers webhooks to it):
   ```bash
   ngrok http 3000   # or: cloudflared tunnel --url http://localhost:3000
   ```
3. Create `.env.local` under `/streaming-alerts` (see `.env.local.example`):
   - `NEXT_PUBLIC_FOURTHWALL_APP_ID` — your app's id
   - `FOURTHWALL_APP_SECRET` — your app's OAuth client secret
   - `FOURTHWALL_APP_HMAC_SECRET` — the embedded-settings HMAC secret
   - `NEXT_PUBLIC_BASE_URL` — where this app runs (your tunnel URL)
   - `NEXT_PUBLIC_FOURTHWALL_BASE_URL` — `fourthwall.com` (or `staging.fourthwall.com`)
4. Run it: `pnpm install && pnpm --filter streaming-alerts dev`
5. Install the app from your Fourthwall dashboard, then open its **settings** there.
6. Copy the overlay URL into OBS as a **Browser Source**, hit **Send test alert**,
   then place a real order or send a tip.

## Local preview (no dashboard)

The settings page is signed by Fourthwall, so it can't load from a raw
`localhost` URL. Mint a signed one (dev only) and open it:

```bash
curl "http://localhost:3000/api/dev/settings-url?shop_id=sh_demo"
```

## How it works

```
Install (OAuth) ─► register webhooks
Dashboard ─► iframes /?shop_id&hmac&timestamp ─► HMAC-verified settings
Order/tip ─► POST /api/webhooks ─► in-memory channel ─► SSE ─► /overlay/:shopId (OBS)
```

Two signatures: embedded settings (HMAC-SHA512, Base64, shared app secret) and
webhook delivery (HMAC-SHA256 over the raw body, per-shop secret). In-memory
state resets on restart — a production build would use a database + a real broker.
