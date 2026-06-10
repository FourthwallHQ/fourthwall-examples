'use client';

import { useState } from 'react';
import { cn } from '../lib/cn';

export type ToolCallStatus = 'success' | 'pending' | 'error';

export interface ToolCallProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Tool name, rendered in mono. */
  name: string;
  /** Inline result summary ("32 orders", "awaiting approval", "failed"). */
  summary?: React.ReactNode;
  /**
   * success (default) carries no status icon — the happy path is unmarked.
   * pending shows an amber clock, error a red block.
   */
  status?: ToolCallStatus;
  defaultOpen?: boolean;
  /** Expanded detail — tool arguments or error text, shown in a mono inset. */
  children?: React.ReactNode;
}

/**
 * One quiet line of tool-call provenance inside a <ChatTurn>: mono name,
 * muted summary, and an optional disclosure with the exact arguments.
 * Borderless by design — provenance, not the hero.
 */
export function ToolCall({
  name,
  summary,
  status = 'success',
  defaultOpen = false,
  className,
  children,
  ...props
}: ToolCallProps) {
  const [open, setOpen] = useState(defaultOpen);
  const expandable = children != null;

  return (
    <div className={cn('flex flex-col', className)} {...props}>
      <button
        type="button"
        disabled={!expandable}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'inline-flex items-baseline gap-1.5 self-start py-1 text-sm text-muted-foreground',
          expandable && 'cursor-pointer',
        )}
      >
        {status === 'pending' && (
          <svg viewBox="0 0 16 16" className="size-3.5 self-center text-alert-foreground" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <circle cx="8" cy="8" r="6.5" />
            <path d="M8 4.5V8l2.5 1.5" strokeLinecap="round" />
          </svg>
        )}
        {status === 'error' && (
          <svg viewBox="0 0 16 16" className="size-3.5 self-center text-text-critical" fill="currentColor" aria-hidden>
            <path d="M2.343 2.343A8 8 0 1 1 13.658 13.66 8 8 0 0 1 2.343 2.343m.638 1.527a6.5 6.5 0 0 0 9.148 9.148zm9.616-.466a6.5 6.5 0 0 0-8.535-.574l9.107 9.108a6.5 6.5 0 0 0-.572-8.534" />
          </svg>
        )}
        <code className="font-mono text-sm">{name}</code>
        {summary != null && <span className="text-muted-foreground/70">· {summary}</span>}
        {expandable && (
          <svg
            viewBox="0 0 16 16"
            className={cn('size-3 self-center text-muted-foreground/70 transition-transform', open && 'rotate-180')}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden
          >
            <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      {expandable && open && (
        <pre
          className={cn(
            'mb-2 mt-1 overflow-x-auto rounded-control bg-muted px-3 py-2.5 font-mono text-xs leading-relaxed',
            status === 'error' && 'text-text-critical',
          )}
        >
          {children}
        </pre>
      )}
    </div>
  );
}
