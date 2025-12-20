/**
 * AuthProvider - Firebase Authentication Context
 * Provides authentication state and methods throughout the app
 */

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  getFirebaseAuth,
  signInWithGoogle as firebaseSignInWithGoogle,
  startPhoneSignIn as firebaseStartPhoneSignIn,
  verifyPhoneCode as firebaseVerifyPhoneCode,
  signOut as firebaseSignOut,
  getIdToken,
  initRecaptcha,
  type User,
} from '../lib/firebase';
import {
  AuthContext,
  type AuthUser,
  type AuthError,
  type AuthContextValue,
} from './useAuth';

// ============================================
// Helper: Convert Firebase User to AuthUser
// ============================================

function toAuthUser(user: User): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    phoneNumber: user.phoneNumber,
  };
}

// ============================================
// Provider Component
// ============================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [phoneVerificationPending, setPhoneVerificationPending] = useState(false);

  // Listen to auth state changes
  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(toAuthUser(firebaseUser));
      } else {
        setUser(null);
      }
      setLoading(false);
    }, (err) => {
      console.error('Auth state error:', err);
      const errorCode = (err as { code?: string }).code || 'auth/unknown';
      setError({ code: errorCode, message: err.message });
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Token getter for API calls
  const getToken = useCallback(async (): Promise<string | null> => {
    return getIdToken(false);
  }, []);

  // Sign in with Google
  const signInWithGoogle = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      const firebaseUser = await firebaseSignInWithGoogle();
      setUser(toAuthUser(firebaseUser));
    } catch (err: unknown) {
      const authErr = err as { code?: string; message?: string };
      const authError: AuthError = {
        code: authErr.code || 'auth/unknown',
        message: authErr.message || 'Failed to sign in with Google',
      };
      setError(authError);
      throw err;
    }
  }, []);

  // Start phone sign-in
  const startPhoneSignIn = useCallback(async (phoneE164: string): Promise<void> => {
    setError(null);
    try {
      // Initialize reCAPTCHA if not already done
      initRecaptcha('recaptcha-container');
      await firebaseStartPhoneSignIn(phoneE164);
      setPhoneVerificationPending(true);
    } catch (err: unknown) {
      const authErr = err as { code?: string; message?: string };
      const authError: AuthError = {
        code: authErr.code || 'auth/unknown',
        message: authErr.message || 'Failed to send verification code',
      };
      setError(authError);
      setPhoneVerificationPending(false);
      throw err;
    }
  }, []);

  // Verify phone code
  const verifyPhoneCode = useCallback(async (code: string): Promise<void> => {
    setError(null);
    try {
      const firebaseUser = await firebaseVerifyPhoneCode(code);
      setUser(toAuthUser(firebaseUser));
      setPhoneVerificationPending(false);
    } catch (err: unknown) {
      const authErr = err as { code?: string; message?: string };
      const authError: AuthError = {
        code: authErr.code || 'auth/unknown',
        message: authErr.message || 'Invalid verification code',
      };
      setError(authError);
      throw err;
    }
  }, []);

  // Sign out
  const signOut = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      await firebaseSignOut();
      setUser(null);
      setPhoneVerificationPending(false);
    } catch (err: unknown) {
      const authErr = err as { code?: string; message?: string };
      const authError: AuthError = {
        code: authErr.code || 'auth/unknown',
        message: authErr.message || 'Failed to sign out',
      };
      setError(authError);
      throw err;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Memoize context value
  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    error,
    getToken,
    signInWithGoogle,
    startPhoneSignIn,
    verifyPhoneCode,
    signOut,
    clearError,
    phoneVerificationPending,
  }), [
    user,
    loading,
    error,
    getToken,
    signInWithGoogle,
    startPhoneSignIn,
    verifyPhoneCode,
    signOut,
    clearError,
    phoneVerificationPending,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
