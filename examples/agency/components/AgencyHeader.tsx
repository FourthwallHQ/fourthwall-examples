import { Avatar } from "@fourthwall-examples/ui";
import { Button } from "@fourthwall-examples/ui";
import { initials } from "@/lib/format";
import type { AgencyChannel } from "@/lib/types";

interface AgencyHeaderProps {
  channel: AgencyChannel | null;
  loading: boolean;
  onOnboard: () => void;
}

/** App chrome + agency identity. Persistent across the app. */
export function AgencyHeader({ channel, loading, onOnboard }: AgencyHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
      <div className="flex items-center gap-3">
        <Avatar fallback={channel ? initials(channel.name) : "GR"} size="large" />
        <div className="leading-tight">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Greenroom · Agency console
          </p>
          <p className="text-lg font-semibold text-foreground">
            {loading ? "Connecting…" : channel?.name ?? "—"}
          </p>
        </div>
      </div>
      <Button appearance="primary" onClick={onOnboard}>
        Onboard a creator
      </Button>
    </header>
  );
}
