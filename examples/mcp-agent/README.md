# MCP Agent

A single-page chat app where a Claude agent answers questions about your shop by
driving the **Fourthwall MCP server** (`mcp.fourthwall.com`) live — and pauses
for an explicit **Allow / Deny** before any tool call that would change the
shop.

The architecture hinges on **who calls the MCP server**. The Messages API has a
built-in MCP connector, but it executes tools server-side at Anthropic with no
interception point. This example instead runs its own tool-use loop in
`app/api/chat/route.ts`: Claude only *decides* which tool to invoke; the route
is the sole caller of the MCP server, which is where reads run automatically
and writes block on your approval.

## How a turn works

1. The browser POSTs the full transcript to `/api/chat` (stateless — the server
   holds no session).
2. The route connects to `mcp.fourthwall.com`, lists the tools, and hands them
   to Claude as tool definitions.
3. While Claude answers with `tool_use`, the route classifies each call:
   - **Read** — executed immediately, its result fed back, the loop continues.
   - **Write** — the route returns an `awaiting_approval` payload and stops.
4. On a write, the UI renders the exact arguments with **Allow / Deny**. The
   browser re-POSTs the decision: Allow executes the call; Deny feeds Claude an
   error result so it can adapt (it proposes a softer alternative instead of
   dead-ending).
5. The answer renders beneath a quiet per-call trace — every MCP call is one
   line with its arguments behind a disclosure, and decisions stay audited
   (`· approved by you` / `· denied by you`).

The route responds with an **NDJSON stream**: `text_delta` and `tool` events
render live (Markdown included) as the loop runs, and the last line is the
terminal payload — the completed turn, an approval request, or an error.

## Write classification

A call pauses for approval when it would change the shop. Classification reads,
in order of trust:

1. **MCP annotations** — `readOnlyHint: true` marks a tool safe (the Fourthwall
   server annotates all of its tools).
2. **The call's `action` argument** — Fourthwall's `manage_*` tools are
   polymorphic (`{ action: "list" }` vs `{ action: "create" }`), so the verb
   lives in the input. List/get/search-style actions run free; everything else
   pauses.
3. **A name heuristic** as the fallback for unannotated servers
   (create/update/delete/… prefixes are writes).

Anything ambiguous is treated as a write — an unknown tool never runs silently.
The approval panel is the only write gate: nothing reaches the shop without an
explicit **Allow**.

## Authentication — in-app MCP OAuth

The Fourthwall MCP server authenticates with standard MCP OAuth, and this
example does the whole dance itself (`lib/oauth.ts` + `/api/auth/*`):

1. **Connect Fourthwall** redirects to `/api/auth/login`, which uses the MCP
   SDK's `auth()` orchestrator: it discovers the server's OAuth metadata,
   **dynamically registers** this app as a client (no pre-provisioned client
   id), and redirects you to Fourthwall's login with PKCE.
2. Fourthwall sends you back to `/api/auth/callback`, which exchanges the code
   for tokens.
3. The MCP transport is constructed with the same `authProvider`, so requests
   carry the access token and the SDK **refreshes it automatically** when it
   expires.

The session (client registration + tokens) is held in memory, single-user —
restarting the dev server forgets it, and reconnecting is one click. If the
server rejects the session mid-conversation (refresh token revoked or
expired), the turn surfaces a critical alert with a **Reconnect** button.

## Setup

```bash
cp .env.local.example .env.local
```

One secret: **`ANTHROPIC_API_KEY`** — from the
[Anthropic Console](https://console.anthropic.com/). Fourthwall credentials
are handled by the in-app OAuth flow above.

Then, from the monorepo root:

```bash
pnpm install
pnpm --filter mcp-agent dev
```

Open http://localhost:3000 and click **Connect Fourthwall**.

To exercise the approval gate, ask for something like *"Create a 15% discount
code SUMMER15"* — the turn blocks on the approval panel before anything reaches
the shop.

## Simplifications

This is an example, tuned for legibility over efficiency:

- **Stateless replay** — every turn re-sends the whole transcript and re-lists
  the tool catalog. The obvious follow-up is caching the catalog and holding
  conversation state server-side.
- **One tool call per round** — parallel tool use is disabled so a paused write
  is always the lone dangling call in the transcript, which keeps the
  pause/resume protocol trivially stateless.
- **A hard cap** (12 tool calls per turn) stops a runaway loop; on hitting it
  the agent answers with what it has.
- **In-memory everything** — no database. The conversation lives in the
  browser tab and the OAuth session (client registration + tokens) in the
  server process; a dev-server restart means reconnecting, a page refresh
  means a fresh conversation. A real app would persist the OAuth session and
  scope it per user.
