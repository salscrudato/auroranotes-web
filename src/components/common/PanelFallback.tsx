/**
 * Fallback UI for granular error boundaries in panels.
 * Allows individual panels to fail without crashing the entire app.
 */

import { memo } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';

interface PanelFallbackProps {
  title: string;
  onRetry?: () => void;
}

export const PanelFallback = memo(function PanelFallback({ title, onRetry }: PanelFallbackProps) {
  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)]">
      <div className="flex flex-col items-center justify-center flex-1 p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--color-danger-bg)] flex items-center justify-center mb-4 text-[var(--color-danger)]">
          <AlertTriangle size={32} />
        </div>

        <h3 className="text-base font-semibold text-[var(--color-text)] mb-2">
          Something went wrong
        </h3>

        <p className="text-sm text-[var(--color-text-secondary)] max-w-[280px] leading-relaxed mb-4">
          {title} encountered an error. The rest of the app is still working.
        </p>

        {onRetry && (
          <Button variant="primary" onClick={onRetry}>
            <RotateCcw size={16} />
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
});
