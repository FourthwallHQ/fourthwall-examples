'use client';

import { useState } from 'react';
import { cn } from '../lib/cn';

export interface ComposerProps
  extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  placeholder?: string;
  disabled?: boolean;
  /** Quiet centered line under the field ("Connected to …"). */
  meta?: React.ReactNode;
  /** Controlled value; leave undefined for uncontrolled use. */
  value?: string;
  onValueChange?: (value: string) => void;
  /** Called with the trimmed text on submit; the field clears when uncontrolled. */
  onSend?: (text: string) => void;
}

/**
 * Chat composer: borderless filled-pill input with a circular brand send
 * button. Layout-neutral — pin it (sticky/fixed) from the app.
 */
export function Composer({
  placeholder,
  disabled = false,
  meta,
  value,
  onValueChange,
  onSend,
  className,
  ...props
}: ComposerProps) {
  const [inner, setInner] = useState('');
  const text = value ?? inner;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend?.(trimmed);
    if (value === undefined) setInner('');
  }

  return (
    <form onSubmit={handleSubmit} className={cn('flex flex-col gap-2.5', className)} {...props}>
      <div className={cn('flex items-center gap-2.5', disabled && 'pointer-events-none opacity-45')}>
        <div className="flex h-12 flex-1 items-center rounded-full bg-muted px-5">
          <input
            value={text}
            onChange={(e) => {
              if (value === undefined) setInner(e.target.value);
              onValueChange?.(e.target.value);
            }}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/70"
          />
        </div>
        <button
          type="submit"
          aria-label="Send"
          disabled={disabled}
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="M8 13V3M3.5 7.5L8 3l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      {meta != null && (
        <div className="text-center text-xs text-muted-foreground/70">{meta}</div>
      )}
    </form>
  );
}
