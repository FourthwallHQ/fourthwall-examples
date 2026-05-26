import { forwardRef, useId } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

const field = cva(
  'w-full rounded-control border bg-background px-3.5 text-foreground outline-none transition-colors placeholder:text-muted-foreground hover:border-input-hover focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: { xsmall: 'h-8 text-sm', small: 'h-10 text-base', medium: 'h-12 text-base', large: 'h-14 text-base' },
      invalid: { true: 'border-destructive focus-visible:border-destructive focus-visible:outline-destructive', false: 'border-input' },
    },
    defaultVariants: { size: 'medium', invalid: false },
  },
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof field> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, error, size, invalid, id, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const isInvalid = invalid ?? Boolean(error);
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <input ref={ref} id={inputId} aria-invalid={isInvalid} className={cn(field({ size, invalid: isInvalid }), className)} {...props} />
      {error && <span className="text-sm text-text-critical">{error}</span>}
    </div>
  );
});
