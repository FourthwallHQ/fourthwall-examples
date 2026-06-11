import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { UnauthorizedError } from "@modelcontextprotocol/sdk/client/auth.js";
import type Anthropic from "@anthropic-ai/sdk";
import { MCP_URL, oauthProvider } from "./oauth";

export interface McpTool {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
  annotations?: {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    [key: string]: unknown;
  };
}

/** The expected failure: no Fourthwall session, or one the server rejected. */
export class McpAuthError extends Error {
  constructor() {
    super("The Fourthwall MCP server rejected the session — reconnect your account.");
  }
}

function isAuthError(err: unknown): boolean {
  if (err instanceof UnauthorizedError) return true;
  const message = err instanceof Error ? err.message : String(err);
  return /\b401\b|unauthorized|invalid[_ ]token/i.test(message);
}

export interface McpConnection {
  client: Client;
  tools: McpTool[];
  close: () => Promise<void>;
}

export async function connectMcp(): Promise<McpConnection> {
  // The authProvider attaches the stored OAuth tokens and refreshes them when
  // they expire; it throws UnauthorizedError when interactive login is needed.
  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL), {
    authProvider: oauthProvider,
  });
  const client = new Client({ name: "fourthwall-mcp-agent-example", version: "0.1.0" });

  try {
    await client.connect(transport);
    const { tools } = await client.listTools();
    return {
      client,
      tools: tools as McpTool[],
      close: () => client.close(),
    };
  } catch (err) {
    await client.close().catch(() => {});
    if (isAuthError(err)) throw new McpAuthError();
    throw err;
  }
}

export function toClaudeTools(tools: McpTool[]): Anthropic.Messages.Tool[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema as Anthropic.Messages.Tool.InputSchema,
  }));
}

/**
 * Looks up the shop the OAuth session is bound to, for the header pill.
 * Best-effort: any failure (or an unexpected catalog shape) just means no
 * label.
 */
export async function fetchShopLabel(): Promise<string | undefined> {
  let mcp: McpConnection | undefined;
  try {
    mcp = await connectMcp();
    const result = await mcp.client.callTool({ name: "show_shops", arguments: {} });
    const structured = result.structuredContent as
      | { shops?: Array<{ name?: string; isCurrent?: boolean }> }
      | undefined;
    const shops = structured?.shops ?? [];
    return (shops.find((shop) => shop.isCurrent) ?? shops[0])?.name;
  } catch {
    return undefined;
  } finally {
    await mcp?.close().catch(() => {});
  }
}

export interface ToolResult {
  text: string;
  isError: boolean;
}

export async function callTool(
  client: Client,
  name: string,
  input: Record<string, unknown>,
): Promise<ToolResult> {
  try {
    const result = await client.callTool({ name, arguments: input });
    const content = Array.isArray(result.content) ? result.content : [];
    const text = content
      .filter((block): block is { type: "text"; text: string } => block.type === "text")
      .map((block) => block.text)
      .join("\n");
    return { text, isError: result.isError === true };
  } catch (err) {
    if (isAuthError(err)) throw new McpAuthError();
    return { text: err instanceof Error ? err.message : String(err), isError: true };
  }
}
