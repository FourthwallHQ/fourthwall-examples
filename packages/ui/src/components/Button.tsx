import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

const button = cva(
  'relative inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-control font-semibold outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      appearance: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary-hover',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive-hover',
        'semi-transparent': 'bg-transparent text-foreground hover:bg-muted',
      },
      size: {
        xsmall: 'h-8 px-2.5 text-sm',
        small: 'h-10 px-4 text-base',
        medium: 'h-12 px-5 text-base',
        large: 'h-14 px-6 text-base',
      },
      fullWidth: { true: 'flex w-full' },
    },
    defaultVariants: { appearance: 'secondary', size: 'medium' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, appearance, size, fullWidth, loading, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(button({ appearance, size, fullWidth }), className)}
      {...props}
    >
      {loading && (
        <span
          aria-hidden
          className="absolute size-5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      <span className={cn('inline-flex items-center gap-2.5', loading && 'invisible')}>
        {children}
      </span>
    </button>
  );
});
