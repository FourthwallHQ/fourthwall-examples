import type { PendingApproval, ToolEvent } from "./types";

export interface UserDisplayTurn {
  kind: "user";
  text: string;
}

export interface AssistantDisplayTurn {
  kind: "assistant";
  trace: ToolEvent[];
  text?: string;
  pending?: PendingApproval;
  authError?: boolean;
  alertDismissed?: boolean;
  errorMessage?: string;
  /** True while the turn's request is in flight and nothing has rendered yet. */
  thinking?: boolean;
  /** Set when resuming after a decision: the next text delta needs a paragraph break. */
  sepPending?: boolean;
}

export type DisplayTurn = UserDisplayTurn | AssistantDisplayTurn;
