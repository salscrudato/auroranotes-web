/**
 * PanelFallback component
 * Fallback UI for granular error boundaries in panels
 * Allows individual panels to fail without crashing the entire app
 */

import { AlertTriangle, RotateCcw } from 'lucide-react';

interface PanelFallbackProps {
  title: string;
  onRetry?: () => void;
}

export function PanelFallback({ title, onRetry }: PanelFallbackProps) {
  return (
    <div className="panel panel-fallback">
      <div className="panel-fallback-content">
        <div className="panel-fallback-icon">
          <AlertTriangle size={32} />
        </div>
        <h3 className="panel-fallback-title">Something went wrong</h3>
        <p className="panel-fallback-description">
          {title} encountered an error. The rest of the app is still working.
        </p>
        {onRetry && (
          <button className="btn btn-primary panel-fallback-btn" onClick={onRetry}>
            <RotateCcw size={16} />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

