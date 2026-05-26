import { forwardRef, useId } from 'react';
import { cn } from '../lib/cn';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: React.ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, label, id, ...props },
  ref,
) {
  const autoId = useId();
  const cbId = id ?? autoId;
  return (
    <label htmlFor={cbId} className="inline-flex cursor-pointer items-center gap-2.5 text-base text-foreground has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
      <span className="relative inline-flex">
        <input
          ref={ref}
          id={cbId}
          type="checkbox"
          className={cn(
            'peer size-5 appearance-none rounded-[5px] border border-input bg-background outline-none transition-colors checked:border-primary checked:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
            className,
          )}
          {...props}
        />
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className="pointer-events-none absolute left-0 top-0 size-5 scale-75 p-0.5 text-primary-foreground opacity-0 transition-opacity peer-checked:opacity-100"
        >
          <path d="M3.5 8.5l3 3 6-6.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {label && <span>{label}</span>}
    </label>
  );
});
