import { useLayoutEffect, useState, useEffect, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/auth/useAuth';
import { setTokenGetter } from '@/lib/api';
import { LandingPage } from './LandingPage';
import { TermsOfService, PrivacyPolicy } from '@/components/legal';

/**
 * Simple router hook for handling legal pages without a full routing library
 */
function useSimpleRouter() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return path;
}

export function AuthenticatedApp({ children }: { children: ReactNode }) {
  const { user, loading, getToken } = useAuth();
  const path = useSimpleRouter();

  // Connect auth token to API client before render
  useLayoutEffect(() => {
    setTokenGetter(getToken);
  }, [getToken]);

  // Legal pages are accessible without authentication
  if (path === '/terms') {
    return <TermsOfService />;
  }
  if (path === '/privacy') {
    return <PrivacyPolicy />;
  }

  if (loading) {
    return (
      <div className="auth-loading">
        <Loader2 size={32} className="spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) return <LandingPage />;

  return <>{children}</>;
}
