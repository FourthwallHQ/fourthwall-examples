import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type Anthropic from "@anthropic-ai/sdk";

const MCP_URL = process.env.FOURTHWALL_MCP_URL ?? "https://mcp.fourthwall.com/";

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

/** The expected failure: the short-lived MCP token has expired. */
export class McpAuthError extends Error {
  constructor() {
    super("401 Unauthorized — the MCP server rejected the access token");
  }
}

function isAuthError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /\b401\b|unauthorized|invalid[_ ]token/i.test(message);
}

export interface McpConnection {
  client: Client;
  tools: McpTool[];
  close: () => Promise<void>;
}

export async function connectMcp(token: string): Promise<McpConnection> {
  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL), {
    requestInit: { headers: { Authorization: `Bearer ${token}` } },
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
