import { Button } from "@fourthwall-examples/ui";
import type { PendingApproval } from "@/lib/types";

export function ApprovalPanel({
  pending,
  busy,
  onDecide,
}: {
  pending: PendingApproval;
  busy: boolean;
  onDecide: (approved: boolean) => void;
}) {
  return (
    <div className="flex max-w-[480px] flex-col gap-3 rounded-panel bg-muted px-5 py-4">
      <span className="text-sm text-muted-foreground">The assistant wants to run:</span>
      <code className="font-mono text-base font-semibold">{pending.name}</code>
      <pre className="overflow-x-auto rounded-control bg-background px-3 py-2.5 font-mono text-xs leading-relaxed">
        {JSON.stringify(pending.input, null, 2)}
      </pre>
      <div className="flex gap-2.5 pt-1">
        <Button appearance="primary" size="small" disabled={busy} onClick={() => onDecide(true)}>
          Allow
        </Button>
        <Button size="small" disabled={busy} onClick={() => onDecide(false)}>
          Deny
        </Button>
      </div>
    </div>
  );
}
