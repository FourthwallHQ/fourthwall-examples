'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

const card = cva('flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden rounded-panel border border-border bg-card text-card-foreground shadow-2xl', {
  variants: {
    size: { small: 'max-w-[480px]', medium: 'max-w-[600px]', large: 'max-w-[800px]', xlarge: 'max-w-[960px]' },
  },
  defaultVariants: { size: 'medium' },
});

export interface ModalProps extends VariantProps<typeof card> {
  open: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, size, className, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4"
      onClick={onClose}
      role="presentation"
    >
      <div role="dialog" aria-modal className={cn(card({ size }), className)} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function ModalHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('border-b border-border px-6 py-5 text-xl font-semibold', className)} {...props} />;
}

export function ModalBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('overflow-y-auto px-6 py-5 text-base text-muted-foreground', className)} {...props} />;
}

export function ModalFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center justify-end gap-3 border-t border-border px-6 py-4', className)} {...props} />;
}
