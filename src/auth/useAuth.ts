import { useContext, createContext } from 'react';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
}

export interface AuthError {
  code: string;
  message: string;
}

export type TokenGetter = () => Promise<string | null>;

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: AuthError | null;
  getToken: TokenGetter;
  signInWithGoogle: () => Promise<void>;
  startPhoneSignIn: (phoneE164: string) => Promise<void>;
  verifyPhoneCode: (code: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  phoneVerificationPending: boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function getUserInitials(user: AuthUser | null): string {
  if (!user) return '?';
  if (user.displayName) {
    const parts = user.displayName.trim().split(' ');
    const first = parts[0]?.[0] ?? '';
    const last = parts.length >= 2 ? parts[parts.length - 1]?.[0] ?? '' : '';
    return (last ? first + last : parts[0]?.slice(0, 2) ?? '').toUpperCase();
  }
  if (user.email) return user.email.slice(0, 2).toUpperCase();
  if (user.phoneNumber) return user.phoneNumber.slice(-2);
  return user.uid.slice(0, 2).toUpperCase();
}
