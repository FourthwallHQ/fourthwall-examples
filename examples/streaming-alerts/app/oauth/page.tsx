"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

/**
 * /oauth — the install redirect target.
 *
 * The registered Platform App points its redirect URI here. Fourthwall returns
 * with ?code=…; we hand that straight to GET /api/oauth via a full-page
 * navigation. That server route does the token exchange + webhook registration,
 * then redirects the browser to /installed — so this page is just a brief
 * "installing…" hand-off.
 */
function OAuthRedirect() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      window.location.replace(`/api/oauth?code=${encodeURIComponent(code)}`);
    } else {
      window.location.replace("/installed?error=missing_code");
    }
  }, [searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted p-8">
      <div className="space-y-2 text-center">
        <div
          aria-hidden
          className="mx-auto size-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent"
        />
        <p className="text-base text-muted-foreground">Installing Streaming Alerts…</p>
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
