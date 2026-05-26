import { forwardRef, useId } from 'react';
import { cn } from '../lib/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  invalid?: boolean;
  resize?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, label, error, invalid, resize = true, id, rows = 4, ...props },
  ref,
) {
  const autoId = useId();
  const taId = id ?? autoId;
  const isInvalid = invalid ?? Boolean(error);
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={taId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={taId}
        rows={rows}
        aria-invalid={isInvalid}
        className={cn(
          'w-full rounded-control border bg-background px-3.5 py-2.5 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground hover:border-input-hover focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50',
          isInvalid ? 'border-destructive focus-visible:border-destructive focus-visible:outline-destructive' : 'border-input',
          !resize && 'resize-none',
          className,
        )}
        {...props}
      />
      {error && <span className="text-sm text-text-critical">{error}</span>}
    </div>
  );
});
