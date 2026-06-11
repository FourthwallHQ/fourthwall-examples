import { randomUUID } from "node:crypto";
import { auth } from "@modelcontextprotocol/sdk/client/auth.js";
import type { OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth.js";
import type {
  OAuthClientInformationMixed,
  OAuthClientMetadata,
  OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js";

export const MCP_URL = process.env.FOURTHWALL_MCP_URL ?? "https://mcp.fourthwall.com/";

/**
 * Single-user, in-memory OAuth state. The server self-registers with the MCP
 * server (dynamic client registration) on the first login and the SDK
 * refreshes tokens automatically. Restarting the dev server forgets the
 * session — reconnect is one click.
 *
 * Stashed on globalThis so Next.js dev-mode hot reloads don't drop a live
 * session.
 */
interface AuthStore {
  baseUrl?: string;
  clientInformation?: OAuthClientInformationMixed;
  tokens?: OAuthTokens;
  codeVerifier?: string;
  state?: string;
  pendingAuthUrl?: string;
  shopLabel?: string;
}

const store: AuthStore = ((globalThis as Record<string, unknown>).__mcpAgentAuth ??=
  {}) as AuthStore;

class InMemoryOAuthProvider implements OAuthClientProvider {
  get redirectUrl(): string {
    return `${store.baseUrl ?? "http://localhost:3000"}/api/auth/callback`;
  }

  get clientMetadata(): OAuthClientMetadata {
    return {
      client_name: "Fourthwall MCP Agent (example)",
      redirect_uris: [this.redirectUrl],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      scope: "openid profile email offline_access",
    };
  }

  state(): string {
    store.state ??= randomUUID();
    return store.state;
  }

  clientInformation(): OAuthClientInformationMixed | undefined {
    return store.clientInformation;
  }

  saveClientInformation(clientInformation: OAuthClientInformationMixed): void {
    store.clientInformation = clientInformation;
  }

  tokens(): OAuthTokens | undefined {
    return store.tokens;
  }

  saveTokens(tokens: OAuthTokens): void {
    store.tokens = tokens;
  }

  redirectToAuthorization(authorizationUrl: URL): void {
    store.pendingAuthUrl = authorizationUrl.toString();
  }

  saveCodeVerifier(codeVerifier: string): void {
    store.codeVerifier = codeVerifier;
  }

  codeVerifier(): string {
    if (!store.codeVerifier) {
      throw new Error("No PKCE verifier in this session — start the login flow again.");
    }
    return store.codeVerifier;
  }
}

export const oauthProvider = new InMemoryOAuthProvider();

export function isConnected(): boolean {
  return store.tokens != null;
}

export function shopLabel(): string | undefined {
  return store.shopLabel;
}

export function saveShopLabel(label: string | undefined): void {
  store.shopLabel = label;
}

export function clearSession(): void {
  delete store.tokens;
  delete store.codeVerifier;
  delete store.state;
  delete store.pendingAuthUrl;
}

/**
 * Starts the authorization-code flow (registering the client first if
 * needed). Returns the Fourthwall authorize URL to redirect the browser to,
 * or null when the stored session is already valid.
 */
export async function beginLogin(baseUrl: string): Promise<string | null> {
  store.baseUrl = baseUrl;
  store.state = randomUUID();
  delete store.pendingAuthUrl;

  const result = await auth(oauthProvider, { serverUrl: MCP_URL });
  if (result === "AUTHORIZED") return null;
  if (!store.pendingAuthUrl) throw new Error("Authorization flow produced no redirect URL.");
  return store.pendingAuthUrl;
}

/** Exchanges the callback's authorization code for tokens. */
export async function completeLogin(code: string, state: string | null): Promise<void> {
  if (!store.state || state !== store.state) {
    throw new Error("OAuth state mismatch — start the login flow again.");
  }
  const result = await auth(oauthProvider, { serverUrl: MCP_URL, authorizationCode: code });
  if (result !== "AUTHORIZED") {
    throw new Error("Token exchange did not complete.");
  }
}
