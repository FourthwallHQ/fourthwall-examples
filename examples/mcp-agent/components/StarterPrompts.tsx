const PROMPTS = [
  "What sold best this month?",
  "Which orders are unfulfilled?",
  "How many orders this week?",
  "Show my shop details",
];

export function StarterPrompts({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="flex min-h-[520px] flex-col items-center justify-center gap-5 py-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-[18px] bg-primary text-primary-foreground">
        <svg viewBox="0 0 16 16" className="size-7" fill="currentColor" aria-hidden>
          <path d="M8 0c.62 4.06 3.42 6.92 8 8-4.58 1.08-7.38 3.94-8 8-.62-4.06-3.42-6.92-8-8 4.58-1.08 7.38-3.94 8-8Z" />
        </svg>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xl font-semibold">Ask anything about your shop</span>
        <span className="text-base text-muted-foreground">
          Answers come live from your shop through the Fourthwall MCP server.
        </span>
      </div>
      <div className="flex max-w-[560px] flex-wrap justify-center gap-2.5">
        {PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onPick(prompt)}
            className="cursor-pointer rounded-full bg-muted px-4 py-2 text-sm transition-colors hover:bg-accent"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
