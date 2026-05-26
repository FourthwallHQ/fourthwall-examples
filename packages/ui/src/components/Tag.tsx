import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

const tag = cva(
  'inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap',
  {
    variants: {
      appearance: {
        neutral: 'bg-muted text-muted-foreground',
        brand: 'bg-brand-subtle text-text-brand',
        critical: 'bg-critical-subtle text-text-critical',
        success: 'bg-success-subtle text-text-success',
        alert: 'bg-alert-subtle text-alert-foreground',
      },
      size: { small: 'h-6 px-2 text-sm', medium: 'h-7 px-2.5 text-sm' },
    },
    defaultVariants: { appearance: 'neutral', size: 'medium' },
  },
);

export interface TagProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof tag> {}

export function Tag({ className, appearance, size, children, ...props }: TagProps) {
  return (
    <span className={cn(tag({ appearance, size }), className)} {...props}>
      {children}
    </span>
  );
}
