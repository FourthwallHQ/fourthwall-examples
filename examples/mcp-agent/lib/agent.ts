import Anthropic from "@anthropic-ai/sdk";
import {
  connectMcp,
  callTool,
  toClaudeTools,
  McpAuthError,
  type McpConnection,
  type McpTool,
} from "./mcp";
import { classifyCall } from "./writeClassifier";
import type {
  ChatResponse,
  Decision,
  StreamEvent,
  ToolEvent,
  WireMessage,
} from "./types";

const MODEL = "claude-opus-4-8";
const MAX_TOKENS = 2048;
/** Hard cap on tool calls per turn so a misbehaving model can't fan out. */
const MAX_TOOL_CALLS = 12;

const systemPrompt = () => `You are a shop assistant for a creator's Fourthwall shop. Answer questions with live data fetched through the Fourthwall MCP tools — never invent numbers, orders, or products. Keep answers short and concrete; use lists for rankings and enumerations. Answer in Markdown.

Today's date is ${new Date().toISOString().slice(0, 10)}.

Tool calls that change the shop pause for the creator's explicit approval. If a call is denied, do not retry it — acknowledge the denial and offer a softer alternative.`;

function summarizeResult(text: string): string {
  try {
    const data: unknown = JSON.parse(text);
    if (Array.isArray(data)) return `${data.length} item${data.length === 1 ? "" : "s"}`;
    if (data && typeof data === "object") {
      for (const [key, value] of Object.entries(data)) {
        if (Array.isArray(value)) return `${value.length} ${key}`;
      }
      const named = data as { name?: unknown; id?: unknown };
      if (typeof named.name === "string") return named.name;
      if (typeof named.id === "string") return named.id;
    }
  } catch {
    // not JSON — fall through to the text snippet
  }
  const line = text.replace(/\s+/g, " ").trim();
  if (!line) return "done";
  return line.length > 60 ? `${line.slice(0, 57)}…` : line;
}

function formatArgs(input: Record<string, unknown>): string {
  return JSON.stringify(input, null, 2);
}

function toolResultMessage(toolUseId: string, text: string, isError: boolean): WireMessage {
  return {
    role: "user",
    content: [
      { type: "tool_result", tool_use_id: toolUseId, content: text, is_error: isError },
    ],
  };
}

/** The tool_use a decision resolves must be the tail of the transcript. */
function findPendingToolUse(
  messages: WireMessage[],
  toolUseId: string,
): Anthropic.Messages.ToolUseBlockParam | undefined {
  const last = messages[messages.length - 1];
  if (!last || last.role !== "assistant" || !Array.isArray(last.content)) return undefined;
  return last.content.find(
    (block): block is Anthropic.Messages.ToolUseBlockParam =>
      block.type === "tool_use" && block.id === toolUseId,
  );
}

export interface TurnInput {
  messages: WireMessage[];
  decision?: Decision;
  /** Live progress sink — text deltas and tool-trace upserts as they happen. */
  emit?: (event: StreamEvent) => void;
}

export async function runTurn(input: TurnInput): Promise<ChatResponse> {
  const anthropic = new Anthropic();
  const emit = input.emit ?? (() => {});
  const messages = [...input.messages];
  const trace: ToolEvent[] = [];
  const textParts: string[] = [];
  let streamedText = false;

  let mcp: McpConnection;
  try {
    mcp = await connectMcp();
  } catch (err) {
    if (err instanceof McpAuthError) {
      return { type: "error", trace, errorKind: "auth", message: err.message };
    }
    throw err;
  }

  try {
    const toolsByName = new Map(mcp.tools.map((tool) => [tool.name, tool]));
    const claudeTools = toClaudeTools(mcp.tools);

    const execute = async (
      block: Anthropic.Messages.ToolUseBlockParam,
      decision?: "allowed",
    ): Promise<ChatResponse | undefined> => {
      const args = block.input as Record<string, unknown>;
      const settle = (event: ToolEvent) => {
        trace.push(event);
        emit({ type: "tool", event });
      };
      emit({
        type: "tool",
        event: {
          id: block.id,
          name: block.name,
          input: args,
          status: "pending",
          summary: "running…",
          decision,
        },
      });
      try {
        const result = await callTool(mcp.client, block.name, args);
        messages.push(toolResultMessage(block.id, result.text, result.isError));
        settle({
          id: block.id,
          name: block.name,
          input: args,
          status: result.isError ? "error" : "success",
          summary: result.isError ? "failed" : summarizeResult(result.text),
          detail: result.isError ? result.text : formatArgs(args),
          decision,
        });
        return undefined;
      } catch (err) {
        if (!(err instanceof McpAuthError)) throw err;
        // Keep the transcript valid (the dangling tool_use gets a result) and
        // surface the expected failure as the trace line + recovery alert.
        messages.push(toolResultMessage(block.id, err.message, true));
        settle({
          id: block.id,
          name: block.name,
          input: args,
          status: "error",
          summary: "failed",
          detail: err.message,
          decision,
        });
        return { type: "error", messages, trace, errorKind: "auth", message: err.message };
      }
    };

    if (input.decision) {
      const block = findPendingToolUse(messages, input.decision.toolUseId);
      if (!block) {
        return {
          type: "error",
          trace,
          errorKind: "other",
          message: "The decision does not match a pending tool call in the transcript.",
        };
      }
      if (input.decision.approved) {
        const failure = await execute(block, "allowed");
        if (failure) return failure;
      } else {
        messages.push(
          toolResultMessage(
            block.id,
            "The creator denied this tool call. Nothing was changed. Do not retry it; acknowledge the denial and offer an alternative.",
            true,
          ),
        );
        const event: ToolEvent = {
          id: block.id,
          name: block.name,
          input: block.input as Record<string, unknown>,
          status: "error",
          summary: "",
          decision: "denied",
        };
        trace.push(event);
        emit({ type: "tool", event });
      }
    }

    const emitText = (delta: string) => {
      if (!streamedText) {
        streamedText = true;
      }
      emit({ type: "text_delta", delta });
    };

    let toolCalls = 0;
    for (let round = 0; round < MAX_TOOL_CALLS + 3; round++) {
      const messageStream = anthropic.messages.stream({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt(),
        messages,
        tools: claudeTools,
        // One tool_use per round keeps the pause/resume protocol stateless: a
        // paused write is always the lone dangling call in the transcript.
        tool_choice: { type: "auto", disable_parallel_tool_use: true },
      });

      let firstDeltaOfRound = true;
      messageStream.on("text", (delta) => {
        if (firstDeltaOfRound) {
          firstDeltaOfRound = false;
          if (streamedText) emitText("\n\n");
        }
        emitText(delta);
      });

      const response = await messageStream.finalMessage();
      messages.push({ role: "assistant", content: response.content });

      const roundText = response.content
        .filter((block): block is Anthropic.Messages.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("\n")
        .trim();
      if (roundText) textParts.push(roundText);

      const toolUse = response.content.find(
        (block): block is Anthropic.Messages.ToolUseBlock => block.type === "tool_use",
      );

      if (response.stop_reason !== "tool_use" || !toolUse) {
        return { type: "turn_complete", messages, trace, text: textParts.join("\n\n") };
      }

      const args = toolUse.input as Record<string, unknown>;

      if (toolCalls >= MAX_TOOL_CALLS) {
        messages.push(
          toolResultMessage(
            toolUse.id,
            "Tool-call limit reached for this turn. Answer with what you have so far.",
            true,
          ),
        );
        continue;
      }
      toolCalls++;

      const tool: McpTool = toolsByName.get(toolUse.name) ?? {
        name: toolUse.name,
        inputSchema: {},
      };

      if (classifyCall(tool, args) === "write") {
        const event: ToolEvent = {
          id: toolUse.id,
          name: toolUse.name,
          input: args,
          status: "pending",
          summary: "awaiting approval",
        };
        trace.push(event);
        emit({ type: "tool", event });
        return {
          type: "awaiting_approval",
          messages,
          trace,
          pending: { toolUseId: toolUse.id, name: toolUse.name, input: args },
        };
      }

      const failure = await execute(toolUse);
      if (failure) return failure;
    }

    const capNotice = "I couldn't finish within this turn's tool-call limit. Try a narrower question.";
    if (streamedText) emitText("\n\n");
    emitText(capNotice);
    textParts.push(capNotice);
    return { type: "turn_complete", messages, trace, text: textParts.join("\n\n") };
  } finally {
    await mcp.close().catch(() => {});
  }
}
