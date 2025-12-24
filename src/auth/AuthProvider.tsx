import { useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react';
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
import { setStorageUserId, clearAllAuroraStorage } from '../lib/scopedStorage';
import { queryClient } from '../lib/queryClient';
import { setUnauthorizedCallback } from '../lib/api';

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
        const authUser = firebaseUser ? toAuthUser(firebaseUser) : null;
        // Set storage user ID for scoped localStorage
        setStorageUserId(authUser?.uid ?? null);
        setUser(authUser);
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
      // Clear all user-scoped localStorage data
      clearAllAuroraStorage();
      // Clear storage user ID
      setStorageUserId(null);
      // Reset TanStack Query cache to prevent data leakage
      queryClient.clear();
      // Sign out from Firebase
      await firebaseSignOut();
      setPhoneVerificationPending(false);
    } catch (err) {
      setError(toAuthError(err, 'Failed to sign out'));
      throw err;
    }
  }, []);

  // Track if we've already handled a 401 to prevent multiple sign-outs
  const handlingUnauthorized = useRef(false);

  // Set up 401 unauthorized callback to trigger sign out
  useEffect(() => {
    setUnauthorizedCallback(() => {
      // Prevent multiple simultaneous sign-out attempts
      if (handlingUnauthorized.current) return;
      handlingUnauthorized.current = true;

      // Only sign out if user is currently authenticated
      if (user) {
        console.warn('[Auth] Session expired - signing out');
        signOut().finally(() => {
          handlingUnauthorized.current = false;
        });
      } else {
        handlingUnauthorized.current = false;
      }
    });
  }, [user, signOut]);

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
