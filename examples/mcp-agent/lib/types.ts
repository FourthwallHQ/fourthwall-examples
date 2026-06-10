import type Anthropic from "@anthropic-ai/sdk";

/** Raw Anthropic transcript message — the browser replays these each turn. */
export type WireMessage = Anthropic.Messages.MessageParam;

/** One MCP call as the UI renders it: a quiet trace line with a disclosure. */
export interface ToolEvent {
  /** The Anthropic tool_use id — stable across pause/resume merges. */
  id: string;
  name: string;
  input: Record<string, unknown>;
  status: "success" | "pending" | "error";
  /** Inline result summary ("32 orders", "awaiting approval", "failed"). */
  summary: string;
  /** Expanded disclosure content — the exact arguments, or the error text. */
  detail?: string;
  /** Audit trail once the creator has ruled on a write. */
  decision?: "allowed" | "denied";
}

export interface PendingApproval {
  toolUseId: string;
  name: string;
  input: Record<string, unknown>;
}

export interface Decision {
  toolUseId: string;
  approved: boolean;
}

export interface ChatRequest {
  messages: WireMessage[];
  /** Present when resuming a turn that paused on a write. */
  decision?: Decision;
}

export type ChatResponse =
  | {
      type: "turn_complete";
      messages: WireMessage[];
      trace: ToolEvent[];
      text: string;
    }
  | {
      type: "awaiting_approval";
      messages: WireMessage[];
      trace: ToolEvent[];
      pending: PendingApproval;
    }
  | {
      type: "error";
      messages?: WireMessage[];
      trace: ToolEvent[];
      errorKind: "auth" | "config" | "other";
      message: string;
    };
