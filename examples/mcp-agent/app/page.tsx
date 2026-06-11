"use client";

import { useEffect, useState } from "react";
import { Composer } from "@fourthwall-examples/ui";
import { Thread } from "@/components/Thread";
import { StarterPrompts } from "@/components/StarterPrompts";
import { ConnectGate } from "@/components/ConnectGate";
import type { ChatResponse, Decision, ToolEvent, WireMessage } from "@/lib/types";
import type { AssistantDisplayTurn, DisplayTurn } from "@/lib/clientTypes";

const SHOP_LABEL = process.env.NEXT_PUBLIC_SHOP_LABEL ?? "Your shop";
const SHOP_INITIALS = SHOP_LABEL.split(/[^a-zA-Z0-9]+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((word) => word[0].toUpperCase())
  .join("");

function mergeTrace(existing: ToolEvent[], incoming: ToolEvent[]): ToolEvent[] {
  const merged = [...existing];
  for (const event of incoming) {
    const index = merged.findIndex((candidate) => candidate.id === event.id);
    if (index >= 0) merged[index] = event;
    else merged.push(event);
  }
  return merged;
}

function applyResponse(turn: AssistantDisplayTurn, data: ChatResponse): AssistantDisplayTurn {
  const base: AssistantDisplayTurn = {
    ...turn,
    trace: mergeTrace(turn.trace, data.trace),
    thinking: false,
    pending: undefined,
  };
  switch (data.type) {
    case "turn_complete":
      return { ...base, text: data.text };
    case "awaiting_approval":
      return { ...base, pending: data.pending };
    case "error":
      return data.errorKind === "auth"
        ? { ...base, authError: true }
        : { ...base, errorMessage: data.message };
  }
}

export default function Page() {
  const [turns, setTurns] = useState<DisplayTurn[]>([]);
  const [messages, setMessages] = useState<WireMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState<string | undefined>();

  useEffect(() => {
    const url = new URL(window.location.href);
    const failed = url.searchParams.get("auth_error");
    if (failed) {
      url.searchParams.delete("auth_error");
      window.history.replaceState(null, "", url.toString());
    }
    fetch("/api/auth/status")
      .then((response) => response.json())
      .then((data: { connected: boolean }) => {
        setConnected(data.connected);
        if (failed) setAuthError(failed);
      })
      .catch(() => setConnected(false));
  }, []);

  const lastTurn = turns[turns.length - 1];
  const pending = lastTurn?.kind === "assistant" ? lastTurn.pending : undefined;

  function updateLastAssistant(update: (turn: AssistantDisplayTurn) => AssistantDisplayTurn) {
    setTurns((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (last?.kind === "assistant") next[next.length - 1] = update(last);
      return next;
    });
  }

  async function post(wire: WireMessage[], decision?: Decision) {
    setBusy(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: wire, decision }),
      });
      const data: ChatResponse = await response.json();
      updateLastAssistant((turn) => applyResponse(turn, data));
      if ("messages" in data && data.messages) setMessages(data.messages);
    } catch {
      updateLastAssistant((turn) => ({
        ...turn,
        thinking: false,
        errorMessage: "The request failed — check that the dev server is running and try again.",
      }));
    } finally {
      setBusy(false);
    }
  }

  function send(text: string) {
    if (busy || pending) return;
    const wire: WireMessage[] = [...messages, { role: "user", content: text }];
    setMessages(wire);
    setTurns((prev) => [
      ...prev,
      { kind: "user", text },
      { kind: "assistant", trace: [], thinking: true },
    ]);
    void post(wire);
  }

  function decide(approved: boolean) {
    if (!pending || busy) return;
    const decision: Decision = { toolUseId: pending.toolUseId, approved };
    updateLastAssistant((turn) => ({ ...turn, pending: undefined, thinking: true }));
    void post(messages, decision);
  }

  function dismissAlert(index: number) {
    setTurns((prev) =>
      prev.map((turn, i) =>
        i === index && turn.kind === "assistant" ? { ...turn, alertDismissed: true } : turn,
      ),
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[760px] flex-col px-6">
      <header className="flex items-center justify-between gap-4 border-b border-border py-5">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-panel bg-primary text-primary-foreground">
            <svg viewBox="0 0 16 16" className="size-[18px]" fill="currentColor" aria-hidden>
              <path d="M8 0c.62 4.06 3.42 6.92 8 8-4.58 1.08-7.38 3.94-8 8-.62-4.06-3.42-6.92-8-8 4.58-1.08 7.38-3.94 8-8Z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold">Shop Assistant</span>
            <span className="text-sm text-muted-foreground">
              Powered by the Fourthwall MCP server
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3">
          <span className="flex size-6 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-muted-foreground">
            {SHOP_INITIALS}
          </span>
          <span className="text-sm font-medium">{SHOP_LABEL}</span>
        </div>
      </header>

      <main className="flex-1">
        {connected === false ? (
          <ConnectGate authError={authError} />
        ) : turns.length === 0 ? (
          connected != null && <StarterPrompts onPick={send} />
        ) : (
          <Thread turns={turns} busy={busy} onDecide={decide} onDismissAlert={dismissAlert} />
        )}
      </main>

      <div className="sticky bottom-0 bg-background pb-5 pt-3">
        <Composer
          placeholder={pending ? "Waiting for your decision…" : "Ask about your shop…"}
          disabled={busy || pending != null || connected !== true}
          meta={connected ? "Connected to mcp.fourthwall.com" : "Not connected"}
          onSend={send}
        />
      </div>
    </div>
  );
}
