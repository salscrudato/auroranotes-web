/**
 * AuroraNotes AI - Main App Entry
 *
 * This is a thin composition layer that sets up providers and renders the shell.
 * Shows landing page when not authenticated, main app when authenticated.
 */

import './styles/app.css';
import { ToastProvider } from './components/common/Toast';
import { LiveRegionProvider } from './components/common/LiveRegion';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AppShell } from './components/layout/AppShell';
import { AuthProvider } from './auth';
import { AuthenticatedApp } from './components/auth/AuthenticatedApp';

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <LiveRegionProvider>
          <AuthProvider>
            <AuthenticatedApp>
              <AppShell />
            </AuthenticatedApp>
          </AuthProvider>
        </LiveRegionProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
