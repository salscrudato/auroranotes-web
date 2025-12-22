/**
 * Toast notification system
 * Lightweight context-based toast for showing ephemeral messages
 */

import { useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { Check, X, Info, AlertTriangle } from 'lucide-react';
import { ToastContext, type ToastType } from './ToastContext';
import { UI } from '../../lib/constants';
import { cn } from '../../lib/utils';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Cleanup all timeouts on unmount
  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
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

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success': return <Check size={14} />;
      case 'error': return <X size={14} />;
      case 'warning': return <AlertTriangle size={14} />;
      case 'info': default: return <Info size={14} />;
    }
  };

  const getToastStyles = (type: ToastType) => {
    const base = [
      'flex items-center gap-2 px-4 py-3',
      'bg-[var(--color-surface-elevated)] text-[var(--color-text)]',
      'border rounded-[var(--radius-lg)] shadow-[var(--shadow-card)]',
      'text-sm font-medium',
      'animate-in slide-in-from-bottom-2 fade-in duration-200',
    ].join(' ');

    const variants: Record<ToastType, string> = {
      success: 'border-[var(--color-success-border)]',
      error: 'border-[var(--color-danger-border)]',
      warning: 'border-amber-300/30',
      info: 'border-[var(--color-border)]',
    };

    return cn(base, variants[type]);
  };

  const getIconStyles = (type: ToastType) => {
    const variants: Record<ToastType, string> = {
      success: 'text-[var(--color-success)]',
      error: 'text-[var(--color-danger)]',
      warning: 'text-[var(--color-warning)]',
      info: 'text-[var(--color-accent)]',
    };
    return variants[type];
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[2000] flex flex-col gap-2"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className={getToastStyles(toast.type)}>
            <span className={getIconStyles(toast.type)}>
              {getIcon(toast.type)}
            </span>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

