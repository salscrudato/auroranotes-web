/**
 * Toast notification system
 * Lightweight context-based toast for showing ephemeral messages
 */

import { useState, useCallback, type ReactNode } from 'react';
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

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, UI.TOAST_DURATION_MS);
  }, []);

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success': return <Check size={14} />;
      case 'error': return <X size={14} />;
      case 'warning': return <AlertTriangle size={14} />;
      case 'info': default: return <Info size={14} />;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={cn('toast', toast.type)}>
            <span className="toast-icon">
              {getIcon(toast.type)}
            </span>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

