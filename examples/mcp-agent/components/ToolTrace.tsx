import { ToolCall } from "@fourthwall-examples/ui";
import type { ToolEvent } from "@/lib/types";

function summaryWithAudit(event: ToolEvent): string | undefined {
  const audit = event.decision ? `${event.decision === "allowed" ? "approved" : "denied"} by you` : "";
  const parts = [event.summary, audit].filter(Boolean);
  return parts.length ? parts.join(" · ") : undefined;
}

export function ToolTrace({ events }: { events: ToolEvent[] }) {
  if (events.length === 0) return null;
  return (
    <div className="flex flex-col">
      {events.map((event) => (
        <ToolCall
          key={event.id}
          name={event.name}
          summary={summaryWithAudit(event)}
          status={event.status}
        >
          {event.status === "pending" ? undefined : event.detail}
        </ToolCall>
      ))}
    </div>
  );
}
