import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  getFirebaseAuth,
  signInWithGoogle as firebaseSignInWithGoogle,
  startPhoneSignIn as firebaseStartPhoneSignIn,
  verifyPhoneCode as firebaseVerifyPhoneCode,
  signOut as firebaseSignOut,
  getIdToken,
  type User,
} from '../lib/firebase';
import { AuthContext, type AuthUser, type AuthError, type AuthContextValue } from './useAuth';

const toAuthUser = (user: User): AuthUser => ({
  uid: user.uid,
  email: user.email,
  displayName: user.displayName,
  photoURL: user.photoURL,
  phoneNumber: user.phoneNumber,
});

const toAuthError = (err: unknown, fallbackMessage: string): AuthError => {
  const e = err as { code?: string; message?: string };
  return { code: e.code ?? 'auth/unknown', message: e.message ?? fallbackMessage };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [phoneVerificationPending, setPhoneVerificationPending] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      getFirebaseAuth(),
      (firebaseUser) => {
        setUser(firebaseUser ? toAuthUser(firebaseUser) : null);
        setLoading(false);
      },
      (err) => {
        console.error('Auth state error:', err);
        setError(toAuthError(err, err.message));
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  const getToken = useCallback(() => getIdToken(false), []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    try {
      await firebaseSignInWithGoogle();
    } catch (err) {
      setError(toAuthError(err, 'Failed to sign in with Google'));
      throw err;
    }
  }, []);

  const startPhoneSignIn = useCallback(async (phoneE164: string) => {
    setError(null);
    try {
      await firebaseStartPhoneSignIn(phoneE164, 'phone-sign-in-button');
      setPhoneVerificationPending(true);
    } catch (err) {
      setError(toAuthError(err, 'Failed to send verification code'));
      setPhoneVerificationPending(false);
      throw err;
    }
  }, []);

  const verifyPhoneCode = useCallback(async (code: string) => {
    setError(null);
    try {
      await firebaseVerifyPhoneCode(code);
      setPhoneVerificationPending(false);
    } catch (err) {
      setError(toAuthError(err, 'Invalid verification code'));
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    try {
      await firebaseSignOut();
      setPhoneVerificationPending(false);
    } catch (err) {
      setError(toAuthError(err, 'Failed to sign out'));
      throw err;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
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
    }),
    [user, loading, error, getToken, signInWithGoogle, startPhoneSignIn, verifyPhoneCode, signOut, clearError, phoneVerificationPending]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
