import { forwardRef, useId } from 'react';
import { cn } from '../lib/cn';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: React.ReactNode;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { className, label, id, ...props },
  ref,
) {
  const autoId = useId();
  const rId = id ?? autoId;
  return (
    <label htmlFor={rId} className="inline-flex cursor-pointer items-center gap-2.5 text-base text-foreground has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
      <span className="relative inline-flex">
        <input
          ref={ref}
          id={rId}
          type="radio"
          className={cn(
            'peer size-5 appearance-none rounded-full border border-input bg-background outline-none transition-colors checked:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
            className,
          )}
          {...props}
        />
        <span className="pointer-events-none absolute left-1/2 top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-primary transition-transform peer-checked:scale-100" />
      </span>
      {label && <span>{label}</span>}
    </label>
  );
});
