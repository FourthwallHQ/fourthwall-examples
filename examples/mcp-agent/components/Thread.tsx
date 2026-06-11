"use client";

import { useEffect, useRef } from "react";
import { ChatBubble } from "@fourthwall-examples/ui";
import { AssistantTurn } from "./AssistantTurn";
import type { DisplayTurn } from "@/lib/clientTypes";

export function Thread({
  turns,
  busy,
  onDecide,
  onDismissAlert,
}: {
  turns: DisplayTurn[];
  busy: boolean;
  onDecide: (approved: boolean) => void;
  onDismissAlert: (index: number) => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns]);

  return (
    <div className="flex flex-col gap-10 py-12">
      {turns.map((turn, index) =>
        turn.kind === "user" ? (
          <ChatBubble key={index}>{turn.text}</ChatBubble>
        ) : (
          <AssistantTurn
            key={index}
            turn={turn}
            busy={busy}
            onDecide={onDecide}
            onDismissAlert={() => onDismissAlert(index)}
          />
        ),
      )}
      <div ref={endRef} />
    </div>
  );
}
