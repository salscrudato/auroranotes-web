/**
 * ConfirmDialog component
 * Modal dialog for confirming destructive actions
 */

import { memo, useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

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
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle escape key, focus trap, and focus restoration
  useEffect(() => {
    if (!isOpen) return;

    // Store current focused element for restoration
    previousActiveElement.current = document.activeElement as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Focus the confirm button (first action) by default
    confirmButtonRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  // Restore focus when closed
  useEffect(() => {
    if (!isOpen && previousActiveElement.current) {
      previousActiveElement.current.focus();
      previousActiveElement.current = null;
    }
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="modal-backdrop animate-fade-in" 
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      <div 
        ref={dialogRef}
        className="modal confirm-dialog animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          className="modal-close btn btn-icon btn-ghost"
          onClick={onCancel}
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        <div className={cn(
          'confirm-dialog-icon',
          variant === 'danger' && 'bg-danger',
          variant === 'warning' && 'bg-warning'
        )}>
          <AlertTriangle size={24} />
        </div>

        <h3 id="confirm-dialog-title">{title}</h3>
        <p id="confirm-dialog-message">{message}</p>

        <div className="confirm-dialog-actions">
          <button 
            className="btn btn-secondary"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button 
            ref={confirmButtonRef}
            className={cn(
              'btn',
              variant === 'danger' && 'btn-danger',
              variant === 'warning' && 'btn-warning',
              variant === 'default' && 'btn-primary'
            )}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
});

