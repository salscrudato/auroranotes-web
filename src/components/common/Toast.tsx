/**
 * Context-based toast notification system for ephemeral messages.
 */

import { useState, useCallback, useRef, useEffect, useMemo, memo, type ReactNode } from 'react';
import { Check, X, Info, AlertTriangle, type LucideIcon } from 'lucide-react';
import { ToastContext, type ToastType } from './ToastContext';
import { UI } from '../../lib/constants';
import { cn } from '../../lib/utils';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

// ============================================================================
// Style Configuration
// ============================================================================

interface ToastVariantConfig {
  icon: LucideIcon;
  iconColor: string;
  borderColor: string;
}

const TOAST_VARIANTS: Record<ToastType, ToastVariantConfig> = {
  success: {
    icon: Check,
    iconColor: 'text-[var(--color-success)]',
    borderColor: 'border-[var(--color-success-border)]',
  },
  error: {
    icon: X,
    iconColor: 'text-[var(--color-danger)]',
    borderColor: 'border-[var(--color-danger-border)]',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-[var(--color-warning)]',
    borderColor: 'border-amber-300/30',
  },
  info: {
    icon: Info,
    iconColor: 'text-[var(--color-accent)]',
    borderColor: 'border-[var(--color-border)]',
  },
};

const TOAST_BASE_CLASSES = cn(
  'flex items-center gap-2 px-4 py-3',
  'bg-[var(--color-surface-elevated)] text-[var(--color-text)]',
  'border rounded-[var(--radius-lg)] shadow-[var(--shadow-card)]',
  'text-sm font-medium',
  'animate-in slide-in-from-bottom-2 fade-in duration-200'
);

// ============================================================================
// Provider
// ============================================================================

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach(clearTimeout);
      timeouts.clear();
    };
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    setToasts((prev) => [...prev, { id, message, type }]);

    const timeout = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timeoutsRef.current.delete(id);
    }, UI.TOAST_DURATION_MS);

    timeoutsRef.current.set(id, timeout);
  }, []);

  const contextValue = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

const ToastContainer = memo(function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[2000] flex flex-col gap-2"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
});

const ToastItem = memo(function ToastItem({ toast }: { toast: Toast }) {
  const config = TOAST_VARIANTS[toast.type];
  const Icon = config.icon;

  return (
    <div className={cn(TOAST_BASE_CLASSES, config.borderColor)}>
      <span className={config.iconColor}>
        <Icon size={14} />
      </span>
      {toast.message}
    </div>
  );
});
