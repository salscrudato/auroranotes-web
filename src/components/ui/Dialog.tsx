/**
 * Dialog component - Tailwind-based UI primitive
 * Modal dialog with backdrop, accessible focus management
 */

import { forwardRef, type HTMLAttributes, type ReactNode, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { IconButton } from './IconButton';

export interface DialogProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export const Dialog = forwardRef<HTMLDivElement, DialogProps>(
  ({ className, open, onClose, children, ...props }, ref) => {
    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }, [onClose]);

    if (!open) return null;

    return (
      <div
        className={cn(
          'fixed inset-0 z-[1000]',
          'flex items-center justify-center p-4',
          'bg-black/50 backdrop-blur-[2px]',
          'animate-in fade-in duration-200'
        )}
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        {...props}
      >
        <div
          ref={ref}
          className={cn(
            'relative w-full max-w-md',
            'bg-[var(--color-surface)] rounded-[var(--radius-xl)]',
            'border border-[var(--color-border)]',
            'shadow-[var(--shadow-modal)]',
            'animate-in zoom-in-95 duration-200',
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    );
  }
);

Dialog.displayName = 'Dialog';

/** Dialog Close Button */
export interface DialogCloseProps {
  onClose: () => void;
}

export function DialogClose({ onClose }: DialogCloseProps) {
  return (
    <IconButton
      variant="ghost"
      size="sm"
      onClick={onClose}
      className="absolute top-3 right-3"
      aria-label="Close dialog"
    >
      <X size={18} />
    </IconButton>
  );
}

/** Dialog Header */
export interface DialogHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const DialogHeader = forwardRef<HTMLDivElement, DialogHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-6 pt-6 pb-4', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DialogHeader.displayName = 'DialogHeader';

/** Dialog Title */
export interface DialogTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

export const DialogTitle = forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <h2
        ref={ref}
        className={cn(
          'text-lg font-semibold text-[var(--color-text)]',
          'tracking-tight',
          className
        )}
        {...props}
      >
        {children}
      </h2>
    );
  }
);

DialogTitle.displayName = 'DialogTitle';

/** Dialog Body */
export interface DialogBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const DialogBody = forwardRef<HTMLDivElement, DialogBodyProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-6 py-4', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DialogBody.displayName = 'DialogBody';

/** Dialog Footer */
export interface DialogFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const DialogFooter = forwardRef<HTMLDivElement, DialogFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-end gap-3',
          'px-6 pb-6 pt-2',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DialogFooter.displayName = 'DialogFooter';

