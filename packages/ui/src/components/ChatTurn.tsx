import { cn } from '../lib/cn';

export interface ChatTurnProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Replaces the default sparkle in the avatar disc. */
  avatar?: React.ReactNode;
}

/**
 * An assistant turn in a chat thread: a small brand avatar rail beside a
 * content column. Children stack with a tight gap — typically a run of
 * <ToolCall> lines followed by the answer prose.
 */
export function ChatTurn({ avatar, className, children, ...props }: ChatTurnProps) {
  return (
    <div className={cn('flex gap-3', className)} {...props}>
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        {avatar ?? (
          <svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor" aria-hidden>
            <path d="M8 0c.62 4.06 3.42 6.92 8 8-4.58 1.08-7.38 3.94-8 8-.62-4.06-3.42-6.92-8-8 4.58-1.08 7.38-3.94 8-8Z" />
          </svg>
        )}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-3">{children}</div>
    </div>
  );
}
