import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

const alert = cva('flex gap-3 rounded-panel border p-4 text-base', {
  variants: {
    appearance: {
      info: 'border-border bg-muted text-foreground',
      brand: 'border-text-brand/30 bg-brand-subtle text-foreground',
      critical: 'border-destructive/30 bg-critical-subtle text-foreground',
      success: 'border-success/30 bg-success-subtle text-foreground',
      alert: 'border-alert/40 bg-alert-subtle text-foreground',
    },
  },
  defaultVariants: { appearance: 'info' },
});

export interface AlertProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof alert> {
  title?: React.ReactNode;
  onDismiss?: () => void;
}

export function Alert({ className, appearance, title, onDismiss, children, ...props }: AlertProps) {
  return (
    <div role="alert" className={cn(alert({ appearance }), className)} {...props}>
      <div className="flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-1', 'text-muted-foreground')}>{children}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="-mr-1 -mt-1 inline-flex size-7 shrink-0 items-center justify-center rounded-control text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
            <path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
