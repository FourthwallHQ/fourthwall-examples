"use client";

import { useState } from "react";
import { Alert, Button } from "@fourthwall-examples/ui";
import { useFleet } from "@/hooks/useFleet";
import { AgencyHeader } from "@/components/AgencyHeader";
import { ShopRosterGrid } from "@/components/ShopRosterGrid";
import { OnboardModal } from "@/components/OnboardModal";

/** F1 · Fleet home — the front door of Greenroom. */
export default function FleetHome() {
  const { channel, shops, loading, error, refresh } = useFleet();
  const [onboardOpen, setOnboardOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <AgencyHeader
        channel={channel}
        loading={loading}
        onOnboard={() => setOnboardOpen(true)}
      />

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Fleet roster</h1>
            <p className="text-muted-foreground">
              One channel token enumerates every shop this agency manages.
            </p>
          </div>
          <Button appearance="secondary" size="small" onClick={() => refresh()}>
            Refresh
          </Button>
        </div>

        {error ? (
          <Alert appearance="critical" title="Couldn&apos;t load the fleet">
            {error}
          </Alert>
        ) : loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-panel border border-border bg-card"
              />
            ))}
          </div>
        ) : (
          <ShopRosterGrid shops={shops} />
        )}
      </main>

      <OnboardModal
        open={onboardOpen}
        onClose={() => setOnboardOpen(false)}
        onCreated={refresh}
      />
    </div>
  );
}
