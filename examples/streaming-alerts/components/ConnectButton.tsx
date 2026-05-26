"use client";

import { Button } from "@fourthwall-examples/ui";

/**
 * Builds the Fourthwall authorize URL (app id + redirect back to /oauth +
 * webhook_write scope) and sends the creator there. All values are public
 * (NEXT_PUBLIC_), so this is safe to run browser-side.
 *
 * The redirect_uri here MUST match the one configured on the Platform App and
 * the one /api/oauth sends to the token endpoint — a mismatch is the most
 * common first-run failure (see the README).
 */
export function ConnectButton() {
  function connect() {
    const appId = process.env.NEXT_PUBLIC_FOURTHWALL_APP_ID;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const fourthwallBaseUrl = process.env.NEXT_PUBLIC_FOURTHWALL_BASE_URL ?? "fourthwall.com";

    if (!appId || !baseUrl) {
      alert(
        "Missing NEXT_PUBLIC_FOURTHWALL_APP_ID or NEXT_PUBLIC_BASE_URL — copy .env.local.example to .env.local and fill it in.",
      );
      return;
    }

    const authorizeUrl = new URL(
      `https://my-shop.${fourthwallBaseUrl}/admin/platform-apps/authorize`,
    );
    authorizeUrl.searchParams.set("client_id", appId);
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("redirect_uri", `${baseUrl}/oauth`);
    authorizeUrl.searchParams.set("scope", "webhook_write");

    window.location.href = authorizeUrl.toString();
  }

  return (
    <Button appearance="primary" size="large" fullWidth onClick={connect}>
      Connect your Fourthwall shop
    </Button>
  );
}
