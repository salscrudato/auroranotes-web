/**
 * Error Boundary component
 * Catches React component crashes and displays a fallback UI
 * Uses Tailwind utilities
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
    
    // TODO: Send to error reporting service in production
    // e.g., Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

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
            {import.meta.env.DEV && this.state.error && (
              <details className="text-left mb-6 p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)]">
                <summary className="cursor-pointer text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  Error details
                </summary>
                <pre className="text-xs text-[var(--color-danger)] overflow-auto whitespace-pre-wrap">
                  {this.state.error.toString()}
                </pre>
                {this.state.errorInfo && (
                  <pre className="text-xs text-[var(--color-text-tertiary)] overflow-auto whitespace-pre-wrap mt-2">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}
            <div className="flex items-center justify-center gap-3">
              <Button variant="primary" onClick={this.handleReload}>
                <RefreshCw size={16} />
                Reload Page
              </Button>
              <Button variant="default" onClick={this.handleReset}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  name?: string
): React.FC<P> {
  const displayName = name || WrappedComponent.displayName || WrappedComponent.name || 'Component';
  
  const WithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );
  
  WithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;
  
  return WithErrorBoundary;
}

