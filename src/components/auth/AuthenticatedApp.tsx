/**
 * AuthenticatedApp - Wrapper that shows landing page or app content based on auth state
 * Also handles connecting the auth token getter to the API client
 */

import { useEffect, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { setTokenGetter } from '../../lib/api';
import { LandingPage } from './LandingPage';

interface AuthenticatedAppProps {
  children: ReactNode;
}

export function AuthenticatedApp({ children }: AuthenticatedAppProps) {
  const { user, loading, getToken } = useAuth();

  // Connect auth token getter to API client
  useEffect(() => {
    setTokenGetter(getToken);
  }, [getToken]);

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="auth-loading">
        <Loader2 size={32} className="spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  // Show landing page if not authenticated
  if (!user) {
    return <LandingPage />;
  }

  // Show app content if authenticated
  return <>{children}</>;
}

