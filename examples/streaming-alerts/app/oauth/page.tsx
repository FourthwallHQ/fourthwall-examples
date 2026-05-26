"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

/**
 * /oauth — the OAuth redirect target.
 *
 * The registered Platform App points its redirect URI here. Fourthwall returns
 * with ?code=…; we hand that straight to GET /api/oauth via a full-page
 * navigation. That server route does the token exchange + webhook registration,
 * then 302-redirects the browser back to / connected — so this page is just a
 * brief "connecting…" hand-off.
 */
function OAuthRedirect() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      window.location.replace(`/api/oauth?code=${encodeURIComponent(code)}`);
    } else {
      window.location.replace("/?error=missing_code");
    }
  }, [searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted p-8">
      <div className="space-y-2 text-center">
        <div
          aria-hidden
          className="mx-auto size-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent"
        />
        <p className="text-base text-muted-foreground">Connecting your Fourthwall shop…</p>
      </div>
    </main>
  );
}

export default function OAuthPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center text-muted-foreground">
          Loading…
        </main>
      }
    >
      <OAuthRedirect />
    </Suspense>
  );
}
