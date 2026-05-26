import { forwardRef, useId } from 'react';
import { cn } from '../lib/cn';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: React.ReactNode;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { className, label, id, ...props },
  ref,
) {
  const autoId = useId();
  const swId = id ?? autoId;
  return (
    <label htmlFor={swId} className="inline-flex cursor-pointer items-center gap-2.5 text-base text-foreground has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
      <span className="relative inline-flex">
        <input ref={ref} id={swId} type="checkbox" role="switch" className={cn('peer size-0 appearance-none', className)} {...props} />
        <span className="h-6 w-10 rounded-full bg-input transition-colors peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring" />
        <span className="pointer-events-none absolute left-0.5 top-0.5 size-5 rounded-full bg-background shadow-sm transition-transform peer-checked:translate-x-4" />
      </span>
      {label && <span>{label}</span>}
    </label>
  );
});
