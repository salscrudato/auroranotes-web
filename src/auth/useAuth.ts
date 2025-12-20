/**
 * useAuth hook and auth utilities
 * Separated from AuthProvider for React fast refresh compatibility
 */

import { useContext, createContext } from 'react';

// ============================================
// Types (re-exported from AuthProvider)
// ============================================

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
}

export type AuthError = {
  code: string;
  message: string;
};

export type TokenGetter = () => Promise<string | null>;

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: AuthError | null;
  /** Get a fresh ID token for API calls */
  getToken: TokenGetter;
  /** Sign in with Google popup */
  signInWithGoogle: () => Promise<void>;
  /** Start phone sign-in - sends SMS code */
  startPhoneSignIn: (phoneE164: string) => Promise<void>;
  /** Verify SMS code to complete phone sign-in */
  verifyPhoneCode: (code: string) => Promise<void>;
  /** Sign out the current user */
  signOut: () => Promise<void>;
  /** Clear any auth errors */
  clearError: () => void;
  /** Whether phone verification is pending */
  phoneVerificationPending: boolean;
}

// ============================================
// Context (created here, used by AuthProvider)
// ============================================

export const AuthContext = createContext<AuthContextValue | null>(null);

// ============================================
// Hook
// ============================================

/**
 * Hook to access authentication state and methods
 * Must be used within an AuthProvider
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ============================================
// Utilities
// ============================================

/**
 * Get user initials for avatar display
 */
export function getUserInitials(user: AuthUser | null): string {
  if (!user) return '?';

  if (user.displayName) {
    const parts = user.displayName.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }

  if (user.email) {
    return user.email.slice(0, 2).toUpperCase();
  }

  if (user.phoneNumber) {
    return user.phoneNumber.slice(-2);
  }

  return user.uid.slice(0, 2).toUpperCase();
}

