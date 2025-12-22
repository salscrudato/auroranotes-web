/**
 * ConfirmDialog component
 * Modal dialog for confirming destructive actions
 * Uses new Tailwind-based UI components
 */

import { memo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { Button } from '../ui/Button';
import { Dialog, DialogClose } from '../ui/Dialog';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = memo(function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Use focus trap hook for proper focus management
  const dialogRef = useFocusTrap<HTMLDivElement>({
    enabled: isOpen,
    onEscape: onCancel,
    restoreFocus: true,
  });

  return (
    <Dialog
      open={isOpen}
      onClose={onCancel}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      <div ref={dialogRef} className="p-6 text-center">
        <DialogClose onClose={onCancel} />

        {/* Icon */}
        <div className={cn(
          'mx-auto mb-4 w-12 h-12 rounded-full',
          'flex items-center justify-center',
          variant === 'danger' && 'bg-[var(--color-danger-bg)] text-[var(--color-danger)]',
          variant === 'warning' && 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
          variant === 'default' && 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
        )}>
          <AlertTriangle size={24} />
        </div>

        {/* Title */}
        <h3
          id="confirm-dialog-title"
          className="text-lg font-semibold text-[var(--color-text)] mb-2"
        >
          {title}
        </h3>

        {/* Message */}
        <p
          id="confirm-dialog-message"
          className="text-sm text-[var(--color-text-secondary)] mb-6"
        >
          {message}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <Button variant="default" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : variant === 'default' ? 'primary' : 'default'}
            onClick={onConfirm}
            className={variant === 'warning' ? 'bg-[var(--color-warning)] text-white hover:bg-amber-600' : ''}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
});

