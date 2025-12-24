/**
 * Modal dialog for confirming destructive or important actions.
 */

import { memo, useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { Button, type ButtonVariant } from '../ui/Button';
import { Dialog, DialogClose } from '../ui/Dialog';

type ConfirmVariant = 'danger' | 'warning' | 'default';

interface VariantConfig {
  iconClasses: string;
  buttonVariant: ButtonVariant;
  buttonClassName?: string;
}

const VARIANT_CONFIG: Record<ConfirmVariant, VariantConfig> = {
  danger: {
    iconClasses: 'bg-[var(--color-danger-bg)] text-[var(--color-danger)]',
    buttonVariant: 'danger',
  },
  warning: {
    iconClasses: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
    buttonVariant: 'default',
    buttonClassName: 'bg-[var(--color-warning)] text-white hover:bg-amber-600',
  },
  default: {
    iconClasses: 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]',
    buttonVariant: 'primary',
  },
};

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
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
  const dialogRef = useFocusTrap<HTMLDivElement>({
    enabled: isOpen,
    onEscape: onCancel,
    restoreFocus: true,
  });

  const config = useMemo(() => VARIANT_CONFIG[variant], [variant]);

  return (
    <Dialog
      open={isOpen}
      onClose={onCancel}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      <div ref={dialogRef} className="p-6 text-center">
        <DialogClose onClose={onCancel} />

        <DialogIcon className={config.iconClasses} />

        <h3
          id="confirm-dialog-title"
          className="text-lg font-semibold text-[var(--color-text)] mb-2"
        >
          {title}
        </h3>

        <p
          id="confirm-dialog-message"
          className="text-sm text-[var(--color-text-secondary)] mb-6"
        >
          {message}
        </p>

        <div className="flex items-center justify-center gap-3">
          <Button variant="default" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={config.buttonVariant}
            onClick={onConfirm}
            className={config.buttonClassName}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
});

/** Icon wrapper for the confirmation dialog */
const DialogIcon = memo(function DialogIcon({ className }: { className: string }) {
  return (
    <div
      className={cn(
        'mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center',
        className
      )}
    >
      <AlertTriangle size={24} />
    </div>
  );
});
