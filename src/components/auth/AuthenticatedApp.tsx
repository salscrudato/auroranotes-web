import { useLayoutEffect, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/auth/useAuth';
import { setTokenGetter } from '@/lib/api';
import { LandingPage } from './LandingPage';

export function AuthenticatedApp({ children }: { children: ReactNode }) {
  const { user, loading, getToken } = useAuth();

  // Connect auth token to API client before render
  useLayoutEffect(() => {
    setTokenGetter(getToken);
  }, [getToken]);

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
