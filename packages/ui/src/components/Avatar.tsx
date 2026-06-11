import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

const avatar = cva(
  'inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-accent font-semibold text-muted-foreground',
  {
    variants: {
      size: {
        xsmall: 'size-6 text-[11px]',
        small: 'size-8 text-xs',
        medium: 'size-10 text-sm',
        large: 'size-12 text-base',
      },
    },
    defaultVariants: { size: 'medium' },
  },
);

export interface AvatarProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof avatar> {
  src?: string;
  alt?: string;
  /** Initials shown when no image is given (or while it loads). */
  fallback?: string;
}

export function Avatar({ src, alt, fallback, size, className, ...props }: AvatarProps) {
  return (
    <span className={cn(avatar({ size }), className)} {...props}>
      {src ? <img src={src} alt={alt} className="size-full object-cover" /> : fallback}
    </span>
  );
}
