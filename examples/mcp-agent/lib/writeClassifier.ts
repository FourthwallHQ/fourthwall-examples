import type { McpTool } from "./mcp";

/**
 * Decides which tool calls run freely and which pause for approval.
 *
 * Inputs, in order of trust:
 *   1. MCP annotations — `readOnlyHint: true` marks a tool safe.
 *   2. The call's `action` argument — Fourthwall's `manage_*` tools are
 *      polymorphic, so the verb lives in the input, not the tool name.
 *   3. A name heuristic, for servers that annotate nothing.
 *
 * Anything ambiguous is treated as a write: an unknown tool must never run
 * silently.
 */

const READ_ACTIONS = new Set(["list", "get", "read", "show", "search", "find", "fetch"]);

const READ_NAME = /^(get|list|show|search|fetch|read|describe)([_-]|$)/i;
const WRITE_NAME =
  /^(create|update|delete|cancel|refund|issue|publish|upload|set|toggle)([_-]|$)/i;
const POLYMORPHIC_NAME = /^manage([_-]|$)/i;

export function classifyCall(
  tool: McpTool,
  input: Record<string, unknown>,
): "read" | "write" {
  if (tool.annotations?.readOnlyHint === true) return "read";

  const action = typeof input.action === "string" ? input.action.toLowerCase() : undefined;
  if (action) return READ_ACTIONS.has(action) ? "read" : "write";

  if (tool.annotations?.readOnlyHint === false) return "write";
  if (WRITE_NAME.test(tool.name)) return "write";
  if (READ_NAME.test(tool.name)) return "read";
  return "write";
}

/**
 * Read-only mode withholds tools from Claude rather than refusing calls.
 * Polymorphic `manage_*` tools can't be withheld without losing their read
 * actions, so they stay offered and their write actions are refused at
 * execution time instead.
 */
export function isOfferedReadOnly(tool: McpTool): boolean {
  if (tool.annotations?.readOnlyHint === true) return true;
  if (POLYMORPHIC_NAME.test(tool.name)) return true;
  if (tool.annotations == null && READ_NAME.test(tool.name)) return true;
  return false;
}
