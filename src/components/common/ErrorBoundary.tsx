/**
 * Error boundary component that catches React component crashes.
 */

import { Component, memo, type ReactNode, type ErrorInfo, type ComponentType, type FC } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

const INITIAL_STATE: ErrorBoundaryState = {
  hasError: false,
  error: null,
  errorInfo: null,
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = INITIAL_STATE;

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // TODO: Send to error reporting service in production
    // e.g., Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = (): void => {
    this.setState(INITIAL_STATE);
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (!hasError) {
      return children;
    }

    if (fallback) {
      return fallback;
    }

    return (
      <ErrorFallback
        error={error}
        errorInfo={errorInfo}
        onReset={this.handleReset}
        onReload={this.handleReload}
      />
    );
  }
}

// ============================================================================
// Error Fallback UI
// ============================================================================

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
  onReload: () => void;
}

const ErrorFallback = memo(function ErrorFallback({
  error,
  errorInfo,
  onReset,
  onReload,
}: ErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-[var(--color-danger-bg)] flex items-center justify-center mb-6 text-[var(--color-danger)]">
          <AlertTriangle size={32} />
        </div>

        <h2 className="text-xl font-semibold text-[var(--color-text)] mb-3">
          Something went wrong
        </h2>

        <p className="text-sm text-[var(--color-text-secondary)] mb-6 leading-relaxed">
          We're sorry, but something unexpected happened.
          Please try refreshing the page.
        </p>

        {import.meta.env.DEV && error && (
          <ErrorDetails error={error} errorInfo={errorInfo} />
        )}

        <div className="flex items-center justify-center gap-3">
          <Button variant="primary" onClick={onReload}>
            <RefreshCw size={16} />
            Reload Page
          </Button>
          <Button variant="default" onClick={onReset}>
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
});

interface ErrorDetailsProps {
  error: Error;
  errorInfo: ErrorInfo | null;
}

const ErrorDetails = memo(function ErrorDetails({ error, errorInfo }: ErrorDetailsProps) {
  return (
    <details className="text-left mb-6 p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)]">
      <summary className="cursor-pointer text-sm font-medium text-[var(--color-text-secondary)] mb-2">
        Error details
      </summary>
      <pre className="text-xs text-[var(--color-danger)] overflow-auto whitespace-pre-wrap">
        {error.toString()}
      </pre>
      {errorInfo && (
        <pre className="text-xs text-[var(--color-text-tertiary)] overflow-auto whitespace-pre-wrap mt-2">
          {errorInfo.componentStack}
        </pre>
      )}
    </details>
  );
});

// ============================================================================
// Higher-Order Component
// ============================================================================

/**
 * HOC for wrapping components with an error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: ComponentType<P>,
  name?: string
): FC<P> {
  const displayName = name || WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const WithErrorBoundary: FC<P> = (props) => (
    <ErrorBoundary>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

  return WithErrorBoundary;
}
