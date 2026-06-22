"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Alert } from "@fourthwall-examples/ui";
import { useStorefront } from "@/hooks/useStorefront";
import { SubaccountBar } from "@/components/SubaccountBar";
import { BrowserFrame } from "@/components/BrowserFrame";
import { StorefrontView } from "@/components/StorefrontView";

/** F5 · Creator storefront — the live shop read from the browser via publicToken. */
export default function StorefrontPage() {
  return (
    <Suspense fallback={null}>
      <StorefrontViewPage />
    </Suspense>
  );
}

function StorefrontViewPage() {
  const params = useParams<{ shopId: string }>();
  const searchParams = useSearchParams();
  const shopId = params.shopId;
  const name = searchParams.get("name") ?? undefined;

  const { shop, collection, loading, error } = useStorefront(shopId);

  return (
    <div className="min-h-screen">
      <SubaccountBar
        shopId={shopId}
        name={name}
        face="via publicToken · storefront-api · browser-safe"
      />
      <main className="mx-auto max-w-5xl px-6 py-8">
        {error ? (
          <Alert appearance="critical" title="Couldn&apos;t load the storefront">
            {error}
            <span className="mt-1 block text-sm">
              F5 needs the SHOP_READ grant (part of the 1-backend role widening) until then this
              403s.
            </span>
          </Alert>
        ) : loading ? (
          <div className="overflow-hidden rounded-panel border border-border bg-card shadow-2xl">
            <div className="h-10 animate-pulse border-b border-border bg-muted" />
            <div className="space-y-6 p-6">
              <div className="mx-auto h-16 w-48 animate-pulse rounded bg-muted" />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-square animate-pulse rounded-control bg-muted" />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <BrowserFrame domain={shop?.publicDomain || shop?.domain}>
            <StorefrontView shop={shop} collection={collection} />
          </BrowserFrame>
        )}
      </main>
    </div>
  );
}
