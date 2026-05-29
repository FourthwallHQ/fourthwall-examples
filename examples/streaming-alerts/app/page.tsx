import { verifyEmbeddedSettings } from "@/lib/hmac";
import { getSettings } from "@/lib/store";
import { Settings } from "./Settings";

// Reads signed query params + in-memory state, so it must run fresh per request.
export const dynamic = "force-dynamic";

function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

/**
 * / — the embedded settings page.
 *
 * Fourthwall iframes this inside the creator dashboard with signed `shop_id`,
 * `hmac`, and `timestamp` query params. We HMAC-verify them server-side, then
 * render the settings UI for the trusted shop. There is no connect button: the
 * app is installed via OAuth (see /api/oauth) and managed from here.
 *
 * Locally, mint a signed URL with `GET /api/dev/settings-url?shop_id=sh_xxx`
 * (dev only) and open it — the verification path is identical to production.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ shop_id?: string | string[]; hmac?: string | string[]; timestamp?: string | string[] }>;
}) {
  const params = await searchParams;
  const shopId = firstParam(params.shop_id);
  const hmac = firstParam(params.hmac);
  const timestamp = firstParam(params.timestamp);

  const appId = process.env.NEXT_PUBLIC_FOURTHWALL_APP_ID;
  const secret = process.env.FOURTHWALL_APP_HMAC_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";

  if (!shopId || !hmac || !timestamp) {
    return <Notice tone="muted">Open this settings page from your Fourthwall dashboard.</Notice>;
  }
  if (!appId || !secret || !verifyEmbeddedSettings({ shopId, appId, timestamp, hmac, secret })) {
    return <Notice tone="critical">Invalid or expired settings link.</Notice>;
  }

  const row = getSettings(shopId);

  return (
    <main className="min-h-screen w-full bg-background">
      <div className="w-full">
        <Settings
          initial={{
            installed: !!row,
            enabled: row?.enabled ?? true,
            showSupporterName: row?.showSupporterName ?? true,
            shopId,
            overlayUrl: `${baseUrl}/overlay/${shopId}`,
          }}
          auth={{ shopId, hmac, timestamp }}
        />
      </div>
    </main>
  );
}

function Notice({ tone, children }: { tone: "muted" | "critical"; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <p className={tone === "critical" ? "text-text-critical" : "text-muted-foreground"}>{children}</p>
    </main>
  );
}
