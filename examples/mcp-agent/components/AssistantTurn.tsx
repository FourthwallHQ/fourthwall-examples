import { ChatTurn } from "@fourthwall-examples/ui";
import { ToolTrace } from "./ToolTrace";
import { ApprovalPanel } from "./ApprovalPanel";
import { TokenAlert } from "./TokenAlert";
import type { AssistantDisplayTurn } from "@/lib/clientTypes";

export function AssistantTurn({
  turn,
  busy,
  onDecide,
  onDismissAlert,
}: {
  turn: AssistantDisplayTurn;
  busy: boolean;
  onDecide: (approved: boolean) => void;
  onDismissAlert: () => void;
}) {
  return (
    <ChatTurn>
      <ToolTrace events={turn.trace} />
      {turn.pending && <ApprovalPanel pending={turn.pending} busy={busy} onDecide={onDecide} />}
      {turn.authError && !turn.alertDismissed && <TokenAlert onDismiss={onDismissAlert} />}
      {turn.errorMessage && !turn.authError && (
        <p className="text-base text-muted-foreground">{turn.errorMessage}</p>
      )}
      {turn.text && <div className="whitespace-pre-wrap text-base leading-relaxed">{turn.text}</div>}
      {turn.thinking && (
        <span className="animate-pulse text-base text-muted-foreground">Thinking…</span>
      )}
    </ChatTurn>
  );
}
