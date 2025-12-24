/**
 * Modal dialog for confirming destructive or important actions.
 * Features iOS-style design with smooth animations.
 */

import { memo, useMemo, useCallback } from 'react';
import { Trash2, AlertCircle, Info } from 'lucide-react';
import { cn, triggerHaptic } from '../../lib/utils';
import { useFocusTrap } from '../../hooks/useFocusTrap';

type ConfirmVariant = 'danger' | 'warning' | 'default';

interface VariantConfig {
  iconBg: string;
  iconColor: string;
  buttonBg: string;
  buttonHover: string;
  icon: typeof Trash2;
}

const VARIANT_CONFIG: Record<ConfirmVariant, VariantConfig> = {
  danger: {
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-500',
    buttonBg: 'bg-red-500 hover:bg-red-600',
    buttonHover: '',
    icon: Trash2,
  },
  warning: {
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
    buttonBg: 'bg-amber-500 hover:bg-amber-600',
    buttonHover: '',
    icon: AlertCircle,
  },
  default: {
    iconBg: 'bg-indigo-500/10',
    iconColor: 'text-indigo-500',
    buttonBg: 'bg-indigo-500 hover:bg-indigo-600',
    buttonHover: '',
    icon: Info,
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
  const IconComponent = config.icon;

  const handleConfirm = useCallback(() => {
    triggerHaptic('medium');
    onConfirm();
  }, [onConfirm]);

  const handleCancel = useCallback(() => {
    triggerHaptic('light');
    onCancel();
  }, [onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && handleCancel()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />

      {/* Dialog */}
      <div
        ref={dialogRef}
        style={{ width: 'calc(100% - 48px)', maxWidth: '320px' }}
        className={cn(
          'relative',
          'bg-[var(--color-surface)]',
          'rounded-2xl',
          'shadow-2xl',
          'animate-in zoom-in-95 fade-in duration-200',
          'overflow-hidden'
        )}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        {/* Content */}
        <div className="pt-6 pb-5 px-5 flex flex-col items-center text-center">
          {/* Icon */}
          <div
            className={cn(
              'mb-4 w-12 h-12 rounded-xl',
              'flex items-center justify-center',
              config.iconBg
            )}
          >
            <IconComponent size={24} className={config.iconColor} strokeWidth={2} />
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
            className="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-[280px]"
          >
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 px-5 pb-5">
          <button
            type="button"
            onClick={handleCancel}
            className={cn(
              'flex-1 h-12 rounded-xl',
              'text-[15px] font-medium',
              'text-[var(--color-text)]',
              'bg-[var(--color-bg-muted)]',
              'hover:bg-[var(--color-surface-hover)]',
              'active:scale-[0.98]',
              'transition-all duration-150'
            )}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={cn(
              'flex-1 h-12 rounded-xl',
              'text-[15px] font-semibold text-white',
              config.buttonBg,
              'active:scale-[0.98]',
              'transition-all duration-150'
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
});
