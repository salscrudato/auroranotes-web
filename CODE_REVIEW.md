# Aurora Notes Web - Code Review Document

This document contains all source code files from the Aurora Notes Web project for external code review.

**Generated:** 2025-12-23 07:03:16
**Project Root:** /Users/salscrudato/Projects/auroranotes-web
**Total Files:** 58

---

## Table of Contents

- [src/App.tsx](#src-app-tsx)
- [src/auth/AuthProvider.tsx](#src-auth-authprovider-tsx)
- [src/auth/index.ts](#src-auth-index-ts)
- [src/auth/useAuth.ts](#src-auth-useauth-ts)
- [src/components/auth/AuthenticatedApp.tsx](#src-components-auth-authenticatedapp-tsx)
- [src/components/auth/GoogleIcon.tsx](#src-components-auth-googleicon-tsx)
- [src/components/auth/LandingPage.tsx](#src-components-auth-landingpage-tsx)
- [src/components/chat/ActionResult.tsx](#src-components-chat-actionresult-tsx)
- [src/components/chat/ChatMarkdown.tsx](#src-components-chat-chatmarkdown-tsx)
- [src/components/chat/ChatMessage.tsx](#src-components-chat-chatmessage-tsx)
- [src/components/chat/ChatPanel.tsx](#src-components-chat-chatpanel-tsx)
- [src/components/chat/CitationChip.tsx](#src-components-chat-citationchip-tsx)
- [src/components/chat/SourcesPanel.tsx](#src-components-chat-sourcespanel-tsx)
- [src/components/common/CommandPalette.tsx](#src-components-common-commandpalette-tsx)
- [src/components/common/ConfirmDialog.tsx](#src-components-common-confirmdialog-tsx)
- [src/components/common/EmptyState.tsx](#src-components-common-emptystate-tsx)
- [src/components/common/ErrorBoundary.tsx](#src-components-common-errorboundary-tsx)
- [src/components/common/LiveRegion.tsx](#src-components-common-liveregion-tsx)
- [src/components/common/OfflineBanner.tsx](#src-components-common-offlinebanner-tsx)
- [src/components/common/PanelFallback.tsx](#src-components-common-panelfallback-tsx)
- [src/components/common/SkipLink.tsx](#src-components-common-skiplink-tsx)
- [src/components/common/Toast.tsx](#src-components-common-toast-tsx)
- [src/components/common/ToastContext.ts](#src-components-common-toastcontext-ts)
- [src/components/common/useToast.ts](#src-components-common-usetoast-ts)
- [src/components/layout/AppShell.tsx](#src-components-layout-appshell-tsx)
- [src/components/notes/EditNoteModal.tsx](#src-components-notes-editnotemodal-tsx)
- [src/components/notes/NoteCard.tsx](#src-components-notes-notecard-tsx)
- [src/components/notes/NoteCardSkeleton.tsx](#src-components-notes-notecardskeleton-tsx)
- [src/components/notes/NoteDetailDrawer.tsx](#src-components-notes-notedetaildrawer-tsx)
- [src/components/notes/NotesPanel.tsx](#src-components-notes-notespanel-tsx)
- [src/components/notes/VoicePreviewBar.tsx](#src-components-notes-voicepreviewbar-tsx)
- [src/components/ui/Avatar.tsx](#src-components-ui-avatar-tsx)
- [src/components/ui/Badge.tsx](#src-components-ui-badge-tsx)
- [src/components/ui/Button.tsx](#src-components-ui-button-tsx)
- [src/components/ui/Card.tsx](#src-components-ui-card-tsx)
- [src/components/ui/Dialog.tsx](#src-components-ui-dialog-tsx)
- [src/components/ui/IconButton.tsx](#src-components-ui-iconbutton-tsx)
- [src/components/ui/Input.tsx](#src-components-ui-input-tsx)
- [src/components/ui/index.ts](#src-components-ui-index-ts)
- [src/hooks/index.ts](#src-hooks-index-ts)
- [src/hooks/useChat.ts](#src-hooks-usechat-ts)
- [src/hooks/useCommandPalette.ts](#src-hooks-usecommandpalette-ts)
- [src/hooks/useFocusTrap.ts](#src-hooks-usefocustrap-ts)
- [src/hooks/useNoteClassifier.ts](#src-hooks-usenoteclassifier-ts)
- [src/hooks/useOnlineStatus.ts](#src-hooks-useonlinestatus-ts)
- [src/hooks/useSpeechToText.ts](#src-hooks-usespeechtotext-ts)
- [src/hooks/useTouchGestures.ts](#src-hooks-usetouchgestures-ts)
- [src/lib/api.ts](#src-lib-api-ts)
- [src/lib/citations.ts](#src-lib-citations-ts)
- [src/lib/constants.ts](#src-lib-constants-ts)
- [src/lib/firebase.ts](#src-lib-firebase-ts)
- [src/lib/format.ts](#src-lib-format-ts)
- [src/lib/noteClassifier.ts](#src-lib-noteclassifier-ts)
- [src/lib/types.ts](#src-lib-types-ts)
- [src/lib/utils.ts](#src-lib-utils-ts)
- [src/main.tsx](#src-main-tsx)
- [src/styles/app.css](#src-styles-app-css)
- [src/test/setup.ts](#src-test-setup-ts)

---

## src/App.tsx

```typescript
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

```

## src/auth/AuthProvider.tsx

```typescript
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
      // Pass the button ID for invisible reCAPTCHA
      await firebaseStartPhoneSignIn(phoneE164, 'phone-sign-in-button');
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

```

## src/auth/index.ts

```typescript
/**
 * Auth module exports
 * Import from 'src/auth' for cleaner imports
 */

// Provider component
export { AuthProvider } from './AuthProvider';

// Hook and utilities (from separate file for React fast refresh compatibility)
export { useAuth, getUserInitials } from './useAuth';

// Types
export type { AuthUser, AuthError, AuthContextValue, TokenGetter } from './useAuth';


```

## src/auth/useAuth.ts

```typescript
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


```

## src/components/auth/AuthenticatedApp.tsx

```typescript
/**
 * AuthenticatedApp - Wrapper that shows landing page or app content based on auth state
 * Also handles connecting the auth token getter to the API client
 */

import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { setTokenGetter } from '../../lib/api';
import { LandingPage } from './LandingPage';

interface AuthenticatedAppProps {
  children: ReactNode;
}

export function AuthenticatedApp({ children }: AuthenticatedAppProps) {
  const { user, loading, getToken } = useAuth();
  const tokenGetterSet = useRef(false);

  // Connect auth token getter to API client synchronously before children render
  // useLayoutEffect runs synchronously after DOM mutations but before paint
  useLayoutEffect(() => {
    if (!tokenGetterSet.current && getToken) {
      setTokenGetter(getToken);
      tokenGetterSet.current = true;
    }
  }, [getToken]);

  // Update token getter if getToken changes
  useEffect(() => {
    if (getToken) {
      setTokenGetter(getToken);
    }
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


```

## src/components/auth/GoogleIcon.tsx

```typescript
/**
 * Google "G" Logo - Official multi-color version
 * Following Google's brand guidelines for sign-in buttons
 */

export function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}


```

## src/components/auth/LandingPage.tsx

```typescript
/**
 * LandingPage - Simple, compelling authentication landing page
 * Clean design with Google and phone number sign-in options
 */

import { useState, useCallback, memo } from 'react';
import { Loader2, ArrowRight, Phone, ChevronLeft, PenLine, MessageCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { GoogleIcon } from './GoogleIcon';
import { formatPhoneNumber, toE164 } from '../../lib/utils';

// How it works steps
const steps = [
  {
    icon: PenLine,
    title: 'Capture',
    description: 'Jot down thoughts, ideas, and notes as they come to you.',
  },
  {
    icon: MessageCircle,
    title: 'Ask',
    description: 'Ask questions about your notes in plain English.',
  },
  {
    icon: Sparkles,
    title: 'Discover',
    description: 'Get AI-powered answers with sources from your notes.',
  },
];

export const LandingPage = memo(function LandingPage() {
  const { signInWithGoogle, startPhoneSignIn, verifyPhoneCode, phoneVerificationPending, error, clearError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const handleGoogleSignIn = useCallback(async () => {
    setLoading(true);
    clearError();
    try {
      await signInWithGoogle();
    } catch {
      // Error handled by AuthProvider
    } finally {
      setLoading(false);
    }
  }, [signInWithGoogle, clearError]);

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { formatted } = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  }, []);

  const handlePhoneSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    setLoading(true);
    clearError();
    try {
      const e164Phone = toE164(phoneNumber);
      await startPhoneSignIn(e164Phone);
    } catch {
      // Error handled by AuthProvider
    } finally {
      setLoading(false);
    }
  }, [phoneNumber, startPhoneSignIn, clearError]);

  const handleVerifyCode = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) return;

    setLoading(true);
    clearError();
    try {
      await verifyPhoneCode(verificationCode);
    } catch {
      // Error handled by AuthProvider
    } finally {
      setLoading(false);
    }
  }, [verificationCode, verifyPhoneCode, clearError]);

  const handleBackToOptions = useCallback(() => {
    setShowPhoneInput(false);
    setPhoneNumber('');
    setVerificationCode('');
    clearError();
  }, [clearError]);

  return (
    <div className="landing-page">
      {/* Aurora Ambient Background */}
      <div className="landing-ambient" aria-hidden="true">
        <div className="landing-grid-overlay" />
      </div>

      <div className="landing-content">
        {/* Hero Section - Centered */}
        <header className="landing-hero-simple">
          {/* Logo */}
          <div className="landing-logo-simple">
            <img src="/favicon.svg" alt="AuroraNotes" className="landing-favicon" />
          </div>

          <h1 className="landing-title-simple">Your notes, brilliantly searchable</h1>

          <p className="landing-subtitle-simple">
            Jot down notes naturally, then ask questions in plain English. Our AI instantly finds and synthesizes answers from everything you've written.
          </p>

          {/* Auth Options */}
          <div className="landing-auth">
            {!showPhoneInput && !phoneVerificationPending ? (
              <>
                {/* Google Sign In */}
                <button
                  className="landing-auth-btn landing-auth-google"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  type="button"
                >
                  {loading ? (
                    <Loader2 size={20} className="spinner" />
                  ) : (
                    <GoogleIcon size={20} />
                  )}
                  <span>Continue with Google</span>
                </button>

                <div className="landing-auth-divider">
                  <span>or</span>
                </div>

                {/* Phone Sign In Option */}
                <button
                  className="landing-auth-btn landing-auth-phone"
                  onClick={() => setShowPhoneInput(true)}
                  type="button"
                >
                  <Phone size={20} />
                  <span>Continue with Phone</span>
                </button>
              </>
            ) : phoneVerificationPending ? (
              /* Verification Code Input */
              <form onSubmit={handleVerifyCode} className="landing-phone-form">
                <button
                  type="button"
                  className="landing-back-btn"
                  onClick={handleBackToOptions}
                >
                  <ChevronLeft size={20} />
                  Back
                </button>
                <p className="landing-phone-hint">Enter the code sent to your phone</p>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="landing-phone-input"
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  autoFocus
                />
                <button
                  type="submit"
                  className="landing-auth-btn landing-auth-primary"
                  disabled={loading || verificationCode.length < 6}
                >
                  {loading ? <Loader2 size={20} className="spinner" /> : <ArrowRight size={20} />}
                  <span>Verify Code</span>
                </button>
              </form>
            ) : (
              /* Phone Number Input */
              <form onSubmit={handlePhoneSubmit} className="landing-phone-form">
                <button
                  type="button"
                  className="landing-back-btn"
                  onClick={handleBackToOptions}
                >
                  <ChevronLeft size={20} />
                  Back
                </button>
                <p className="landing-phone-hint">Enter your phone number</p>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  className="landing-phone-input"
                  placeholder="(555) 123-4567"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  autoFocus
                />
                <button
                  id="phone-sign-in-button"
                  type="submit"
                  className="landing-auth-btn landing-auth-primary"
                  disabled={loading || phoneNumber.replace(/\D/g, '').length < 10}
                >
                  {loading ? <Loader2 size={20} className="spinner" /> : <ArrowRight size={20} />}
                  <span>Send Code</span>
                </button>
              </form>
            )}

            {error && (
              <p className="landing-error" role="alert">{error.message}</p>
            )}
          </div>

          {/* How It Works */}
          <section className="landing-steps" aria-label="How it works">
            {steps.map((step, i) => (
              <div key={i} className="landing-step">
                <div className="landing-step-icon" aria-hidden="true">
                  <step.icon size={24} />
                </div>
                <h3 className="landing-step-title">{step.title}</h3>
                <p className="landing-step-desc">{step.description}</p>
              </div>
            ))}
          </section>
        </header>

        {/* Footer with Terms/Privacy */}
        <footer className="landing-legal-footer">
          <p className="landing-legal-text">
            By continuing, you agree to our{' '}
            <a href="/terms" className="landing-legal-link">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" className="landing-legal-link">Privacy Policy</a>
          </p>
          <p className="landing-copyright">
            © {new Date().getFullYear()} AuroraNotes. All rights reserved.
          </p>
        </footer>
      </div>

    </div>
  );
});


```

## src/components/chat/ActionResult.tsx

```typescript
/**
 * ActionResult component
 * Displays results from agentic actions (create_note, set_reminder, search_notes, etc.)
 */

import { memo } from 'react';
import { CheckCircle, XCircle, FileText, Bell, Search, List, AtSign, Calendar } from 'lucide-react';
import type { ActionMeta } from '../../lib/types';

interface ActionResultProps {
  action: ActionMeta;
  onNoteClick?: (noteId: string) => void;
}

export const ActionResult = memo(function ActionResult({ action, onNoteClick }: ActionResultProps) {
  const { type, success, data } = action;

  if (!success || !data) {
    return (
      <div className="action-result action-result-error">
        <XCircle size={16} />
        <span>Action failed: {type.replace(/_/g, ' ')}</span>
      </div>
    );
  }

  // Render different UI based on action type
  switch (type) {
    case 'create_note':
      if (!data.createdNote) return null;
      return (
        <div className="action-result action-result-success">
          <div className="action-result-header">
            <CheckCircle size={16} />
            <span className="action-result-title">Note Created</span>
          </div>
          <div className="action-result-content">
            <FileText size={14} />
            <div className="action-result-details">
              {data.createdNote.title && (
                <div className="action-result-note-title">{data.createdNote.title}</div>
              )}
              <div className="action-result-note-preview">{data.createdNote.text.slice(0, 100)}...</div>
              {onNoteClick && (
                <button
                  className="action-result-link"
                  onClick={() => onNoteClick(data.createdNote!.id)}
                >
                  View note →
                </button>
              )}
            </div>
          </div>
        </div>
      );

    case 'set_reminder':
      if (!data.reminder) return null;
      return (
        <div className="action-result action-result-success">
          <div className="action-result-header">
            <Bell size={16} />
            <span className="action-result-title">Reminder Set</span>
          </div>
          <div className="action-result-content">
            <Calendar size={14} />
            <div className="action-result-details">
              <div className="action-result-reminder-text">{data.reminder.text}</div>
              <div className="action-result-reminder-due">
                Due: {new Date(data.reminder.dueAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      );

    case 'search_notes':
      if (!data.searchResults || data.searchResults.length === 0) {
        return (
          <div className="action-result action-result-empty">
            <Search size={16} />
            <span>No notes found</span>
          </div>
        );
      }
      return (
        <div className="action-result action-result-success">
          <div className="action-result-header">
            <Search size={16} />
            <span className="action-result-title">Found {data.searchResults.length} note{data.searchResults.length === 1 ? '' : 's'}</span>
          </div>
          <div className="action-result-list">
            {data.searchResults.slice(0, 5).map((result, idx) => (
              <div key={idx} className="action-result-item">
                <div className="action-result-item-preview">{result.preview}</div>
                <div className="action-result-item-meta">
                  <span className="action-result-item-date">{result.date}</span>
                  {onNoteClick && (
                    <button
                      className="action-result-link"
                      onClick={() => onNoteClick(result.noteId)}
                    >
                      View →
                    </button>
                  )}
                </div>
              </div>
            ))}
            {data.searchResults.length > 5 && (
              <div className="action-result-more">
                +{data.searchResults.length - 5} more
              </div>
            )}
          </div>
        </div>
      );

    case 'summarize_period':
      if (!data.summary) return null;
      return (
        <div className="action-result action-result-success">
          <div className="action-result-header">
            <FileText size={16} />
            <span className="action-result-title">Summary</span>
          </div>
          <div className="action-result-content">
            <div className="action-result-summary">{data.summary}</div>
          </div>
        </div>
      );

    case 'list_action_items':
      if (!data.actionItems || data.actionItems.length === 0) {
        return (
          <div className="action-result action-result-empty">
            <List size={16} />
            <span>No action items found</span>
          </div>
        );
      }
      return (
        <div className="action-result action-result-success">
          <div className="action-result-header">
            <List size={16} />
            <span className="action-result-title">{data.actionItems.length} Action Item{data.actionItems.length === 1 ? '' : 's'}</span>
          </div>
          <div className="action-result-list">
            {data.actionItems.map((item, idx) => (
              <div key={idx} className="action-result-item action-result-action-item">
                <div className="action-result-item-text">
                  {item.status && <span className="action-item-status">[{item.status}]</span>}
                  {item.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'find_mentions':
      if (!data.mentions || data.mentions.length === 0) {
        return (
          <div className="action-result action-result-empty">
            <AtSign size={16} />
            <span>No mentions found</span>
          </div>
        );
      }
      return (
        <div className="action-result action-result-success">
          <div className="action-result-header">
            <AtSign size={16} />
            <span className="action-result-title">Found {data.mentions.length} mention{data.mentions.length === 1 ? '' : 's'}</span>
          </div>
          <div className="action-result-list">
            {data.mentions.slice(0, 5).map((mention, idx) => (
              <div key={idx} className="action-result-item">
                <div className="action-result-item-preview">{mention.context}</div>
                <div className="action-result-item-meta">
                  <span className="action-result-item-date">{mention.date}</span>
                  {onNoteClick && (
                    <button
                      className="action-result-link"
                      onClick={() => onNoteClick(mention.noteId)}
                    >
                      View →
                    </button>
                  )}
                </div>
              </div>
            ))}
            {data.mentions.length > 5 && (
              <div className="action-result-more">
                +{data.mentions.length - 5} more
              </div>
            )}
          </div>
        </div>
      );

    default:
      return null;
  }
});


```

## src/components/chat/ChatMarkdown.tsx

```typescript
/**
 * ChatMarkdown component
 * Renders markdown content with source citation support for chat messages
 */

import { memo, useMemo, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Source } from '../../lib/types';
import { SourceRefChip } from './CitationChip';

/** Regex pattern to match citation tokens like [1], [2], etc. */
const SOURCE_PATTERN = /\[(\d+)\]/g;

interface ChatMarkdownProps {
  content: string;
  sources?: Source[];
  onSourceClick: (source: Source) => void;
}

/**
 * Process text to replace [1], [2] citation markers with React elements
 */
function processTextWithCitations(
  text: string,
  sourceMap: Map<string, Source>,
  onSourceClick: (source: Source) => void
): ReactNode[] {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let keyIndex = 0;

  // Reset regex state
  SOURCE_PATTERN.lastIndex = 0;
  
  let match;
  while ((match = SOURCE_PATTERN.exec(text)) !== null) {
    const fullMatch = match[0]; // e.g., "[1]"
    const id = match[1]; // e.g., "1"
    const matchIndex = match.index;

    // Add text before this citation
    if (matchIndex > lastIndex) {
      parts.push(text.slice(lastIndex, matchIndex));
    }

    // Add citation chip or plain text
    const source = sourceMap.get(id);
    if (source) {
      parts.push(
        <SourceRefChip
          key={`citation-${keyIndex++}`}
          source={source}
          onClick={onSourceClick}
        />
      );
    } else {
      // Source not found - render as plain text
      parts.push(fullMatch);
    }

    lastIndex = matchIndex + fullMatch.length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

/**
 * ChatMarkdown - Renders markdown with inline source citations
 */
export const ChatMarkdown = memo(function ChatMarkdown({
  content,
  sources,
  onSourceClick,
}: ChatMarkdownProps) {
  // Build source lookup map
  const sourceMap = useMemo(() => {
    const map = new Map<string, Source>();
    if (sources) {
      for (const s of sources) {
        map.set(s.id, s);
      }
    }
    return map;
  }, [sources]);

  // Custom components for react-markdown
  const components = useMemo(() => ({
    // Override text rendering to handle citations
    p: ({ children }: { children?: ReactNode }) => {
      return <p>{processChildren(children, sourceMap, onSourceClick)}</p>;
    },
    li: ({ children }: { children?: ReactNode }) => {
      return <li>{processChildren(children, sourceMap, onSourceClick)}</li>;
    },
    strong: ({ children }: { children?: ReactNode }) => {
      return <strong>{processChildren(children, sourceMap, onSourceClick)}</strong>;
    },
    em: ({ children }: { children?: ReactNode }) => {
      return <em>{processChildren(children, sourceMap, onSourceClick)}</em>;
    },
    // Code blocks - don't process citations inside code
    code: ({ children, className }: { children?: ReactNode; className?: string }) => {
      const isInline = !className;
      if (isInline) {
        return <code className="inline-code">{children}</code>;
      }
      return <code className={className}>{children}</code>;
    },
    pre: ({ children }: { children?: ReactNode }) => {
      return <pre className="code-block">{children}</pre>;
    },
    // Links - open in new tab
    a: ({ href, children }: { href?: string; children?: ReactNode }) => {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    },
  }), [sourceMap, onSourceClick]);

  return (
    <div className="chat-markdown">
      <ReactMarkdown components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
});

/**
 * Process children nodes, replacing text with citation-aware content
 */
function processChildren(
  children: ReactNode,
  sourceMap: Map<string, Source>,
  onSourceClick: (source: Source) => void
): ReactNode {
  if (typeof children === 'string') {
    return processTextWithCitations(children, sourceMap, onSourceClick);
  }
  if (Array.isArray(children)) {
    return children.map((child, i) => {
      if (typeof child === 'string') {
        const processed = processTextWithCitations(child, sourceMap, onSourceClick);
        return processed.length === 1 ? processed[0] : <span key={i}>{processed}</span>;
      }
      return child;
    });
  }
  return children;
}


```

## src/components/chat/ChatMessage.tsx

```typescript
/**
 * ChatMessage component
 * Renders chat messages with inline source chips and sources summary
 */

import { memo, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { BookOpen, AlertCircle, AlertTriangle, RotateCcw, Copy, ThumbsUp, ThumbsDown, Send, X } from 'lucide-react';
import type { ChatMessage as ChatMessageType, Source, FeedbackRating, ConfidenceLevel } from '../../lib/types';
import { parseSources, getReferencedSources } from '../../lib/citations';
import { formatRelativeTime } from '../../lib/format';
import { copyToClipboard, cn } from '../../lib/utils';
import { useToast } from '../common/useToast';
import { useAnnounce } from '../common/LiveRegion';
import { SourceRefChip, SourceBadge } from './CitationChip';
import { ChatMarkdown } from './ChatMarkdown';
import { ActionResult } from './ActionResult';

/** Streaming elapsed time indicator */
function StreamingElapsed({ startTime }: { startTime: Date }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  // Only show after 3 seconds
  if (elapsed < 3) return null;

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = minutes > 0
    ? `${minutes}:${seconds.toString().padStart(2, '0')}`
    : `${seconds}s`;

  return (
    <div className="streaming-elapsed">
      <span>Generating... {timeStr}</span>
    </div>
  );
}

interface FeedbackState {
  hasSent: boolean;
  isCommentMode: boolean;
  comment: string;
  isSubmitting: boolean;
}

interface ChatMessageProps {
  message: ChatMessageType;
  onSourceClick: (source: Source) => void;
  activeSourceId?: string | null;
  onRetry?: () => void;
  showTimestamp?: boolean;
  feedbackState?: FeedbackState;
  onFeedback?: (rating: FeedbackRating, comment?: string) => void;
  onFeedbackCommentChange?: (comment: string) => void;
  onCancelFeedback?: () => void;
  /** Suggested follow-up questions */
  suggestedQuestions?: string[];
  /** Callback when a suggested question is clicked */
  onSuggestedQuestion?: (question: string) => void;
  /** Whether this is the last message (for showing suggestions) */
  isLastMessage?: boolean;
  /** Callback when a note is clicked from action results */
  onNoteClick?: (noteId: string) => void;
}

export const ChatMessage = memo(function ChatMessage({
  message,
  onSourceClick,
  activeSourceId,
  onRetry,
  showTimestamp = true,
  feedbackState,
  onFeedback,
  onFeedbackCommentChange,
  onCancelFeedback,
  suggestedQuestions,
  onSuggestedQuestion,
  isLastMessage = false,
  onNoteClick,
}: ChatMessageProps) {
  const { showToast } = useToast();
  const announce = useAnnounce();
  const wasStreamingRef = useRef(false);
  const isUser = message.role === 'user';
  const isError = message.isError;
  const isStreaming = message.isStreaming;
  const segments = parseSources(message.content, message.sources);

  // Announce when streaming completes for screen readers
  useEffect(() => {
    if (wasStreamingRef.current && !isStreaming && !isUser && !isError) {
      const sourceCount = message.sources?.length || 0;
      const announcement = sourceCount > 0
        ? `Response complete with ${sourceCount} source${sourceCount === 1 ? '' : 's'}`
        : 'Response complete';
      announce(announcement);
    }
    wasStreamingRef.current = isStreaming || false;
  }, [isStreaming, isUser, isError, message.sources?.length, announce]);

  // Memoize referenced sources to avoid recalculation on every render
  const referencedSources = useMemo(
    () => getReferencedSources(message.content, message.sources),
    [message.content, message.sources]
  );

  // Get all sources: combine cited sources with context sources, avoiding duplicates
  const allSources = useMemo(() => {
    const citedIds = new Set(referencedSources.map(s => s.noteId));
    const contextSources = (message.contextSources || []).filter(s => !citedIds.has(s.noteId));
    return {
      cited: referencedSources,
      context: contextSources,
      hasAny: referencedSources.length > 0 || contextSources.length > 0,
    };
  }, [referencedSources, message.contextSources]);

  // Show retry button for 503 and 5xx errors
  const showRetry = isError && onRetry && (message.errorCode === 503 || (message.errorCode && message.errorCode >= 500));

  // Confidence warning for low-confidence responses
  const confidenceWarning = useMemo(() => {
    if (isUser || isError || isStreaming || !message.meta?.confidence) return null;
    const level = message.meta.confidence;
    if (level === 'low') {
      return {
        level: 'low' as ConfidenceLevel,
        message: 'This response may be less accurate. Consider verifying with your notes.',
        severe: false,
      };
    }
    if (level === 'none') {
      return {
        level: 'none' as ConfidenceLevel,
        message: 'No relevant notes found. This response is based on general knowledge.',
        severe: true,
      };
    }
    return null;
  }, [isUser, isError, isStreaming, message.meta?.confidence]);

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(message.content);
    showToast(success ? 'Copied' : 'Failed to copy', success ? 'success' : 'error');
  }, [message.content, showToast]);

  return (
    <div className={cn('chat-message', isUser ? 'user' : 'assistant', isStreaming && 'streaming')}>
      <div className={cn('chat-bubble', isError && 'chat-bubble-error')} aria-busy={isStreaming}>
        {isError && <AlertCircle size={14} className="error-icon" />}
        {isUser || isError ? (
          // User messages and errors: render as plain text with source chips
          segments.map((segment, i) => {
            if (segment.type === 'source' && segment.source) {
              return (
                <SourceRefChip
                  key={`${segment.source.id}-${i}`}
                  source={segment.source}
                  onClick={onSourceClick}
                />
              );
            }
            return <span key={i}>{segment.content}</span>;
          })
        ) : (
          // Assistant messages: render as markdown with source citations
          <ChatMarkdown
            content={message.content}
            sources={message.sources}
            onSourceClick={onSourceClick}
          />
        )}
        {isStreaming && <span className="streaming-cursor" />}
        {showRetry && (
          <button className="btn btn-sm btn-ghost retry-btn" onClick={onRetry}>
            <RotateCcw size={12} />
            Retry
          </button>
        )}
      </div>

      {/* Streaming progress indicator */}
      {isStreaming && <StreamingElapsed startTime={message.timestamp} />}

      {/* Action result display */}
      {!isUser && !isError && !isStreaming && message.action && (
        <ActionResult action={message.action} onNoteClick={onNoteClick} />
      )}

      {/* Confidence warning for low-confidence responses */}
      {confidenceWarning && (
        <div className={cn('confidence-warning', confidenceWarning.severe && 'severe')}>
          <AlertTriangle size={14} />
          <span>{confidenceWarning.message}</span>
        </div>
      )}

      {/* Message meta row: sources + feedback on same line */}
      {!isUser && !isError && !isStreaming && (
        <div className="chat-message-footer">
          {/* Left side: Cited sources */}
          <div className="chat-footer-sources">
            {allSources.cited.length > 0 && (
              <>
                <span className="sources-label">
                  <BookOpen size={14} />
                  Cited:
                </span>
                <div className="sources-chips">
                  {allSources.cited.map((source) => (
                    <SourceBadge
                      key={source.id}
                      id={source.id}
                      onClick={() => onSourceClick(source)}
                      isActive={source.id === activeSourceId}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right side: Feedback buttons */}
          {feedbackState && onFeedback && (
            <div className="chat-footer-feedback">
              {feedbackState.hasSent ? (
                <span className="feedback-thanks">Thanks!</span>
              ) : feedbackState.isCommentMode ? (
                <div className="feedback-comment-form">
                  <input
                    type="text"
                    className="feedback-comment-input"
                    value={feedbackState.comment}
                    onChange={(e) => onFeedbackCommentChange?.(e.target.value.slice(0, 1000))}
                    placeholder="What went wrong?"
                    aria-label="Feedback comment"
                    maxLength={1000}
                    disabled={feedbackState.isSubmitting}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        onFeedback('down', feedbackState.comment);
                      } else if (e.key === 'Escape') {
                        onCancelFeedback?.();
                      }
                    }}
                  />
                  <button
                    className="btn btn-icon btn-ghost btn-sm"
                    onClick={() => onFeedback('down', feedbackState.comment)}
                    disabled={feedbackState.isSubmitting}
                    aria-label="Submit feedback"
                  >
                    {feedbackState.isSubmitting ? <span className="spinner" /> : <Send size={14} />}
                  </button>
                  <button
                    className="btn btn-icon btn-ghost btn-sm"
                    onClick={onCancelFeedback}
                    disabled={feedbackState.isSubmitting}
                    aria-label="Cancel"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    className="btn btn-icon btn-ghost btn-sm feedback-btn"
                    onClick={() => onFeedback('up')}
                    aria-label="Good response"
                    title="Good response"
                  >
                    <ThumbsUp size={14} />
                  </button>
                  <button
                    className="btn btn-icon btn-ghost btn-sm feedback-btn"
                    onClick={() => onFeedback('down')}
                    aria-label="Poor response"
                    title="Poor response"
                  >
                    <ThumbsDown size={14} />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Timestamp row */}
      {showTimestamp && !isStreaming && (
        <div className="chat-message-meta">
          <span className="chat-timestamp">
            {formatRelativeTime(message.timestamp)}
          </span>
          {!isUser && !isError && (
            <button
              className="btn btn-icon btn-ghost btn-sm chat-copy-btn"
              onClick={handleCopy}
              title="Copy message"
              aria-label="Copy message"
            >
              <Copy size={12} />
            </button>
          )}
        </div>
      )}

      {/* Suggested follow-up questions */}
      {isLastMessage && !isUser && !isError && !isStreaming && suggestedQuestions && suggestedQuestions.length > 0 && onSuggestedQuestion && (
        <div className="suggested-questions">
          {suggestedQuestions.slice(0, 3).map((question, idx) => (
            <button
              key={idx}
              className="suggestion-chip"
              onClick={() => onSuggestedQuestion(question)}
            >
              {question}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

/**
 * Loading state message bubble with AI typing indicator
 */
export function ChatMessageLoading() {
  return (
    <div className="chat-message assistant animate-fade-in">
      <div className="chat-bubble chat-bubble-loading">
        <div className="ai-typing">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <span className="text-muted">Searching your notes...</span>
      </div>
    </div>
  );
}




```

## src/components/chat/ChatPanel.tsx

```typescript
/**
 * ChatPanel component
 * RAG-powered chat with inline source references, streaming support, and feedback
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  ArrowUp,
  FileText,
  ListChecks,
  HelpCircle,
  CheckSquare,
  Square,
  Clock,
  Sparkles,
  Mic,
} from 'lucide-react';
import type { ChatMessage as ChatMessageType, Source, FeedbackRating, QueryIntent } from '../../lib/types';
import { useChat } from '../../hooks/useChat';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import { submitFeedback, ApiRequestError } from '../../lib/api';
import { useToast } from '../common/useToast';
import { ChatMessage, ChatMessageLoading } from './ChatMessage';
import { SourcesPanel } from './SourcesPanel';
import { ErrorBoundary } from '../common/ErrorBoundary';

interface ChatPanelProps {
  className?: string;
  onOpenNote?: (noteId: string, preview?: string) => void;
}

const MAX_MESSAGE_LENGTH = 2000;

const SUGGESTIONS = [
  { label: 'Summarize my notes', prompt: 'Summarize my recent notes from this week', Icon: FileText },
  { label: 'What decisions did I make?', prompt: 'What decisions did I make recently?', Icon: ListChecks },
  { label: 'Open questions', prompt: 'What are my open questions or unresolved items?', Icon: HelpCircle },
  { label: 'Find action items', prompt: 'List action items from my notes', Icon: CheckSquare },
];

/** Generate follow-up suggestions based on the last response */
function getFollowUpSuggestions(intent?: QueryIntent, sourceCount?: number): string[] {
  if (!intent) return [];

  const suggestions: Record<QueryIntent, string[]> = {
    summarize: ['Tell me more about a specific topic', 'What are the key takeaways?', 'Any action items from this?'],
    list: ['Expand on the first item', 'Which is most important?', 'Are there any I missed?'],
    decision: ['What led to this decision?', 'Are there alternatives?', 'What are the next steps?'],
    action_item: ['Which should I prioritize?', 'Any deadlines mentioned?', 'Who is responsible for each?'],
    search: ['Tell me more about this', 'When did I write about this?', 'Related topics?'],
    question: ['Can you elaborate?', 'What sources support this?', 'Any related notes?'],
  };

  const baseSuggestions = suggestions[intent] || [];

  // Add source-based suggestion if we have sources
  if (sourceCount && sourceCount > 0) {
    return [...baseSuggestions.slice(0, 2), 'Show me the original notes'];
  }

  return baseSuggestions;
}

export function ChatPanel({ className = '', onOpenNote }: ChatPanelProps) {
  const {
    messages,
    loadingState,
    sendMessage,
    retryLastMessage,
    clearChat,
    cancelStream,
  } = useChat({ streaming: true }); // Streaming SSE by default per API spec

  const [input, setInput] = useState('');
  const [showSources, setShowSources] = useState(false);
  const [activeSources, setActiveSources] = useState<Source[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [feedbackSent, setFeedbackSent] = useState<Set<string>>(new Set());
  const [rateLimitCountdown, setRateLimitCountdown] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  // Feedback comment state for thumbs-down
  const [feedbackCommentFor, setFeedbackCommentFor] = useState<string | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { showToast } = useToast();

  const isLoading = loadingState === 'sending' || loadingState === 'streaming';

  // Speech-to-text for voice input (simplified - no preview mode, direct to input)
  const {
    state: recordingState,
    isSupported: isSpeechSupported,
    startRecording,
    stopRecording,
    cancelRecording,
    transcript: voiceTranscript,
  } = useSpeechToText({
    onError: useCallback((errorMsg: string) => {
      showToast(errorMsg, 'error');
    }, [showToast]),
    autoEnhance: false, // No enhancement needed for chat - just raw speech
  });

  const isRecording = recordingState === 'recording';

  // When recording stops, put transcript in input
  useEffect(() => {
    if (recordingState === 'preview' && voiceTranscript.trim()) {
      setInput(voiceTranscript.trim());
      cancelRecording(); // Reset to idle
      inputRef.current?.focus();
    }
  }, [recordingState, voiceTranscript, cancelRecording]);

  // Handle mic button click
  const handleMicClick = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Cleanup countdown interval on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  // Start rate limit countdown
  const startRateLimitCountdown = useCallback((seconds: number) => {
    setRateLimitCountdown(seconds);

    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    countdownRef.current = setInterval(() => {
      setRateLimitCountdown(prev => {
        if (prev === null || prev <= 1) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      // Scroll the messages container to the bottom
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Collect all sources from messages for sources panel
  useEffect(() => {
    const allSources: Source[] = [];
    const seen = new Set<string>();

    for (const msg of messages) {
      if (msg.sources) {
        for (const s of msg.sources) {
          if (!seen.has(s.id)) {
            seen.add(s.id);
            allSources.push(s);
          }
        }
      }
    }

    setActiveSources(allSources);
  }, [messages]);

  // Generate follow-up suggestions based on the last assistant message
  const followUpSuggestions = useMemo(() => {
    const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant' && !m.isError && !m.isStreaming);
    if (!lastAssistantMessage?.meta) return [];
    return getFollowUpSuggestions(lastAssistantMessage.meta.intent, lastAssistantMessage.meta.sourceCount);
  }, [messages]);

  const handleSend = useCallback(async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || isLoading || rateLimitCountdown !== null) return;

    if (messageText.length > MAX_MESSAGE_LENGTH) {
      showToast(`Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters.`, 'error');
      return;
    }

    setInput('');

    try {
      await sendMessage(messageText);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.status === 429) {
          const retrySeconds = err.retryAfterSeconds || 30;
          startRateLimitCountdown(retrySeconds);
        }
        showToast(err.getUserMessage(), 'error');
      }
    } finally {
      inputRef.current?.focus();
    }
  }, [input, isLoading, rateLimitCountdown, showToast, sendMessage, startRateLimitCountdown]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleSuggestionClick = useCallback((prompt: string) => {
    handleSend(prompt);
  }, [handleSend]);

  const handleSourceClick = useCallback((source: Source) => {
    setSelectedSourceId(source.id);
    setShowSources(true);
  }, []);

  const handleOpenNote = useCallback((noteId: string, preview?: string) => {
    onOpenNote?.(noteId, preview);
    setShowSources(false);
  }, [onOpenNote]);

  const handleRetry = useCallback(async () => {
    await retryLastMessage();
  }, [retryLastMessage]);

  const handleFeedback = useCallback(async (message: ChatMessageType, rating: FeedbackRating, comment?: string) => {
    const requestId = message.meta?.requestId;
    if (!requestId) {
      showToast('Cannot submit feedback: missing request ID', 'error');
      return;
    }

    // Check if already submitted
    if (feedbackSent.has(requestId)) {
      showToast('Feedback already submitted', 'info');
      return;
    }

    // For thumbs-down, show comment input first (unless already submitting with comment)
    if (rating === 'down' && !comment && feedbackCommentFor !== requestId) {
      setFeedbackCommentFor(requestId);
      setFeedbackComment('');
      return;
    }

    setFeedbackSubmitting(true);
    try {
      await submitFeedback(requestId, rating, comment?.trim() || undefined);
      setFeedbackSent(prev => new Set(prev).add(requestId));
      setFeedbackCommentFor(null);
      setFeedbackComment('');
      showToast(rating === 'up' ? 'Thanks for the feedback!' : 'Thanks, we\'ll improve', 'success');
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.getUserMessage() : 'Failed to submit feedback';
      showToast(msg, 'error');
    } finally {
      setFeedbackSubmitting(false);
    }
  }, [feedbackSent, feedbackCommentFor, showToast]);

  const handleCancelFeedbackComment = useCallback(() => {
    setFeedbackCommentFor(null);
    setFeedbackComment('');
  }, []);

  const handleCancelStream = useCallback(() => {
    setIsCancelling(true);
    cancelStream();
    // Brief visual feedback then reset
    setTimeout(() => setIsCancelling(false), 300);
  }, [cancelStream]);

  const handleClearChat = useCallback(() => {
    clearChat();
    setFeedbackSent(new Set());
    setShowSources(false);
    setSelectedSourceId(null);
  }, [clearChat]);

  return (
    <div className={`panel panel-chat ${className}`}>
      <div className="panel-body chat-panel-body">
        <div className="chat-container">
          {/* Suggestion Chips */}
          {messages.length === 0 && (
            <div className="chat-suggestions stagger-children">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion.prompt}
                  className="suggestion-chip"
                  onClick={() => handleSuggestionClick(suggestion.prompt)}
                  disabled={isLoading}
                >
                  <suggestion.Icon size={15} className="suggestion-icon" />
                  <span>{suggestion.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Messages Area */}
          <div
            ref={messagesContainerRef}
            className="chat-messages"
            role="log"
            aria-live="polite"
            aria-atomic="false"
            aria-relevant="additions"
          >
            {messages.length === 0 ? (
              <div className="chat-empty">
                <div className="chat-empty-icon">
                  <Sparkles size={28} />
                </div>
                <h3>Your AI-powered memory</h3>
                <p>
                  Ask questions and get instant answers with sources from your notes.
                </p>
              </div>
            ) : (
              messages.map((message, idx) => {
                const requestId = message.meta?.requestId;
                const showFeedback = message.role === 'assistant' && !message.isError && !message.isStreaming && requestId;
                const feedbackState = showFeedback ? {
                  hasSent: feedbackSent.has(requestId),
                  isCommentMode: feedbackCommentFor === requestId,
                  comment: feedbackComment,
                  isSubmitting: feedbackSubmitting,
                } : undefined;

                const isLastMessage = idx === messages.length - 1;

                return (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    onSourceClick={handleSourceClick}
                    activeSourceId={selectedSourceId}
                    onRetry={message.isError && isLastMessage ? handleRetry : undefined}
                    feedbackState={feedbackState}
                    onFeedback={showFeedback ? (rating, comment) => handleFeedback(message, rating, comment) : undefined}
                    onFeedbackCommentChange={showFeedback ? setFeedbackComment : undefined}
                    onCancelFeedback={showFeedback ? handleCancelFeedbackComment : undefined}
                    isLastMessage={isLastMessage}
                    suggestedQuestions={isLastMessage ? followUpSuggestions : undefined}
                    onSuggestedQuestion={isLastMessage ? handleSend : undefined}
                    onNoteClick={onOpenNote}
                  />
                );
              })
            )}
            {loadingState === 'sending' && <ChatMessageLoading />}
            {messages.length > 0 && !isLoading && (
              <div className="chat-clear-container">
                <button
                  className="chat-clear-btn"
                  onClick={handleClearChat}
                  aria-label="Clear chat"
                >
                  Clear
                </button>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="chat-input-area">
            {rateLimitCountdown !== null && (
              <div className="rate-limit-notice" role="alert" aria-live="polite">
                <Clock size={14} aria-hidden="true" />
                <div className="rate-limit-content">
                  <strong>Slow down</strong>
                  <span>You're sending messages too quickly. Please wait {rateLimitCountdown}s</span>
                </div>
              </div>
            )}
            <div className={`chat-input-wrapper ${isRecording ? 'recording' : ''}`}>
              {/* Mic button - shown on left when speech is supported */}
              {isSpeechSupported && (
                <button
                  className={`chat-mic-btn ${isRecording ? 'recording' : ''}`}
                  onClick={handleMicClick}
                  disabled={isLoading || rateLimitCountdown !== null}
                  aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
                  title={isRecording ? 'Stop recording' : 'Voice input'}
                >
                  <Mic size={18} />
                </button>
              )}
              <input
                ref={inputRef}
                type="text"
                className={`chat-input ${input.trim().length > MAX_MESSAGE_LENGTH ? 'input-error' : ''} ${isSpeechSupported ? 'has-mic' : ''}`}
                value={isRecording ? voiceTranscript : input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isRecording
                    ? 'Listening...'
                    : rateLimitCountdown !== null
                    ? `Wait ${rateLimitCountdown}s...`
                    : 'Ask a question...'
                }
                aria-label="Chat input"
                aria-invalid={input.trim().length > MAX_MESSAGE_LENGTH}
                aria-describedby={input.trim().length > MAX_MESSAGE_LENGTH ? 'chat-input-error' : undefined}
                disabled={isLoading || rateLimitCountdown !== null || isRecording}
                maxLength={MAX_MESSAGE_LENGTH + 100}
              />
              {loadingState === 'streaming' || isCancelling ? (
                <button
                  className={`chat-send-btn ${isCancelling ? 'is-cancelling' : ''}`}
                  onClick={handleCancelStream}
                  disabled={isCancelling}
                  aria-label={isCancelling ? 'Cancelling...' : 'Stop generating'}
                  title={isCancelling ? 'Cancelling...' : 'Stop generating'}
                >
                  {isCancelling ? <span className="spinner-sm" /> : <Square size={16} />}
                </button>
              ) : (
                <button
                  className={`chat-send-btn ${input.trim() && input.trim().length <= MAX_MESSAGE_LENGTH ? 'active' : ''}`}
                  onClick={() => handleSend()}
                  disabled={!input.trim() || input.trim().length > MAX_MESSAGE_LENGTH || isLoading || rateLimitCountdown !== null || isRecording}
                  aria-label="Send message"
                >
                  {loadingState === 'sending' ? <span className="spinner-sm" /> : <ArrowUp size={18} strokeWidth={2.5} />}
                </button>
              )}
            </div>
            {input.trim().length > 0 && (
              <div
                id="chat-input-error"
                className={`chat-char-count ${input.trim().length > MAX_MESSAGE_LENGTH ? 'over-limit' : ''}`}
                role={input.trim().length > MAX_MESSAGE_LENGTH ? 'alert' : undefined}
              >
                {input.trim().length > MAX_MESSAGE_LENGTH
                  ? `Message too long: ${input.trim().length.toLocaleString()} / ${MAX_MESSAGE_LENGTH.toLocaleString()}`
                  : `${input.trim().length.toLocaleString()} / ${MAX_MESSAGE_LENGTH.toLocaleString()}`
                }
              </div>
            )}
          </div>
        </div>

        {/* Sources Panel */}
        {showSources && (
          <ErrorBoundary
            fallback={
              <div className="sources-panel sources-panel-error">
                <div className="sources-error-content">
                  <p className="text-muted">Unable to load sources</p>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => setShowSources(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            }
          >
            <SourcesPanel
              sources={activeSources}
              selectedSourceId={selectedSourceId}
              onSelectSource={setSelectedSourceId}
              onOpenNote={handleOpenNote}
              onClose={() => setShowSources(false)}
            />
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
}


```

## src/components/chat/CitationChip.tsx

```typescript
/**
 * Source/Citation chip components
 * Clickable inline chips that replace [1], [2] source tokens
 * Shows tooltip preview and triggers sources panel on click
 */

import { useState, useRef, useEffect, memo, useCallback } from 'react';
import type { Source } from '../../lib/types';
import { formatPreview } from '../../lib/citations';
import { cn } from '../../lib/utils';

// ============================================
// New Source-based Components
// ============================================

interface SourceRefChipProps {
  source: Source;
  onClick: (source: Source) => void;
}

/**
 * Inline source reference chip with tooltip
 * Replaces [1], [2] tokens in chat messages
 */
export const SourceRefChip = memo(function SourceRefChip({ source, onClick }: SourceRefChipProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const chipRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Position tooltip to avoid overflow
  useEffect(() => {
    if (showTooltip && tooltipRef.current && chipRef.current) {
      const tooltip = tooltipRef.current;
      const viewportWidth = window.innerWidth;

      tooltip.style.left = '50%';
      tooltip.style.transform = 'translateX(-50%)';

      const tooltipRect = tooltip.getBoundingClientRect();
      if (tooltipRect.right > viewportWidth - 8) {
        tooltip.style.left = 'auto';
        tooltip.style.right = '0';
        tooltip.style.transform = 'none';
      }
      if (tooltipRect.left < 8) {
        tooltip.style.left = '0';
        tooltip.style.right = 'auto';
        tooltip.style.transform = 'none';
      }
    }
  }, [showTooltip]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick(source);
  };

  const preview = formatPreview(source.preview, 100);
  const relevancePercent = Math.round(source.relevance * 100);

  const handleMouseEnter = useCallback(() => setShowTooltip(true), []);
  const handleMouseLeave = useCallback(() => setShowTooltip(false), []);

  return (
    <span className="source-chip-wrapper">
      <button
        ref={chipRef}
        className="source-ref-chip"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        aria-label={`Source ${source.id}: ${preview}`}
        title=""
      >
        [{source.id}]
      </button>

      {showTooltip && (
        <div ref={tooltipRef} className="source-tooltip" role="tooltip">
          <div className="source-tooltip-header">
            <span className="source-tooltip-badge">[{source.id}]</span>
            {source.relevance > 0 && (
              <span className="source-tooltip-score">
                {relevancePercent}% match
              </span>
            )}
          </div>
          <p className="source-tooltip-text">{preview}</p>
          <div className="source-tooltip-footer">
            <span className="source-tooltip-date">{source.date}</span>
            <span className="source-tooltip-hint">Click to view</span>
          </div>
        </div>
      )}
    </span>
  );
});

/**
 * Small badge for source lists
 * variant="context" shows a muted style for context sources (not directly cited)
 */
interface SourceBadgeProps {
  id: string;
  onClick: () => void;
  isActive?: boolean;
  variant?: 'cited' | 'context';
}

export const SourceBadge = memo(function SourceBadge({
  id,
  onClick,
  isActive = false,
  variant = 'cited',
}: SourceBadgeProps) {
  return (
    <button
      className={cn(
        'source-badge-chip',
        isActive && 'active',
        variant === 'context' && 'context'
      )}
      onClick={onClick}
      aria-label={`View source ${id}`}
      title={variant === 'context' ? 'Context source (not directly cited)' : undefined}
    >
      [{id}]
    </button>
  );
});

```

## src/components/chat/SourcesPanel.tsx

```typescript
/**
 * SourcesPanel component
 * Shows sources in a modal dialog
 * Allows viewing source previews and navigating to full notes
 */

import { useEffect, useRef } from 'react';
import { BookOpen, X, ShieldCheck, ArrowRight } from 'lucide-react';
import type { Source } from '../../lib/types';
import { formatPreview, getConfidenceFromRelevance } from '../../lib/citations';

interface SourcesPanelProps {
  sources: Source[];
  selectedSourceId: string | null;
  onSelectSource: (id: string | null) => void;
  onOpenNote: (noteId: string, preview?: string) => void;
  onClose: () => void;
}

export function SourcesPanel({
  sources,
  selectedSourceId,
  onSelectSource,
  onOpenNote,
  onClose,
}: SourcesPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLDivElement>(null);

  // Scroll to selected source when it changes
  useEffect(() => {
    if (selectedSourceId && selectedRef.current) {
      selectedRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedSourceId]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (sources.length === 0) return null;

  return (
    <div className="sources-modal-overlay" onClick={onClose}>
      <div
        className="sources-modal animate-scale-in"
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sources-modal-header">
          <div className="sources-modal-title">
            <BookOpen size={16} />
            <span>Sources</span>
            <span className="sources-count">{sources.length}</span>
          </div>
          <button
            className="btn btn-icon btn-ghost btn-sm"
            onClick={onClose}
            aria-label="Close sources panel"
          >
            <X size={16} />
          </button>
        </div>

        <div className="sources-modal-body">
          <div className="sources-trust-hint">
            <ShieldCheck size={14} />
            Grounded in your notes
          </div>

          <div className="sources-list">
            {sources.map((source) => {
              const isSelected = source.id === selectedSourceId;
              const confidence = getConfidenceFromRelevance(source.relevance);
              const relevancePercent = Math.round(source.relevance * 100);

              return (
                <div
                  key={source.id}
                  ref={isSelected ? selectedRef : null}
                  className={`source-card ${isSelected ? 'selected' : ''} confidence-${confidence}`}
                  onClick={() => onSelectSource(isSelected ? null : source.id)}
                >
                  <div className="source-card-header">
                    <span className="source-badge">[{source.id}]</span>
                    {source.relevance > 0 && (
                      <span className="source-score" title={`Relevance: ${relevancePercent}%`}>
                        {relevancePercent}%
                      </span>
                    )}
                  </div>

                  <p className="source-preview">
                    {formatPreview(source.preview, 200)}
                  </p>

                  <div className="source-card-footer">
                    <span className="source-date">
                      {source.date}
                    </span>
                    <button
                      className="btn btn-sm btn-ghost jump-to-note-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenNote(source.noteId, source.preview);
                      }}
                      title="Jump to this note in the notes list"
                    >
                      Jump to note
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}


```

## src/components/common/CommandPalette.tsx

```typescript
/**
 * CommandPalette component
 * Cmd/Ctrl+K powered command palette for power users
 * Provides quick access to common actions and navigation
 * Uses Tailwind utilities
 */

import { useState, useCallback, useEffect, useRef, memo, useMemo } from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface CommandAction {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  actions: CommandAction[];
  recentActionIds?: string[];
  onActionExecuted?: (actionId: string) => void;
}

export const CommandPalette = memo(function CommandPalette({
  isOpen,
  onClose,
  actions,
  recentActionIds = [],
  onActionExecuted,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const prevIsOpen = useRef(isOpen);

  // Get recent actions
  const recentActions = useMemo(() => {
    return recentActionIds
      .map((id) => actions.find((a) => a.id === id))
      .filter((a): a is CommandAction => a !== undefined);
  }, [recentActionIds, actions]);

  // Filter actions based on query
  const filteredActions = useMemo(() => {
    if (!query.trim()) {
      // Show recent actions first, then all actions
      const nonRecentActions = actions.filter(
        (a) => !recentActionIds.includes(a.id)
      );
      return [...recentActions, ...nonRecentActions];
    }
    const searchText = query.toLowerCase();
    return actions.filter((action) =>
      action.label.toLowerCase().includes(searchText) ||
      action.description?.toLowerCase().includes(searchText) ||
      action.keywords?.some((k) => k.toLowerCase().includes(searchText))
    );
  }, [actions, query, recentActions, recentActionIds]);

  // Compute bounded selected index - automatically clamps to valid range
  // No need to reset via effect; just ensure index stays within bounds
  const boundedSelectedIndex = useMemo(() => {
    if (filteredActions.length === 0) return 0;
    return Math.min(selectedIndex, filteredActions.length - 1);
  }, [selectedIndex, filteredActions.length]);

  // Reset state when opened (detect edge from closed to open)
  useEffect(() => {
    if (isOpen && !prevIsOpen.current) {
      // Just opened - reset via timeout to avoid sync setState in effect
      const timeoutId = setTimeout(() => {
        setQuery('');
        setSelectedIndex(0);
        inputRef.current?.focus();
      }, 0);
      return () => clearTimeout(timeoutId);
    }
    prevIsOpen.current = isOpen;
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    const listEl = listRef.current;
    if (!listEl) return;
    const selectedEl = listEl.querySelector('[data-selected="true"]');
    selectedEl?.scrollIntoView({ block: 'nearest' });
  }, [boundedSelectedIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, filteredActions.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredActions[boundedSelectedIndex]) {
            filteredActions[boundedSelectedIndex].action();
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [filteredActions, boundedSelectedIndex, onClose]
  );

  const handleItemClick = useCallback(
    (action: CommandAction) => {
      action.action();
      onActionExecuted?.(action.id);
      onClose();
    },
    [onClose, onActionExecuted]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-modal)] overflow-hidden animate-in zoom-in-95 slide-in-from-top-2 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
          <Search size={18} className="text-[var(--color-text-tertiary)] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-base text-[var(--color-text)] placeholder:text-[var(--color-placeholder)]"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Search commands"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text-tertiary)] bg-[var(--color-bg-muted)] border border-[var(--color-border)] rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[300px] overflow-y-auto p-2" ref={listRef}>
          {filteredActions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-[var(--color-text-tertiary)]">
              <Search size={24} className="mb-2 opacity-50" />
              <p className="text-sm">No commands found</p>
            </div>
          ) : (
            <>
              {!query && recentActions.length > 0 && (
                <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  Recent
                </div>
              )}
              {filteredActions.map((action, index) => {
                const isSelected = index === boundedSelectedIndex;
                const showAllHeader = !query && index === recentActions.length && recentActions.length > 0;

                return (
                  <div key={action.id}>
                    {showAllHeader && (
                      <div className="px-2 py-1.5 mt-2 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                        All Commands
                      </div>
                    )}
                    <button
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-left transition-colors duration-100',
                        isSelected
                          ? 'bg-[var(--color-accent)] text-white'
                          : 'hover:bg-[var(--color-surface-hover)]'
                      )}
                      data-selected={isSelected}
                      onClick={() => handleItemClick(action)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <span className={cn(
                        'flex-shrink-0 [&>svg]:w-[18px] [&>svg]:h-[18px]',
                        isSelected ? 'text-white/80' : 'text-[var(--color-text-tertiary)]'
                      )}>
                        {action.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className={cn(
                          'block text-sm font-medium truncate',
                          isSelected ? 'text-white' : 'text-[var(--color-text)]'
                        )}>
                          {action.label}
                        </span>
                        {action.description && (
                          <span className={cn(
                            'block text-xs truncate',
                            isSelected ? 'text-white/70' : 'text-[var(--color-text-secondary)]'
                          )}>
                            {action.description}
                          </span>
                        )}
                      </div>
                      {action.shortcut && (
                        <kbd className={cn(
                          'px-1.5 py-0.5 text-[10px] font-medium rounded border',
                          isSelected
                            ? 'bg-white/10 border-white/20 text-white/80'
                            : 'bg-[var(--color-bg-muted)] border-[var(--color-border)] text-[var(--color-text-tertiary)]'
                        )}>
                          {action.shortcut}
                        </kbd>
                      )}
                    </button>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center justify-center gap-4 px-4 py-2.5 border-t border-[var(--color-border)] bg-[var(--color-bg-muted)]">
          <span className="text-xs text-[var(--color-text-tertiary)]">
            <kbd className="px-1 py-0.5 mr-1 text-[10px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded">↑↓</kbd>
            navigate
          </span>
          <span className="text-xs text-[var(--color-text-tertiary)]">
            <kbd className="px-1 py-0.5 mr-1 text-[10px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded">↵</kbd>
            select
          </span>
          <span className="text-xs text-[var(--color-text-tertiary)]">
            <kbd className="px-1 py-0.5 mr-1 text-[10px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded">esc</kbd>
            close
          </span>
        </div>
      </div>
    </div>
  );
});

```

## src/components/common/ConfirmDialog.tsx

```typescript
/**
 * ConfirmDialog component
 * Modal dialog for confirming destructive actions
 * Uses new Tailwind-based UI components
 */

import { memo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { Button } from '../ui/Button';
import { Dialog, DialogClose } from '../ui/Dialog';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = memo(function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Use focus trap hook for proper focus management
  const dialogRef = useFocusTrap<HTMLDivElement>({
    enabled: isOpen,
    onEscape: onCancel,
    restoreFocus: true,
  });

  return (
    <Dialog
      open={isOpen}
      onClose={onCancel}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      <div ref={dialogRef} className="p-6 text-center">
        <DialogClose onClose={onCancel} />

        {/* Icon */}
        <div className={cn(
          'mx-auto mb-4 w-12 h-12 rounded-full',
          'flex items-center justify-center',
          variant === 'danger' && 'bg-[var(--color-danger-bg)] text-[var(--color-danger)]',
          variant === 'warning' && 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
          variant === 'default' && 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
        )}>
          <AlertTriangle size={24} />
        </div>

        {/* Title */}
        <h3
          id="confirm-dialog-title"
          className="text-lg font-semibold text-[var(--color-text)] mb-2"
        >
          {title}
        </h3>

        {/* Message */}
        <p
          id="confirm-dialog-message"
          className="text-sm text-[var(--color-text-secondary)] mb-6"
        >
          {message}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <Button variant="default" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : variant === 'default' ? 'primary' : 'default'}
            onClick={onConfirm}
            className={variant === 'warning' ? 'bg-[var(--color-warning)] text-white hover:bg-amber-600' : ''}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
});


```

## src/components/common/EmptyState.tsx

```typescript
/**
 * EmptyState component
 * Displays a friendly empty state with icon and message
 * Uses Tailwind utilities
 */

import { memo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { FileText, Search } from 'lucide-react';

interface EmptyStateProps {
  /** Type of empty state */
  type: 'no-notes' | 'no-search-results';
  /** Custom message (optional) */
  message?: string;
}

const configs: Record<EmptyStateProps['type'], { icon: LucideIcon; title: string; description: string }> = {
  'no-notes': {
    icon: FileText,
    title: 'No notes yet',
    description: 'Write your first note above to get started. Your notes will appear here.',
  },
  'no-search-results': {
    icon: Search,
    title: 'No results found',
    description: 'Try adjusting your search or filter to find what you\'re looking for.',
  },
};

export const EmptyState = memo(function EmptyState({ type, message }: EmptyStateProps) {
  const config = configs[type];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-[var(--color-bg-muted)] flex items-center justify-center mb-4 text-[var(--color-text-tertiary)]">
        <Icon size={32} strokeWidth={1.5} />
      </div>
      <h3 className="text-base font-semibold text-[var(--color-text)] mb-2">
        {config.title}
      </h3>
      <p className="text-sm text-[var(--color-text-secondary)] max-w-[280px] leading-relaxed">
        {message || config.description}
      </p>
    </div>
  );
});


```

## src/components/common/ErrorBoundary.tsx

```typescript
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


```

## src/components/common/LiveRegion.tsx

```typescript
/**
 * LiveRegion component
 * Provides screen reader announcements for dynamic content changes
 * Uses aria-live regions for accessible notifications
 */

import { createContext, useContext, useCallback, useState, useRef, useEffect, type ReactNode } from 'react';

type AnnouncePriority = 'polite' | 'assertive';

interface LiveRegionContextValue {
  announce: (message: string, priority?: AnnouncePriority) => void;
}

const LiveRegionContext = createContext<LiveRegionContextValue | null>(null);

interface LiveRegionProviderProps {
  children: ReactNode;
}

export function LiveRegionProvider({ children }: LiveRegionProviderProps) {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');
  const timeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  // Cleanup timeouts on unmount
  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
      timeouts.clear();
    };
  }, []);

  const announce = useCallback((message: string, priority: AnnouncePriority = 'polite') => {
    const clearMessage = () => {
      if (priority === 'assertive') {
        setAssertiveMessage('');
      } else {
        setPoliteMessage('');
      }
    };

    // Clear any existing message first to ensure the new message is announced
    clearMessage();

    // Set new message after a small delay to trigger announcement
    const setTimer = setTimeout(() => {
      if (priority === 'assertive') {
        setAssertiveMessage(message);
      } else {
        setPoliteMessage(message);
      }
      timeoutsRef.current.delete(setTimer);
    }, 50);
    timeoutsRef.current.add(setTimer);

    // Clear message after it's been announced
    const clearTimer = setTimeout(() => {
      clearMessage();
      timeoutsRef.current.delete(clearTimer);
    }, 1000);
    timeoutsRef.current.add(clearTimer);
  }, []);

  return (
    <LiveRegionContext.Provider value={{ announce }}>
      {children}
      {/* Screen reader only live regions */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {politeMessage}
      </div>
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        role="alert"
      >
        {assertiveMessage}
      </div>
    </LiveRegionContext.Provider>
  );
}

/**
 * Hook to access the announce function for screen reader notifications
 * Note: Co-located with provider for simplicity; Fast Refresh still works but may refresh whole tree
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useAnnounce() {
  const context = useContext(LiveRegionContext);
  if (!context) {
    throw new Error('useAnnounce must be used within a LiveRegionProvider');
  }
  return context.announce;
}


```

## src/components/common/OfflineBanner.tsx

```typescript
/**
 * OfflineBanner component
 * Shows a prominent banner when the user is offline
 */

import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export function OfflineBanner() {
  const { isOnline } = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[1000] flex items-center justify-center gap-2 py-2 px-4 bg-[var(--color-warning-bg)] text-[var(--color-warning)] text-sm font-medium border-b border-amber-300/30"
      role="alert"
      aria-live="polite"
    >
      <WifiOff size={16} />
      <span>You're offline. Some features may not work.</span>
    </div>
  );
}


```

## src/components/common/PanelFallback.tsx

```typescript
/**
 * PanelFallback component
 * Fallback UI for granular error boundaries in panels
 * Allows individual panels to fail without crashing the entire app
 * Uses Tailwind utilities
 */

import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';

interface PanelFallbackProps {
  title: string;
  onRetry?: () => void;
}

export function PanelFallback({ title, onRetry }: PanelFallbackProps) {
  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)]">
      <div className="flex flex-col items-center justify-center flex-1 p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--color-danger-bg)] flex items-center justify-center mb-4 text-[var(--color-danger)]">
          <AlertTriangle size={32} />
        </div>
        <h3 className="text-base font-semibold text-[var(--color-text)] mb-2">
          Something went wrong
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)] max-w-[280px] leading-relaxed mb-4">
          {title} encountered an error. The rest of the app is still working.
        </p>
        {onRetry && (
          <Button variant="primary" onClick={onRetry}>
            <RotateCcw size={16} />
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}


```

## src/components/common/SkipLink.tsx

```typescript
/**
 * SkipLink component
 * Allows keyboard users to skip to main content
 */

interface SkipLinkProps {
  targetId: string;
  label?: string;
}

export function SkipLink({ targetId, label = 'Skip to main content' }: SkipLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <a 
      href={`#${targetId}`}
      className="skip-link"
      onClick={handleClick}
    >
      {label}
    </a>
  );
}


```

## src/components/common/Toast.tsx

```typescript
/**
 * Toast notification system
 * Lightweight context-based toast for showing ephemeral messages
 */

import { useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { Check, X, Info, AlertTriangle } from 'lucide-react';
import { ToastContext, type ToastType } from './ToastContext';
import { UI } from '../../lib/constants';
import { cn } from '../../lib/utils';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Cleanup all timeouts on unmount
  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
      timeouts.clear();
    };
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    setToasts((prev) => [...prev, { id, message, type }]);

    const timeout = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timeoutsRef.current.delete(id);
    }, UI.TOAST_DURATION_MS);

    timeoutsRef.current.set(id, timeout);
  }, []);

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success': return <Check size={14} />;
      case 'error': return <X size={14} />;
      case 'warning': return <AlertTriangle size={14} />;
      case 'info': default: return <Info size={14} />;
    }
  };

  const getToastStyles = (type: ToastType) => {
    const base = [
      'flex items-center gap-2 px-4 py-3',
      'bg-[var(--color-surface-elevated)] text-[var(--color-text)]',
      'border rounded-[var(--radius-lg)] shadow-[var(--shadow-card)]',
      'text-sm font-medium',
      'animate-in slide-in-from-bottom-2 fade-in duration-200',
    ].join(' ');

    const variants: Record<ToastType, string> = {
      success: 'border-[var(--color-success-border)]',
      error: 'border-[var(--color-danger-border)]',
      warning: 'border-amber-300/30',
      info: 'border-[var(--color-border)]',
    };

    return cn(base, variants[type]);
  };

  const getIconStyles = (type: ToastType) => {
    const variants: Record<ToastType, string> = {
      success: 'text-[var(--color-success)]',
      error: 'text-[var(--color-danger)]',
      warning: 'text-[var(--color-warning)]',
      info: 'text-[var(--color-accent)]',
    };
    return variants[type];
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[2000] flex flex-col gap-2"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className={getToastStyles(toast.type)}>
            <span className={getIconStyles(toast.type)}>
              {getIcon(toast.type)}
            </span>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}


```

## src/components/common/ToastContext.ts

```typescript
/**
 * Toast context - separated for fast refresh compatibility
 */

import { createContext } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);


```

## src/components/common/useToast.ts

```typescript
/**
 * useToast hook - extracted for fast refresh compatibility
 */

import { useContext } from 'react';
import { ToastContext, type ToastContextValue } from './ToastContext';

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}


```

## src/components/layout/AppShell.tsx

```typescript
/**
 * AppShell component
 * Main layout with header, responsive grid, and mobile tabs
 * Manages cross-pane communication for note highlighting from chat citations
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, FileText, LogOut, Plus, MessageSquare, Search } from 'lucide-react';
import { useAuth, getUserInitials } from '../../auth';
import { useToast } from '../common/useToast';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { PanelFallback } from '../common/PanelFallback';
import { NotesPanel } from '../notes/NotesPanel';
import { ChatPanel } from '../chat/ChatPanel';
import { NoteDetailDrawer } from '../notes/NoteDetailDrawer';
import { SkipLink } from '../common/SkipLink';
import { OfflineBanner } from '../common/OfflineBanner';
import { CommandPalette, type CommandAction } from '../common/CommandPalette';
import { useCommandPalette } from '../../hooks/useCommandPalette';
import type { Note } from '../../lib/types';

type Tab = 'notes' | 'chat';

// Maximum pages to search when looking for a note
const MAX_SEARCH_PAGES = 10;

export function AppShell() {
  const [activeTab, setActiveTab] = useState<Tab>('notes');
  const [highlightNoteId, setHighlightNoteId] = useState<string | null>(null);
  const [drawerNote, setDrawerNote] = useState<Note | null>(null);
  const [drawerHighlight, setDrawerHighlight] = useState<string | undefined>();
  const [searchingForNote, setSearchingForNote] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number }>({ top: 60, right: 16 });
  const { showToast } = useToast();
  const { user, signOut } = useAuth();
  const commandPalette = useCommandPalette();

  // Store notes state from NotesPanel for lookup
  const notesRef = useRef<Note[]>([]);
  const hasMoreRef = useRef<boolean>(false);
  const loadMoreRef = useRef<(() => Promise<void>) | null>(null);
  // Ref to focus notes composer
  const notesComposerRef = useRef<HTMLTextAreaElement | null>(null);
  // Ref for profile avatar button for dropdown positioning
  const profileAvatarRef = useRef<HTMLButtonElement | null>(null);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
    } catch {
      showToast('Failed to sign out', 'error');
    }
  }, [signOut, showToast]);

  // Command palette actions
  const commandActions: CommandAction[] = useMemo(() => [
    {
      id: 'new-note',
      label: 'New Note',
      description: 'Create a new note',
      icon: <Plus size={16} />,
      shortcut: '⌘N',
      keywords: ['create', 'add', 'write'],
      action: () => {
        setActiveTab('notes');
        // Focus the composer after tab switch
        setTimeout(() => notesComposerRef.current?.focus(), 100);
      },
    },
    {
      id: 'go-notes',
      label: 'Go to Notes',
      description: 'Switch to notes panel',
      icon: <FileText size={16} />,
      keywords: ['switch', 'view', 'list'],
      action: () => setActiveTab('notes'),
    },
    {
      id: 'go-chat',
      label: 'Go to Chat',
      description: 'Switch to Aurora AI chat',
      icon: <MessageSquare size={16} />,
      keywords: ['ai', 'ask', 'aurora', 'assistant'],
      action: () => setActiveTab('chat'),
    },
    {
      id: 'search-notes',
      label: 'Search Notes',
      description: 'Search through your notes',
      icon: <Search size={16} />,
      shortcut: '⌘F',
      keywords: ['find', 'lookup'],
      action: () => {
        setActiveTab('notes');
        // The search input will be focused by the NotesPanel
      },
    },
    {
      id: 'sign-out',
      label: 'Sign Out',
      description: 'Sign out of your account',
      icon: <LogOut size={16} />,
      keywords: ['logout', 'exit'],
      action: handleSignOut,
    },
  ], [handleSignOut]);

  // Handle notes loaded from NotesPanel
  const handleNotesLoaded = useCallback((notes: Note[], hasMore: boolean, loadMore: () => Promise<void>) => {
    notesRef.current = notes;
    hasMoreRef.current = hasMore;
    loadMoreRef.current = loadMore;
  }, []);

  // Handle opening a note from chat citation with bounded search
  const handleOpenNote = useCallback(async (noteId: string, snippet?: string) => {
    // Switch to notes tab
    setActiveTab('notes');
    setDrawerHighlight(snippet);

    // Check if note is already loaded
    let foundNote = notesRef.current.find(n => n.id === noteId);

    if (foundNote) {
      // Note is loaded - highlight it and show drawer with full content
      setDrawerNote(foundNote);
      setHighlightNoteId(noteId);
      return;
    }

    // Note not loaded - show drawer with snippet as placeholder
    const tempNote: Note = {
      id: noteId,
      text: snippet || 'Loading note content...',
      tenantId: 'public',
      createdAt: null,
      updatedAt: null,
    };
    setDrawerNote(tempNote);

    // Try to load more pages to find the note (bounded search)
    if (hasMoreRef.current && loadMoreRef.current) {
      setSearchingForNote(true);
      let pagesSearched = 0;

      while (pagesSearched < MAX_SEARCH_PAGES && hasMoreRef.current) {
        try {
          await loadMoreRef.current();
          pagesSearched++;

          // Check if we found the note
          foundNote = notesRef.current.find(n => n.id === noteId);
          if (foundNote) {
            setDrawerNote(foundNote);
            setHighlightNoteId(noteId);
            setSearchingForNote(false);
            return;
          }
        } catch {
          // Stop searching on error
          break;
        }
      }

      setSearchingForNote(false);

      // Still not found after max pages
      if (!foundNote) {
        showToast('Note not found in loaded pages. Showing snippet only.', 'info');
      }
    }
  }, [showToast]);

  const handleNoteHighlighted = useCallback(() => {
    setTimeout(() => setHighlightNoteId(null), 2500);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerNote(null);
    setDrawerHighlight(undefined);
  }, []);

  return (
    <div className="app-shell">
      <SkipLink targetId="main-content" />
      <OfflineBanner />
      <div className="app-container">
        {/* Header */}
        <header className="app-header">
          {/* Left: App Icon */}
          <div className="app-title">
            <img src="/favicon.svg" alt="NotesGPT" className="app-icon" />
          </div>

          {/* Center: Tab Toggle - Segmented Control with sliding indicator */}
          <div
            className={`header-tabs ${activeTab === 'chat' ? 'chat-active' : ''}`}
            role="tablist"
            aria-label="View switcher"
          >
            <button
              role="tab"
              aria-selected={activeTab === 'notes'}
              className={activeTab === 'notes' ? 'active' : ''}
              onClick={() => setActiveTab('notes')}
              aria-label="Notes view"
            >
              <FileText size={15} aria-hidden="true" />
              <span>Notes</span>
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'chat'}
              className={activeTab === 'chat' ? 'active' : ''}
              onClick={() => setActiveTab('chat')}
              aria-label="Chat view"
            >
              <Sparkles size={15} aria-hidden="true" />
              <span>Chat</span>
            </button>
          </div>

          {/* Right: Actions */}
          <div className="header-actions">
            <div className="profile-menu-container">
              <button
                ref={profileAvatarRef}
                className="profile-avatar"
                onClick={() => {
                  if (profileAvatarRef.current) {
                    const rect = profileAvatarRef.current.getBoundingClientRect();
                    setMenuPosition({
                      top: rect.bottom + 12,
                      right: window.innerWidth - rect.right,
                    });
                  }
                  setShowProfileMenu(!showProfileMenu);
                }}
                title={user?.displayName || user?.email || 'Account'}
                aria-label="Account menu"
                aria-expanded={showProfileMenu}
                aria-haspopup="true"
              >
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt=""
                    className="profile-avatar-img"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="profile-avatar-initials">
                    {getUserInitials(user)}
                  </span>
                )}
              </button>

              {showProfileMenu && createPortal(
                <>
                  <div
                    className="profile-menu-backdrop"
                    onClick={() => setShowProfileMenu(false)}
                  />
                  <div
                    className="profile-menu"
                    role="menu"
                    style={{
                      top: menuPosition.top,
                      right: menuPosition.right,
                    }}
                  >
                    <div className="profile-menu-header">
                      <span className="profile-menu-name">
                        {user?.displayName || 'User'}
                      </span>
                      <span className="profile-menu-email">
                        {user?.email || user?.phoneNumber || ''}
                      </span>
                    </div>
                    <button
                      className="profile-menu-item danger"
                      onClick={handleSignOut}
                      role="menuitem"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                </>,
                document.body
              )}
            </div>
          </div>
        </header>

        {/* Main Grid */}
        <main id="main-content" className="main-grid" tabIndex={-1}>
          <ErrorBoundary fallback={<PanelFallback title="Notes" onRetry={() => window.location.reload()} />}>
            <NotesPanel
              className={activeTab !== 'notes' ? 'hidden' : ''}
              highlightNoteId={highlightNoteId}
              onNoteHighlighted={handleNoteHighlighted}
              onNotesLoaded={handleNotesLoaded}
            />
          </ErrorBoundary>
          <ErrorBoundary fallback={<PanelFallback title="Chat" onRetry={() => window.location.reload()} />}>
            <ChatPanel
              className={activeTab !== 'chat' ? 'hidden' : ''}
              onOpenNote={handleOpenNote}
            />
          </ErrorBoundary>
        </main>

        {/* Loading overlay when searching for note */}
        {searchingForNote && (
          <div className="searching-note-overlay">
            <div className="searching-note-content">
              <span className="spinner" />
              <span>Finding note...</span>
            </div>
          </div>
        )}

        <NoteDetailDrawer
          note={drawerNote}
          onClose={handleCloseDrawer}
          highlightText={drawerHighlight}
        />

        {/* Command Palette (Cmd/Ctrl+K) */}
        <CommandPalette
          isOpen={commandPalette.isOpen}
          onClose={commandPalette.close}
          actions={commandActions}
          recentActionIds={commandPalette.recentActionIds}
          onActionExecuted={commandPalette.trackAction}
        />
      </div>
    </div>
  );
}


```

## src/components/notes/EditNoteModal.tsx

```typescript
/**
 * EditNoteModal component
 * Modal for editing an existing note
 * Uses new Tailwind-based UI components
 */

import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { Save } from 'lucide-react';
import type { Note } from '../../lib/types';
import { NOTES } from '../../lib/constants';
import { cn } from '../../lib/utils';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { Button } from '../ui/Button';
import { Dialog, DialogClose, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '../ui/Dialog';

interface EditNoteModalProps {
  note: Note | null;
  isOpen: boolean;
  isSaving?: boolean;
  onSave: (id: string, text: string) => void;
  onClose: () => void;
}

export const EditNoteModal = memo(function EditNoteModal({
  note,
  isOpen,
  isSaving = false,
  onSave,
  onClose,
}: EditNoteModalProps) {
  // Initialize text from note - component is remounted with key when note changes
  const [text, setText] = useState(() => note?.text ?? '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Use focus trap hook for proper focus management
  const modalRef = useFocusTrap<HTMLDivElement>({
    enabled: isOpen && !!note,
    onEscape: onClose,
    restoreFocus: true,
  });

  // Auto-focus textarea when opened
  useEffect(() => {
    if (note && isOpen) {
      // Focus textarea after a brief delay to ensure modal is visible
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [note, isOpen]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!note || !text.trim() || isSaving) return;
    onSave(note.id, text.trim());
  }, [note, text, isSaving, onSave]);

  const charCount = text.length;
  const isOverLimit = charCount > NOTES.MAX_LENGTH;
  const hasChanges = note?.text !== text;
  const canSave = hasChanges && text.trim() && !isOverLimit && !isSaving;

  if (!note) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      aria-labelledby="edit-note-title"
      className="max-w-lg"
    >
      <div ref={modalRef}>
        <DialogHeader className="relative">
          <DialogTitle id="edit-note-title">Edit Note</DialogTitle>
          <DialogClose onClose={onClose} />
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody>
            <textarea
              ref={textareaRef}
              className={cn(
                'w-full min-h-[200px] max-h-[400px] resize-y',
                'p-4 text-base leading-relaxed',
                'bg-[var(--color-surface)] text-[var(--color-text)]',
                'border border-[var(--color-border)] rounded-[var(--radius-lg)]',
                'placeholder:text-[var(--color-placeholder)]',
                'focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20',
                'transition-all duration-150',
                isOverLimit && 'border-[var(--color-danger)] focus:border-[var(--color-danger)]'
              )}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Edit your note..."
              maxLength={NOTES.MAX_LENGTH + 100}
              disabled={isSaving}
              aria-label="Edit note content"
              aria-invalid={isOverLimit}
              aria-describedby="edit-note-char-count"
            />

            <div
              id="edit-note-char-count"
              className={cn(
                'text-xs text-right mt-2',
                isOverLimit ? 'text-[var(--color-danger)] font-medium' : 'text-[var(--color-text-tertiary)]'
              )}
              role={isOverLimit ? 'alert' : undefined}
            >
              {isOverLimit
                ? `Note too long: ${charCount.toLocaleString()} / ${NOTES.MAX_LENGTH.toLocaleString()}`
                : `${charCount.toLocaleString()} / ${NOTES.MAX_LENGTH.toLocaleString()}`
              }
            </div>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="default" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={!canSave}>
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </div>
    </Dialog>
  );
});


```

## src/components/notes/NoteCard.tsx

```typescript
/**
 * NoteCard component - Apple-inspired design
 * Clean, typography-focused note display with subtle interactions
 * Supports search highlighting, external highlight state, and touch gestures
 */

import { useState, useCallback, useEffect, memo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { Note } from '../../lib/types';
import { formatRelativeTime, formatFullTimestamp } from '../../lib/format';
import { splitTextForHighlight, cn, copyToClipboard, triggerHaptic } from '../../lib/utils';
import { useToast } from '../common/useToast';
import { NOTES } from '../../lib/constants';
import { useTouchGestures } from '../../hooks/useTouchGestures';

interface NoteCardProps {
  note: Note;
  isPending?: boolean;
  isHighlighted?: boolean;
  searchQuery?: string;
  onEdit?: (note: Note) => void;
  onDelete?: (note: Note) => void;
}

export const NoteCard = memo(function NoteCard({
  note,
  isPending = false,
  isHighlighted = false,
  searchQuery = '',
  onEdit,
  onDelete,
}: NoteCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [highlightActive, setHighlightActive] = useState(false);
  const [swipeHint, setSwipeHint] = useState<'edit' | 'delete' | null>(null);
  const { showToast } = useToast();

  // Touch gestures for mobile - swipe left to delete, right to edit, long press to copy
  const { isLongPressing, handlers: touchHandlers } = useTouchGestures({
    longPressDelay: 400,
    swipeThreshold: 60,
    hapticFeedback: true,
    onLongPressStart: () => {
      // Long press to copy on mobile
      copyToClipboard(note.text).then(success => {
        showToast(success ? 'Copied to clipboard' : 'Failed to copy', success ? 'success' : 'error');
      });
    },
    onSwipeLeft: () => {
      // Swipe left to delete (with visual hint)
      if (onDelete && !isPending) {
        setSwipeHint('delete');
        setTimeout(() => {
          setSwipeHint(null);
          onDelete(note);
        }, 150);
      }
    },
    onSwipeRight: () => {
      // Swipe right to edit
      if (onEdit && !isPending) {
        setSwipeHint('edit');
        setTimeout(() => {
          setSwipeHint(null);
          onEdit(note);
        }, 150);
      }
    },
  });

  // Flash highlight effect - triggered when isHighlighted prop changes
  useEffect(() => {
    if (!isHighlighted) {
      return;
    }
    // Start highlight animation after a microtask to avoid synchronous setState
    const startTimeout = setTimeout(() => setHighlightActive(true), 0);
    const endTimeout = setTimeout(() => setHighlightActive(false), NOTES.HIGHLIGHT_DURATION_MS);
    return () => {
      clearTimeout(startTimeout);
      clearTimeout(endTimeout);
    };
  }, [isHighlighted]);

  const showHighlight = isHighlighted || highlightActive;

  const needsExpansion = note.text.length > 200 || note.text.split('\n').length > 2;

  const handleToggle = useCallback(() => {
    if (needsExpansion) {
      setExpanded((prev) => !prev);
    }
  }, [needsExpansion]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(note);
  }, [note, onEdit]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('medium');
    onDelete?.(note);
  }, [note, onDelete]);

  const relativeTime = formatRelativeTime(note.createdAt);
  const fullTime = formatFullTimestamp(note.createdAt);

  // Render text with optional search highlighting
  const renderText = () => {
    const parts = splitTextForHighlight(note.text, searchQuery);
    if (parts.length === 1 && !parts[0].isMatch) {
      return note.text;
    }
    return (
      <>
        {parts.map((part, i) =>
          part.isMatch ? (
            <mark key={i} className="search-highlight">{part.text}</mark>
          ) : (
            part.text
          )
        )}
      </>
    );
  };

  // Handle keyboard shortcuts for note actions
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Expand/collapse with Enter or Space
    if (needsExpansion && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleToggle();
      return;
    }

    // Keyboard shortcuts for actions
    if (e.key === 'e' && onEdit) {
      // 'e' to edit
      e.preventDefault();
      onEdit(note);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      // Delete/Backspace to delete (with confirmation in parent)
      if (onDelete) {
        e.preventDefault();
        onDelete(note);
      }
    }
  }, [needsExpansion, handleToggle, note, onEdit, onDelete]);

  const cardClasses = cn(
    'note-card',
    isPending && 'pending',
    showHighlight && 'highlighted',
    isLongPressing && 'long-pressing',
    swipeHint === 'edit' && 'swipe-edit',
    swipeHint === 'delete' && 'swipe-delete'
  );

  // Extract first line as title, rest as preview
  const lines = note.text.split('\n');
  const firstLine = lines[0] || '';

  // Get a preview of the content (first ~60 chars or first line)
  const titleText = firstLine.length > 60 ? firstLine.slice(0, 57) + '...' : firstLine;
  const previewText = lines.length > 1
    ? lines.slice(1).join(' ').trim().slice(0, 100)
    : firstLine.length > 60 ? firstLine.slice(60).trim().slice(0, 100) : '';

  return (
    <article
      className={cardClasses}
      onClick={handleToggle}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`Note: ${note.text.slice(0, 50)}${note.text.length > 50 ? '...' : ''}`}
      aria-expanded={needsExpansion ? expanded : undefined}
      role={needsExpansion ? 'button' : undefined}
      {...touchHandlers}
    >
      {/* Collapsed view: Apple Notes style */}
      {!expanded && (
        <>
          <div className="note-title">
            {searchQuery ? renderText() : titleText}
          </div>
          {previewText && !searchQuery && (
            <div className="note-preview">{previewText}</div>
          )}
          <div className="note-footer">
            <span className="note-time" title={fullTime}>
              {isPending ? 'Saving…' : relativeTime}
            </span>

            {/* Overflow menu button - visible on hover */}
            <div className="note-actions">
              {onEdit && (
                <button
                  className="note-action-btn"
                  onClick={handleEdit}
                  title="Edit"
                  aria-label="Edit note"
                >
                  <Pencil size={15} />
                </button>
              )}
              {onDelete && (
                <button
                  className="note-action-btn note-action-danger"
                  onClick={handleDelete}
                  title="Delete"
                  aria-label="Delete note"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Expanded view: full content */}
      {expanded && (
        <>
          <div className="note-text">
            {renderText()}
          </div>
          <div className="note-footer">
            <span className="note-time" title={fullTime}>
              {isPending ? 'Saving…' : relativeTime}
            </span>
            <div className="note-actions note-actions-visible">
              {onEdit && (
                <button
                  className="note-action-btn"
                  onClick={handleEdit}
                  title="Edit"
                  aria-label="Edit note"
                >
                  <Pencil size={15} />
                </button>
              )}
              {onDelete && (
                <button
                  className="note-action-btn note-action-danger"
                  onClick={handleDelete}
                  title="Delete"
                  aria-label="Delete note"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </article>
  );
});


```

## src/components/notes/NoteCardSkeleton.tsx

```typescript
/**
 * NoteCardSkeleton component
 * Loading placeholder that matches NoteCard layout
 */

import { memo } from 'react';

interface NoteCardSkeletonProps {
  /** Number of skeleton cards to render */
  count?: number;
}

export const NoteCardSkeleton = memo(function NoteCardSkeleton({ count = 1 }: NoteCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="note-card-skeleton" aria-hidden="true">
          <div className="skeleton-text">
            <div className="skeleton-line skeleton-line-full" />
            <div className="skeleton-line skeleton-line-medium" />
          </div>
          <div className="skeleton-meta">
            <div className="skeleton-time" />
            <div className="skeleton-id" />
          </div>
        </div>
      ))}
    </>
  );
});


```

## src/components/notes/NoteDetailDrawer.tsx

```typescript
/**
 * NoteDetailDrawer component
 * Modal/drawer for viewing full note content when navigating from citations
 */

import { useEffect, useCallback } from 'react';
import { FileText, X, Copy } from 'lucide-react';
import type { Note } from '../../lib/types';
import { formatFullTimestamp, formatRelativeTime, shortId } from '../../lib/format';
import { splitTextForHighlight, copyToClipboard } from '../../lib/utils';
import { useToast } from '../common/useToast';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface NoteDetailDrawerProps {
  note: Note | null;
  onClose: () => void;
  highlightText?: string;
}

export function NoteDetailDrawer({ note, onClose, highlightText }: NoteDetailDrawerProps) {
  const { showToast } = useToast();
  // useFocusTrap handles focus trapping, escape key, and restoration automatically
  const drawerRef = useFocusTrap<HTMLDivElement>({
    enabled: !!note,
    onEscape: onClose,
    restoreFocus: true,
  });

  const handleCopy = useCallback(async () => {
    if (!note) return;
    const success = await copyToClipboard(note.text);
    showToast(success ? 'Copied to clipboard' : 'Failed to copy', success ? 'success' : 'error');
  }, [note, showToast]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (note) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [note]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!note) return null;

  const displayId = shortId(note.id);
  const relativeTime = formatRelativeTime(note.createdAt);
  const fullTime = formatFullTimestamp(note.createdAt);

  // Highlight matching text if provided
  const renderText = () => {
    const parts = splitTextForHighlight(note.text, highlightText || '');
    return (
      <p className="note-detail-text">
        {parts.map((part, i) =>
          part.isMatch ? (
            <mark key={i} className="highlight">{part.text}</mark>
          ) : (
            part.text
          )
        )}
      </p>
    );
  };

  return (
    <div className="note-drawer-backdrop" onClick={handleBackdropClick}>
      <div
        ref={drawerRef}
        className="note-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="note-drawer-title"
      >
        <div className="note-drawer-header">
          <h3 id="note-drawer-title">
            <FileText size={18} style={{ marginRight: '8px' }} />
            Note
          </h3>
          <button
            className="btn btn-icon btn-ghost"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="note-drawer-body">
          {renderText()}
        </div>

        <div className="note-drawer-footer">
          <div className="note-drawer-meta">
            <span className="note-drawer-time" title={fullTime}>
              {relativeTime}
            </span>
            {displayId && (
              <span className="note-drawer-id">{displayId}</span>
            )}
          </div>
          <div className="note-drawer-actions">
            <button className="btn btn-sm" onClick={handleCopy}>
              <Copy size={14} />
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}





```

## src/components/notes/NotesPanel.tsx

```typescript
/**
 * NotesPanel component
 * Sticky composer, scrollable notes list, keyboard shortcuts, optimistic updates
 * Now with cursor-based pagination for 100k+ notes support
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Search, ArrowUp, Mic, X, Tag, FileText } from 'lucide-react';
import type { Note } from '../../lib/types';
import { normalizeNote, groupNotesByDate } from '../../lib/format';
import { triggerHaptic } from '../../lib/utils';
import { listNotes, createNote, deleteNote, updateNote, ApiRequestError } from '../../lib/api';
import { NOTES } from '../../lib/constants';
import { useToast } from '../common/useToast';
import { useAnnounce } from '../common/LiveRegion';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import { useNoteClassifier } from '../../hooks/useNoteClassifier';
import { NoteCard } from './NoteCard';
import { NoteCardSkeleton } from './NoteCardSkeleton';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { EditNoteModal } from './EditNoteModal';
import { EmptyState } from '../common/EmptyState';
import { VoicePreviewBar } from './VoicePreviewBar';

interface NotesPanelProps {
  className?: string;
  highlightNoteId?: string | null;
  onNoteHighlighted?: () => void;
  onNotesLoaded?: (notes: Note[], hasMore: boolean, loadMore: () => Promise<void>) => void;
}

export function NotesPanel({ className = '', highlightNoteId, onNoteHighlighted, onNotesLoaded }: NotesPanelProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [pendingNotes, setPendingNotes] = useState<Note[]>([]);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [composerFocused, setComposerFocused] = useState(false);

  // Edit and delete state
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isEditSaving, setIsEditSaving] = useState(false);
  const [deleteConfirmNote, setDeleteConfirmNote] = useState<Note | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const loadMoreRef = useRef<(() => Promise<void>) | null>(null);
  const initialLoadRef = useRef(false);
  const loadingRef = useRef(false);
  const loadingMoreRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { showToast } = useToast();
  const announce = useAnnounce();

  // Speech-to-text for voice input
  // Note: autoEnhance is disabled because the enhancement uses the chat API
  // which performs RAG retrieval and responds as if asking a question.
  // Raw transcription is used directly for note drafting.
  const {
    state: recordingState,
    isSupported: isSpeechSupported,
    startRecording,
    stopRecording,
    cancelRecording,
    confirmTranscription,
    playPreview,
    pausePreview,
    isPlaying,
    duration,
    currentTime,
    transcript,
    setTranscript,
    rawTranscript,
    skipEnhancement,
    enhanceNow,
    enhancementFailed,
  } = useSpeechToText({
    onError: useCallback((errorMsg: string) => {
      showToast(errorMsg, 'error');
    }, [showToast]),
    autoEnhance: false, // Disabled - use raw transcription for note drafting
  });

  const isRecording = recordingState === 'recording';
  const isEnhancing = recordingState === 'enhancing';
  const isPreviewing = recordingState === 'preview' || recordingState === 'enhancing';

  // Note classifier for intelligent suggestions
  const {
    classification,
    suggestedTags,
    suggestedTemplate,
    templates,
    applyTemplate,
    getIcon,
  } = useNoteClassifier(text);

  // State for showing template picker
  const [showTemplates, setShowTemplates] = useState(false);

  // Handle applying a template
  const handleApplyTemplate = useCallback((templateId: string) => {
    const structure = applyTemplate(templateId);
    if (structure) {
      setText(structure);
      setShowTemplates(false);
      textareaRef.current?.focus();
      showToast('Template applied', 'success');
    }
  }, [applyTemplate, showToast]);

  // Handle confirming the voice transcript
  const handleConfirmTranscript = useCallback(() => {
    triggerHaptic('light');
    if (transcript.trim()) {
      setText((prev) => {
        const newText = prev ? `${prev} ${transcript.trim()}` : transcript.trim();
        return newText.slice(0, NOTES.MAX_LENGTH);
      });
      showToast('Voice note added', 'success');
    }
    confirmTranscription();
  }, [transcript, confirmTranscription, showToast]);

  // Wrapper for mic button with haptic feedback
  const handleMicClick = useCallback(() => {
    triggerHaptic('medium');
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Track mounted state and cleanup AbortController on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Abort any in-flight request on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  // Debounce search input
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, NOTES.SEARCH_DEBOUNCE_MS);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const trimmed = text.trim();
  const canSubmit = useMemo(
    () => trimmed.length > 0 && trimmed.length <= NOTES.MAX_LENGTH && !saving,
    [trimmed, saving]
  );

  const loadNotes = useCallback(async (loadCursor?: string, append = false) => {
    // Guard against concurrent requests using refs to avoid stale closures
    if (append && loadingMoreRef.current) return;
    if (!append && loadingRef.current) return;

    // Abort any in-flight request before starting a new one
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Update both ref and state
    if (append) {
      loadingMoreRef.current = true;
      setLoadingMore(true);
    } else {
      loadingRef.current = true;
      setLoading(true);
    }
    setError(null);

    try {
      const response = await listNotes(loadCursor, NOTES.PAGE_SIZE, controller.signal);

      // Prevent state updates if component unmounted during fetch
      if (!mountedRef.current) return;

      const normalized = response.notes.map(normalizeNote);

      if (append) {
        setNotes(prev => [...prev, ...normalized]);
      } else {
        setNotes(normalized);
      }

      setCursor(response.cursor);
      setHasMore(response.hasMore);
    } catch (err) {
      // Ignore abort errors - they're expected when cancelling
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }

      // Prevent state updates if component unmounted during fetch
      if (!mountedRef.current) return;

      const message = err instanceof ApiRequestError
        ? err.getUserMessage()
        : err instanceof Error ? err.message : 'Failed to load notes';
      setError(message);
      showToast(message, 'error');
    } finally {
      if (mountedRef.current) {
        loadingRef.current = false;
        loadingMoreRef.current = false;
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [showToast]);

  const loadMore = useCallback(async () => {
    if (cursor && !loadingMoreRef.current && hasMore) {
      await loadNotes(cursor, true);
    }
  }, [cursor, hasMore, loadNotes]);

  // Keep loadMoreRef in sync with the latest loadMore function
  useEffect(() => {
    loadMoreRef.current = loadMore;
  }, [loadMore]);

  // Stable wrapper function that always calls the latest loadMore
  // This prevents the parent from re-rendering when loadMore changes
  const stableLoadMore = useCallback(async () => {
    await loadMoreRef.current?.();
  }, []);

  // Notify parent when notes change - uses stableLoadMore to prevent flicker
  // Only notify when loading completes (not during loading) to prevent flickering
  useEffect(() => {
    if (!loading) {
      onNotesLoaded?.(notes, hasMore, stableLoadMore);
    }
  }, [notes, hasMore, loading, stableLoadMore, onNotesLoaded]);

  const handleCreate = useCallback(async () => {
    if (!canSubmit) return;

    // Create optimistic note
    const optimisticNote: Note = {
      id: `temp-${Date.now()}`,
      text: trimmed,
      tenantId: 'public',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setPendingNotes((prev) => [optimisticNote, ...prev]);
    setText('');
    setSaving(true);
    setError(null);

    try {
      const createdNote = await createNote(trimmed);
      // Replace optimistic note with the real one from API (more efficient than reloading all)
      const normalizedNote = normalizeNote(createdNote);
      setPendingNotes([]);
      setNotes((prev) => [normalizedNote, ...prev]);
      showToast('Saved', 'success');
      announce('Note saved successfully');
    } catch (err) {
      const message = err instanceof ApiRequestError
        ? err.getUserMessage()
        : err instanceof Error ? err.message : 'Failed to save note';
      setError(message);
      showToast(message, 'error');
      announce(message, 'assertive');
      // Restore text on failure
      setText(optimisticNote.text);
      setPendingNotes([]);
    } finally {
      setSaving(false);
    }
  }, [canSubmit, trimmed, showToast, announce]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleCreate();
      }
    },
    [handleCreate]
  );

  // Handle infinite scroll - use ref for loadingMore to avoid stale closure
  const handleScroll = useCallback(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl || loadingMoreRef.current || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollEl;
    // Load more when within 200px of bottom
    if (scrollHeight - scrollTop - clientHeight < 200) {
      loadMore();
    }
  }, [loadMore, hasMore]);

  // Handle edit note
  const handleEdit = useCallback((note: Note) => {
    setEditingNote(note);
  }, []);

  const handleEditSave = useCallback(async (id: string, newText: string) => {
    setIsEditSaving(true);
    try {
      const updated = await updateNote(id, newText);
      const normalizedNote = normalizeNote(updated);
      setNotes(prev => prev.map(n => n.id === id ? normalizedNote : n));
      setEditingNote(null);
      showToast('Note updated', 'success');
      announce('Note updated successfully');
    } catch (err) {
      const message = err instanceof ApiRequestError
        ? err.getUserMessage()
        : err instanceof Error ? err.message : 'Failed to update note';
      showToast(message, 'error');
      announce(message, 'assertive');
    } finally {
      setIsEditSaving(false);
    }
  }, [showToast, announce]);

  const handleEditClose = useCallback(() => {
    setEditingNote(null);
  }, []);

  // Handle delete note
  const handleDeleteClick = useCallback((note: Note) => {
    setDeleteConfirmNote(note);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirmNote) return;

    setIsDeleting(true);
    const noteId = deleteConfirmNote.id;

    try {
      await deleteNote(noteId);
      setNotes(prev => prev.filter(n => n.id !== noteId));
      setDeleteConfirmNote(null);
      showToast('Note deleted', 'success');
      announce('Note deleted');
    } catch (err) {
      const message = err instanceof ApiRequestError
        ? err.getUserMessage()
        : err instanceof Error ? err.message : 'Failed to delete note';
      showToast(message, 'error');
      announce(message, 'assertive');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteConfirmNote, showToast, announce]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirmNote(null);
  }, []);

  // Initial load - only runs once on mount
  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      loadNotes();
    }
  }, [loadNotes]);

  // Attach scroll listener
  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    scrollEl.addEventListener('scroll', handleScroll);
    return () => scrollEl.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Scroll to highlighted note when requested
  useEffect(() => {
    if (highlightNoteId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      onNoteHighlighted?.();
    }
  }, [highlightNoteId, onNoteHighlighted]);

  // Intelligent search: splits query into terms, matches all terms, ranks by relevance
  const filteredNotes = useMemo(() => {
    const allNotes = [...pendingNotes, ...notes];

    if (!debouncedSearch) {
      return allNotes;
    }

    const queryTerms = debouncedSearch.toLowerCase().split(/\s+/).filter(t => t.length > 0);
    if (queryTerms.length === 0) {
      return allNotes;
    }

    // Score and filter notes
    const scored = allNotes.map(note => {
      const textLower = note.text.toLowerCase();
      let score = 0;
      let allTermsMatch = true;

      for (const term of queryTerms) {
        if (!textLower.includes(term)) {
          allTermsMatch = false;
          break;
        }
        // Exact word match scores higher
        const wordBoundaryRegex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (wordBoundaryRegex.test(note.text)) {
          score += 10;
        } else {
          score += 1; // Partial match
        }
        // Multiple occurrences boost score
        const occurrences = (textLower.match(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        score += Math.min(occurrences - 1, 3); // Cap bonus at 3
      }

      // Boost if query appears as exact phrase
      if (textLower.includes(debouncedSearch.toLowerCase())) {
        score += 20;
      }

      return { note, score, matches: allTermsMatch };
    });

    // Filter to notes that match all terms, then sort by score descending
    return scored
      .filter(s => s.matches)
      .sort((a, b) => b.score - a.score)
      .map(s => s.note);
  }, [pendingNotes, notes, debouncedSearch]);

  // Group notes by date (Apple Notes style)
  const groupedNotes = useMemo(() => {
    return groupNotesByDate(filteredNotes);
  }, [filteredNotes]);

  const isFiltered = debouncedSearch.length > 0;

  return (
    <div className={`panel ${className}`}>
      <div className="panel-body">
        {/* Floating Composer */}
        <div className={`composer ${composerFocused || text || isPreviewing ? 'composer-expanded' : ''}`}>
          {/* Audio Preview Bar with Editable Transcript */}
          {isPreviewing && (
            <VoicePreviewBar
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              onPlay={playPreview}
              onPause={pausePreview}
              transcript={transcript}
              rawTranscript={rawTranscript}
              isEnhancing={isEnhancing}
              enhancementFailed={enhancementFailed}
              onTranscriptChange={setTranscript}
              onSkipEnhancement={skipEnhancement}
              onEnhanceNow={enhanceNow}
              onConfirm={handleConfirmTranscript}
              onCancel={cancelRecording}
            />
          )}

          {/* Show live transcript while recording */}
          {isRecording && transcript && (
            <div className="recording-transcript">
              <span className="recording-transcript-label">Listening...</span>
              <p className="recording-transcript-text">{transcript}</p>
            </div>
          )}

          <div
            className="composer-wrapper"
            style={{ display: isPreviewing ? 'none' : undefined }}
          >
            <span id="composer-hint" className="sr-only">
              Press Cmd+Enter or Ctrl+Enter to save
            </span>
            <textarea
              ref={textareaRef}
              className="composer-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setComposerFocused(true)}
              onBlur={() => setComposerFocused(false)}
              placeholder="Capture a thought..."
              aria-label="Write a note"
              aria-describedby="composer-hint"
              disabled={saving || isRecording}
            />
            <div className="composer-actions">
              <button
                className="composer-template-btn"
                onClick={() => setShowTemplates(!showTemplates)}
                disabled={saving || isRecording}
                aria-label="Choose template"
                title="Choose template"
                type="button"
              >
                <FileText size={18} />
              </button>
              {isSpeechSupported && (
                <button
                  className={`composer-mic-btn ${isRecording ? 'recording' : ''}`}
                  onClick={handleMicClick}
                  disabled={saving}
                  aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
                  title={isRecording ? 'Stop recording' : 'Voice input'}
                  type="button"
                >
                  <Mic size={18} />
                </button>
              )}
              <button
                className="composer-send-btn"
                onClick={handleCreate}
                disabled={!canSubmit || isRecording}
                aria-label="Save note"
                title="Save note"
              >
                {saving ? (
                  <span className="spinner" />
                ) : (
                  <ArrowUp size={18} />
                )}
              </button>
            </div>
          </div>
          {/* Character count and classification hints */}
          {trimmed.length > 0 && (
            <div className="composer-footer">
              <div className="composer-char-count">
                {trimmed.length.toLocaleString()} / {NOTES.MAX_LENGTH.toLocaleString()}
              </div>
              {classification && classification.type !== 'general' && classification.confidence > 0.3 && (
                <div className="composer-classification" title={`Detected as ${classification.type} note`}>
                  <span className="classification-icon">{getIcon(classification.type)}</span>
                </div>
              )}
            </div>
          )}
          {/* Suggested tags */}
          {suggestedTags.length > 0 && composerFocused && (
            <div className="composer-suggestions">
              <Tag size={12} />
              <span className="suggestion-label">Tags:</span>
              {suggestedTags.map(tag => (
                <span key={tag} className="suggested-tag">#{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Template Picker */}
        {showTemplates && (
          <div className="template-picker">
            <div className="template-picker-header">
              <span>Choose a template</span>
              <button onClick={() => setShowTemplates(false)} className="template-close" aria-label="Close templates">
                <X size={16} />
              </button>
            </div>
            <div className="template-list">
              {templates.map(template => (
                <button
                  key={template.id}
                  className="template-item"
                  onClick={() => handleApplyTemplate(template.id)}
                >
                  <span className="template-icon">{template.icon}</span>
                  <div className="template-info">
                    <span className="template-name">{template.name}</span>
                    <span className="template-desc">{template.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Template suggestion */}
        {suggestedTemplate && !showTemplates && trimmed.length < 50 && composerFocused && (
          <div className="template-suggestion">
            <FileText size={14} />
            <span>Try the <button className="template-link" onClick={() => handleApplyTemplate(suggestedTemplate.id)}>
              {suggestedTemplate.icon} {suggestedTemplate.name}
            </button> template</span>
          </div>
        )}

        {/* Search */}
        <div className="notes-toolbar">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              className="search-input"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search notes"
            />
            {searchQuery && (
              <button
                className="search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {error && <div className="error-inline">{error}</div>}

        {/* Scrollable Notes List with Infinite Scroll */}
        <div className="notes-scroll" ref={scrollRef}>
          {loading && notes.length === 0 ? (
            <div className="notes-list" role="list" aria-label="Notes list">
              <NoteCardSkeleton count={3} />
            </div>
          ) : filteredNotes.length === 0 ? (
            <EmptyState type={isFiltered ? 'no-search-results' : 'no-notes'} />
          ) : (
            <>
              {groupedNotes.map(({ group, notes: groupNotes }) => (
                <div key={group} className="notes-group">
                  <div className="notes-group-header">
                    <span className="notes-group-title">{group}</span>
                  </div>
                  <div className="notes-list" role="list" aria-label={`${group} notes`}>
                    {groupNotes.map((note) => (
                      <div
                        key={note.id}
                        ref={note.id === highlightNoteId ? highlightRef : null}
                        role="listitem"
                      >
                        <NoteCard
                          note={note}
                          isPending={note.id.startsWith('temp-')}
                          isHighlighted={note.id === highlightNoteId}
                          searchQuery={debouncedSearch}
                          onEdit={handleEdit}
                          onDelete={handleDeleteClick}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {!isFiltered && loadingMore && (
                <div className="loading-more">
                  <span className="spinner" /> Loading more...
                </div>
              )}
              {!isFiltered && hasMore && !loadingMore && (
                <button
                  className="btn load-more-btn"
                  onClick={loadMore}
                >
                  Load more notes
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Edit Note Modal - key forces remount when note changes to reset state */}
      <EditNoteModal
        key={editingNote?.id}
        note={editingNote}
        isOpen={!!editingNote}
        isSaving={isEditSaving}
        onSave={handleEditSave}
        onClose={handleEditClose}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirmNote}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}


```

## src/components/notes/VoicePreviewBar.tsx

```typescript
/**
 * VoicePreviewBar component
 * Displays audio preview with playback controls, editable transcript, and action buttons
 */

import { Play, Pause, Check, X, Sparkles, AlertTriangle, RotateCcw } from 'lucide-react';
import { formatTime } from '../../lib/utils';

interface VoicePreviewBarProps {
  // Playback state
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  
  // Transcript state
  transcript: string;
  rawTranscript: string;
  isEnhancing: boolean;
  enhancementFailed: boolean;
  onTranscriptChange: (text: string) => void;
  onSkipEnhancement: () => void;
  onEnhanceNow: () => void;
  
  // Actions
  onConfirm: () => void;
  onCancel: () => void;
}

export function VoicePreviewBar({
  isPlaying,
  currentTime,
  duration,
  onPlay,
  onPause,
  transcript,
  rawTranscript,
  isEnhancing,
  enhancementFailed,
  onTranscriptChange,
  onSkipEnhancement,
  onEnhanceNow,
  onConfirm,
  onCancel,
}: VoicePreviewBarProps) {
  return (
    <div className="audio-preview-container">
      {/* Playback controls */}
      <div className="audio-preview-bar">
        <button
          className="audio-preview-play-btn"
          onClick={isPlaying ? onPause : onPlay}
          aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
          type="button"
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <div
          className="audio-preview-progress"
          role="progressbar"
          aria-label="Audio playback progress"
          aria-valuenow={Math.round(currentTime)}
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
        >
          <div
            className="audio-preview-progress-bar"
            style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
          />
        </div>
        <span className="audio-preview-time" aria-hidden="true">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      {/* Editable transcript with enhancement status */}
      <div className="audio-preview-transcript">
        {isEnhancing && (
          <div className="enhancement-status">
            <span className="enhancement-badge">
              <Sparkles size={12} />
              AI enhancing...
            </span>
            <button
              className="enhancement-skip-btn"
              onClick={onSkipEnhancement}
              type="button"
            >
              Use original
            </button>
          </div>
        )}
        <textarea
          className={`audio-preview-transcript-input ${isEnhancing ? 'enhancing' : ''}`}
          value={transcript}
          onChange={(e) => onTranscriptChange(e.target.value)}
          placeholder={isEnhancing ? 'Enhancing with AI...' : 'Transcript will appear here...'}
          aria-label="Edit transcript"
          disabled={isEnhancing}
        />
        {rawTranscript && !isEnhancing && transcript !== rawTranscript && (
          <div className="enhancement-comparison">
            <button
              className="enhancement-toggle-btn"
              onClick={() => onTranscriptChange(rawTranscript)}
              type="button"
            >
              Show original
            </button>
          </div>
        )}
        {/* Enhancement failed notice with retry */}
        {enhancementFailed && !isEnhancing && (
          <div className="enhancement-failed-notice">
            <AlertTriangle size={14} />
            <span>AI enhancement failed. Using original transcript.</span>
            <button
              className="btn"
              onClick={onEnhanceNow}
              type="button"
            >
              <RotateCcw size={12} />
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="audio-preview-footer">
        <span className="audio-preview-hint">
          {isEnhancing ? 'AI is cleaning up your transcript...' : 'Edit the transcript above, then confirm or discard'}
        </span>
        <div className="audio-preview-actions">
          <button
            className="audio-preview-cancel-btn"
            onClick={onCancel}
            aria-label="Discard recording"
            title="Discard"
            type="button"
          >
            <X size={16} />
            <span>Discard</span>
          </button>
          <button
            className="audio-preview-confirm-btn"
            onClick={onConfirm}
            disabled={!transcript.trim()}
            aria-label="Add to note"
            title="Add to note"
            type="button"
          >
            <Check size={16} />
            <span>Add to note</span>
          </button>
        </div>
      </div>
    </div>
  );
}


```

## src/components/ui/Avatar.tsx

```typescript
/**
 * Avatar component - Tailwind-based UI primitive
 * User profile images with fallback initials
 */

import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  initials?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const baseStyles = [
  'inline-flex items-center justify-center',
  'rounded-full overflow-hidden flex-shrink-0',
  'bg-[var(--color-bg-muted)] text-[var(--color-text-secondary)]',
  'font-semibold uppercase',
].join(' ');

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
};

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt = '', initials, size = 'md', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(baseStyles, sizes[size], className)}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span>{initials || '?'}</span>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';


```

## src/components/ui/Badge.tsx

```typescript
/**
 * Badge component - Tailwind-based UI primitive
 * Small status indicators and pills
 */

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'danger' | 'warning' | 'muted';
  children: ReactNode;
}

const baseStyles = [
  'inline-flex items-center justify-center',
  'min-w-[18px] h-[18px] px-1.5',
  'text-[11px] font-bold text-white',
  'rounded-full',
].join(' ');

const variants = {
  default: 'bg-[var(--color-accent)]',
  primary: 'bg-[var(--color-accent)]',
  success: 'bg-[var(--color-success)]',
  danger: 'bg-[var(--color-danger)]',
  warning: 'bg-[var(--color-warning)] text-[var(--color-text)]',
  muted: 'bg-[var(--color-text-muted)]',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(baseStyles, variants[variant], className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

/** Chip - Larger interactive tag/pill */
export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  children: ReactNode;
}

const chipBaseStyles = [
  'inline-flex items-center gap-1.5',
  'font-medium whitespace-nowrap',
  'border rounded-full',
  'transition-all duration-150',
].join(' ');

const chipVariants = {
  default: [
    'bg-[var(--color-bg-muted)] border-[var(--color-border)]',
    'text-[var(--color-text-secondary)]',
  ].join(' '),
  primary: 'bg-[var(--color-accent)] border-transparent text-white',
  success: 'bg-[var(--color-success-bg)] border-[var(--color-success-border)] text-[var(--color-success)]',
  danger: 'bg-[var(--color-danger-bg)] border-[var(--color-danger-border)] text-[var(--color-danger)]',
  warning: 'bg-[var(--color-warning-bg)] border-amber-300/30 text-[var(--color-warning)]',
};

const chipSizes = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export const Chip = forwardRef<HTMLSpanElement, ChipProps>(
  ({ className, variant = 'default', size = 'md', interactive, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          chipBaseStyles,
          chipVariants[variant],
          chipSizes[size],
          interactive && [
            'cursor-pointer',
            'hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-border-strong)]',
            'active:scale-[0.96]',
          ],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Chip.displayName = 'Chip';


```

## src/components/ui/Button.tsx

```typescript
/**
 * Button component - Tailwind-based UI primitive
 * Clean, accessible button with multiple variants and sizes
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'ghost' | 'danger';
  children: ReactNode;
}

const baseStyles = [
  'inline-flex items-center justify-center gap-2',
  'font-medium cursor-pointer whitespace-nowrap select-none',
  'transition-all duration-150 ease-out',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2',
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
  'active:scale-[0.98]',
].join(' ');

const variants = {
  default: [
    'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)]',
    'hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-border-strong)]',
  ].join(' '),
  primary: [
    'bg-[var(--color-accent)] border border-transparent text-white',
    'hover:bg-[var(--color-accent-hover)]',
  ].join(' '),
  ghost: [
    'bg-transparent border border-transparent text-[var(--color-text)]',
    'hover:bg-[var(--color-surface-hover)]',
  ].join(' '),
  danger: [
    'bg-transparent border border-[var(--color-border)] text-[var(--color-danger)]',
    'hover:bg-[var(--color-danger-bg)] hover:border-[var(--color-danger-border)]',
  ].join(' '),
};

const sizeStyles = 'h-10 px-4 text-sm rounded-[var(--radius-md)]';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizeStyles, className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';


```

## src/components/ui/Card.tsx

```typescript
/**
 * Card component - Tailwind-based UI primitive
 * Clean container with optional interactive states
 */

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const baseStyles = [
  'bg-[var(--color-surface)] border border-[var(--color-border)]',
  'rounded-[var(--radius-lg)]',
].join(' ');

const variants = {
  default: '',
  elevated: 'bg-[var(--color-surface-elevated)] shadow-[var(--shadow-card)]',
  interactive: [
    'cursor-pointer transition-all duration-150',
    'hover:border-[var(--color-border-strong)]',
    'active:bg-[var(--color-surface-pressed)]',
  ].join(' '),
};

const paddings = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(baseStyles, variants[variant], paddings[padding], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

/** Card Header - Optional title section */
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-between gap-4 pb-3 mb-3',
          'border-b border-[var(--color-border-subtle)]',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

/** Card Title - Styled heading */
export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn(
          'text-xs font-bold uppercase tracking-wider',
          'text-[var(--color-text-tertiary)]',
          className
        )}
        {...props}
      >
        {children}
      </h3>
    );
  }
);

CardTitle.displayName = 'CardTitle';

/** Card Content - Main content area */
export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('', className)} {...props}>
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';


```

## src/components/ui/Dialog.tsx

```typescript
/**
 * Dialog component - Tailwind-based UI primitive
 * Modal dialog with backdrop, accessible focus management
 */

import { forwardRef, type HTMLAttributes, type ReactNode, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { IconButton } from './IconButton';

export interface DialogProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export const Dialog = forwardRef<HTMLDivElement, DialogProps>(
  ({ className, open, onClose, children, ...props }, ref) => {
    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }, [onClose]);

    if (!open) return null;

    return (
      <div
        className={cn(
          'fixed inset-0 z-[1000]',
          'flex items-center justify-center p-4',
          'bg-black/50 backdrop-blur-[2px]',
          'animate-in fade-in duration-200'
        )}
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        {...props}
      >
        <div
          ref={ref}
          className={cn(
            'relative w-full max-w-md',
            'bg-[var(--color-surface)] rounded-[var(--radius-xl)]',
            'border border-[var(--color-border)]',
            'shadow-[var(--shadow-modal)]',
            'animate-in zoom-in-95 duration-200',
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    );
  }
);

Dialog.displayName = 'Dialog';

/** Dialog Close Button */
export interface DialogCloseProps {
  onClose: () => void;
}

export function DialogClose({ onClose }: DialogCloseProps) {
  return (
    <IconButton
      variant="ghost"
      size="sm"
      onClick={onClose}
      className="absolute top-3 right-3"
      aria-label="Close dialog"
    >
      <X size={18} />
    </IconButton>
  );
}

/** Dialog Header */
export interface DialogHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const DialogHeader = forwardRef<HTMLDivElement, DialogHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-6 pt-6 pb-4', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DialogHeader.displayName = 'DialogHeader';

/** Dialog Title */
export interface DialogTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

export const DialogTitle = forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <h2
        ref={ref}
        className={cn(
          'text-lg font-semibold text-[var(--color-text)]',
          'tracking-tight',
          className
        )}
        {...props}
      >
        {children}
      </h2>
    );
  }
);

DialogTitle.displayName = 'DialogTitle';

/** Dialog Body */
export interface DialogBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const DialogBody = forwardRef<HTMLDivElement, DialogBodyProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-6 py-4', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DialogBody.displayName = 'DialogBody';

/** Dialog Footer */
export interface DialogFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const DialogFooter = forwardRef<HTMLDivElement, DialogFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-end gap-3',
          'px-6 pb-6 pt-2',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DialogFooter.displayName = 'DialogFooter';


```

## src/components/ui/IconButton.tsx

```typescript
/**
 * IconButton component - Tailwind-based UI primitive
 * Minimal icon-only button for toolbars and actions
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const baseStyles = [
  'inline-flex items-center justify-center',
  'rounded-[var(--radius-md)] cursor-pointer',
  'transition-all duration-150',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  'active:scale-95',
].join(' ');

const variants = {
  default: [
    'bg-[var(--color-surface)] border border-[var(--color-border)]',
    'text-[var(--color-text-secondary)]',
    'hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-border-strong)]',
    'hover:text-[var(--color-text)]',
  ].join(' '),
  ghost: [
    'bg-transparent border-transparent',
    'text-[var(--color-text-tertiary)]',
    'hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]',
  ].join(' '),
  danger: [
    'bg-transparent border-transparent',
    'text-[var(--color-text-tertiary)]',
    'hover:bg-[var(--color-danger-bg)] hover:text-[var(--color-danger)]',
  ].join(' '),
};

const sizes = {
  sm: 'w-7 h-7 [&>svg]:w-3.5 [&>svg]:h-3.5',
  md: 'w-9 h-9 [&>svg]:w-[18px] [&>svg]:h-[18px]',
  lg: 'w-11 h-11 [&>svg]:w-5 [&>svg]:h-5',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = 'ghost', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';


```

## src/components/ui/Input.tsx

```typescript
/**
 * Input component - Tailwind-based UI primitive
 * Clean, accessible input with error states
 */

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  inputSize?: 'sm' | 'md' | 'lg';
}

const baseStyles = [
  'w-full font-inherit',
  'bg-[var(--color-surface)] text-[var(--color-text)]',
  'border border-[var(--color-border)] rounded-[var(--radius-lg)]',
  'transition-all duration-150',
  'placeholder:text-[var(--color-placeholder)]',
  'hover:border-[var(--color-border-strong)]',
  'focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20',
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--color-bg-muted)]',
].join(' ');

const sizes = {
  sm: 'h-8 px-3 text-sm rounded-[var(--radius-md)]',
  md: 'h-[52px] px-4 text-base',
  lg: 'h-14 px-5 text-lg rounded-[var(--radius-xl)]',
};

const errorStyles = [
  'border-[var(--color-danger)]',
  'focus:border-[var(--color-danger)] focus:ring-[var(--color-danger)]/20',
].join(' ');

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, inputSize = 'md', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(baseStyles, sizes[inputSize], error && errorStyles, className)}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

/** Textarea variant */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const textareaBaseStyles = [
  'w-full min-h-[52px] max-h-[200px] resize-none font-inherit',
  'p-3 text-base leading-normal',
  'bg-[var(--color-surface)] text-[var(--color-text)]',
  'border border-[var(--color-border)] rounded-[var(--radius-lg)]',
  'transition-all duration-150',
  'placeholder:text-[var(--color-placeholder)]',
  'hover:border-[var(--color-border-strong)]',
  'focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20',
  'disabled:opacity-50 disabled:cursor-not-allowed',
].join(' ');

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(textareaBaseStyles, error && errorStyles, className)}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';


```

## src/components/ui/index.ts

```typescript
/**
 * UI Component Library
 * Reusable Tailwind-based primitives
 */

// Buttons
export { Button, type ButtonProps } from './Button';
export { IconButton, type IconButtonProps } from './IconButton';

// Inputs
export { Input, Textarea, type InputProps, type TextareaProps } from './Input';

// Containers
export { Card, CardHeader, CardTitle, CardContent, type CardProps } from './Card';

// Dialogs
export {
  Dialog,
  DialogClose,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  type DialogProps,
} from './Dialog';

// Indicators
export { Badge, Chip, type BadgeProps, type ChipProps } from './Badge';
export { Avatar, type AvatarProps } from './Avatar';


```

## src/hooks/index.ts

```typescript
/**
 * Custom hooks index
 * Re-exports all custom hooks for convenient imports
 */

export { useChat, type ChatLoadingState } from './useChat';
export { useCommandPalette } from './useCommandPalette';
export { useFocusTrap } from './useFocusTrap';
export { useNoteClassifier, type NoteClassification, type NoteType, type NoteTemplate } from './useNoteClassifier';
export { useOnlineStatus } from './useOnlineStatus';
export { useSpeechToText, type RecordingState, type UseSpeechToTextOptions, type UseSpeechToTextReturn } from './useSpeechToText';
export { useTouchGestures } from './useTouchGestures';

```

## src/hooks/useChat.ts

```typescript
/**
 * useChat hook
 * Manages chat state, message history, and API interactions
 * Supports both streaming and non-streaming modes
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { ChatMessage, Source, StreamSource } from '../lib/types';
import { sendChatMessage, sendChatMessageStreaming, ApiRequestError } from '../lib/api';
import { CHAT, STORAGE_KEYS } from '../lib/constants';

export type ChatLoadingState = 'idle' | 'sending' | 'streaming' | 'error';

interface UseChatOptions {
  streaming?: boolean;
}

interface UseChatReturn {
  messages: ChatMessage[];
  loadingState: ChatLoadingState;
  activeSource: Source | null;
  setActiveSource: (source: Source | null) => void;
  sendMessage: (text: string) => Promise<void>;
  retryLastMessage: () => Promise<void>;
  clearChat: () => void;
  cancelStream: () => void;
}

/**
 * Generate a unique message ID
 */
function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Load chat history from localStorage
 */
function loadChatHistory(): ChatMessage[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
    if (stored) {
      const messages = JSON.parse(stored) as ChatMessage[];
      // Limit to max history size
      return messages.slice(-CHAT.MAX_HISTORY_MESSAGES);
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

/**
 * Save chat history to localStorage
 */
function saveChatHistory(messages: ChatMessage[]): void {
  try {
    const toSave = messages.slice(-CHAT.MAX_HISTORY_MESSAGES);
    localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(toSave));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Convert StreamSource to Source by adding default relevance
 */
function streamSourceToSource(ss: StreamSource): Source {
  return {
    ...ss,
    relevance: 0, // Will be updated when done event arrives with full meta
  };
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  // Default to non-streaming mode for better compatibility
  const { streaming = false } = options;

  const [messages, setMessages] = useState<ChatMessage[]>(() => loadChatHistory());
  const [loadingState, setLoadingState] = useState<ChatLoadingState>('idle');
  const [activeSource, setActiveSource] = useState<Source | null>(null);

  // Ref to track the current stream controller
  const streamControllerRef = useRef<AbortController | null>(null);
  // Ref to track the current streaming message ID
  const streamingMessageIdRef = useRef<string | null>(null);

  // Persist messages to localStorage
  useEffect(() => {
    saveChatHistory(messages);
  }, [messages]);

  // Cancel any active stream
  const cancelStream = useCallback(() => {
    if (streamControllerRef.current) {
      streamControllerRef.current.abort();
      streamControllerRef.current = null;
    }
    if (streamingMessageIdRef.current) {
      // Mark streaming message as complete
      setMessages(prev =>
        prev.map(m =>
          m.id === streamingMessageIdRef.current ? { ...m, isStreaming: false } : m
        )
      );
      streamingMessageIdRef.current = null;
    }
    setLoadingState('idle');
  }, []);

  // Send a message (streaming or non-streaming)
  const sendMessage = useCallback(async (text: string) => {
    // Cancel any existing stream
    cancelStream();

    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    if (streaming) {
      // Streaming mode
      const assistantMessageId = generateMessageId();
      streamingMessageIdRef.current = assistantMessageId;

      // Add initial streaming message
      const initialMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
        sources: [],
      };
      setMessages(prev => [...prev, initialMessage]);
      setLoadingState('streaming');

      try {
        const controller = await sendChatMessageStreaming(text, {
          onSources: (sources) => {
            // Update message with sources immediately
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantMessageId
                  ? { ...m, sources: sources.map(streamSourceToSource) }
                  : m
              )
            );
          },
          onToken: (token) => {
            // Append token to content
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantMessageId
                  ? { ...m, content: m.content + token }
                  : m
              )
            );
          },
          onDone: (meta) => {
            // Finalize message with meta
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantMessageId
                  ? { ...m, meta, isStreaming: false }
                  : m
              )
            );
            streamingMessageIdRef.current = null;
            streamControllerRef.current = null;
            setLoadingState('idle');
          },
          onError: (error) => {
            // Update message to show error
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantMessageId
                  ? { ...m, content: error, isError: true, isStreaming: false }
                  : m
              )
            );
            streamingMessageIdRef.current = null;
            streamControllerRef.current = null;
            setLoadingState('error');
          },
        });

        streamControllerRef.current = controller;
      } catch (err) {
        const isApiError = err instanceof ApiRequestError;
        // Update the streaming message to show error
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMessageId
              ? {
                  ...m,
                  content: isApiError ? err.getUserMessage() : 'Something went wrong. Please try again.',
                  isError: true,
                  isStreaming: false,
                  errorCode: isApiError ? err.status : undefined,
                }
              : m
          )
        );
        streamingMessageIdRef.current = null;
        setLoadingState('error');
      }
    } else {
      // Non-streaming mode
      setLoadingState('sending');

      try {
        const response = await sendChatMessage(text);

        const assistantMessage: ChatMessage = {
          id: generateMessageId(),
          role: 'assistant',
          content: response.answer,
          sources: response.sources,
          contextSources: response.contextSources,
          timestamp: new Date(),
          meta: response.meta,
          action: response.meta?.action,  // Include action metadata if present
        };

        setMessages(prev => [...prev, assistantMessage]);
        setLoadingState('idle');
      } catch (err) {
        const isApiError = err instanceof ApiRequestError;
        const errorMessage: ChatMessage = {
          id: generateMessageId(),
          role: 'assistant',
          content: isApiError ? err.getUserMessage() : 'Something went wrong. Please try again.',
          timestamp: new Date(),
          isError: true,
          errorCode: isApiError ? err.status : undefined,
        };

        setMessages(prev => [...prev, errorMessage]);
        setLoadingState('error');
      }
    }
  }, [streaming, cancelStream]);

  // Retry the last failed message
  const retryLastMessage = useCallback(async () => {
    // Find the last user message before the error
    let lastUserMessageIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMessageIndex = i;
        break;
      }
    }
    if (lastUserMessageIndex === -1) return;

    const lastUserMessage = messages[lastUserMessageIndex];

    // Remove BOTH the error message AND the last user message
    // sendMessage will re-add the user message, avoiding duplicates
    setMessages(prev => prev.filter((m, idx) => !m.isError && idx !== lastUserMessageIndex));

    // Re-send using the existing sendMessage logic
    await sendMessage(lastUserMessage.content);
  }, [messages, sendMessage]);

  // Clear all messages
  const clearChat = useCallback(() => {
    cancelStream();
    setMessages([]);
    setActiveSource(null);
    setLoadingState('idle');
    localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
  }, [cancelStream]);

  return {
    messages,
    loadingState,
    activeSource,
    setActiveSource,
    sendMessage,
    retryLastMessage,
    clearChat,
    cancelStream,
  };
}


```

## src/hooks/useCommandPalette.ts

```typescript
/**
 * Hook to manage command palette state and keyboard shortcut
 */
import { useState, useCallback, useEffect } from 'react';

const RECENT_ACTIONS_KEY = 'auroranotes:recent-actions';
const MAX_RECENT_ACTIONS = 5;

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [recentActionIds, setRecentActionIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_ACTIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  // Track recent actions
  const trackAction = useCallback((actionId: string) => {
    setRecentActionIds((prev) => {
      // Remove if already exists, then add to front
      const filtered = prev.filter((id) => id !== actionId);
      const updated = [actionId, ...filtered].slice(0, MAX_RECENT_ACTIONS);

      // Persist to localStorage
      try {
        localStorage.setItem(RECENT_ACTIONS_KEY, JSON.stringify(updated));
      } catch {
        // Ignore localStorage errors
      }

      return updated;
    });
  }, []);

  // Global keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  return { isOpen, open, close, toggle, recentActionIds, trackAction };
}


```

## src/hooks/useFocusTrap.ts

```typescript
/**
 * useFocusTrap hook
 * Traps focus within a container for modals and drawers
 */

import { useEffect, useRef, useCallback } from 'react';

const FOCUSABLE_SELECTORS = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

interface UseFocusTrapOptions {
  enabled?: boolean;
  onEscape?: () => void;
  restoreFocus?: boolean;
}

export function useFocusTrap<T extends HTMLElement>(
  options: UseFocusTrapOptions = {}
) {
  const { enabled = true, onEscape, restoreFocus = true } = options;
  const containerRef = useRef<T>(null);
  const previousActiveElement = useRef<Element | null>(null);

  // Get all focusable elements within the container
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
    ).filter(el => el.offsetParent !== null); // Filter hidden elements
  }, []);

  // Handle tab key navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled || !containerRef.current) return;

    if (event.key === 'Escape' && onEscape) {
      event.preventDefault();
      onEscape();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Shift+Tab on first element -> go to last
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    // Tab on last element -> go to first
    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
      return;
    }
  }, [enabled, onEscape, getFocusableElements]);

  // Set up focus trap when enabled
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    // Store the previously focused element
    previousActiveElement.current = document.activeElement;

    // Focus the first focusable element or the container itself
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    } else if (containerRef.current) {
      containerRef.current.focus();
    }

    // Add keydown listener
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      // Restore focus when trap is disabled
      if (restoreFocus && previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [enabled, getFocusableElements, handleKeyDown, restoreFocus]);

  return containerRef;
}


```

## src/hooks/useNoteClassifier.ts

```typescript
/**
 * useNoteClassifier - Hook for real-time note classification
 * 
 * Provides debounced classification as the user types, suggesting
 * note types, tags, and templates based on content.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  classifyNote,
  type NoteClassification,
  type NoteType,
  type NoteTemplate,
  NOTE_TEMPLATES,
  getNoteTypeIcon,
  getNoteTypeName,
} from '../lib/noteClassifier';

interface UseNoteClassifierOptions {
  /** Debounce delay in ms (default: 300) */
  debounceMs?: number;
  /** Minimum text length before classifying (default: 20) */
  minLength?: number;
}

interface UseNoteClassifierReturn {
  /** Current classification result */
  classification: NoteClassification | null;
  /** Whether classification is in progress */
  isClassifying: boolean;
  /** Suggested tags based on content */
  suggestedTags: string[];
  /** Suggested template based on content */
  suggestedTemplate: NoteTemplate | null;
  /** All available templates */
  templates: NoteTemplate[];
  /** Apply a template to get its structure */
  applyTemplate: (templateId: string) => string | null;
  /** Get icon for a note type */
  getIcon: (type: NoteType) => string;
  /** Get name for a note type */
  getName: (type: NoteType) => string;
}

/**
 * Hook for real-time note classification with debouncing
 */
export function useNoteClassifier(
  text: string,
  options: UseNoteClassifierOptions = {}
): UseNoteClassifierReturn {
  const { debounceMs = 300, minLength = 20 } = options;

  const [classification, setClassification] = useState<NoteClassification | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);

  // Debounced classification using async setTimeout pattern
  useEffect(() => {
    // Skip classification for short text
    if (text.length < minLength) {
      const timer = setTimeout(() => {
        setClassification(null);
        setIsClassifying(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    // Use immediate timeout to avoid synchronous setState warning
    const startTimer = setTimeout(() => setIsClassifying(true), 0);

    const classifyTimer = setTimeout(() => {
      const result = classifyNote(text);
      setClassification(result);
      setIsClassifying(false);
    }, debounceMs);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(classifyTimer);
    };
  }, [text, debounceMs, minLength]);

  // Extract suggested tags from classification
  const suggestedTags = useMemo(() => {
    return classification?.suggestedTags || [];
  }, [classification]);

  // Get suggested template
  const suggestedTemplate = useMemo(() => {
    if (!classification || classification.confidence < 0.3) {
      return null;
    }
    return classification.template || null;
  }, [classification]);

  // Apply a template by ID
  const applyTemplate = useCallback((templateId: string): string | null => {
    const template = NOTE_TEMPLATES.find(t => t.id === templateId);
    if (!template) return null;

    // Replace date placeholder with current date
    return template.structure.replace('[Today]', new Date().toLocaleDateString());
  }, []);

  return {
    classification,
    isClassifying,
    suggestedTags,
    suggestedTemplate,
    templates: NOTE_TEMPLATES,
    applyTemplate,
    getIcon: getNoteTypeIcon,
    getName: getNoteTypeName,
  };
}

export type { NoteClassification, NoteType, NoteTemplate };


```

## src/hooks/useOnlineStatus.ts

```typescript
/**
 * useOnlineStatus hook
 * Tracks browser online/offline status
 */

import { useState, useEffect, useCallback } from 'react';

interface UseOnlineStatusReturn {
  isOnline: boolean;
  wasOffline: boolean;
  resetWasOffline: () => void;
}

export function useOnlineStatus(): UseOnlineStatusReturn {
  const [isOnline, setIsOnline] = useState(() => 
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Keep wasOffline true so we can show "back online" message
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const resetWasOffline = useCallback(() => {
    setWasOffline(false);
  }, []);

  return {
    isOnline,
    wasOffline,
    resetWasOffline,
  };
}


```

## src/hooks/useSpeechToText.ts

```typescript
/**
 * useSpeechToText - Speech-to-text hook with real-time transcription and AI enhancement
 *
 * Uses Web Speech API for real-time transcription and MediaRecorder for audio playback.
 * Shows transcript instantly as user speaks, then enhances with AI for better quality.
 * Features:
 * - Real-time transcription via Web Speech API
 * - Audio recording for playback preview
 * - AI enhancement via Gemini (fixes grammar, removes filler words, adds punctuation)
 * - Streaming enhancement with visible token-by-token updates
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { enhanceTranscript } from '../lib/api';

export type RecordingState = 'idle' | 'recording' | 'enhancing' | 'preview';

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event & { error: string }) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export interface UseSpeechToTextOptions {
  /** Called when an error occurs */
  onError?: (error: string) => void;
  /** Whether to auto-enhance transcript after recording (default: true) */
  autoEnhance?: boolean;
}

export interface UseSpeechToTextReturn {
  /** Current recording state */
  state: RecordingState;
  /** Whether the browser supports speech recognition */
  isSupported: boolean;
  /** Start recording audio */
  startRecording: () => Promise<void>;
  /** Stop recording and enter preview mode */
  stopRecording: () => Promise<void>;
  /** Cancel recording or preview */
  cancelRecording: () => void;
  /** Confirm the transcript and return it */
  confirmTranscription: () => void;
  /** Play the recorded audio preview */
  playPreview: () => void;
  /** Pause the audio preview */
  pausePreview: () => void;
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Recording duration in seconds */
  duration: number;
  /** Current playback position in seconds */
  currentTime: number;
  /** Current transcript text (editable) - shows enhanced version when available */
  transcript: string;
  /** Update the transcript text */
  setTranscript: (text: string) => void;
  /** Original raw transcript before AI enhancement */
  rawTranscript: string;
  /** Whether AI enhancement is available (user is authenticated) */
  enhancementAvailable: boolean;
  /** Manually trigger enhancement */
  enhanceNow: () => Promise<void>;
  /** Skip enhancement and use raw transcript */
  skipEnhancement: () => void;
  /** Error message if any */
  error: string | null;
  /** Whether enhancement failed (for retry UI) */
  enhancementFailed: boolean;
}

/**
 * Hook for recording audio and transcribing it to text in real-time with AI enhancement
 */
export function useSpeechToText(options: UseSpeechToTextOptions = {}): UseSpeechToTextReturn {
  const { onError, autoEnhance = true } = options;

  const [state, setState] = useState<RecordingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [rawTranscript, setRawTranscript] = useState('');
  const [enhancementFailed, setEnhancementFailed] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioBlobRef = useRef<Blob | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null); // Track Object URL to prevent memory leak
  const recordingStartTimeRef = useRef<number>(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef<string>('');
  const enhanceControllerRef = useRef<AbortController | null>(null);

  // Check browser support for both MediaRecorder and SpeechRecognition
  const SpeechRecognitionAPI = typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null;

  const isSupported = typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== 'undefined' &&
    !!SpeechRecognitionAPI;

  // Enhancement is available if we have the API configured
  const enhancementAvailable = true; // Will fail gracefully if not authenticated

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Revoke Object URL to prevent memory leak
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.src = '';
        audioElementRef.current = null;
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
      if (enhanceControllerRef.current) {
        enhanceControllerRef.current.abort();
        enhanceControllerRef.current = null;
      }
    };
  }, []);

  const cleanupMedia = useCallback(() => {
    // Stop all tracks on the stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    if (enhanceControllerRef.current) {
      enhanceControllerRef.current.abort();
      enhanceControllerRef.current = null;
    }
  }, []);

  const cleanupAudio = useCallback(() => {
    // Revoke Object URL to prevent memory leak
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.src = '';
      audioElementRef.current = null;
    }
    audioBlobRef.current = null;
    setIsPlaying(false);
    setDuration(0);
    setCurrentTime(0);
  }, []);

  const cleanup = useCallback(() => {
    cleanupMedia();
    cleanupAudio();
    setTranscript('');
    setRawTranscript('');
    finalTranscriptRef.current = '';
  }, [cleanupMedia, cleanupAudio]);

  // AI enhancement function - streams enhanced text token by token
  const runEnhancement = useCallback(async (text: string): Promise<void> => {
    if (!text.trim()) {
      setState('preview');
      return;
    }

    setState('enhancing');
    setTranscript(''); // Clear to show streaming effect
    setEnhancementFailed(false); // Reset failure state

    // Set a timeout to prevent users getting stuck in enhancing state
    const ENHANCEMENT_TIMEOUT_MS = 15000; // 15 seconds
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let isCompleted = false;

    const handleTimeout = () => {
      if (!isCompleted) {
        console.warn('Enhancement timed out, using raw transcript');
        if (enhanceControllerRef.current) {
          enhanceControllerRef.current.abort();
          enhanceControllerRef.current = null;
        }
        setTranscript(text);
        setEnhancementFailed(true);
        setState('preview');
        isCompleted = true;
      }
    };

    timeoutId = setTimeout(handleTimeout, ENHANCEMENT_TIMEOUT_MS);

    try {
      const controller = await enhanceTranscript(text, {
        onToken: (token) => {
          setTranscript(prev => prev + token);
        },
        onComplete: (enhanced) => {
          if (!isCompleted) {
            if (timeoutId) clearTimeout(timeoutId);
            isCompleted = true;
            setTranscript(enhanced);
            setEnhancementFailed(false);
            setState('preview');
          }
        },
        onError: (err) => {
          if (!isCompleted) {
            if (timeoutId) clearTimeout(timeoutId);
            isCompleted = true;
            console.warn('Enhancement failed, using raw transcript:', err);
            // Fall back to raw transcript on error
            setTranscript(text);
            setEnhancementFailed(true);
            setState('preview');
          }
        },
      });
      enhanceControllerRef.current = controller;
    } catch (err) {
      if (!isCompleted) {
        if (timeoutId) clearTimeout(timeoutId);
        isCompleted = true;
        console.warn('Enhancement failed, using raw transcript:', err);
        // Fall back to raw transcript on error
        setTranscript(text);
        setEnhancementFailed(true);
        setState('preview');
      }
    }
  }, []);

  // Skip enhancement and use raw transcript
  const skipEnhancement = useCallback(() => {
    if (enhanceControllerRef.current) {
      enhanceControllerRef.current.abort();
      enhanceControllerRef.current = null;
    }
    setTranscript(rawTranscript);
    if (state === 'enhancing') {
      setState('preview');
    }
  }, [rawTranscript, state]);

  // Manually trigger enhancement
  const enhanceNow = useCallback(async () => {
    if (rawTranscript.trim()) {
      await runEnhancement(rawTranscript);
    }
  }, [rawTranscript, runEnhancement]);

  const startRecording = useCallback(async () => {
    if (!isSupported || !SpeechRecognitionAPI) {
      const msg = 'Speech recognition is not supported in this browser. Please use Chrome or Edge.';
      setError(msg);
      onError?.(msg);
      return;
    }

    // Clean up any previous recording
    cleanup();
    setError(null);

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });
      streamRef.current = stream;

      // Set up MediaRecorder for audio playback
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Set up SpeechRecognition for real-time transcription
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognitionRef.current = recognition;
      finalTranscriptRef.current = '';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscriptRef.current += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        // Update transcript with final + interim results
        setTranscript(finalTranscriptRef.current + interimTranscript);
      };

      recognition.onerror = (event) => {
        // Ignore 'no-speech' and 'aborted' errors as they're expected
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          const msg = `Speech recognition error: ${event.error}`;
          setError(msg);
          onError?.(msg);
        }
      };

      recognition.onend = () => {
        // Recognition ended - this is normal when we stop it
      };

      // Start both recording and recognition
      recordingStartTimeRef.current = Date.now();
      mediaRecorder.start(100);
      recognition.start();
      setState('recording');
    } catch (err) {
      const msg = err instanceof Error
        ? (err.name === 'NotAllowedError'
          ? 'Microphone access denied. Please allow microphone access and try again.'
          : err.message)
        : 'Failed to start recording';
      setError(msg);
      onError?.(msg);
      cleanup();
    }
  }, [isSupported, SpeechRecognitionAPI, onError, cleanup]);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || state !== 'recording') {
      return;
    }

    // Stop speech recognition first
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    return new Promise<void>((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;

      mediaRecorder.onstop = () => {
        // Create blob from chunks
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });

        // Stop media stream but keep the audio blob
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        mediaRecorderRef.current = null;
        chunksRef.current = [];

        // Check if we have audio data
        if (audioBlob.size === 0) {
          const msg = 'No audio recorded';
          setError(msg);
          onError?.(msg);
          setState('idle');
          resolve();
          return;
        }

        // Store the blob for preview
        audioBlobRef.current = audioBlob;

        // Calculate recording duration
        const recordedDuration = (Date.now() - recordingStartTimeRef.current) / 1000;
        setDuration(recordedDuration);

        // Revoke any existing Object URL to prevent memory leak
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
        }

        // Create audio element for preview with tracked Object URL
        audioUrlRef.current = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrlRef.current);
        audioElementRef.current = audio;

        audio.onloadedmetadata = () => {
          if (audio.duration && isFinite(audio.duration)) {
            setDuration(audio.duration);
          }
        };

        audio.ontimeupdate = () => {
          setCurrentTime(audio.currentTime);
        };

        audio.onended = () => {
          setIsPlaying(false);
          setCurrentTime(0);
        };

        // Store raw transcript before enhancement
        const currentTranscript = finalTranscriptRef.current.trim();
        setRawTranscript(currentTranscript);

        // Auto-enhance if enabled and we have text
        if (autoEnhance && currentTranscript) {
          runEnhancement(currentTranscript);
        } else {
          setState('preview');
        }

        resolve();
      };

      mediaRecorder.stop();
    });
  }, [state, onError, autoEnhance, runEnhancement]);

  const playPreview = useCallback(() => {
    if (audioElementRef.current && (state === 'preview' || state === 'enhancing')) {
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  }, [state]);

  const pausePreview = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const confirmTranscription = useCallback(() => {
    if (state !== 'preview' && state !== 'enhancing') {
      return;
    }
    // Abort any ongoing enhancement
    if (enhanceControllerRef.current) {
      enhanceControllerRef.current.abort();
      enhanceControllerRef.current = null;
    }
    // Transcript is already in state and editable - just cleanup and return to idle
    // The parent component will use the transcript value
    cleanupAudio();
    setState('idle');
  }, [state, cleanupAudio]);

  const cancelRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    if (enhanceControllerRef.current) {
      enhanceControllerRef.current.abort();
      enhanceControllerRef.current = null;
    }
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    cleanup();
    setState('idle');
    setError(null);
  }, [state, cleanup]);

  return {
    state,
    isSupported,
    startRecording,
    stopRecording,
    cancelRecording,
    confirmTranscription,
    playPreview,
    pausePreview,
    isPlaying,
    duration,
    currentTime,
    transcript,
    setTranscript,
    rawTranscript,
    enhancementAvailable,
    enhanceNow,
    skipEnhancement,
    error,
    enhancementFailed,
  };
}


```

## src/hooks/useTouchGestures.ts

```typescript
/**
 * useTouchGestures hook
 * Provides Apple-style touch gesture detection for mobile interactions
 * Supports long-press, swipe detection, and haptic feedback
 */

import { useCallback, useRef, useState } from 'react';
import { triggerHaptic } from '../lib/utils';

interface TouchGestureOptions {
  /** Duration in ms to trigger long press (default: 500) */
  longPressDelay?: number;
  /** Minimum swipe distance in px (default: 50) */
  swipeThreshold?: number;
  /** Enable haptic feedback (default: true) */
  hapticFeedback?: boolean;
  /** Callback when long press starts */
  onLongPressStart?: () => void;
  /** Callback when long press ends */
  onLongPressEnd?: () => void;
  /** Callback for swipe left */
  onSwipeLeft?: () => void;
  /** Callback for swipe right */
  onSwipeRight?: () => void;
}

interface TouchGestureResult {
  /** Whether currently in long press state */
  isLongPressing: boolean;
  /** Touch event handlers to spread on the element */
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
    onTouchCancel: () => void;
  };
}

export function useTouchGestures({
  longPressDelay = 500,
  swipeThreshold = 50,
  hapticFeedback = true,
  onLongPressStart,
  onLongPressEnd,
  onSwipeLeft,
  onSwipeRight,
}: TouchGestureOptions = {}): TouchGestureResult {
  const [isLongPressing, setIsLongPressing] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const hasMovedRef = useRef(false);

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (isLongPressing) {
      setIsLongPressing(false);
      onLongPressEnd?.();
    }
  }, [isLongPressing, onLongPressEnd]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    hasMovedRef.current = false;

    // Start long press timer
    longPressTimer.current = setTimeout(() => {
      if (!hasMovedRef.current) {
        setIsLongPressing(true);
        if (hapticFeedback) {
          triggerHaptic('medium');
        }
        onLongPressStart?.();
      }
    }, longPressDelay);
  }, [longPressDelay, hapticFeedback, onLongPressStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartPos.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartPos.current.x;
    const deltaY = touch.clientY - touchStartPos.current.y;

    // If moved more than 10px, cancel long press
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      hasMovedRef.current = true;
      cancelLongPress();
    }
  }, [cancelLongPress]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    cancelLongPress();

    if (!touchStartPos.current || hasMovedRef.current) {
      touchStartPos.current = null;
      return;
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartPos.current.x;
    const deltaY = touch.clientY - touchStartPos.current.y;

    // Detect horizontal swipe (must be more horizontal than vertical)
    if (Math.abs(deltaX) > swipeThreshold && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX < 0 && onSwipeLeft) {
        if (hapticFeedback) triggerHaptic('light');
        onSwipeLeft();
      } else if (deltaX > 0 && onSwipeRight) {
        if (hapticFeedback) triggerHaptic('light');
        onSwipeRight();
      }
    }

    touchStartPos.current = null;
  }, [cancelLongPress, swipeThreshold, hapticFeedback, onSwipeLeft, onSwipeRight]);

  const handleTouchCancel = useCallback(() => {
    cancelLongPress();
    touchStartPos.current = null;
    hasMovedRef.current = false;
  }, [cancelLongPress]);

  return {
    isLongPressing,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchCancel,
    },
  };
}


```

## src/lib/api.ts

```typescript
/**
 * API client wrapper for AuroraNotes backend
 * Optimized for the AuroraNotes API specification with:
 * - Firebase Auth token injection via Authorization header
 * - Rate limit header parsing
 * - X-Request-Id capture for debugging
 * - Client-side validation
 * - Exponential backoff with retry
 *
 * Backend derives tenantId from the authenticated user's Firebase UID.
 */

import type {
  RawNote,
  HealthResponse,
  ApiError,
  NotesListResponse,
  ChatResponse,
  RateLimitInfo,
  StreamSource,
  StreamEvent,
  ChatMeta,
  FeedbackRating,
  FeedbackResponse,
  TranscriptionResponse,
} from './types';
import { API, NOTES, CHAT } from './constants';

// ============================================
// Configuration
// ============================================

/** Token getter function - set via setTokenGetter() */
type TokenGetter = () => Promise<string | null>;
let tokenGetter: TokenGetter | null = null;

function getApiBase(): string {
  return (import.meta.env.VITE_API_BASE as string) || '';
}

/**
 * Set the token getter function for authentication
 * This should be called once at app initialization with the auth provider's getToken function
 */
export function setTokenGetter(getter: TokenGetter): void {
  tokenGetter = getter;
}

/**
 * Get authorization headers with Bearer token
 * Returns headers with Content-Type and Authorization (if token available)
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (tokenGetter) {
    try {
      const token = await tokenGetter();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        console.warn('[API] tokenGetter returned null - user may not be authenticated');
      }
    } catch (err) {
      console.error('[API] Failed to get auth token:', err);
      // Continue without token - API will return 401 if auth is required
    }
  } else {
    console.warn('[API] No tokenGetter set - API calls will be unauthenticated');
  }

  return headers;
}

// ============================================
// Validation Helpers
// ============================================

/**
 * Validate note text before sending to API
 */
export function validateNoteText(text: string): { valid: boolean; error?: string } {
  const trimmed = text.trim();
  if (!trimmed) {
    return { valid: false, error: 'Note text is required' };
  }
  if (trimmed.length > NOTES.MAX_LENGTH) {
    return { valid: false, error: `Note text too long (max ${NOTES.MAX_LENGTH} characters)` };
  }
  return { valid: true };
}

/**
 * Validate chat message before sending to API
 */
export function validateChatMessage(message: string): { valid: boolean; error?: string } {
  const trimmed = message.trim();
  if (!trimmed) {
    return { valid: false, error: 'Message is required' };
  }
  if (trimmed.length > CHAT.MAX_MESSAGE_LENGTH) {
    return { valid: false, error: `Message too long (max ${CHAT.MAX_MESSAGE_LENGTH} characters)` };
  }
  return { valid: true };
}

// ============================================
// Error Handling
// ============================================

/**
 * Extract error message and code from API error response
 * Handles both string and object formats from backend
 */
function extractErrorInfo(
  body: ApiError | null,
  fallbackMessage: string
): { message: string; code?: string } {
  if (!body?.error) {
    return { message: fallbackMessage };
  }

  if (typeof body.error === 'string') {
    return { message: body.error, code: body.code };
  }

  if (typeof body.error === 'object' && body.error.message) {
    return {
      message: body.error.message,
      code: body.code || body.error.code,
    };
  }

  return { message: fallbackMessage, code: body.code };
}

/**
 * Custom error class for API errors with enhanced metadata
 */
export class ApiRequestError extends Error {
  status?: number;
  code?: string;
  retryAfterSeconds?: number;
  requestId?: string;

  constructor(
    message: string,
    status?: number,
    code?: string,
    retryAfterSeconds?: number,
    requestId?: string
  ) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
    this.requestId = requestId;
  }

  /**
   * Get user-friendly error message based on status code
   */
  getUserMessage(): string {
    switch (this.status) {
      case 400:
        return this.message || 'Invalid request. Please check your input.';
      case 401:
      case 403:
        return 'Authentication error. Please check your API key configuration.';
      case 429:
        return `Too many requests. Please wait ${this.retryAfterSeconds || 30} seconds.`;
      case 503:
        return 'Service temporarily unavailable. Please try again later.';
      case 500:
      default:
        if (this.status && this.status >= 500) {
          return 'The server is experiencing issues. Please try again in a few moments.';
        }
        return this.message || 'An unexpected error occurred.';
    }
  }
}

// ============================================
// Rate Limit Handling
// ============================================

/** Last known rate limit info from API */
let lastRateLimitInfo: RateLimitInfo | null = null;

/**
 * Get the last known rate limit info
 */
export function getRateLimitInfo(): RateLimitInfo | null {
  return lastRateLimitInfo;
}

/**
 * Parse rate limit headers from response
 */
function parseRateLimitHeaders(res: Response): RateLimitInfo | null {
  const limit = res.headers.get('X-RateLimit-Limit');
  const remaining = res.headers.get('X-RateLimit-Remaining');
  const reset = res.headers.get('X-RateLimit-Reset');

  if (limit && remaining && reset) {
    return {
      limit: parseInt(limit, 10),
      remaining: parseInt(remaining, 10),
      resetSeconds: parseInt(reset, 10),
    };
  }
  return null;
}

/**
 * Get X-Request-Id from response for debugging
 */
function getRequestId(res: Response): string | null {
  return res.headers.get('X-Request-Id');
}

// ============================================
// Request Helpers
// ============================================

/**
 * Safe JSON parsing
 */
async function safeJson<T>(res: Response): Promise<T | null> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Make a single API request attempt
 */
async function singleRequest<T>(
  path: string,
  options: RequestInit,
  timeout: number,
  apiBase: string
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(`${apiBase}${path}`, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Parse and store rate limit info
    const rateLimitInfo = parseRateLimitHeaders(res);
    if (rateLimitInfo) {
      lastRateLimitInfo = rateLimitInfo;
    }

    // Get request ID for debugging
    const requestId = getRequestId(res);

    if (!res.ok) {
      const body = await safeJson<ApiError>(res);
      const { message, code } = extractErrorInfo(body, `Request failed: ${res.status}`);

      // For 429, get retryAfter from body (in seconds per API spec)
      const retryAfterSeconds = body?.retryAfter ?? (res.status === 429 ? 30 : undefined);

      const error = new ApiRequestError(
        message,
        res.status,
        code,
        retryAfterSeconds,
        requestId ?? undefined
      );

      // Log error with request ID for debugging
      if (requestId) {
        console.error(`API Error [${requestId}]:`, body);
      }

      throw error;
    }

    return await res.json();
  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof ApiRequestError) {
      throw err;
    }

    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new ApiRequestError('Request timed out', 0, 'TIMEOUT');
      }
      throw new ApiRequestError(err.message, 0, 'NETWORK_ERROR');
    }

    throw new ApiRequestError('An unexpected error occurred');
  }
}

/**
 * Check if an error is retryable
 */
function isRetryable(error: ApiRequestError): boolean {
  // Retry on network errors, timeouts, and 5xx server errors
  if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT') {
    return true;
  }
  if (error.status && error.status >= 500 && error.status < 600) {
    return true;
  }
  // 429 is retryable (we have retryAfterSeconds from API)
  if (error.status === 429) {
    return true;
  }
  return false;
}

/**
 * Get retry delay for an error (in milliseconds)
 */
function getRetryDelay(error: ApiRequestError, attempt: number): number {
  // If 429 with retryAfterSeconds, convert to ms (capped at 30s for sanity)
  if (error.status === 429 && error.retryAfterSeconds) {
    return Math.min(error.retryAfterSeconds * 1000, API.RETRY.MAX_DELAY);
  }
  // Otherwise exponential backoff: 300ms, 600ms, 1200ms...
  return API.RETRY.BASE_DELAY * Math.pow(2, attempt);
}

/**
 * Make API request with timeout, error handling, and retry for transient failures
 */
async function request<T>(
  path: string,
  options: RequestInit = {},
  timeout: number = API.TIMEOUTS.DEFAULT,
  maxRetries: number = API.RETRY.MAX_RETRIES
): Promise<T> {
  const apiBase = getApiBase();

  if (!apiBase) {
    throw new ApiRequestError(
      'Missing VITE_API_BASE. Add it to .env.local and restart the dev server.',
      0,
      'MISSING_CONFIG'
    );
  }

  let lastError: ApiRequestError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await singleRequest<T>(path, options, timeout, apiBase);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        lastError = err;

        // Only retry if it's a retryable error and we have retries left
        if (attempt < maxRetries && isRetryable(err)) {
          // Wait before retrying (uses retryAfterMs for 429 or exponential backoff)
          const delay = getRetryDelay(err, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      throw err;
    }
  }

  // Should not reach here, but just in case
  throw lastError || new ApiRequestError('Request failed after retries');
}

// ============================================
// API Endpoints
// ============================================

/**
 * Check API health
 * Typical latency: <50ms
 */
export async function getHealth(): Promise<HealthResponse> {
  try {
    const response = await request<HealthResponse>(API.ENDPOINTS.HEALTH, {}, API.TIMEOUTS.HEALTH);
    // Backend returns status: 'healthy' on success
    if (response.status === 'healthy') {
      return response;
    }
    return { ...response, status: 'unhealthy' };
  } catch {
    return { status: 'unhealthy' };
  }
}

/**
 * List notes with pagination
 * Typical latency: 100-300ms
 * Backend derives tenantId from authenticated user
 *
 * @param cursor - Base64 pagination cursor from previous response
 * @param limit - Results per page (1-100, default 50)
 */
export async function listNotes(
  cursor?: string,
  limit = 50,
  signal?: AbortSignal
): Promise<NotesListResponse> {
  const params = new URLSearchParams();
  params.set('limit', String(Math.min(Math.max(1, limit), 100))); // Clamp 1-100
  if (cursor) params.set('cursor', cursor);

  const path = `${API.ENDPOINTS.NOTES}?${params.toString()}`;
  const headers = await getAuthHeaders();

  return await request<NotesListResponse>(path, { headers, signal });
}

/**
 * Create a new note
 * Typical latency: 200-500ms (includes async chunking for RAG)
 * Backend derives tenantId from authenticated user
 *
 * @param text - Note content (required, max 5000 chars)
 * @throws {ApiRequestError} If validation fails or server error
 */
export async function createNote(text: string): Promise<RawNote> {
  // Client-side validation
  const validation = validateNoteText(text);
  if (!validation.valid) {
    throw new ApiRequestError(validation.error!, 400, 'VALIDATION_ERROR');
  }

  const headers = await getAuthHeaders();

  return await request<RawNote>(API.ENDPOINTS.NOTES, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      text: text.trim(),
    }),
  });
}

/**
 * Update an existing note
 * Backend derives tenantId from authenticated user
 *
 * @param id - Note ID
 * @param text - New note content (required, max 5000 chars)
 * @throws {ApiRequestError} If validation fails or server error
 */
export async function updateNote(id: string, text: string): Promise<RawNote> {
  // Client-side validation
  const validation = validateNoteText(text);
  if (!validation.valid) {
    throw new ApiRequestError(validation.error!, 400, 'VALIDATION_ERROR');
  }

  const headers = await getAuthHeaders();

  return await request<RawNote>(`${API.ENDPOINTS.NOTES}/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ text: text.trim() }),
  });
}

/** Response from delete note endpoint */
export interface DeleteNoteResponse {
  success: boolean;
  id: string;
  deletedAt: string;
  chunksDeleted: number;
}

/**
 * Delete a note
 * Backend derives tenantId from authenticated user
 *
 * @param id - Note ID to delete
 */
export async function deleteNote(id: string): Promise<DeleteNoteResponse> {
  const headers = await getAuthHeaders();

  return await request<DeleteNoteResponse>(`${API.ENDPOINTS.NOTES}/${id}`, {
    method: 'DELETE',
    headers,
  });
}

/**
 * Send a chat message and get RAG-powered response with sources
 * Typical latency: 1000-3500ms (RAG pipeline + LLM generation)
 * Backend derives tenantId from authenticated user
 *
 * @param message - Question to ask (required, max 2000 chars)
 * @throws {ApiRequestError} If validation fails, rate limited, or server error
 */
export async function sendChatMessage(message: string): Promise<ChatResponse> {
  // Client-side validation
  const validation = validateChatMessage(message);
  if (!validation.valid) {
    throw new ApiRequestError(validation.error!, 400, 'VALIDATION_ERROR');
  }

  const headers = await getAuthHeaders();

  const response = await request<ChatResponse>(
    API.ENDPOINTS.CHAT,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: message.trim(),
      }),
    },
    API.TIMEOUTS.CHAT
  );

  // Backward compatibility: convert legacy citations to sources
  if (!response.sources && response.citations) {
    response.sources = response.citations.map((c, idx) => ({
      id: String(idx + 1),
      noteId: c.noteId,
      preview: c.snippet,
      date: formatDateForSource(c.createdAt),
      relevance: c.score,
    }));
    // Also update answer to use new citation format [1] instead of [N1]
    response.answer = response.answer.replace(/\[N(\d+)\]/g, '[$1]');
  }

  return response;
}

/**
 * Format date string for source display
 */
function formatDateForSource(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

// ============================================
// SSE Stream Processing (Shared)
// ============================================

/**
 * Generic SSE event handler callback type
 */
interface SSEEventHandlers {
  onSources?: (sources: StreamSource[]) => void;
  onToken?: (token: string) => void;
  onDone?: (meta: ChatMeta) => void;
  onError?: (error: string) => void;
}

/**
 * Process an SSE stream from the API
 * Shared utility for chat streaming and transcript enhancement
 */
async function processSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  handlers: SSEEventHandlers
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim() || !line.startsWith('data: ')) continue;

        try {
          const event: StreamEvent = JSON.parse(line.slice(6));

          switch (event.type) {
            case 'sources':
              handlers.onSources?.(event.sources || []);
              break;
            case 'token':
              handlers.onToken?.(event.content || '');
              break;
            case 'done':
              handlers.onDone?.(event.meta!);
              break;
            case 'error':
              handlers.onError?.(event.error || 'Stream error');
              break;
          }
        } catch {
          // Skip malformed JSON lines
        }
      }
    }
  } catch (err) {
    if (err instanceof Error && err.name !== 'AbortError') {
      handlers.onError?.(err.message);
    }
  }
}

// ============================================
// Streaming Chat
// ============================================

export interface StreamCallbacks {
  onSources?: (sources: StreamSource[]) => void;
  onToken?: (token: string) => void;
  onDone?: (meta: ChatMeta) => void;
  onError?: (error: string) => void;
}

/**
 * Send a chat message with streaming response (SSE)
 * Delivers sources immediately, then streams tokens
 * Backend derives tenantId from authenticated user
 *
 * @param message - Question to ask (required, max 2000 chars)
 * @param callbacks - Event handlers for stream events
 * @returns AbortController to cancel the stream
 */
export async function sendChatMessageStreaming(
  message: string,
  callbacks: StreamCallbacks
): Promise<AbortController> {
  const apiBase = getApiBase();

  if (!apiBase) {
    throw new ApiRequestError(
      'Missing VITE_API_BASE. Add it to .env.local and restart the dev server.',
      0,
      'MISSING_CONFIG'
    );
  }

  // Client-side validation
  const validation = validateChatMessage(message);
  if (!validation.valid) {
    throw new ApiRequestError(validation.error!, 400, 'VALIDATION_ERROR');
  }

  const controller = new AbortController();
  const headers = await getAuthHeaders();

  try {
    const response = await fetch(`${apiBase}${API.ENDPOINTS.CHAT}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        message: message.trim(),
        stream: true,
      }),
      signal: controller.signal,
    });

    // Handle error responses
    if (!response.ok) {
      const body = await safeJson<ApiError>(response);
      const { message, code } = extractErrorInfo(body, `Request failed: ${response.status}`);
      const retryAfterSeconds = body?.retryAfter ?? body?.retryAfterMs ? Math.ceil((body?.retryAfterMs || 0) / 1000) : undefined;

      throw new ApiRequestError(
        message,
        response.status,
        code,
        retryAfterSeconds,
        getRequestId(response) ?? undefined
      );
    }

    // Process SSE stream
    const reader = response.body?.getReader();
    if (!reader) {
      throw new ApiRequestError('Response body not available', 0, 'STREAM_ERROR');
    }

    // Process stream in background using shared helper
    processSSEStream(reader, callbacks);

    return controller;
  } catch (err) {
    if (err instanceof ApiRequestError) {
      throw err;
    }
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new ApiRequestError('Stream aborted', 0, 'ABORTED');
      }
      throw new ApiRequestError(err.message, 0, 'NETWORK_ERROR');
    }
    throw new ApiRequestError('An unexpected error occurred');
  }
}

// ============================================
// Feedback
// ============================================

/**
 * Submit feedback for a chat response
 * Backend derives tenantId from authenticated user
 *
 * @param requestId - The requestId from chat response meta
 * @param rating - 'up' or 'down'
 * @param comment - Optional feedback comment (max 1000 chars)
 */
export async function submitFeedback(
  requestId: string,
  rating: FeedbackRating,
  comment?: string
): Promise<FeedbackResponse> {
  if (!requestId) {
    throw new ApiRequestError('requestId is required', 400, 'VALIDATION_ERROR');
  }

  if (comment && comment.length > 1000) {
    throw new ApiRequestError('Comment too long (max 1000 characters)', 400, 'VALIDATION_ERROR');
  }

  const headers = await getAuthHeaders();

  return await request<FeedbackResponse>(
    API.ENDPOINTS.FEEDBACK,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        requestId,
        rating,
        comment: comment?.trim(),
      }),
    }
  );
}

// ============================================
// Transcription
// ============================================

/**
 * Transcribe audio to text using the backend transcription service
 * Typical latency: 1-5 seconds depending on audio length
 *
 * @param audioBlob - Audio data as a Blob
 * @returns Transcription result with text and metadata
 * @throws {ApiRequestError} If transcription fails
 */
export async function transcribeAudio(audioBlob: Blob): Promise<TranscriptionResponse> {
  const apiBase = getApiBase();

  if (!apiBase) {
    throw new ApiRequestError(
      'Missing VITE_API_BASE. Add it to .env.local and restart the dev server.',
      0,
      'MISSING_CONFIG'
    );
  }

  // Get auth token
  let authToken: string | null = null;
  if (tokenGetter) {
    try {
      authToken = await tokenGetter();
    } catch (err) {
      console.error('Failed to get auth token:', err);
    }
  }

  // Build form data
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API.TIMEOUTS.TRANSCRIBE);

  try {
    const headers: Record<string, string> = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const res = await fetch(`${apiBase}${API.ENDPOINTS.TRANSCRIBE}`, {
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const body = await safeJson<ApiError>(res);
      const { message, code } = extractErrorInfo(body, `Transcription failed: ${res.status}`);
      throw new ApiRequestError(message, res.status, code);
    }

    return await res.json();
  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof ApiRequestError) {
      throw err;
    }

    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new ApiRequestError('Transcription timed out', 0, 'TIMEOUT');
      }
      throw new ApiRequestError(err.message, 0, 'NETWORK_ERROR');
    }

    throw new ApiRequestError('Transcription failed');
  }
}

// ============================================
// Transcript Enhancement
// ============================================

/** Callbacks for streaming transcript enhancement */
export interface EnhanceTranscriptCallbacks {
  onToken?: (token: string) => void;
  onComplete?: (enhancedText: string) => void;
  onError?: (error: string) => void;
}

/**
 * Enhance a voice transcript using AI
 * Cleans up grammar, removes filler words, adds punctuation
 * Uses streaming for real-time feedback
 *
 * @param rawTranscript - The raw transcript from speech recognition
 * @param callbacks - Event handlers for streaming tokens
 * @returns AbortController to cancel the enhancement
 */
export async function enhanceTranscript(
  rawTranscript: string,
  callbacks: EnhanceTranscriptCallbacks
): Promise<AbortController> {
  const apiBase = getApiBase();

  if (!apiBase) {
    throw new ApiRequestError(
      'Missing VITE_API_BASE. Add it to .env.local and restart the dev server.',
      0,
      'MISSING_CONFIG'
    );
  }

  const trimmed = rawTranscript.trim();
  if (!trimmed) {
    callbacks.onError?.('No transcript to enhance');
    return new AbortController();
  }

  // Create a special prompt for transcript enhancement
  const enhancePrompt = `You are a transcript editor. Clean up this voice transcript by:
1. Fixing grammar and punctuation
2. Removing filler words (um, uh, like, you know, so, basically, actually)
3. Correcting obvious speech-to-text errors based on context
4. Keeping the original meaning and intent intact
5. Making it read naturally as written text

IMPORTANT:
- Output ONLY the cleaned transcript, nothing else
- Do NOT add explanations, headers, or commentary
- Do NOT change the meaning or add new information
- Keep it concise

Transcript to clean:
"""
${trimmed}
"""`;

  const controller = new AbortController();
  const headers = await getAuthHeaders();

  try {
    const response = await fetch(`${apiBase}${API.ENDPOINTS.CHAT}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        message: enhancePrompt,
        stream: true,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await safeJson<ApiError>(response);
      const { message, code } = extractErrorInfo(body, `Enhancement failed: ${response.status}`);
      throw new ApiRequestError(message, response.status, code);
    }

    // Process SSE stream
    const reader = response.body?.getReader();
    if (!reader) {
      throw new ApiRequestError('No response body', 0, 'STREAM_ERROR');
    }

    // Accumulate text for onComplete callback
    let fullText = '';
    processSSEStream(reader, {
      onToken: (token) => {
        fullText += token;
        callbacks.onToken?.(token);
      },
      onDone: () => callbacks.onComplete?.(fullText.trim()),
      onError: (error) => callbacks.onError?.(error),
      // onSources is ignored for enhancement
    });

    return controller;
  } catch (err) {
    if (err instanceof ApiRequestError) {
      throw err;
    }
    if (err instanceof Error) {
      throw new ApiRequestError(err.message, 0, 'NETWORK_ERROR');
    }
    throw new ApiRequestError('Enhancement failed');
  }
}

```

## src/lib/citations.ts

```typescript
/**
 * Citation/Source parsing and handling utilities
 * Parses [1], [2] citation tokens from RAG responses and maps to source objects
 */

import type { Source, ConfidenceLevel } from './types';

/** Regex pattern to match citation tokens like [1], [2], etc. */
const SOURCE_PATTERN = /\[(\d+)\]/g;

/** Represents a segment of parsed text - either plain text or a source reference */
export interface TextSegment {
  type: 'text' | 'source';
  content: string;
  source?: Source;
}

/**
 * Parse answer text and identify source tokens [1], [2], etc.
 * Returns an array of segments for rendering
 */
export function parseSources(
  text: string,
  sources: Source[] | undefined
): TextSegment[] {
  if (!text) return [];
  if (!sources || sources.length === 0) {
    return [{ type: 'text', content: text }];
  }

  // Build a lookup map for faster access
  const sourceMap = new Map<string, Source>();
  for (const s of sources) {
    sourceMap.set(s.id, s);
  }

  const segments: TextSegment[] = [];
  let lastIndex = 0;

  // Find all source matches
  const matches = text.matchAll(SOURCE_PATTERN);

  for (const match of matches) {
    const fullMatch = match[0]; // e.g., "[1]"
    const id = match[1]; // e.g., "1"
    const matchIndex = match.index!;

    // Add text before this source
    if (matchIndex > lastIndex) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex, matchIndex),
      });
    }

    // Add source segment
    const source = sourceMap.get(id);
    if (source) {
      segments.push({
        type: 'source',
        content: fullMatch,
        source,
      });
    } else {
      // Source not found in list - render as plain text
      segments.push({
        type: 'text',
        content: fullMatch,
      });
    }

    lastIndex = matchIndex + fullMatch.length;
  }

  // Add remaining text after last source
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(lastIndex),
    });
  }

  return segments;
}

/**
 * Get unique sources referenced in the text
 * Useful for building a summary list of sources
 */
export function getReferencedSources(
  text: string,
  sources: Source[] | undefined
): Source[] {
  if (!text || !sources || sources.length === 0) return [];

  const sourceMap = new Map<string, Source>();
  for (const s of sources) {
    sourceMap.set(s.id, s);
  }

  const referenced: Source[] = [];
  const seen = new Set<string>();

  const matches = text.matchAll(SOURCE_PATTERN);
  for (const match of matches) {
    const id = match[1];
    if (!seen.has(id)) {
      seen.add(id);
      const source = sourceMap.get(id);
      if (source) {
        referenced.push(source);
      }
    }
  }

  return referenced;
}



/**
 * Format source preview for display (truncate if needed)
 */
export function formatPreview(preview: string, maxLength = 120): string {
  if (!preview) return '';
  if (preview.length <= maxLength) return preview;
  return preview.slice(0, maxLength).trim() + '…';
}

/**
 * Calculate confidence level from relevance score
 */
export function getConfidenceFromRelevance(relevance: number): ConfidenceLevel {
  if (relevance >= 0.7) return 'high';
  if (relevance >= 0.4) return 'medium';
  if (relevance > 0) return 'low';
  return 'none';
}

```

## src/lib/constants.ts

```typescript
/**
 * Application constants and configuration
 * Centralized location for magic numbers and strings
 */

// ===========================================
// API Configuration
// ===========================================

export const API = {
  ENDPOINTS: {
    HEALTH: '/health',
    NOTES: '/notes',
    CHAT: '/chat',
    FEEDBACK: '/feedback',
    TRANSCRIBE: '/transcribe',
  },
  TIMEOUTS: {
    DEFAULT: 10000,      // 10 seconds
    HEALTH: 5000,        // 5 seconds
    CHAT: 30000,         // 30 seconds for AI responses
    STREAM: 60000,       // 60 seconds for streaming responses
    TRANSCRIBE: 30000,   // 30 seconds for audio transcription
  },
  RETRY: {
    MAX_RETRIES: 1,
    BASE_DELAY: 300,     // ms
    MAX_DELAY: 30000,    // 30 seconds max for rate limit retry
  },
} as const;

// ===========================================
// Notes Configuration  
// ===========================================

export const NOTES = {
  MAX_LENGTH: 5000,
  PAGE_SIZE: 50,
  SEARCH_DEBOUNCE_MS: 300,
  HIGHLIGHT_DURATION_MS: 2500,
  MAX_SEARCH_PAGES: 10,
} as const;

// ===========================================
// Chat Configuration
// ===========================================

export const CHAT = {
  MAX_MESSAGE_LENGTH: 2000,
  MAX_HISTORY_MESSAGES: 100,
} as const;

// ===========================================
// UI Configuration
// ===========================================

export const UI = {
  TOAST_DURATION_MS: 3000,
} as const;

// ===========================================
// Storage Keys
// ===========================================

export const STORAGE_KEYS = {
  CHAT_HISTORY: 'aurora-chat-history',
} as const;


```

## src/lib/firebase.ts

```typescript
/**
 * Firebase Configuration and Initialization
 * Loads config from VITE_FIREBASE_* environment variables
 * Supports Auth Emulator for local development
 */

import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  type Auth,
  type ConfirmationResult,
  type User,
} from 'firebase/auth';

// Check if we should use the Firebase Auth Emulator
const USE_AUTH_EMULATOR = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';
const AUTH_EMULATOR_URL = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL || 'http://127.0.0.1:9099';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
};

// Validate required config
function validateConfig(): boolean {
  const required = ['apiKey', 'authDomain', 'projectId', 'appId'];
  return required.every(key => !!firebaseConfig[key as keyof typeof firebaseConfig]);
}

// Initialize Firebase app (lazy singleton)
let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    if (!validateConfig()) {
      throw new Error(
        'Firebase configuration is incomplete. ' +
        'Please set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, ' +
        'VITE_FIREBASE_PROJECT_ID, and VITE_FIREBASE_APP_ID in your .env file.'
      );
    }
    app = initializeApp(firebaseConfig);
  }
  return app;
}

// Track if emulator has been connected
let emulatorConnected = false;

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());

    // Connect to Auth Emulator in development
    if (USE_AUTH_EMULATOR && !emulatorConnected) {
      try {
        connectAuthEmulator(auth, AUTH_EMULATOR_URL, { disableWarnings: true });
        emulatorConnected = true;
        // eslint-disable-next-line no-console
        console.log('🔧 Connected to Firebase Auth Emulator at', AUTH_EMULATOR_URL);
      } catch (e) {
        console.warn('Failed to connect to Auth Emulator:', e);
      }
    }
  }
  return auth;
}

// Google Auth Provider (singleton)
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

/**
 * Sign in with Google popup
 */
export async function signInWithGoogle(): Promise<User> {
  const auth = getFirebaseAuth();
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

// Store confirmation result for phone auth verification
let phoneConfirmationResult: ConfirmationResult | null = null;

// Store recaptcha verifier
let recaptchaVerifier: RecaptchaVerifier | null = null;

/**
 * Initialize invisible reCAPTCHA attached to a button
 * The reCAPTCHA will be solved automatically when the button is clicked
 * @param buttonId The ID of the submit button to attach reCAPTCHA to
 */
export function initRecaptcha(buttonId: string): RecaptchaVerifier {
  const auth = getFirebaseAuth();

  // Clear existing verifier
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch {
      // Ignore errors when clearing
    }
    recaptchaVerifier = null;
  }

  recaptchaVerifier = new RecaptchaVerifier(auth, buttonId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved - form will be submitted
    },
    'expired-callback': () => {
      // reCAPTCHA expired - reset
      console.warn('reCAPTCHA expired, please try again');
      if (recaptchaVerifier) {
        recaptchaVerifier.render();
      }
    },
  });

  return recaptchaVerifier;
}

/**
 * Clear the reCAPTCHA verifier (call when unmounting)
 */
export function clearRecaptcha(): void {
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch {
      // Ignore errors when clearing
    }
    recaptchaVerifier = null;
  }
}

/**
 * Start phone sign-in flow
 * @param phoneNumber Phone number in E.164 format (e.g., +14155551234)
 * @param buttonId The ID of the button to attach reCAPTCHA to
 */
export async function startPhoneSignIn(phoneNumber: string, buttonId: string): Promise<void> {
  const auth = getFirebaseAuth();

  // Initialize reCAPTCHA on the button if not already done (skip for emulator)
  if (!recaptchaVerifier && !USE_AUTH_EMULATOR) {
    initRecaptcha(buttonId);
  }

  try {
    // For emulator, we need a mock verifier
    if (USE_AUTH_EMULATOR) {
      // Create a simple mock ApplicationVerifier for the emulator
      const mockVerifier = {
        type: 'recaptcha' as const,
        verify: () => Promise.resolve('mock-recaptcha-token'),
      };
      phoneConfirmationResult = await signInWithPhoneNumber(auth, phoneNumber, mockVerifier);
    } else {
      phoneConfirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier!);
    }
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };

    // Provide user-friendly error messages
    if (firebaseError.code === 'auth/invalid-phone-number') {
      throw new Error('Invalid phone number format. Please enter a valid US phone number.');
    } else if (firebaseError.code === 'auth/too-many-requests') {
      throw new Error('Too many attempts. Please wait a few minutes and try again.');
    } else if (firebaseError.code === 'auth/captcha-check-failed') {
      throw new Error('reCAPTCHA verification failed. Please try again.');
    } else if (firebaseError.code === 'auth/quota-exceeded') {
      throw new Error('SMS quota exceeded. Please try again later or use Google sign-in.');
    } else if (firebaseError.message?.includes('400')) {
      // This is the error we're seeing - provide helpful guidance
      throw new Error(
        'Phone authentication is not configured. Please ensure:\n' +
        '1. Phone auth is enabled in Firebase Console → Authentication → Sign-in method\n' +
        '2. localhost is in authorized domains\n' +
        'Or use Google sign-in instead.'
      );
    }
    throw error;
  }
}

/**
 * Verify phone code to complete sign-in
 * @param code The 6-digit verification code from SMS
 */
export async function verifyPhoneCode(code: string): Promise<User> {
  if (!phoneConfirmationResult) {
    throw new Error('No pending phone verification. Call startPhoneSignIn() first.');
  }
  
  const result = await phoneConfirmationResult.confirm(code);
  phoneConfirmationResult = null;
  return result.user;
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  const auth = getFirebaseAuth();
  await auth.signOut();
}

/**
 * Get current ID token for API calls
 * @param forceRefresh Force refresh the token even if not expired
 */
export async function getIdToken(forceRefresh = false): Promise<string | null> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  
  if (!user) {
    return null;
  }
  
  return user.getIdToken(forceRefresh);
}

// Export types for convenience
export type { User, Auth, ConfirmationResult };


```

## src/lib/format.ts

```typescript
/**
 * Formatting utilities for timestamps and notes
 */

import type { RawTimestamp, RawNote, Note } from './types';

/**
 * Convert raw timestamp value to Date object
 */
export function toDate(value: RawTimestamp): Date | null {
  if (!value) return null;
  
  if (typeof value === 'string') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  
  if (typeof value === 'object' && '_seconds' in value) {
    return new Date(value._seconds * 1000);
  }
  
  return null;
}

/**
 * Format a date as relative time (e.g., "Just now", "5m", "2h", "3d")
 */
export function formatRelativeTime(d: Date | null): string {
  if (!d) return '';
  
  try {
    const now = Date.now();
    const diffMs = now - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m`;
    
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h`;
    
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d`;
    
    // For older, show short date
    return d.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric' 
    });
  } catch {
    return '';
  }
}

/**
 * Format a date as full timestamp for tooltips
 */
export function formatFullTimestamp(d: Date | null): string {
  if (!d) return 'Unknown time';
  
  try {
    return d.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return 'Unknown time';
  }
}

/**
 * Normalize a raw note from API to consistent format
 */
export function normalizeNote(raw: RawNote): Note {
  return {
    id: raw.id || `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: raw.title,
    text: raw.text || '',
    tenantId: raw.tenantId || 'public',
    processingStatus: raw.processingStatus,
    tags: raw.tags,
    metadata: raw.metadata,
    createdAt: toDate(raw.createdAt),
    updatedAt: toDate(raw.updatedAt),
  };
}



/**
 * Get short ID for display (first 8 chars)
 */
export function shortId(id: string): string {
  if (!id || id.startsWith('temp-')) return '';
  return id.slice(0, 8);
}

/**
 * Get date group label for a date (Today, Yesterday, This Week, etc)
 * Used internally for grouping notes in Apple Notes style
 */
function getDateGroup(d: Date | null): string {
  if (!d) return 'Unknown';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const noteDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (noteDate.getTime() === today.getTime()) {
    return 'Today';
  }
  if (noteDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  }
  if (noteDate >= lastWeek) {
    return 'This Week';
  }
  if (noteDate >= lastMonth) {
    return 'This Month';
  }

  // For older dates, show month and year
  return d.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Group notes by date category
 */
export function groupNotesByDate<T extends { createdAt: Date | null }>(
  notes: T[]
): { group: string; notes: T[] }[] {
  const groups = new Map<string, T[]>();

  for (const note of notes) {
    const group = getDateGroup(note.createdAt);
    if (!groups.has(group)) {
      groups.set(group, []);
    }
    groups.get(group)!.push(note);
  }

  // Convert to array, maintaining insertion order (most recent first)
  return Array.from(groups.entries()).map(([group, notes]) => ({ group, notes }));
}


```

## src/lib/noteClassifier.ts

```typescript
/**
 * Note Classifier - AI-powered note type detection and auto-tagging
 * 
 * Classifies notes into types and suggests relevant tags based on content analysis.
 * Uses pattern matching and keyword analysis for fast, local classification.
 */

/** Note types that can be detected */
export type NoteType = 
  | 'meeting'      // Meeting notes, agendas, minutes
  | 'todo'         // Task lists, action items
  | 'idea'         // Creative ideas, brainstorms
  | 'journal'      // Personal reflections, daily logs
  | 'reference'    // Facts, documentation, how-tos
  | 'decision'     // Decision records, pros/cons
  | 'contact'      // People info, contact details
  | 'project'      // Project plans, updates
  | 'general';     // Uncategorized

/** Classification result */
export interface NoteClassification {
  type: NoteType;
  confidence: number;      // 0-1 confidence score
  suggestedTags: string[];
  suggestedTitle?: string;
  template?: NoteTemplate;
}

/** Note template for structured notes */
export interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  structure: string;
  icon: string;
}

/** Classification patterns for each note type */
interface ClassificationPattern {
  type: NoteType;
  keywords: string[];
  patterns: RegExp[];
  weight: number;
}

const CLASSIFICATION_PATTERNS: ClassificationPattern[] = [
  {
    type: 'meeting',
    keywords: ['meeting', 'agenda', 'minutes', 'attendees', 'discussed', 'sync', 'standup', 'retrospective', 'call', 'conference'],
    patterns: [
      /meeting\s+(with|about|notes?)/i,
      /attendees?:/i,
      /agenda:/i,
      /action\s+items?:/i,
      /next\s+steps?:/i,
      /discussed\s+(with|about)/i,
    ],
    weight: 1.2,
  },
  {
    type: 'todo',
    keywords: ['todo', 'task', 'tasks', 'checklist', 'must', 'need', 'should', 'deadline', 'due', 'priority'],
    patterns: [
      /^[-*□☐✓✗]\s+/m,
      /\[\s*[x ]?\s*\]/i,
      /todo:/i,
      /tasks?:/i,
      /deadline:/i,
      /due\s+(by|date|on)/i,
      /need\s+to/i,
      /must\s+/i,
    ],
    weight: 1.1,
  },
  {
    type: 'idea',
    keywords: ['idea', 'brainstorm', 'concept', 'what if', 'maybe', 'could', 'explore', 'innovation', 'creative'],
    patterns: [
      /^idea:/im,
      /what\s+if/i,
      /brainstorm/i,
      /concept:/i,
      /💡|🧠|✨/,
    ],
    weight: 1.0,
  },
  {
    type: 'journal',
    keywords: ['today', 'feeling', 'grateful', 'reflection', 'thoughts', 'diary', 'personal', 'morning', 'evening'],
    patterns: [
      /^today/im,
      /i\s+(feel|felt|am|was)\s+/i,
      /grateful\s+for/i,
      /reflection/i,
      /dear\s+diary/i,
    ],
    weight: 1.0,
  },
  {
    type: 'decision',
    keywords: ['decision', 'decided', 'option', 'pros', 'cons', 'choose', 'alternative', 'tradeoff', 'versus', 'vs'],
    patterns: [
      /decision:/i,
      /pros\s*(and|&|\/)\s*cons/i,
      /option\s*[1-9a-z]:/i,
      /we\s+decided/i,
      /vs\.?|versus/i,
    ],
    weight: 1.1,
  },
  {
    type: 'contact',
    keywords: ['email', 'phone', 'linkedin', 'twitter', 'contact', 'met', 'introduced'],
    patterns: [
      /[\w.-]+@[\w.-]+\.\w+/,           // Email
      /\+?\d{1,3}[-.\s]?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}/, // Phone
      /linkedin\.com/i,
      /met\s+(with|at)/i,
    ],
    weight: 1.0,
  },
  {
    type: 'project',
    keywords: ['project', 'milestone', 'sprint', 'release', 'roadmap', 'timeline', 'deliverable', 'stakeholder'],
    patterns: [
      /project:/i,
      /milestone:/i,
      /sprint\s+\d+/i,
      /release\s+(date|notes?|v)/i,
      /roadmap/i,
    ],
    weight: 1.0,
  },
  {
    type: 'reference',
    keywords: ['how to', 'guide', 'documentation', 'reference', 'steps', 'instructions', 'tutorial', 'note:'],
    patterns: [
      /how\s+to/i,
      /step\s+[1-9]/i,
      /instructions?:/i,
      /^#\s+/m,  // Markdown headers suggest documentation
    ],
    weight: 0.9,
  },
];

/** Available note templates */
export const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: 'meeting',
    name: 'Meeting Notes',
    description: 'Structured meeting notes with attendees and action items',
    icon: '📅',
    structure: `## Meeting: [Topic]\n**Date:** [Today]\n**Attendees:** \n\n### Agenda\n- \n\n### Discussion Notes\n\n\n### Action Items\n- [ ] \n\n### Next Steps\n`,
  },
  {
    id: 'todo',
    name: 'Task List',
    description: 'Checklist for tracking tasks',
    icon: '✅',
    structure: `## Tasks\n\n### High Priority\n- [ ] \n\n### Normal Priority\n- [ ] \n\n### Low Priority\n- [ ] \n`,
  },
  {
    id: 'idea',
    name: 'Idea',
    description: 'Capture and develop creative ideas',
    icon: '💡',
    structure: `## 💡 Idea: [Title]\n\n### The Concept\n\n\n### Why It Matters\n\n\n### Next Steps to Explore\n- \n`,
  },
  {
    id: 'journal',
    name: 'Daily Journal',
    description: 'Daily reflection and gratitude',
    icon: '📔',
    structure: `## Journal Entry\n\n### Today I'm grateful for:\n- \n\n### What happened today:\n\n\n### Reflections:\n\n\n### Tomorrow I want to:\n- \n`,
  },
  {
    id: 'decision',
    name: 'Decision Record',
    description: 'Document important decisions',
    icon: '⚖️',
    structure: `## Decision: [Title]\n\n### Context\n\n\n### Options Considered\n\n**Option A:**\n- Pros: \n- Cons: \n\n**Option B:**\n- Pros: \n- Cons: \n\n### Decision\n\n\n### Rationale\n\n`,
  },
  {
    id: 'project',
    name: 'Project Update',
    description: 'Track project progress and updates',
    icon: '📊',
    structure: `## Project: [Name]\n**Status:** On Track | At Risk | Blocked\n\n### Progress This Week\n- \n\n### Blockers\n- \n\n### Next Week\n- \n`,
  },
];

/**
 * Classify a note based on its content
 */
export function classifyNote(text: string): NoteClassification {
  const normalizedText = text.toLowerCase();
  const scores: Map<NoteType, number> = new Map();

  // Initialize scores
  for (const pattern of CLASSIFICATION_PATTERNS) {
    scores.set(pattern.type, 0);
  }

  // Score each pattern
  for (const pattern of CLASSIFICATION_PATTERNS) {
    let score = 0;

    // Check keywords
    for (const keyword of pattern.keywords) {
      if (normalizedText.includes(keyword)) {
        score += 1;
      }
    }

    // Check regex patterns (weighted higher)
    for (const regex of pattern.patterns) {
      if (regex.test(text)) {
        score += 2;
      }
    }

    // Apply type-specific weight
    score *= pattern.weight;
    scores.set(pattern.type, score);
  }

  // Find the best match
  let bestType: NoteType = 'general';
  let bestScore = 0;

  for (const [type, score] of scores) {
    if (score > bestScore) {
      bestScore = score;
      bestType = type;
    }
  }

  // Calculate confidence (normalize to 0-1)
  const maxPossibleScore = 20; // Rough max score
  const confidence = Math.min(bestScore / maxPossibleScore, 1);

  // Only classify if confidence is above threshold
  if (confidence < 0.15) {
    bestType = 'general';
  }

  // Generate suggested tags
  const suggestedTags = generateSuggestedTags(text, bestType);

  // Generate suggested title
  const suggestedTitle = generateSuggestedTitle(text);

  // Get template for this type
  const template = NOTE_TEMPLATES.find(t => t.id === bestType);

  return {
    type: bestType,
    confidence,
    suggestedTags,
    suggestedTitle,
    template,
  };
}

/**
 * Generate suggested tags based on content
 */
function generateSuggestedTags(text: string, noteType: NoteType): string[] {
  const tags: Set<string> = new Set();

  // Add type-based tag
  if (noteType !== 'general') {
    tags.add(noteType);
  }

  // Extract @mentions as tags
  const mentions = text.match(/@(\w+)/g);
  if (mentions) {
    mentions.slice(0, 3).forEach(m => tags.add(m.slice(1).toLowerCase()));
  }

  // Extract #hashtags
  const hashtags = text.match(/#(\w+)/g);
  if (hashtags) {
    hashtags.slice(0, 5).forEach(h => tags.add(h.slice(1).toLowerCase()));
  }

  // Common topic keywords
  const topicKeywords: Record<string, string> = {
    'budget': 'finance',
    'revenue': 'finance',
    'sales': 'sales',
    'marketing': 'marketing',
    'design': 'design',
    'engineering': 'engineering',
    'product': 'product',
    'customer': 'customer',
    'team': 'team',
    'hiring': 'hiring',
    'onboarding': 'onboarding',
    'security': 'security',
    'performance': 'performance',
    'bug': 'bug',
    'feature': 'feature',
  };

  const normalizedText = text.toLowerCase();
  for (const [keyword, tag] of Object.entries(topicKeywords)) {
    if (normalizedText.includes(keyword)) {
      tags.add(tag);
    }
  }

  return Array.from(tags).slice(0, 5);
}

/**
 * Generate a suggested title from the first line or key content
 */
function generateSuggestedTitle(text: string): string | undefined {
  // Try to extract title from markdown header
  const headerMatch = text.match(/^#\s+(.+)$/m);
  if (headerMatch) {
    return headerMatch[1].trim().slice(0, 60);
  }

  // Use first line if it's short enough
  const firstLine = text.split('\n')[0].trim();
  if (firstLine.length > 5 && firstLine.length <= 60) {
    // Clean up common prefixes
    const cleaned = firstLine
      .replace(/^(meeting|note|idea|todo|task):\s*/i, '')
      .replace(/^[-*•]\s*/, '');
    if (cleaned.length > 5) {
      return cleaned;
    }
  }

  return undefined;
}

/**
 * Get icon for a note type
 */
export function getNoteTypeIcon(type: NoteType): string {
  const icons: Record<NoteType, string> = {
    meeting: '📅',
    todo: '✅',
    idea: '💡',
    journal: '📔',
    reference: '📚',
    decision: '⚖️',
    contact: '👤',
    project: '📊',
    general: '📝',
  };
  return icons[type];
}

/**
 * Get display name for a note type
 */
export function getNoteTypeName(type: NoteType): string {
  const names: Record<NoteType, string> = {
    meeting: 'Meeting',
    todo: 'Task List',
    idea: 'Idea',
    journal: 'Journal',
    reference: 'Reference',
    decision: 'Decision',
    contact: 'Contact',
    project: 'Project',
    general: 'Note',
  };
  return names[type];
}


```

## src/lib/types.ts

```typescript
/**
 * Shared types for AuroraNotes
 * Types aligned with API specification (2024-12 version)
 */

/** Firestore timestamp shape when serialized from backend */
export type FirestoreTs = { _seconds: number; _nanoseconds?: number };

/** Raw timestamp value that can come from API */
export type RawTimestamp = string | FirestoreTs | undefined | null;

/** Processing status for notes */
export type ProcessingStatus = 'pending' | 'processing' | 'ready' | 'failed';

/** Note as returned from API (with raw timestamps) */
export interface RawNote {
  id: string;
  title?: string;                        // Optional title
  text: string;
  tenantId: string;
  processingStatus?: ProcessingStatus;   // Chunk processing status
  tags?: string[];                       // Optional tags
  metadata?: Record<string, unknown>;    // Optional metadata
  createdAt: string;                     // ISO 8601 timestamp
  updatedAt: string;                     // ISO 8601 timestamp
}

/** Normalized note with JS Date objects */
export interface Note {
  id: string;
  title?: string;
  text: string;
  tenantId: string;
  processingStatus?: ProcessingStatus;
  tags?: string[];
  metadata?: Record<string, unknown>;
  createdAt: Date | null;
  updatedAt: Date | null;
}

/** Request body for creating a note */
export interface CreateNoteRequest {
  text: string;
  // Note: tenantId is derived from authenticated user on backend
}

/** Request body for chat */
export interface ChatRequest {
  message: string;
  stream?: boolean;
  // Note: tenantId is derived from authenticated user on backend
}

/** Paginated notes list response from API */
export interface NotesListResponse {
  notes: RawNote[];
  cursor: string | null;
  hasMore: boolean;
}

/** Rate limit information from API headers */
export interface RateLimitInfo {
  limit: number;        // Max requests per window
  remaining: number;    // Requests remaining in current window
  resetSeconds: number; // Seconds until window resets
}

// ============================================
// Chat Types (Updated for new API spec)
// ============================================

/** Source in chat response - maps citation markers to source details */
export interface Source {
  id: string;        // "1", "2", etc. - matches [1], [2] in answer
  noteId: string;    // For deep-linking to the original note
  preview: string;   // ~120 char preview of the source
  date: string;      // Human-readable: "Dec 15, 2024"
  relevance: number; // 0-1 confidence score
}

/** Query intent classification - matches backend QueryIntent */
export type QueryIntent = 'summarize' | 'list' | 'decision' | 'action_item' | 'search' | 'question';

/** Confidence level for chat responses */
export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'none';

/** Enhanced confidence breakdown from API */
export interface EnhancedConfidence {
  overall: number;           // 0-1 overall confidence score
  level: ConfidenceLevel;    // high, medium, low
  isReliable: boolean;       // Whether answer should be trusted
  breakdown?: {
    citationDensity?: number;
    sourceRelevance?: number;
    answerCoherence?: number;
    claimSupport?: number;
  };
}

/** Action result data from agentic actions */
export interface ActionData {
  createdNote?: { id: string; title?: string; text: string };
  reminder?: { id: string; text: string; dueAt: string };
  searchResults?: Array<{ noteId: string; preview: string; date: string }>;
  summary?: string;
  actionItems?: Array<{ text: string; source: string; status?: string }>;
  mentions?: Array<{ noteId: string; context: string; date: string }>;
}

/** Action metadata in chat response */
export interface ActionMeta {
  type: 'create_note' | 'set_reminder' | 'search_notes' | 'summarize_period' | 'list_action_items' | 'find_mentions';
  success: boolean;
  data?: ActionData;
}

/** Chat response metadata */
export interface ChatMeta {
  model: string;
  requestId?: string;
  responseTimeMs: number;
  intent: QueryIntent;
  confidence: ConfidenceLevel;
  sourceCount: number;
  action?: ActionMeta;  // Present when an agentic action was executed
  debug?: {
    strategy: string;
    candidateCount?: number;
    rerankCount?: number;
    enhancedConfidence?: EnhancedConfidence;
  };
}

/** Chat response from API (new format) */
export interface ChatResponse {
  answer: string;      // Contains [1], [2] citation markers
  sources: Source[];   // Maps citation markers to source details (cited in answer)
  contextSources?: Source[]; // All relevant sources used as context (may not be cited)
  meta: ChatMeta;
  /** @deprecated Use sources instead */
  citations?: Citation[];
}

/** @deprecated Legacy citation format - use Source instead */
export interface Citation {
  cid: string;          // e.g., "N1", "N2"
  noteId: string;
  chunkId: string;
  createdAt: string;    // ISO string
  snippet: string;
  score: number;
}



/** Chat message for UI state */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Source[];
  contextSources?: Source[]; // All relevant sources used as context (may not be cited)
  meta?: ChatMeta;
  action?: ActionMeta;  // Present when this message was an agentic action response
  isError?: boolean;
  errorCode?: number;
  isStreaming?: boolean;
  /** @deprecated Use sources instead */
  citations?: Citation[];
}

// ============================================
// Streaming Types
// ============================================

/** Stream event types from SSE */
export type StreamEventType = 'sources' | 'token' | 'done' | 'error';

/** Source event in streaming (without relevance) */
export type StreamSource = Omit<Source, 'relevance'>;

/** Stream event from SSE */
export interface StreamEvent {
  type: StreamEventType;
  content?: string;              // For 'token' events
  sources?: StreamSource[];      // For 'sources' event
  meta?: ChatMeta;               // For 'done' event
  error?: string;                // For 'error' event
}

// ============================================
// Feedback Types
// ============================================

/** Feedback rating options */
export type FeedbackRating = 'up' | 'down';

/** Request body for submitting feedback */
export interface FeedbackRequest {
  requestId: string;         // Required. From chat response meta.requestId
  rating: FeedbackRating;    // Required.
  comment?: string;          // Optional. Max 1000 chars.
  // Note: tenantId is derived from authenticated user on backend
}

/** Feedback response */
export interface FeedbackResponse {
  status: 'recorded';
  requestId: string;
}

// ============================================
// Other Types
// ============================================

/** Health check response */
export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp?: string;
  service?: string;
  project?: string;
  version?: string;
}

/** API error response - matches backend format */
export interface ApiError {
  error: string | { code: string; message: string; details?: Record<string, unknown> };
  code?: string;
  retryAfter?: number;       // Seconds until retry allowed (for 429 responses)
  retryAfterMs?: number;     // Milliseconds until retry (alternative format)
}

/** Enhanced API response with metadata */
export interface ApiResponse<T> {
  data: T;
  requestId: string | null;
  rateLimit: RateLimitInfo | null;
}

// ============================================
// Transcription Types
// ============================================

/** Transcription response from API */
export interface TranscriptionResponse {
  text: string;
  processingTimeMs: number;
  model: string;
  estimatedDurationSeconds?: number;
}


```

## src/lib/utils.ts

```typescript
/**
 * Shared utility functions
 * Common helpers used across the application
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Escape special regex characters in a string
 * Used for safe string matching in search/highlight features
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Split text into parts for highlighting search matches
 * Returns an array of { text, isMatch } objects for rendering
 */
export function splitTextForHighlight(
  text: string,
  query: string
): { text: string; isMatch: boolean }[] {
  if (!query || !text.toLowerCase().includes(query.toLowerCase())) {
    return [{ text, isMatch: false }];
  }

  const parts = text.split(new RegExp(`(${escapeRegex(query)})`, 'gi'));
  return parts
    .filter(part => part.length > 0)
    .map(part => ({
      text: part,
      isMatch: part.toLowerCase() === query.toLowerCase(),
    }));
}

/**
 * Check if we're running in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Copy text to clipboard with fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!isBrowser()) return false;

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch {
    return false;
  }
}

/**
 * Merge class names with Tailwind-aware conflict resolution
 * Uses clsx for conditional classes and tailwind-merge to handle conflicts
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Trigger haptic feedback for touch interactions
 * Uses the Vibration API when available
 */
export function triggerHaptic(style: 'light' | 'medium' | 'heavy' = 'light'): void {
  if (!isBrowser() || !('vibrate' in navigator)) return;

  const patterns: Record<typeof style, number> = {
    light: 10,
    medium: 20,
    heavy: 30,
  };

  try {
    navigator.vibrate(patterns[style]);
  } catch {
    // Silently fail if vibration is not allowed
  }
}

/**
 * Format a phone number as user types
 * Formats US numbers as (XXX) XXX-XXXX
 * Returns both formatted display value and raw digits for E.164 conversion
 */
export function formatPhoneNumber(value: string): { formatted: string; digits: string } {
  // Strip all non-digit characters except leading +
  const hasPlus = value.startsWith('+');
  const digits = value.replace(/\D/g, '');

  // If it starts with country code (like +1), handle differently
  if (hasPlus && digits.length > 0) {
    // International format - just clean it up
    if (digits.startsWith('1') && digits.length <= 11) {
      // US number with country code
      const areaCode = digits.slice(1, 4);
      const firstPart = digits.slice(4, 7);
      const secondPart = digits.slice(7, 11);

      if (digits.length <= 1) return { formatted: '+1', digits };
      if (digits.length <= 4) return { formatted: `+1 (${areaCode}`, digits };
      if (digits.length <= 7) return { formatted: `+1 (${areaCode}) ${firstPart}`, digits };
      return { formatted: `+1 (${areaCode}) ${firstPart}-${secondPart}`, digits };
    }
    // Other international - just return with +
    return { formatted: `+${digits}`, digits };
  }

  // US format without country code
  const areaCode = digits.slice(0, 3);
  const firstPart = digits.slice(3, 6);
  const secondPart = digits.slice(6, 10);

  if (digits.length === 0) return { formatted: '', digits: '' };
  if (digits.length <= 3) return { formatted: `(${areaCode}`, digits };
  if (digits.length <= 6) return { formatted: `(${areaCode}) ${firstPart}`, digits };
  return { formatted: `(${areaCode}) ${firstPart}-${secondPart}`, digits };
}

/**
 * Convert a phone number to E.164 format for Firebase
 * Assumes US (+1) if no country code provided
 */
export function toE164(phoneNumber: string): string {
  const digits = phoneNumber.replace(/\D/g, '');

  // Already has country code
  if (phoneNumber.startsWith('+')) {
    return `+${digits}`;
  }

  // Assume US
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // Already includes country code without +
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  // Return as-is with + prefix
  return `+${digits}`;
}

/**
 * Format duration in seconds as MM:SS
 * Used for audio playback time display
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

```

## src/main.tsx

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

```

## src/styles/app.css

```css
@import "tailwindcss";

/**
 * AuroraNotes Design System v12.0
 * "Quiet Intelligence" Design Language
 * Clean, content-first design with purposeful AI moments
 * Invisible design - interface disappears, content shines
 */

/* ============================================
   Tailwind v4 Theme Configuration
   Maps CSS variables to Tailwind utilities
   ============================================ */
@theme {
  /* Colors - Using CSS variables for light/dark mode support */
  --color-accent: var(--color-accent);
  --color-accent-hover: var(--color-accent-hover);
  --color-accent-subtle: var(--color-accent-subtle);
  --color-accent-muted: var(--color-accent-muted);

  --color-surface: var(--color-surface);
  --color-surface-secondary: var(--color-surface-secondary);
  --color-surface-elevated: var(--color-surface-elevated);
  --color-surface-hover: var(--color-surface-hover);
  --color-surface-pressed: var(--color-surface-pressed);

  --color-foreground: var(--color-text);
  --color-foreground-secondary: var(--color-text-secondary);
  --color-foreground-tertiary: var(--color-text-tertiary);
  --color-foreground-muted: var(--color-text-muted);

  --color-border: var(--color-border);
  --color-border-subtle: var(--color-border-subtle);
  --color-border-strong: var(--color-border-strong);

  --color-success: var(--color-success);
  --color-danger: var(--color-danger);
  --color-warning: var(--color-warning);
  --color-info: var(--color-info);

  --color-ai: var(--color-ai);
  --color-ai-hover: var(--color-ai-hover);

  /* Border Radius */
  --radius-xs: var(--radius-xs);
  --radius-sm: var(--radius-sm);
  --radius-md: var(--radius-md);
  --radius-lg: var(--radius-lg);
  --radius-xl: var(--radius-xl);
  --radius-2xl: var(--radius-2xl);
  --radius-3xl: var(--radius-3xl);
  --radius-full: var(--radius-full);

  /* Shadows */
  --shadow-xs: var(--shadow-xs);
  --shadow-sm: var(--shadow-sm);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-xl: var(--shadow-xl);
  --shadow-focus: var(--shadow-focus);

  /* Typography */
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);

  /* Transitions */
  --transition-fast: var(--transition-fast);
  --transition-normal: var(--transition-normal);
}

/* ============================================
   Theme Variables (CSS Custom Properties)
   Light-First Design with Reserved AI Accents
   ============================================ */
:root {
  /* Primary Accent - Refined Electric Indigo */
  --color-accent: #5B5FE7;
  --color-accent-hover: #4F52D4;
  --color-accent-subtle: #EEF0FF;
  --color-accent-muted: #E8EAFF;
  --color-accent-light: #F5F6FF;

  /* Legacy aliases for compatibility */
  --color-primary: var(--color-accent);
  --color-primary-hover: var(--color-accent-hover);

  /* Surfaces - Warm, clean whites */
  --color-bg: #FFFFFF;
  --color-bg-subtle: #FAFAF9;
  --color-bg-muted: #F5F5F4;
  --color-surface: #FAFAF9;
  --color-surface-secondary: #F5F5F4;
  --color-surface-tertiary: #F0F0EE;
  --color-surface-elevated: #FFFFFF;
  --color-surface-hover: #F5F5F4;
  --color-surface-pressed: #EBEBEA;

  /* Text - High contrast warm hierarchy */
  --color-text: #0A0A0A;
  --color-text-secondary: #525252;
  --color-text-tertiary: #737373;
  --color-text-muted: #A3A3A3;
  --color-muted: #737373;
  --color-placeholder: #D4D4D4;

  /* Borders - Warm, subtle */
  --color-border: #E7E5E4;
  --color-border-subtle: #F5F5F4;
  --color-border-strong: #D6D3D1;
  --color-border-focused: var(--color-accent);
  --color-primary-muted: rgba(91, 95, 231, 0.1);
  --color-primary-subtle: rgba(91, 95, 231, 0.06);

  /* Separator */
  --color-separator: #E7E5E4;
  --color-separator-opaque: #E7E5E4;

  /* Status Colors - Refined */
  --color-success: #059669;
  --color-success-bg: rgba(5, 150, 105, 0.1);
  --color-success-border: rgba(5, 150, 105, 0.25);
  --color-danger: #DC2626;
  --color-danger-bg: rgba(220, 38, 38, 0.1);
  --color-danger-border: rgba(220, 38, 38, 0.25);
  --color-warning: #D97706;
  --color-warning-bg: rgba(217, 119, 6, 0.1);
  --color-info: #2563EB;

  /* AI Accent - Reserved ONLY for AI moments (Vivid Violet) */
  --color-ai: #7C3AED;
  --color-ai-hover: #6D28D9;
  --color-ai-bg: rgba(124, 58, 237, 0.08);
  --color-ai-border: rgba(124, 58, 237, 0.2);
  --color-ai-muted: rgba(124, 58, 237, 0.04);
  --color-ai-glow: rgba(124, 58, 237, 0.15);

  /* Brand Gradient - Reserved for AI send button and streaming states ONLY */
  --brand-aurora: linear-gradient(135deg, #5B5FE7 0%, #7C3AED 100%);
  --brand-aurora-vivid: linear-gradient(135deg, #5B5FE7 0%, #7C3AED 50%, #9333EA 100%);
  --brand-aurora-subtle: linear-gradient(180deg, rgba(91, 95, 231, 0.03) 0%, transparent 100%);
  --brand-aurora-glow: linear-gradient(135deg, rgba(91, 95, 231, 0.15) 0%, rgba(124, 58, 237, 0.1) 100%);

  /* Shadows - Subtle, solid (no color in shadows) */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.06), 0 4px 6px -4px rgba(0, 0, 0, 0.04);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
  --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.18);
  --shadow-inner: inset 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-button: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.04);
  --shadow-card-hover: 0 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-modal: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  --shadow-focus: 0 0 0 3px rgba(91, 95, 231, 0.12);
  --shadow-focus-ring: 0 0 0 2px var(--color-bg), 0 0 0 4px var(--color-accent);

  /* Focus ring */
  --ring: var(--shadow-focus);
  --ring-ai: 0 0 0 3px rgba(124, 58, 237, 0.2);

  /* Radii - Softer, more modern */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 20px;
  --radius-3xl: 24px;
  --radius-full: 9999px;

  /* Transitions - Snappy, spring-based (200-300ms) */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.45, 0, 0.55, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
  --transition-instant: 0.1s var(--ease-out);
  --transition-fast: 0.15s var(--ease-out);
  --transition-normal: 0.2s var(--ease-out);
  --transition-slow: 0.3s var(--ease-out);
  --transition-spring: 0.25s var(--ease-spring);
  --transition-modal: 0.25s var(--ease-smooth);

  /* Typography - Inter first, system fallback */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', Consolas, ui-monospace, monospace;

  /* Font weights - Just 3 */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  /* Legacy aliases */
  --font-regular: 400;
  --font-bold: 600;
  --font-light: 400;

  /* Letter spacing - Tighter at larger sizes */
  --tracking-tighter: -0.025em;
  --tracking-tight: -0.015em;
  --tracking-normal: 0;
  --tracking-wide: 0.015em;
  --tracking-wider: 0.025em;

  /* Line heights */
  --leading-none: 1;
  --leading-tight: 1.2;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --leading-loose: 1.75;

  /* Type scale - Simplified (Major Third 1.25) */
  --text-xs: 0.75rem;    /* 12px - meta, timestamps */
  --text-sm: 0.875rem;   /* 14px - secondary, captions */
  --text-base: 1rem;     /* 16px - body text */
  --text-lg: 1.125rem;   /* 18px - emphasized body */
  --text-xl: 1.25rem;    /* 20px - card titles */
  --text-2xl: 1.5rem;    /* 24px - section headers */
  --text-3xl: 2rem;      /* 32px - page titles */
  /* Legacy */
  --text-2xs: 0.6875rem; /* 11px */
  --text-md: 1.0625rem;  /* 17px */

  /* Spacing - Simplified 8pt grid */
  --space-0: 0;
  --space-px: 1px;
  --space-0-5: 2px;
  --space-1: 4px;
  --space-1-5: 6px;
  --space-2: 8px;
  --space-2-5: 10px;
  --space-3: 12px;
  --space-3-5: 14px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 28px;
  --space-8: 48px;
  --space-10: 64px;
  --space-12: 48px;
  --space-14: 56px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;

  /* Z-index system */
  --z-base: 0;
  --z-above: 10;
  --z-sticky: 100;
  --z-overlay: 500;
  --z-modal: 1000;
  --z-toast: 1100;
  --z-tooltip: 1200;
}

/* ============================================
   Dark Mode Theme Overrides
   Elegant dark theme with refined accents
   ============================================ */
@media (prefers-color-scheme: dark) {
  :root {
    /* Accent - Brighter for dark mode legibility */
    --color-accent: #7C7FFF;
    --color-accent-hover: #9B9EFF;
    --color-accent-subtle: rgba(124, 127, 255, 0.15);
    --color-accent-muted: rgba(124, 127, 255, 0.1);
    --color-accent-light: rgba(124, 127, 255, 0.08);
    --color-primary: var(--color-accent);
    --color-primary-hover: var(--color-accent-hover);

    /* Surfaces - Deep, warm dark */
    --color-bg: #0A0A0A;
    --color-bg-subtle: #111111;
    --color-bg-muted: #171717;
    --color-surface: #111111;
    --color-surface-secondary: #171717;
    --color-surface-tertiary: #1C1C1C;
    --color-surface-elevated: #1C1C1C;
    --color-surface-hover: #1C1C1C;
    --color-surface-pressed: #262626;

    /* Text - High contrast hierarchy */
    --color-text: #FAFAFA;
    --color-text-secondary: #A3A3A3;
    --color-text-tertiary: #737373;
    --color-text-muted: #525252;
    --color-muted: #737373;
    --color-placeholder: #525252;

    /* Borders - Subtle but visible */
    --color-border: #262626;
    --color-border-subtle: #1C1C1C;
    --color-border-strong: #404040;
    --color-primary-muted: rgba(124, 127, 255, 0.15);
    --color-primary-subtle: rgba(124, 127, 255, 0.1);

    /* Separator */
    --color-separator: #262626;
    --color-separator-opaque: #262626;

    /* Status Colors */
    --color-success: #34D399;
    --color-success-bg: rgba(52, 211, 153, 0.15);
    --color-danger: #F87171;
    --color-danger-bg: rgba(248, 113, 113, 0.15);
    --color-warning: #FBBF24;
    --color-warning-bg: rgba(251, 191, 36, 0.15);
    --color-info: #60A5FA;

    /* AI - Vivid Violet for dark mode */
    --color-ai: #A78BFA;
    --color-ai-hover: #C4B5FD;
    --color-ai-bg: rgba(167, 139, 250, 0.12);
    --color-ai-glow: rgba(167, 139, 250, 0.2);
    --brand-aurora: linear-gradient(135deg, #7C7FFF 0%, #A78BFA 100%);
    --brand-aurora-vivid: linear-gradient(135deg, #7C7FFF 0%, #A78BFA 50%, #C084FC 100%);

    /* Shadows - Deeper for dark mode */
    --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.5);
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.6);
    --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
    --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.7);
    --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.8);
    --shadow-modal: 0 25px 50px rgba(0, 0, 0, 0.9);
    --shadow-focus: 0 0 0 3px rgba(124, 127, 255, 0.25);
    --ring-ai: 0 0 0 3px rgba(167, 139, 250, 0.25);
  }
}

/* Manual dark mode class */
.dark {
  --color-accent: #7C7FFF;
  --color-accent-hover: #9B9EFF;
  --color-accent-subtle: rgba(124, 127, 255, 0.15);
  --color-primary: var(--color-accent);
  --color-bg: #0A0A0A;
  --color-bg-subtle: #111111;
  --color-bg-muted: #171717;
  --color-surface: #111111;
  --color-surface-secondary: #171717;
  --color-surface-hover: #1C1C1C;
  --color-text: #FAFAFA;
  --color-text-secondary: #A3A3A3;
  --color-text-tertiary: #737373;
  --color-border: #262626;
  --color-separator: #262626;
  --color-ai: #A78BFA;
  --brand-aurora: linear-gradient(135deg, #7C7FFF 0%, #A78BFA 100%);
}

/* ============================================
   Utility Classes - Simplified
   ============================================ */

/* Selection styling - Accent tint */
::selection {
  background: rgba(91, 95, 231, 0.2);
  color: inherit;
}

::-moz-selection {
  background: rgba(91, 95, 231, 0.2);
  color: inherit;
}

@media (prefers-color-scheme: dark) {
  ::selection {
    background: rgba(129, 140, 248, 0.25);
  }
  ::-moz-selection {
    background: rgba(129, 140, 248, 0.25);
  }
}

/* ============================================
   AI-Specific Effects (Reserved for AI elements only)
   ============================================ */

/* AI presence indicator - subtle left border */
.ai-presence {
  position: relative;
}

.ai-presence::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--brand-aurora);
  border-radius: 1px;
  opacity: 0;
  transition: opacity 0.3s var(--ease-out);
}

.ai-presence.active::before,
.ai-presence:hover::before {
  opacity: 1;
}

/* ============================================
   Reset & Base Styles
   ============================================ */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body, #root {
  height: 100%;
  height: 100dvh;
  margin: 0;
  padding: 0;
  background: var(--color-bg);
}

html {
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
  font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11', 'ss01';
  -webkit-tap-highlight-color: transparent;
}

body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  font-weight: var(--font-regular);
  letter-spacing: var(--tracking-normal);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow: hidden;
  text-rendering: optimizeLegibility;
  font-synthesis: none;
}

/* Smooth scrolling only when safe */
@media (prefers-reduced-motion: no-preference) {
  html {
    scroll-behavior: smooth;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  /* Keep essential visual feedback */
  .btn:active,
  .note-card:active,
  .suggestion-chip:active {
    transform: none !important;
  }
}

/* Enhanced focus-visible styles for accessibility */
:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus-ring);
}

:focus:not(:focus-visible) {
  outline: none;
  box-shadow: none;
}

/* Skip link for keyboard navigation */
.skip-link {
  position: absolute;
  top: -100%;
  left: var(--space-4);
  z-index: var(--z-max);
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface);
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-lg);
  color: var(--color-primary);
  font-weight: var(--font-semibold);
  text-decoration: none;
  transition: top 0.2s var(--ease-out);
}

.skip-link:focus {
  top: var(--space-4);
}

/* Screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Make sr-only content visible when focused */
.sr-only-focusable:focus {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  :root {
    --color-border: #000;
    --color-border-strong: #000;
    --color-text-secondary: #333;
    --color-text-tertiary: #555;
  }

  .btn,
  .note-card,
  .chat-bubble,
  .suggestion-chip {
    border-width: 2px;
  }
}

/* Forced colors mode (Windows High Contrast) */
@media (forced-colors: active) {
  .btn,
  .note-card,
  .chat-bubble,
  .suggestion-chip,
  .composer-input,
  .chat-input {
    border: 2px solid CanvasText;
  }

  .btn:focus-visible,
  .note-card:focus-visible {
    outline: 3px solid Highlight;
    outline-offset: 2px;
  }
}

/* Note: Selection styling is defined in the Utility Classes section (lines 294-312) */

/* ============================================
   Typography - Clean, readable hierarchy
   Using Major Third (1.25) scale
   ============================================ */
/* Text colors */
.text-muted { color: var(--color-muted); }
.text-secondary { color: var(--color-text-secondary); }
.text-tertiary { color: var(--color-text-tertiary); }
.text-primary { color: var(--color-primary); }

/* Text sizes with optical tracking adjustments */
.text-2xs { font-size: var(--text-2xs); letter-spacing: var(--tracking-wide); }
.text-xs { font-size: var(--text-xs); letter-spacing: var(--tracking-normal); }
.text-sm { font-size: var(--text-sm); letter-spacing: var(--tracking-normal); }
.text-base { font-size: var(--text-base); letter-spacing: var(--tracking-normal); }
.text-md { font-size: var(--text-md); letter-spacing: var(--tracking-tight); }
.text-lg { font-size: var(--text-lg); letter-spacing: var(--tracking-tight); }
.text-xl { font-size: var(--text-xl); letter-spacing: var(--tracking-tight); }
.text-2xl { font-size: var(--text-2xl); letter-spacing: var(--tracking-tighter); }
.text-3xl { font-size: var(--text-3xl); letter-spacing: var(--tracking-tighter); }

/* Font weights - Just 3: regular, medium, semibold */
.font-light { font-weight: var(--font-light); }
.font-regular { font-weight: var(--font-regular); }
.font-medium { font-weight: var(--font-medium); }
.font-semibold { font-weight: var(--font-semibold); }
.font-bold { font-weight: var(--font-bold); }

/* Monospace */
.font-mono {
  font-family: var(--font-mono);
  font-size: 0.9em;
  letter-spacing: -0.01em;
}

/* Headings - Clean, minimal styling */
h1, h2, h3, h4, h5, h6 {
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-tight);
  line-height: var(--leading-tight);
  color: var(--color-text);
}

/* Caption and label styles */
.caption {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  letter-spacing: var(--tracking-wide);
  color: var(--color-text-tertiary);
  text-transform: uppercase;
}

/* ============================================
   Visual Hierarchy Utilities
   Apple/Google-inspired density & emphasis
   ============================================ */

/* Emphasis levels for content importance */
.emphasis-high {
  font-weight: var(--font-semibold);
  color: var(--color-text);
  letter-spacing: var(--tracking-tight);
}

.emphasis-medium {
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
}

.emphasis-low {
  font-weight: var(--font-regular);
  color: var(--color-text-tertiary);
}

/* Information density classes */
.density-compact {
  --local-gap: var(--space-2);
  --local-padding: var(--space-2);
}

.density-default {
  --local-gap: var(--space-3);
  --local-padding: var(--space-4);
}

.density-spacious {
  --local-gap: var(--space-5);
  --local-padding: var(--space-6);
}

/* Content hierarchy sections - Google Material-inspired */
.section-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-separator);
}

.section-title {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  color: var(--color-text-tertiary);
}

.section-count {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--color-text-muted);
  background: var(--color-bg-muted);
  padding: var(--space-0-5) var(--space-2);
  border-radius: var(--radius-full);
}

/* Scannable list items - optimized for quick reading */
.list-item-scannable {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: start;
  gap: var(--space-4);
}

.list-item-scannable .primary-text {
  font-weight: var(--font-medium);
  color: var(--color-text);
  line-height: var(--leading-snug);
}

.list-item-scannable .secondary-text {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: var(--leading-relaxed);
}

.list-item-scannable .meta-text {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  white-space: nowrap;
}

/* Visual weight indicators */
.weight-heavy {
  font-weight: var(--font-bold);
  font-size: 1.05em;
}

.weight-light {
  font-weight: var(--font-light);
  opacity: 0.9;
}

/* Highlight important content */
.highlight-soft {
  background: var(--color-warning-bg);
  padding: var(--space-0-5) var(--space-1-5);
  border-radius: var(--radius-sm);
}

.highlight-accent {
  background: var(--color-ai-bg);
  padding: var(--space-0-5) var(--space-1-5);
  border-radius: var(--radius-sm);
  border-left: 2px solid var(--color-primary);
}

/* Truncation with fade - Tesla-inspired */
.truncate-fade {
  position: relative;
  overflow: hidden;
}

.truncate-fade::after {
  content: '';
  position: absolute;
  bottom: 0;
  right: 0;
  width: 60px;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--color-surface) 100%
  );
  pointer-events: none;
}

/* Elevated surface effect for overlays */
.glass {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-lg);
}

/* ============================================
   Component Primitives - Reusable UI Building Blocks
   ============================================ */

/* Input Primitive - Clean, solid input styling */
.input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  font-family: inherit;
  font-size: var(--text-base);
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.input::placeholder {
  color: var(--color-placeholder);
}

.input:hover:not(:disabled):not(:focus) {
  border-color: var(--color-border-strong);
}

.input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: var(--shadow-focus);
}

.input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--color-bg-muted);
}

.input.input-error {
  border-color: var(--color-danger);
}

.input.input-error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}

.input.input-success {
  border-color: var(--color-success);
}

.input.input-success:focus {
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15);
}

/* Input sizes */
.input-sm {
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  border-radius: var(--radius-md);
}

.input-lg {
  padding: var(--space-4) var(--space-5);
  font-size: var(--text-lg);
  border-radius: var(--radius-xl);
}

/* Card Primitive - Clean, solid styling */
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

.card:hover {
  border-color: var(--color-border-strong);
}

.card.card-interactive {
  cursor: pointer;
  transition: border-color var(--transition-fast);
}

.card.card-interactive:hover {
  border-color: var(--color-border-strong);
}

.card.card-interactive:active {
  background: var(--color-surface-pressed);
}

.card.card-selected {
  border-color: var(--color-accent);
  box-shadow: var(--shadow-focus);
}

.card.card-elevated {
  background: var(--color-surface-elevated);
  box-shadow: var(--shadow-card);
}

/* Card sizes */
.card-sm {
  padding: var(--space-3);
  border-radius: var(--radius-lg);
}

.card-lg {
  padding: var(--space-6);
  border-radius: var(--radius-2xl);
}

/* Chip Primitive - Tags, badges, pills */
.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1-5);
  padding: var(--space-1) var(--space-2-5);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  background: var(--color-bg-muted);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  white-space: nowrap;
  transition: all var(--transition-fast);
}

.chip svg {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

.chip.chip-interactive {
  cursor: pointer;
}

.chip.chip-interactive:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-border-strong);
}

.chip.chip-interactive:active {
  transform: scale(0.96);
}

.chip.chip-primary {
  background: var(--color-primary);
  border-color: transparent;
  color: white;
}

.chip.chip-success {
  background: var(--color-success-bg);
  border-color: var(--color-success-border);
  color: var(--color-success);
}

.chip.chip-danger {
  background: var(--color-danger-bg);
  border-color: var(--color-danger-border);
  color: var(--color-danger);
}

.chip.chip-warning {
  background: var(--color-warning-bg);
  border-color: rgba(255, 159, 10, 0.3);
  color: var(--color-warning);
}

/* Chip sizes */
.chip-sm {
  padding: var(--space-0-5) var(--space-2);
  font-size: var(--text-2xs);
}

.chip-lg {
  padding: var(--space-1-5) var(--space-3);
  font-size: var(--text-sm);
}

/* Segmented Control Primitive */
.segmented-control {
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  background: var(--color-bg-muted);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  position: relative;
}

.segmented-control-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1-5);
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  border-radius: calc(var(--radius-lg) - 3px);
  cursor: pointer;
  transition: all var(--transition-fast);
  z-index: 1;
}

.segmented-control-item:hover:not(.active) {
  color: var(--color-text);
  background: var(--color-surface-hover);
}

.segmented-control-item.active {
  color: var(--color-text);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.segmented-control-item svg {
  width: 16px;
  height: 16px;
}

/* Segmented control with sliding indicator */
.segmented-control.with-indicator {
  position: relative;
}

.segmented-control-indicator {
  position: absolute;
  top: 3px;
  left: 3px;
  height: calc(100% - 6px);
  background: var(--color-surface);
  border-radius: calc(var(--radius-lg) - 3px);
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-spring), width var(--transition-spring);
  z-index: 0;
}

/* Avatar Primitive */
.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: var(--color-bg-muted);
  color: var(--color-text-secondary);
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
  overflow: hidden;
  flex-shrink: 0;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-sm {
  width: 32px;
  height: 32px;
  font-size: var(--text-xs);
}

.avatar-lg {
  width: 56px;
  height: 56px;
  font-size: var(--text-md);
}

.avatar-xl {
  width: 80px;
  height: 80px;
  font-size: var(--text-xl);
}

/* Divider Primitive */
.divider {
  height: 1px;
  background: var(--color-separator);
  border: none;
  margin: var(--space-4) 0;
}

.divider-vertical {
  width: 1px;
  height: auto;
  align-self: stretch;
  margin: 0 var(--space-3);
}

.divider-subtle {
  background: var(--color-border-subtle);
}

/* Badge Primitive - Small status indicators */
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 var(--space-1-5);
  font-size: var(--text-2xs);
  font-weight: var(--font-bold);
  color: white;
  background: var(--color-primary);
  border-radius: var(--radius-full);
}

.badge-success {
  background: var(--color-success);
}

.badge-danger {
  background: var(--color-danger);
}

.badge-warning {
  background: var(--color-warning);
  color: var(--color-text);
}

.badge-muted {
  background: var(--color-text-muted);
}

/* Dot indicator */
.dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background: var(--color-text-muted);
}

.dot-success {
  background: var(--color-success);
}

.dot-danger {
  background: var(--color-danger);
}

.dot-warning {
  background: var(--color-warning);
}

.dot-pulse {
  animation: dot-pulse 2s ease-in-out infinite;
}

@keyframes dot-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.9); }
}

/* ============================================
   Layout - Premium Spatial System
   ============================================ */
.app-shell {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-bg);
}

.app-container {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ============================================
   Header - Clean Navigation
   ============================================ */
.app-header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: 0;
  padding: var(--space-3) var(--space-5);
  padding-top: calc(var(--space-3) + env(safe-area-inset-top, 0px));
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border-subtle);
  position: relative;
  flex-shrink: 0;
}

@media (prefers-color-scheme: dark) {
  .app-header {
    background: var(--color-surface);
    border-bottom-color: var(--color-border-subtle);
  }
}

@media (min-width: 640px) {
  .app-header {
    padding: var(--space-3) var(--space-6);
  }
}

/* Title - left aligned */
.app-title {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

/* App Icon - Simple favicon display */
.app-icon {
  width: 32px;
  height: 32px;
}

/* Header Tabs - Clean Segmented Control (centered in grid) */
.header-tabs {
  justify-self: center;
  display: flex;
  gap: 2px;
  padding: 3px;
  background: var(--color-bg-muted);
  border-radius: var(--radius-lg);
  position: relative;
}

@media (prefers-color-scheme: dark) {
  .header-tabs {
    background: var(--color-bg-muted);
  }
}

/* Sliding indicator */
.header-tabs::before {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: calc(50% - 4px);
  height: calc(100% - 6px);
  background: var(--color-surface);
  border-radius: calc(var(--radius-lg) - 3px);
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-fast);
  z-index: 0;
}

@media (prefers-color-scheme: dark) {
  .header-tabs::before {
    background: var(--color-surface-elevated);
  }
}

.header-tabs.chat-active::before {
  transform: translateX(calc(100% + 3px));
}

.header-tabs button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  border: none;
  border-radius: calc(var(--radius-xl) - 4px);
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: color 0.2s ease, transform 0.2s ease;
  min-height: 36px;
  position: relative;
  z-index: 1;
  flex: 1;
}

.header-tabs button svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  transition: transform 0.3s var(--ease-spring);
}

.header-tabs button span {
  display: none;
}

@media (min-width: 400px) {
  .header-tabs button span {
    display: inline;
  }
}

.header-tabs button:hover:not(.active) {
  color: var(--color-text-secondary);
}

.header-tabs button:hover:not(.active) svg {
  transform: scale(1.1);
}

.header-tabs button.active {
  color: var(--color-text);
}

.header-tabs button.active svg {
  color: var(--color-accent);
}

.header-tabs button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-accent);
}

@media (min-width: 900px) {
  .header-tabs {
    display: none;
  }
}

/* Header Actions - Right aligned in grid */
.header-actions {
  justify-self: end;
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.header-actions-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

/* Profile Avatar - Clean */
.profile-menu-container {
  position: relative;
}

.profile-avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  padding: 0;
  background: var(--color-bg-muted);
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color var(--transition-fast);
  position: relative;
  z-index: 2;
}

.profile-avatar:hover {
  border-color: var(--color-accent);
}

.profile-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-avatar-initials {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--color-text-secondary);
  text-transform: uppercase;
}

/* Profile menu backdrop - covers entire screen */
.profile-menu-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9998;
  background: transparent;
}

/* Profile Menu - Clean Dropdown */
.profile-menu {
  position: fixed;
  top: auto;
  right: var(--space-4);
  min-width: 220px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: 9999;
  overflow: hidden;
  animation: menuFadeIn 0.15s ease-out;
  transform-origin: top right;
}

@keyframes menuFadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-color-scheme: dark) {
  .profile-menu {
    background: var(--color-surface);
    border-color: var(--color-border);
  }
}

.profile-menu-header {
  padding: var(--space-5) var(--space-5) var(--space-4);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: linear-gradient(180deg, rgba(99, 102, 241, 0.05) 0%, transparent 100%);
}

@media (prefers-color-scheme: dark) {
  .profile-menu-header {
    border-bottom-color: rgba(255, 255, 255, 0.06);
    background: linear-gradient(180deg, rgba(99, 102, 241, 0.08) 0%, transparent 100%);
  }
}

.profile-menu-name {
  display: block;
  font-size: var(--text-base);
  font-weight: var(--font-bold);
  color: var(--color-text);
  letter-spacing: var(--tracking-tight);
}

.profile-menu-email {
  display: block;
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  margin-top: 4px;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-menu-divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.06);
  margin: var(--space-2) 0;
}

@media (prefers-color-scheme: dark) {
  .profile-menu-divider {
    background: rgba(255, 255, 255, 0.06);
  }
}

.profile-menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-5);
  border: none;
  background: none;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s var(--ease-spring);
  text-align: left;
  margin: var(--space-1) var(--space-2);
  border-radius: var(--radius-lg);
  width: calc(100% - var(--space-4));
}

.profile-menu-item:hover {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.08) 100%);
  color: var(--color-text);
  transform: translateX(2px);
}

.profile-menu-item:hover svg {
  color: var(--color-accent);
  transform: scale(1.1);
}

.profile-menu-item:active {
  background: rgba(99, 102, 241, 0.15);
  transform: translateX(2px) scale(0.98);
}

.profile-menu-item svg {
  flex-shrink: 0;
  transition: all 0.2s var(--ease-spring);
}

/* Danger variant for destructive actions */
.profile-menu-item.danger:hover {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.08) 100%);
  color: var(--color-danger);
}

.profile-menu-item.danger:hover svg {
  color: var(--color-danger);
}

/* Profile menu footer padding */
.profile-menu-item:last-child {
  margin-bottom: var(--space-2);
}

/* Main grid - Mobile first: flex column, tablet/desktop: grid */
.main-grid {
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  min-height: 0;
  gap: 0;
}

@media (min-width: 900px) {
  .main-grid {
    display: grid;
    grid-template-columns: minmax(360px, 0.9fr) minmax(400px, 1.1fr);
    gap: var(--space-5);
    align-items: stretch;
    flex: 1 1 0;
    min-height: 0;
  }
}

@media (min-width: 1200px) {
  .main-grid {
    grid-template-columns: minmax(400px, 0.85fr) minmax(480px, 1.15fr);
    gap: var(--space-7);
  }
}

/* ============================================
   Mobile Tabs - Clean Segmented Control
   ============================================ */
.mobile-tabs {
  display: flex;
  gap: 2px;
  padding: 3px;
  margin-bottom: var(--space-4);
  background: var(--color-bg-muted);
  border-radius: var(--radius-lg);
}

@media (prefers-color-scheme: dark) {
  .mobile-tabs {
    background: var(--color-bg-muted);
  }
}

.mobile-tabs button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2-5) var(--space-3);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  border: none;
  border-radius: calc(var(--radius-lg) - 3px);
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: color var(--transition-fast), background var(--transition-fast);
}

.mobile-tabs button svg {
  width: 18px;
  height: 18px;
}

.mobile-tabs button:hover:not(.active) {
  color: var(--color-text-secondary);
}

.mobile-tabs button.active {
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-sm);
}

@media (prefers-color-scheme: dark) {
  .mobile-tabs button.active {
    background: var(--color-surface-elevated);
  }
}

.mobile-tabs button.active svg {
  color: var(--color-accent);
}

.mobile-tabs button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3);
}

@media (min-width: 900px) {
  .mobile-tabs {
    display: none;
  }
}

/* ============================================
   Panels - Clean Containers
   ============================================ */
.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: visible;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  height: 100%;
  min-height: 0;
  position: relative;
}

.panel.hidden {
  display: none;
}

@media (prefers-color-scheme: dark) {
  .panel {
    background: var(--color-surface);
    border-color: var(--color-border);
  }
}

@media (min-width: 900px) {
  .panel.hidden {
    display: flex;
  }

  .panel {
    min-height: 560px;
    max-height: calc(100vh - 140px);
    max-height: calc(100dvh - 140px);
    border-radius: var(--radius-xl);
  }
}

/* Panel Header - Clean */
.panel-header {
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-shrink: 0;
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
}

@media (prefers-color-scheme: dark) {
  .panel-header {
    border-bottom-color: var(--color-border-subtle);
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, transparent 100%);
  }

  .panel-header::before {
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(99, 102, 241, 0.5) 30%,
      rgba(139, 92, 246, 0.6) 50%,
      rgba(99, 102, 241, 0.5) 70%,
      transparent 100%
    );
  }
}

.panel-header h2 {
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  color: var(--color-text-tertiary);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.panel-header h2 svg {
  width: 16px;
  height: 16px;
  color: var(--color-accent);
}

/* Panel Header Logo - Premium with glow */
.panel-header-logo {
  width: 26px;
  height: 26px;
  object-fit: contain;
  filter: drop-shadow(0 2px 8px rgba(99, 102, 241, 0.3));
  transition: all 0.3s ease;
}

.panel-header:hover .panel-header-logo {
  filter: drop-shadow(0 4px 12px rgba(99, 102, 241, 0.5));
  transform: scale(1.05);
}

/* Notes count badge - Premium pill */
.panel-header .text-muted {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--color-text-tertiary);
  background: rgba(99, 102, 241, 0.08);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  transition: all 0.2s ease;
}

.panel-header:hover .text-muted {
  background: rgba(99, 102, 241, 0.12);
  color: var(--color-accent);
}

.panel-body {
  padding: var(--space-5);
  flex: 1 1 auto;
  height: 100%;
  min-height: 0;
  overflow: visible;
  display: flex;
  flex-direction: column;
  background: transparent;
  border-radius: 0 0 var(--radius-3xl) var(--radius-3xl);
  position: relative;
  box-sizing: border-box;
}

/* Subtle ambient glow at bottom of panel body */
.panel-body::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 70%;
  height: 100px;
  background: radial-gradient(
    ellipse at center bottom,
    rgba(99, 102, 241, 0.06) 0%,
    rgba(139, 92, 246, 0.04) 40%,
    transparent 70%
  );
  pointer-events: none;
  z-index: 0;
  opacity: 0.8;
}

@media (prefers-color-scheme: dark) {
  .panel-body::after {
    background: radial-gradient(
      ellipse at center bottom,
      rgba(99, 102, 241, 0.1) 0%,
      rgba(139, 92, 246, 0.08) 40%,
      transparent 70%
    );
    opacity: 1;
  }
}

/* ============================================
   Buttons - Clean, Minimal Style
   3 variants: default, primary, ghost
   ============================================ */
.btn {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  border-radius: var(--radius-md);
  padding: var(--space-2-5) var(--space-4);
  font-family: inherit;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
  transition:
    background var(--transition-fast),
    border-color var(--transition-fast),
    transform var(--transition-fast);
}

@media (prefers-color-scheme: dark) {
  .btn {
    background: var(--color-surface-secondary);
    border-color: var(--color-border);
  }
}

.btn svg {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

.btn:hover:not(:disabled) {
  background: var(--color-surface-hover);
  border-color: var(--color-border-strong);
}

.btn:active:not(:disabled) {
  transform: scale(0.98);
}

.btn:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* Primary - Solid accent color (no gradient for regular buttons) */
.btn-primary {
  background: var(--color-accent);
  border-color: transparent;
  color: white;
  font-weight: var(--font-medium);
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-accent-hover);
  border-color: transparent;
}

.btn-primary:focus-visible {
  box-shadow: var(--shadow-focus);
}

/* Ghost - Invisible until hover */
.btn-ghost {
  background: transparent;
  border-color: transparent;
}

.btn-ghost:hover:not(:disabled) {
  background: var(--color-surface-hover);
  border-color: transparent;
}

/* Icon button */
.btn-icon {
  padding: var(--space-2);
  min-width: 36px;
  min-height: 36px;
  border-radius: var(--radius-md);
}

.btn-icon svg {
  width: 18px;
  height: 18px;
}

/* Size variants */
.btn-sm {
  padding: var(--space-1-5) var(--space-3);
  font-size: var(--text-sm);
  min-height: 32px;
  border-radius: var(--radius-sm);
}

.btn-sm svg {
  width: 14px;
  height: 14px;
}

.btn-xs {
  padding: var(--space-1) var(--space-2-5);
  font-size: var(--text-xs);
  min-height: 26px;
  border-radius: var(--radius-sm);
}

/* Danger variant */
.btn-danger {
  color: var(--color-danger);
}

.btn-danger:hover:not(:disabled) {
  background: var(--color-danger-bg);
  border-color: var(--color-danger-border);
}

/* AI button - ONLY for AI actions, uses gradient */
.btn-ai {
  background: var(--brand-aurora);
  border-color: transparent;
  color: white;
  font-weight: var(--font-medium);
}

.btn-ai:hover:not(:disabled) {
  opacity: 0.9;
  border-color: transparent;
}

/* ============================================
   Composer - Clean, Minimal Input
   ============================================ */
.composer {
  padding-bottom: var(--space-3);
  flex-shrink: 0;
  position: relative;
}

.composer-wrapper {
  position: relative;
}

.composer-input {
  width: 100%;
  min-height: 52px;
  max-height: 200px;
  resize: none;
  padding: var(--space-3) var(--space-4);
  padding-right: 100px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  font-family: inherit;
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  transition: border-color var(--transition-fast);
}

@media (prefers-color-scheme: dark) {
  .composer-input {
    background: var(--color-surface);
    border-color: var(--color-border);
  }
}

.composer-expanded .composer-input {
  min-height: 100px;
}

.composer-input::placeholder {
  color: var(--color-placeholder);
}

.composer-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: var(--shadow-focus);
}

@media (prefers-color-scheme: dark) {
  .composer-input:focus {
    border-color: var(--color-accent);
  }
}

/* Composer action buttons container */
.composer-actions {
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

/* AI Send Button - Gradient only for AI */
.composer-send-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  border: none;
  background: var(--color-accent);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background var(--transition-fast), transform var(--transition-fast);
}

.composer-send-btn svg {
  width: 18px;
  height: 18px;
}

.composer-send-btn:hover:not(:disabled) {
  background: var(--color-accent-hover);
}

.composer-send-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.composer-send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: var(--color-bg-muted);
}

/* Microphone button - Clean */
.composer-mic-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.composer-mic-btn svg {
  width: 18px;
  height: 18px;
}

.composer-mic-btn:hover:not(:disabled) {
  background: var(--color-surface-hover);
  color: var(--color-text);
}

.composer-mic-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Recording state - Simple red indicator */
.composer-mic-btn.recording {
  background: var(--color-danger);
  color: white;
}

.composer-mic-btn.transcribing {
  background: var(--color-accent);
  color: white;
}

/* ============================================
   Audio Preview - Voice note preview with editable transcript
   ============================================ */
.audio-preview-container {
  background: var(--color-surface-elevated);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  overflow: hidden;
  margin-bottom: var(--space-3);
}

.audio-preview-bar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.audio-preview-play-btn {
  width: 36px;
  height: 36px;
  min-width: 36px;
  border-radius: var(--radius-full);
  border: none;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.audio-preview-play-btn:hover {
  background: var(--color-primary-hover);
  transform: scale(1.05);
}

.audio-preview-play-btn:active {
  transform: scale(0.95);
}

.audio-preview-play-btn svg {
  width: 18px;
  height: 18px;
}

.audio-preview-progress {
  flex: 1;
  height: 6px;
  background: var(--color-border);
  border-radius: var(--radius-full);
  overflow: hidden;
  position: relative;
}

.audio-preview-progress-bar {
  height: 100%;
  background: var(--color-primary);
  border-radius: var(--radius-full);
  transition: width 0.1s linear;
}

.audio-preview-time {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
  min-width: 70px;
  text-align: right;
}

/* Editable transcript area */
.audio-preview-transcript {
  padding: var(--space-3) var(--space-4);
}

.audio-preview-transcript-input {
  width: 100%;
  min-height: 80px;
  max-height: 150px;
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font-family: inherit;
  font-size: var(--text-sm);
  line-height: 1.5;
  resize: vertical;
  transition: border-color var(--transition-fast);
}

.audio-preview-transcript-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.audio-preview-transcript-input::placeholder {
  color: var(--color-text-tertiary);
  font-style: italic;
}

/* Footer with actions */
.audio-preview-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
}

.audio-preview-hint {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.audio-preview-actions {
  display: flex;
  gap: var(--space-2);
}

.audio-preview-confirm-btn,
.audio-preview-cancel-btn {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  border: none;
  font-size: var(--text-xs);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.audio-preview-confirm-btn svg,
.audio-preview-cancel-btn svg {
  width: 14px;
  height: 14px;
}

.audio-preview-confirm-btn {
  background: var(--color-success, #22c55e);
  color: white;
}

.audio-preview-confirm-btn:hover:not(:disabled) {
  background: var(--color-success-hover, #16a34a);
}

.audio-preview-confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.audio-preview-cancel-btn {
  background: var(--color-surface-hover);
  color: var(--color-text-secondary);
}

.audio-preview-cancel-btn:hover:not(:disabled) {
  background: var(--color-danger);
  color: white;
}

/* Live transcript while recording */
.recording-transcript {
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface-elevated);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-2);
  border: 1px solid var(--color-border);
}

.recording-transcript-label {
  font-size: var(--text-xs);
  color: var(--color-danger);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: var(--space-1);
  margin-bottom: var(--space-2);
}

.recording-transcript-label::before {
  content: '';
  width: 8px;
  height: 8px;
  background: var(--color-danger);
  border-radius: var(--radius-full);
  animation: pulse-recording 1.5s ease-in-out infinite;
}

@keyframes pulse-recording {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}

.recording-transcript-text {
  font-size: var(--text-sm);
  color: var(--color-text);
  line-height: 1.5;
  margin: 0;
}

/* AI Enhancement Status */
.enhancement-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-2);
}

.enhancement-badge {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--color-primary);
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.enhancement-skip-btn {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.enhancement-skip-btn:hover {
  color: var(--color-text-secondary);
  background: var(--color-surface-hover);
}

.audio-preview-transcript-input.enhancing {
  background: linear-gradient(
    90deg,
    var(--color-surface) 0%,
    var(--color-surface-elevated) 50%,
    var(--color-surface) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 2s ease-in-out infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.enhancement-comparison {
  margin-top: var(--space-2);
  display: flex;
  justify-content: flex-end;
}

.enhancement-toggle-btn {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  background: none;
  border: 1px solid var(--color-border);
  cursor: pointer;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.enhancement-toggle-btn:hover {
  color: var(--color-text-secondary);
  border-color: var(--color-text-tertiary);
}

/* Enhancement failed notice with retry */
.enhancement-failed-notice {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  margin-bottom: var(--space-2);
  background: var(--color-warning-bg);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  color: var(--color-warning);
}

.enhancement-failed-notice svg {
  flex-shrink: 0;
}

.enhancement-failed-notice .btn {
  margin-left: auto;
  padding: var(--space-1) var(--space-2);
  font-size: var(--text-xs);
  background: var(--color-surface);
  border: 1px solid var(--color-warning);
  color: var(--color-warning);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.enhancement-failed-notice .btn:hover {
  background: var(--color-warning);
  color: white;
}

.composer-char-count {
  font-size: var(--text-2xs);
  color: var(--color-muted);
  text-align: right;
  padding-top: var(--space-2);
  padding-right: var(--space-2);
  font-variant-numeric: tabular-nums;
}

/* Composer footer with char count and classification */
.composer-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--space-2);
}

.composer-footer .composer-char-count {
  padding-top: 0;
}

.composer-classification {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  opacity: 0.8;
}

.classification-icon {
  font-size: 14px;
}

/* Template button */
.composer-template-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  border: none;
  background: rgba(0, 0, 0, 0.04);
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.composer-template-btn:hover:not(:disabled) {
  background: rgba(99, 102, 241, 0.1);
  color: var(--color-accent);
}

.composer-template-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* Suggested tags row */
.composer-suggestions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-1);
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  animation: fadeIn 0.2s ease-out;
}

.suggestion-label {
  color: var(--color-muted);
}

.suggested-tag {
  background: rgba(99, 102, 241, 0.08);
  color: var(--color-accent);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: var(--text-2xs);
}

/* Template picker */
.template-picker {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  margin-bottom: var(--space-2);
  z-index: 50;
  animation: slideUpFadeIn 0.2s ease-out;
}

.template-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  font-weight: 500;
  font-size: var(--text-sm);
}

.template-close {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: var(--space-1);
  border-radius: var(--radius-sm);
}

.template-close:hover {
  background: var(--color-bg-hover);
}

.template-list {
  max-height: 280px;
  overflow-y: auto;
  padding: var(--space-2);
}

.template-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: none;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease;
}

.template-item:hover {
  background: var(--color-bg-hover);
}

.template-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-muted);
  border-radius: var(--radius-md);
}

.template-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.template-name {
  font-weight: 500;
  font-size: var(--text-sm);
  color: var(--color-text);
}

.template-desc {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}

/* Template suggestion inline */
.template-suggestion {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  background: var(--color-bg-muted);
  border-radius: var(--radius-md);
  margin-top: var(--space-2);
  animation: fadeIn 0.3s ease-out;
}

.template-link {
  background: none;
  border: none;
  color: var(--color-accent);
  cursor: pointer;
  font-weight: 500;
  padding: 0;
}

.template-link:hover {
  text-decoration: underline;
}

@keyframes slideUpFadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ============================================
   Notes List - Premium Scroll Experience
   ============================================ */
.notes-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  margin-top: var(--space-5);
  padding-right: 12px;
  margin-right: -12px;
  scroll-behavior: smooth;
  /* Fade edges for premium scroll effect */
  mask-image: linear-gradient(
    to bottom,
    transparent 0,
    black 16px,
    black calc(100% - 32px),
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0,
    black 16px,
    black calc(100% - 32px),
    transparent 100%
  );
}

/* Custom scrollbar - Premium gradient style */
.notes-scroll::-webkit-scrollbar {
  width: 8px;
}

.notes-scroll::-webkit-scrollbar-track {
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(99, 102, 241, 0.03) 50%,
    transparent 100%
  );
  border-radius: var(--radius-full);
}

.notes-scroll::-webkit-scrollbar-thumb {
  background: linear-gradient(
    180deg,
    rgba(99, 102, 241, 0.25) 0%,
    rgba(139, 92, 246, 0.25) 100%
  );
  border-radius: var(--radius-full);
  border: 2px solid transparent;
  background-clip: padding-box;
  transition: background 0.2s ease;
}

.notes-scroll::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(
    180deg,
    rgba(99, 102, 241, 0.45) 0%,
    rgba(139, 92, 246, 0.45) 100%
  );
  background-clip: padding-box;
}

.notes-scroll::-webkit-scrollbar-thumb:active {
  background: linear-gradient(
    180deg,
    rgba(99, 102, 241, 0.6) 0%,
    rgba(139, 92, 246, 0.6) 100%
  );
  background-clip: padding-box;
}

/* Notes Groups - Premium date grouping */
.notes-group {
  margin-bottom: var(--space-7);
  animation: groupFadeIn 0.5s var(--ease-spring) backwards;
}

.notes-group:nth-child(1) { animation-delay: 0s; }
.notes-group:nth-child(2) { animation-delay: 0.08s; }
.notes-group:nth-child(3) { animation-delay: 0.16s; }
.notes-group:nth-child(4) { animation-delay: 0.24s; }
.notes-group:nth-child(5) { animation-delay: 0.32s; }

@keyframes groupFadeIn {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.notes-group:last-child {
  margin-bottom: 0;
}

/* Date Group Header - Premium Pill Style with glow */
.notes-group-header {
  padding: var(--space-2) 0;
  margin-bottom: var(--space-4);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  position: relative;
}

.notes-group-header::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(
    90deg,
    rgba(99, 102, 241, 0.2) 0%,
    rgba(139, 92, 246, 0.1) 30%,
    transparent 70%
  );
}

.notes-group-title {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-2xs);
  font-weight: var(--font-bold);
  color: var(--color-accent);
  text-transform: uppercase;
  letter-spacing: 0.14em;
  padding: var(--space-1-5) var(--space-3-5);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%);
  border-radius: var(--radius-full);
  border: 1px solid rgba(99, 102, 241, 0.12);
  transition: all 0.3s var(--ease-spring);
  position: relative;
  overflow: hidden;
}

/* Subtle shimmer on group title */
.notes-group-title::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 100%
  );
  animation: groupTitleShimmer 3s ease-in-out infinite;
}

@keyframes groupTitleShimmer {
  0%, 100% { left: -100%; }
  50% { left: 100%; }
}

.notes-group-header:hover .notes-group-title {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.18) 0%, rgba(139, 92, 246, 0.14) 100%);
  border-color: rgba(99, 102, 241, 0.25);
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
}

@media (prefers-color-scheme: dark) {
  .notes-group-header::after {
    background: linear-gradient(
      90deg,
      rgba(99, 102, 241, 0.3) 0%,
      rgba(139, 92, 246, 0.15) 30%,
      transparent 70%
    );
  }

  .notes-group-title {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.22) 0%, rgba(139, 92, 246, 0.16) 100%);
    border-color: rgba(99, 102, 241, 0.2);
  }

  .notes-group-title::before {
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.15) 50%,
      transparent 100%
    );
  }

  .notes-group-header:hover .notes-group-title {
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.25);
  }
}

/* Notes List - Premium layout with entrance animations */
.notes-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2-5);
  background: transparent;
  border-radius: var(--radius-2xl);
  overflow: visible;
}

/* Note card entrance animation */
.notes-list > div {
  animation: noteSlideIn 0.35s var(--ease-spring) backwards;
}

.notes-list > div:nth-child(1) { animation-delay: 0s; }
.notes-list > div:nth-child(2) { animation-delay: 0.03s; }
.notes-list > div:nth-child(3) { animation-delay: 0.06s; }
.notes-list > div:nth-child(4) { animation-delay: 0.09s; }
.notes-list > div:nth-child(5) { animation-delay: 0.12s; }
.notes-list > div:nth-child(n+6) { animation-delay: 0.15s; }

@keyframes noteSlideIn {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Note Card - Clean, content-focused */
.note-card {
  padding: var(--space-4);
  background: var(--color-surface);
  cursor: pointer;
  position: relative;
  border-radius: var(--radius-lg);
  margin: 0;
  border: 1px solid var(--color-border);
  transition: border-color var(--transition-fast), background var(--transition-fast);
}

@media (prefers-color-scheme: dark) {
  .note-card {
    background: var(--color-surface);
    border-color: var(--color-border);
  }
}

@media (min-width: 640px) {
  .note-card {
    padding: var(--space-5);
  }
}

.note-card:hover {
  border-color: var(--color-border-strong);
}

@media (prefers-color-scheme: dark) {
  .note-card:hover {
    border-color: var(--color-border-strong);
  }
}

.note-card:active {
  background: var(--color-surface-pressed);
}

.note-card:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);
}

/* Selected/Highlighted state - Simple accent border */
.note-card.selected,
.note-card.highlighted {
  border-color: var(--color-accent);
  background: var(--color-accent-light);
}

.note-card:hover .note-actions {
  opacity: 1;
}

/* Note title - Clean typography */
.note-title {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  line-height: var(--leading-snug);
  color: var(--color-text);
  margin-bottom: var(--space-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Note preview - secondary content */
.note-preview {
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-3);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Full note text (expanded) */
.note-text {
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--color-text);
  margin-bottom: var(--space-4);
}

/* Note footer with time and actions */
.note-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border-subtle);
  margin-top: auto;
}

.note-time {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  font-weight: var(--font-medium);
  display: flex;
  align-items: center;
  gap: var(--space-1-5);
}

/* Action buttons - Simple hover reveal */
.note-actions {
  display: flex;
  gap: var(--space-1);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.note-card:hover .note-actions,
.note-card:focus-within .note-actions,
.note-actions-visible {
  opacity: 1;
}

/* Note action buttons - Clean style */
.note-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.note-action-btn svg {
  width: 16px;
  height: 16px;
}

.note-action-btn:hover {
  background: var(--color-surface-hover);
  color: var(--color-text);
}

.note-action-btn:active {
  background: var(--color-surface-pressed);
}

.note-action-btn:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);
}

.note-action-danger:hover {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

.note-action-danger:focus-visible {
  box-shadow: var(--shadow-focus);
}

/* Pending state - Subtle pulse */
.note-card.pending {
  opacity: 0.6;
  pointer-events: none;
}

.note-card.pending::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.1), transparent);
  animation: pendingShimmer 1.5s ease-in-out infinite;
}

@keyframes pendingShimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.note-card.pending .note-time {
  color: var(--color-accent);
}

/* Highlighted state - Premium glow animation */
.note-card.highlighted {
  animation: note-highlight-premium 2.5s ease-out;
}

@keyframes note-highlight-premium {
  0% {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.15) 100%);
    box-shadow:
      0 0 0 4px rgba(99, 102, 241, 0.25),
      0 8px 32px rgba(99, 102, 241, 0.2);
    transform: scale(1.02);
  }
  50% {
    box-shadow:
      0 0 0 2px rgba(99, 102, 241, 0.15),
      0 4px 16px rgba(99, 102, 241, 0.1);
  }
  100% {
    background: rgba(255, 255, 255, 0.75);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
    transform: scale(1);
  }
}

/* Swipe hint states for mobile gestures */
.note-card.swipe-edit {
  background: rgba(99, 102, 241, 0.1);
  border-color: rgba(99, 102, 241, 0.2);
}

.note-card.swipe-delete {
  background: rgba(229, 72, 77, 0.1);
  border-color: rgba(229, 72, 77, 0.2);
}

/* Long press state */
.note-card.long-pressing {
  background: var(--color-surface-pressed);
}

/* Overflow menu button (⋯) */
.note-overflow-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: all 0.15s var(--ease-out);
}

.note-overflow-btn:hover {
  background: var(--color-bg-muted);
  color: var(--color-text);
}

.note-overflow-btn:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus-ring);
}

/* Overflow menu dropdown */
.note-overflow-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: var(--space-1);
  min-width: 160px;
  padding: var(--space-1);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-overlay);
  animation: menu-appear 0.15s var(--ease-out);
}

@keyframes menu-appear {
  from {
    opacity: 0;
    transform: translateY(-4px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.note-overflow-menu-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-text);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.1s var(--ease-out);
}

.note-overflow-menu-item:hover {
  background: var(--color-surface-hover);
}

.note-overflow-menu-item.danger {
  color: var(--color-danger);
}

.note-overflow-menu-item.danger:hover {
  background: var(--color-danger-bg);
}

/* Empty state - Premium Delightful */
.empty-state {
  padding: var(--space-12) var(--space-6);
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: var(--text-base);
}

.empty-state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-20) var(--space-6);
  text-align: center;
  animation: emptyStateIn 0.6s var(--ease-spring);
  position: relative;
}

/* Subtle decorative orbs behind empty state */
.empty-state-container::before,
.empty-state-container::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  filter: blur(40px);
  opacity: 0.4;
  pointer-events: none;
}

.empty-state-container::before {
  width: 120px;
  height: 120px;
  background: rgba(99, 102, 241, 0.2);
  top: 20%;
  left: 25%;
  animation: orb-float-slow 8s ease-in-out infinite;
}

.empty-state-container::after {
  width: 80px;
  height: 80px;
  background: rgba(139, 92, 246, 0.2);
  bottom: 30%;
  right: 25%;
  animation: orb-float-slow 8s ease-in-out infinite reverse;
}

@keyframes emptyStateIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes orb-float-slow {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(10px, -15px); }
}

/* Error state for notes */
.notes-error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12) var(--space-6);
  text-align: center;
}

.notes-error-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  margin-bottom: var(--space-4);
  border-radius: var(--radius-full);
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

.notes-error-title {
  font-size: var(--text-md);
  font-weight: var(--font-semibold);
  color: var(--color-text);
  margin: 0 0 var(--space-2) 0;
}

.notes-error-message {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-4) 0;
  max-width: 280px;
}

.notes-error-retry {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2-5) var(--space-4);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.notes-error-retry:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-border-strong);
}

/* Empty State Icon - Premium Animated */
.empty-state-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 96px;
  margin-bottom: var(--space-7);
  border-radius: var(--radius-3xl);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%);
  color: var(--color-accent);
  animation: gentle-float 5s ease-in-out infinite, icon-pulse 3s ease-in-out infinite;
  box-shadow:
    0 12px 32px rgba(99, 102, 241, 0.15),
    0 4px 12px rgba(99, 102, 241, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  position: relative;
  z-index: 1;
}

/* Animated ring around icon */
.empty-state-icon::before {
  content: '';
  position: absolute;
  inset: -8px;
  border-radius: inherit;
  border: 2px dashed rgba(99, 102, 241, 0.2);
  animation: rotate-slow 20s linear infinite;
}

@keyframes gentle-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

@keyframes icon-pulse {
  0%, 100% {
    box-shadow:
      0 12px 32px rgba(99, 102, 241, 0.15),
      0 4px 12px rgba(99, 102, 241, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);
  }
  50% {
    box-shadow:
      0 16px 40px rgba(99, 102, 241, 0.2),
      0 8px 20px rgba(99, 102, 241, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.7);
  }
}

@keyframes rotate-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.empty-state-icon svg {
  width: 40px;
  height: 40px;
  filter: drop-shadow(0 2px 4px rgba(99, 102, 241, 0.2));
}

.empty-state-title {
  margin: 0 0 var(--space-3) 0;
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--color-text);
  letter-spacing: var(--tracking-tight);
  position: relative;
  z-index: 1;
}

.empty-state-description {
  margin: 0;
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  max-width: 300px;
  line-height: var(--leading-relaxed);
  position: relative;
  z-index: 1;
}

/* Skeleton - Refined shimmer */
.skeleton {
  height: 80px;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  position: relative;
  overflow: hidden;
}

.skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(0, 0, 0, 0.03) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.8s ease-in-out infinite;
}

.skeleton + .skeleton {
  margin-top: var(--space-2);
}

/* Note Card Skeleton - matches NoteCard layout */
.note-card-skeleton {
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.note-card-skeleton + .note-card-skeleton {
  margin-top: var(--space-2);
}

.skeleton-text {
  margin-bottom: var(--space-3);
}

.skeleton-line {
  height: 14px;
  border-radius: var(--radius-sm);
  background: var(--color-bg-muted);
  position: relative;
  overflow: hidden;
}

.skeleton-line::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, var(--color-surface), transparent);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-line + .skeleton-line {
  margin-top: var(--space-2);
}

.skeleton-line-full {
  width: 100%;
}

.skeleton-line-medium {
  width: 65%;
}

.skeleton-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.skeleton-time {
  width: 60px;
  height: 12px;
  border-radius: var(--radius-sm);
  background: var(--color-bg-muted);
}

.skeleton-id {
  width: 40px;
  height: 12px;
  border-radius: var(--radius-sm);
  background: var(--color-bg-muted);
}

/* ============================================
   Chat Panel - Premium AI experience with ambient effects
   ============================================ */

/* Chat panel without header - full height body */
.panel-chat {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Ambient aurora glow effect */
.panel-chat::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -30%;
  width: 80%;
  height: 100%;
  background: radial-gradient(
    ellipse at center,
    rgba(99, 102, 241, 0.04) 0%,
    rgba(139, 92, 246, 0.02) 40%,
    transparent 70%
  );
  pointer-events: none;
  z-index: 0;
  animation: chatAmbientFloat 20s ease-in-out infinite;
}

.panel-chat::after {
  content: '';
  position: absolute;
  bottom: -30%;
  left: -20%;
  width: 60%;
  height: 80%;
  background: radial-gradient(
    ellipse at center,
    rgba(139, 92, 246, 0.03) 0%,
    rgba(168, 85, 247, 0.015) 40%,
    transparent 70%
  );
  pointer-events: none;
  z-index: 0;
  animation: chatAmbientFloat 25s ease-in-out infinite reverse;
}

@keyframes chatAmbientFloat {
  0%, 100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.8;
  }
  33% {
    transform: translate(5%, 3%) scale(1.05);
    opacity: 1;
  }
  66% {
    transform: translate(-3%, -2%) scale(0.95);
    opacity: 0.7;
  }
}

.panel-chat > .panel-body {
  position: relative;
  z-index: 1;
  padding: var(--space-4) var(--space-5) 0 var(--space-5); /* No bottom padding - input sits at bottom */
  border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
  flex: 1 1 auto; /* Fill via flex */
  height: 100%; /* Ensure full height */
  min-height: 0; /* Allow shrinking */
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
}

@media (min-width: 900px) {
  .panel-chat > .panel-body {
    border-radius: var(--radius-3xl) var(--radius-3xl) 0 0;
  }
}

.chat-container {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto; /* Grow to fill available space */
  height: 100%; /* Ensure full height */
  min-height: 0; /* Critical for flex child to allow shrinking */
  overflow: hidden; /* Contain scrollable children */
  gap: var(--space-3); /* Space between suggestions, messages, and input */
  box-sizing: border-box;
}

.chat-suggestions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
  padding: 0; /* Parent panel-body handles padding */
  flex-shrink: 0; /* Don't shrink suggestions */
  flex-grow: 0; /* Don't grow suggestions */
}

@media (max-width: 480px) {
  .chat-suggestions {
    grid-template-columns: 1fr;
    gap: var(--space-2);
  }
}

.suggestion-chip {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: border-color var(--transition-fast), background var(--transition-fast);
  text-align: left;
  line-height: var(--leading-snug);
}

@media (prefers-color-scheme: dark) {
  .suggestion-chip {
    background: var(--color-surface);
    border-color: var(--color-border);
  }
}

.suggestion-chip:hover {
  border-color: var(--color-border-strong);
  color: var(--color-text);
}

@media (prefers-color-scheme: dark) {
  .suggestion-chip:hover {
    border-color: var(--color-border-strong);
  }
}

.suggestion-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-accent-light);
  border-radius: var(--radius-md);
  color: var(--color-accent);
}

.suggestion-chip:active {
  background: var(--color-surface-pressed);
}

.suggestion-chip:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);
}

.suggestion-chip:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.suggestion-text {
  flex: 1;
  min-width: 0;
}

/* Chat Messages - Scroll Container */
.chat-messages {
  flex: 1 1 auto; /* Grow to fill available space, shrink if needed */
  min-height: 0; /* Critical for flex shrinking */
  max-height: 100%; /* Ensure it doesn't exceed container */
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: 0 10px var(--space-3) 0; /* Minimal padding for scrollbar space */
  padding-right: calc(10px + 10px); /* Extra space for scrollbar */
  margin-right: -10px; /* Compensate for scrollbar padding */
  scroll-behavior: smooth;
  /* Fade edges for scroll experience */
  mask-image: linear-gradient(
    to bottom,
    transparent 0,
    black 16px,
    black calc(100% - 32px),
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0,
    black 20px,
    black calc(100% - 40px),
    transparent 100%
  );
}

/* Premium gradient scrollbar */
.chat-messages::-webkit-scrollbar {
  width: 8px;
}

.chat-messages::-webkit-scrollbar-track {
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(99, 102, 241, 0.03) 50%,
    transparent 100%
  );
  border-radius: var(--radius-full);
}

.chat-messages::-webkit-scrollbar-thumb {
  background: linear-gradient(
    180deg,
    rgba(99, 102, 241, 0.25) 0%,
    rgba(139, 92, 246, 0.25) 100%
  );
  border-radius: var(--radius-full);
  border: 2px solid transparent;
  background-clip: padding-box;
  transition: background 0.2s ease;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(
    180deg,
    rgba(99, 102, 241, 0.45) 0%,
    rgba(139, 92, 246, 0.45) 100%
  );
  background-clip: padding-box;
}

.chat-messages::-webkit-scrollbar-thumb:active {
  background: linear-gradient(
    180deg,
    rgba(99, 102, 241, 0.6) 0%,
    rgba(139, 92, 246, 0.6) 100%
  );
  background-clip: padding-box;
}

/* Chat Empty State - Clean */
.chat-empty {
  flex: 1 1 0; /* Fill available space in messages area */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-8);
  color: var(--color-text-tertiary);
  min-height: 0; /* Allow shrinking */
}

.chat-empty-icon {
  width: 88px;
  height: 88px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-6);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%);
  border-radius: var(--radius-3xl);
  color: var(--color-accent);
  animation: chat-icon-float 5s ease-in-out infinite, chat-icon-pulse 3s ease-in-out infinite;
  box-shadow:
    0 12px 32px rgba(99, 102, 241, 0.15),
    0 4px 12px rgba(99, 102, 241, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  position: relative;
  z-index: 1;
}

/* Animated ring around icon */
.chat-empty-icon::before {
  content: '';
  position: absolute;
  inset: -10px;
  border-radius: inherit;
  border: 2px dashed rgba(99, 102, 241, 0.2);
  animation: rotate-slow-chat 20s linear infinite;
}

@keyframes chat-icon-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

@keyframes chat-icon-pulse {
  0%, 100% {
    box-shadow:
      0 12px 32px rgba(99, 102, 241, 0.15),
      0 4px 12px rgba(99, 102, 241, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);
  }
  50% {
    box-shadow:
      0 16px 40px rgba(99, 102, 241, 0.2),
      0 8px 20px rgba(99, 102, 241, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.7);
  }
}

@keyframes rotate-slow-chat {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.chat-empty-icon svg {
  width: 40px;
  height: 40px;
  filter: drop-shadow(0 2px 4px rgba(99, 102, 241, 0.2));
}

.chat-empty h3 {
  margin-bottom: var(--space-3);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--color-text);
  letter-spacing: var(--tracking-tight);
  position: relative;
  z-index: 1;
}

.chat-empty p {
  font-size: var(--text-base);
  max-width: 300px;
  color: var(--color-text-secondary);
  line-height: var(--leading-relaxed);
  position: relative;
  z-index: 1;
}

/* Chat landing with suggestions - Premium */
.chat-landing {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-10);
  gap: var(--space-10);
  animation: chatLandingIn 0.5s var(--ease-spring);
}

@keyframes chatLandingIn {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chat-landing-header {
  text-align: center;
  position: relative;
  z-index: 1;
}

.chat-landing-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--color-text);
  margin: 0 0 var(--space-3) 0;
  letter-spacing: var(--tracking-tight);
  background: linear-gradient(135deg, var(--color-text) 0%, var(--color-accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.chat-landing-subtitle {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  margin: 0;
  max-width: 320px;
  line-height: var(--leading-relaxed);
}

/* Chat Clear Button - Minimal style at bottom of messages */
.chat-clear-container {
  display: flex;
  justify-content: center;
  padding: var(--space-4) 0;
}

.chat-clear-btn {
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-tertiary);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all 0.2s ease;
}

.chat-clear-btn:hover {
  color: var(--color-text-secondary);
  border-color: var(--color-border-strong);
  background: rgba(0, 0, 0, 0.02);
}

@media (prefers-color-scheme: dark) {
  .chat-clear-btn:hover {
    background: rgba(255, 255, 255, 0.04);
  }
}

/* Chat Input Area - Fixed at bottom */
.chat-input-area {
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
	padding: 0 0 var(--space-4) 0; /* Bottom padding for breathing room */
	flex-shrink: 0; /* Never shrink */
	flex-grow: 0; /* Never grow */
	background: transparent;
	position: relative;
	z-index: 10;
	border-top: none;
}

/* Input wrapper - Clean */
.chat-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  transition: border-color var(--transition-fast);
  z-index: 1;
}

@media (prefers-color-scheme: dark) {
  .chat-input-wrapper {
    background: var(--color-surface);
    border-color: var(--color-border);
  }
}

.chat-input-wrapper:hover {
  border-color: var(--color-border-strong);
}

.chat-input-wrapper:focus-within {
  border-color: var(--color-accent);
  box-shadow: var(--shadow-focus);
}

.chat-input {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  padding-right: 52px;
  border: none;
  border-radius: var(--radius-lg);
  background: transparent;
  color: var(--color-text);
  font-family: inherit;
  font-size: var(--text-base);
  position: relative;
  z-index: 1;
}

.chat-input:focus {
  outline: none;
  box-shadow: none;
}

.chat-input:focus-visible {
  outline: none;
  box-shadow: none;
}

.chat-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chat-input::placeholder {
  color: var(--color-placeholder);
  transition: color 0.2s ease, transform 0.2s ease;
}

.chat-input:focus::placeholder {
  color: var(--color-text-tertiary);
}

.chat-input.input-error {
  color: var(--color-danger);
}

/* Send Button - Premium Aurora Style */
.chat-send-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 42px;
  height: 42px;
  border-radius: var(--radius-full);
  border: none;
  background: var(--color-text-tertiary);
  color: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.35s var(--ease-spring);
  z-index: 2;
}

.chat-send-btn svg {
  transition: transform 0.25s var(--ease-spring);
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

.chat-send-btn:disabled {
  opacity: 0.25;
  cursor: not-allowed;
  transform: translateY(-50%) scale(0.95);
}

/* Active send button - Premium Aurora */
.chat-send-btn.active {
  background: linear-gradient(135deg, var(--color-accent) 0%, #8B5CF6 50%, #A855F7 100%);
  box-shadow:
    0 6px 20px rgba(99, 102, 241, 0.45),
    0 2px 8px rgba(139, 92, 246, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
  animation: sendBtnReady 0.4s var(--ease-spring);
}

@keyframes sendBtnReady {
  0% {
    transform: translateY(-50%) scale(0.9);
    opacity: 0.8;
  }
  50% {
    transform: translateY(-50%) scale(1.05);
  }
  100% {
    transform: translateY(-50%) scale(1);
    opacity: 1;
  }
}

.chat-send-btn.active:hover {
  transform: translateY(-50%) scale(1.12);
  box-shadow:
    0 8px 28px rgba(99, 102, 241, 0.55),
    0 4px 12px rgba(139, 92, 246, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.chat-send-btn.active:hover svg {
  transform: translateX(3px) rotate(-5deg);
}

.chat-send-btn.active:active {
  transform: translateY(-50%) scale(0.92);
  box-shadow:
    0 4px 12px rgba(99, 102, 241, 0.4),
    0 2px 6px rgba(139, 92, 246, 0.25);
}

/* Cancelling state - Premium red */
.chat-send-btn.is-cancelling {
  background: linear-gradient(135deg, #EF4444 0%, #DC2626 50%, #B91C1C 100%);
  box-shadow:
    0 6px 20px rgba(239, 68, 68, 0.45),
    0 2px 8px rgba(220, 38, 38, 0.3);
  animation: cancelPulse 1s ease-in-out infinite;
}

@keyframes cancelPulse {
  0%, 100% {
    box-shadow:
      0 6px 20px rgba(239, 68, 68, 0.45),
      0 2px 8px rgba(220, 38, 38, 0.3);
  }
  50% {
    box-shadow:
      0 8px 28px rgba(239, 68, 68, 0.6),
      0 4px 12px rgba(220, 38, 38, 0.4);
  }
}

/* Mic button focus - no separate outline, wrapper handles focus */
.chat-mic-btn:focus,
.chat-mic-btn:focus-visible {
  outline: none;
  box-shadow: none;
}

/* Mic button for voice input - Premium style */
.chat-mic-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin-left: 8px;
  flex-shrink: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: color var(--transition-fast), border-color var(--transition-fast);
}

@media (prefers-color-scheme: dark) {
  .chat-mic-btn {
    background: var(--color-surface);
  }
}

.chat-mic-btn:hover:not(:disabled) {
  color: var(--color-accent);
  border-color: var(--color-accent);
}

.chat-mic-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.chat-mic-btn.recording {
  color: white;
  background: var(--color-danger);
  border-color: var(--color-danger);
  animation: pulse-mic 1.5s ease-in-out infinite;
}

@keyframes pulse-mic {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* Chat input - adjust padding when mic button present */
.chat-input.has-mic {
  padding-left: var(--space-3);
}

/* Recording state indicator */
.chat-input-wrapper.recording {
  border: 1px solid var(--color-danger);
  background: var(--color-danger-bg);
}

.chat-input-wrapper.recording .chat-input::placeholder {
  color: var(--color-danger);
}

/* Legacy row style - kept for backwards compatibility */
.chat-input-row {
  display: flex;
  gap: var(--space-2);
  flex: 1;
}

.rate-limit-notice {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2-5);
  width: 100%;
  padding: var(--space-2-5) var(--space-4);
  background: var(--color-warning-bg);
  border: 1px solid var(--color-warning);
  border-radius: var(--radius-lg);
  color: var(--color-warning);
  font-size: var(--text-sm);
  margin-bottom: var(--space-2);
}

.rate-limit-notice svg {
  flex-shrink: 0;
  margin-top: 2px;
}

.rate-limit-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-0-5);
}

.rate-limit-content strong {
  font-weight: var(--font-semibold);
}

.rate-limit-content span {
  font-size: var(--text-xs);
  opacity: 0.9;
}

.chat-char-count {
  font-size: var(--text-2xs);
  color: var(--color-muted);
  text-align: right;
  padding-top: var(--space-1);
  font-variant-numeric: tabular-nums;
}

.chat-char-count.over-limit {
  color: var(--color-danger);
  font-weight: var(--font-semibold);
}

/* Chat Messages - Premium Style with Refined Animations */
.chat-message {
  display: flex;
  flex-direction: column;
  gap: 8px;
  animation: messageSlideIn 0.4s var(--ease-spring);
  position: relative;
}

/* User messages slide in from right */
.chat-message.user {
  align-items: flex-end;
  animation: userMessageIn 0.4s var(--ease-spring);
}

/* Assistant messages slide in from left */
.chat-message.assistant {
  align-items: flex-start;
  animation: assistantMessageIn 0.4s var(--ease-spring);
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes userMessageIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes assistantMessageIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.chat-message-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
  padding: 0 var(--space-4);
}

.chat-timestamp {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  font-weight: var(--font-medium);
  opacity: 0.8;
}

/* Copy button - Clean */
.chat-copy-btn {
  opacity: 0;
  transition: opacity var(--transition-fast);
  padding: var(--space-1);
  border-radius: var(--radius-md);
  background: var(--color-bg-muted);
}

@media (prefers-color-scheme: dark) {
  .chat-copy-btn {
    background: var(--color-surface-elevated);
  }
}

.chat-message:hover .chat-copy-btn {
  opacity: 1;
}

.chat-copy-btn:hover {
  color: var(--color-accent);
}

/* Chat Bubble - Clean Base Styles */
.chat-bubble {
  max-width: 85%;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
  word-break: break-word;
}

/* User messages - Solid accent color */
.chat-message.user .chat-bubble {
  background: var(--color-accent);
  color: white;
  border-bottom-right-radius: var(--radius-xs);
}

/* Assistant messages - Clean surface */
.chat-message.assistant .chat-bubble {
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-bottom-left-radius: var(--radius-xs);
}

@media (prefers-color-scheme: dark) {
  .chat-message.assistant .chat-bubble {
    background: var(--color-surface);
    border-color: var(--color-border);
  }
}

/* Citation badges - Clean pill */
.citation-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  padding: 2px 6px;
  margin: 0 3px;
  background: var(--color-accent-light);
  color: var(--color-accent);
  border-radius: var(--radius-full);
  font-size: var(--text-2xs);
  font-weight: var(--font-semibold);
  font-family: var(--font-mono);
  cursor: pointer;
  transition: background var(--transition-fast);
  vertical-align: middle;
}

.citation-link:hover {
  background: var(--color-accent);
  color: white;
}

/* Sources summary - Apple-style */
.chat-sources-summary {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  margin-top: var(--space-2);
}

.sources-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: var(--font-medium);
}

.sources-label svg {
  width: 14px;
  height: 14px;
  opacity: 0.7;
}

.sources-chips {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.retrieval-time {
  margin-left: auto;
  font-size: var(--text-2xs);
  font-family: var(--font-mono);
  color: var(--color-muted);
  cursor: help;
}

/* Source chip - Premium gradient style */
.source-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  padding: 4px 10px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.06) 100%);
  color: var(--color-accent);
  border: 1px solid rgba(99, 102, 241, 0.12);
  border-radius: var(--radius-full);
  font-size: var(--text-2xs);
  font-weight: var(--font-bold);
  font-family: var(--font-mono);
  cursor: pointer;
  transition: all 0.25s var(--ease-spring);
  box-shadow: 0 2px 6px rgba(99, 102, 241, 0.08);
}

.source-chip:hover,
.source-chip.active {
  background: linear-gradient(135deg, var(--color-accent) 0%, #8B5CF6 100%);
  color: white;
  border-color: transparent;
  transform: scale(1.08);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
}

/* Source Reference Chip (inline in messages) - Premium */
.source-chip-wrapper {
  position: relative;
  display: inline;
}

.source-ref-chip {
  display: inline;
  padding: 2px 6px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.08) 100%);
  color: var(--color-accent);
  border: none;
  border-radius: var(--radius-md);
  font-size: inherit;
  font-weight: var(--font-bold);
  font-family: var(--font-mono);
  cursor: pointer;
  transition: all 0.2s var(--ease-spring);
}

.source-ref-chip:hover {
  background: linear-gradient(135deg, var(--color-accent) 0%, #8B5CF6 100%);
  color: white;
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

/* Source tooltip - Clean */
.source-tooltip {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  z-index: var(--z-tooltip);
  width: max-content;
  max-width: 280px;
  padding: var(--space-3);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  animation: tooltip-appear 0.15s ease-out;
}

@media (prefers-color-scheme: dark) {
  .source-tooltip {
    background: var(--color-surface);
    border-color: var(--color-border);
  }
}

@keyframes tooltip-appear {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.source-tooltip-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.source-tooltip-badge {
  padding: 2px 6px;
  background: var(--color-accent);
  color: white;
  border-radius: var(--radius-sm);
  font-size: var(--text-2xs);
  font-weight: var(--font-semibold);
  font-family: var(--font-mono);
}

.source-tooltip-score {
  font-size: var(--text-2xs);
  color: var(--color-success);
  font-weight: var(--font-medium);
}

.source-tooltip-text {
  margin: 0;
  font-size: var(--text-xs);
  line-height: var(--leading-relaxed);
  color: var(--color-text-secondary);
}

.source-tooltip-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--space-2);
  font-size: var(--text-2xs);
  color: var(--color-text-tertiary);
}

.source-tooltip-hint {
  font-weight: var(--font-medium);
}

/* Source Badge (for source lists) */
.source-badge-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 3px 7px;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: var(--text-2xs);
  font-weight: var(--font-bold);
  font-family: var(--font-mono);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.source-badge-chip:hover,
.source-badge-chip.active {
  background: var(--color-surface-hover);
  color: var(--color-text);
}

/* Context source badges (not directly cited) */
.source-badge-chip.context {
  background: transparent;
  border-style: dashed;
  color: var(--color-muted);
  opacity: 0.7;
}

.source-badge-chip.context:hover,
.source-badge-chip.context.active {
  background: var(--color-surface);
  color: var(--color-text);
  opacity: 1;
}

/* Sources label for context sources */
.sources-label-context {
  color: var(--color-muted);
}

/* Chat Message Footer - Sources + Feedback on same line */
.chat-message-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-1);
  max-width: 85%;
}

.chat-footer-sources {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
  flex: 1;
  min-width: 0;
}

.chat-footer-feedback {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  flex-shrink: 0;
}

.chat-footer-feedback .feedback-btn {
  opacity: 0.5;
  transition: opacity var(--transition-fast), color var(--transition-fast);
}

.chat-footer-feedback .feedback-btn:hover {
  opacity: 1;
}

.chat-footer-feedback .feedback-btn:hover:first-of-type {
  color: var(--color-success);
}

.chat-footer-feedback .feedback-btn:hover:last-of-type {
  color: var(--color-error);
}

.feedback-thanks {
  font-size: 11px;
  color: var(--color-text-tertiary);
  font-style: italic;
  white-space: nowrap;
}

/* Feedback comment form (for thumbs-down) */
.feedback-comment-form {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  max-width: 220px;
}

.feedback-comment-input {
  flex: 1;
  min-width: 0;
  padding: var(--space-1-5) var(--space-2);
  font-size: 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.feedback-comment-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.feedback-comment-input::placeholder {
  color: var(--color-text-tertiary);
}

.feedback-comment-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Streaming cursor - Premium aurora pulse */
.streaming-cursor {
  display: inline-block;
  width: 3px;
  height: 1.15em;
  background: linear-gradient(180deg, var(--color-accent) 0%, #8B5CF6 100%);
  margin-left: 3px;
  vertical-align: text-bottom;
  border-radius: 2px;
  animation: cursorPulse 1.2s ease-in-out infinite;
  box-shadow: 0 0 8px rgba(99, 102, 241, 0.4);
}

@keyframes cursorPulse {
  0%, 100% {
    opacity: 1;
    transform: scaleY(1);
    box-shadow: 0 0 8px rgba(99, 102, 241, 0.4);
  }
  50% {
    opacity: 0.6;
    transform: scaleY(0.85);
    box-shadow: 0 0 12px rgba(139, 92, 246, 0.6);
  }
}

/* Chat Message Skeleton */
.chat-message-skeleton {
  animation: none;
}

.chat-message-skeleton .message-content {
  max-width: 85%;
  padding: var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
}

.chat-message-skeleton.user .message-content {
  background: var(--color-primary);
  opacity: 0.3;
}

.chat-message-skeleton .skeleton-text {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.chat-message-skeleton .skeleton-line {
  height: 12px;
  background: var(--color-skeleton);
  border-radius: var(--radius-sm);
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.chat-message-skeleton .skeleton-line-full {
  width: 100%;
}

.chat-message-skeleton .skeleton-line-long {
  width: 85%;
}

.chat-message-skeleton .skeleton-line-medium {
  width: 60%;
}

.chat-message-skeleton .skeleton-meta {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.chat-message-skeleton .skeleton-badge {
  width: 60px;
  height: 20px;
  background: var(--color-skeleton);
  border-radius: var(--radius-full);
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

/* Confidence warning for AI responses */
.confidence-warning {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  margin-top: var(--space-2);
  background: var(--color-warning-bg);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  color: var(--color-warning);
}

.confidence-warning svg {
  flex-shrink: 0;
}

.confidence-warning.severe {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

/* Streaming progress indicator - Premium aurora */
.streaming-elapsed {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2-5) var(--space-4);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
  font-weight: var(--font-medium);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.06) 0%, rgba(139, 92, 246, 0.04) 100%);
  border-radius: var(--radius-full);
  border: 1px solid rgba(99, 102, 241, 0.1);
}

.streaming-elapsed::before {
  content: '';
  width: 8px;
  height: 8px;
  background: linear-gradient(135deg, var(--color-accent) 0%, #8B5CF6 100%);
  border-radius: 50%;
  animation: streamingPulse 1.2s ease-in-out infinite;
  box-shadow: 0 0 8px rgba(99, 102, 241, 0.4);
}

@keyframes streamingPulse {
  0%, 100% {
    opacity: 0.5;
    transform: scale(0.85);
    box-shadow: 0 0 6px rgba(99, 102, 241, 0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.15);
    box-shadow: 0 0 12px rgba(139, 92, 246, 0.6);
  }
}

/* Suggested follow-up questions */
.suggested-questions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border-subtle);
}

.suggested-questions .suggestion-chip {
  padding: var(--space-1-5) var(--space-3);
  font-size: var(--text-xs);
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.suggested-questions .suggestion-chip:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-border-strong);
  color: var(--color-text);
}

/* Response time display */
.response-time {
  font-size: 11px;
  color: var(--color-text-tertiary);
  font-family: var(--font-mono);
}

/* Loading */
.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-4);
  color: var(--color-text-tertiary);
  font-size: 13px;
}

.load-more-btn {
  width: 100%;
  margin-top: var(--space-3);
}

/* ============================================
   Searching Note Overlay
   ============================================ */
.searching-note-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 900;
  animation: fade-in 0.15s var(--ease-out);
}

.searching-note-content {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  font-size: 14px;
  font-weight: var(--font-medium);
  color: var(--color-text);
}

/* ============================================
   Toast - Clean Notifications
   ============================================ */
.toast-container {
  position: fixed;
  bottom: var(--space-5);
  right: var(--space-5);
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  pointer-events: none;
}

@media (max-width: 640px) {
  .toast-container {
    left: var(--space-4);
    right: var(--space-4);
    bottom: var(--space-4);
  }
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text);
  pointer-events: auto;
}

@media (prefers-color-scheme: dark) {
  .toast {
    background: var(--color-surface);
    border-color: var(--color-border);
  }
}

.toast-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.toast-icon svg {
  width: 16px;
  height: 16px;
}

.toast.success .toast-icon {
  color: var(--color-success);
}

.toast.error .toast-icon {
  color: var(--color-danger);
}

.toast.info .toast-icon {
  color: var(--color-accent);
}

/* Error display */
.error-inline {
  margin-top: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-danger-bg);
  border: 1px solid var(--color-danger-border);
  color: var(--color-danger);
  font-size: 13px;
}

/* Spinner - Aurora gradient style */
.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(139, 92, 246, 0.2);
  border-top-color: var(--color-primary);
  border-radius: var(--radius-full);
  animation: spin 0.8s linear infinite;
}

.spinner-sm {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(139, 92, 246, 0.2);
  border-top-color: var(--color-primary);
  border-radius: var(--radius-full);
  animation: spin 0.8s linear infinite;
}

/* Aurora gradient spinner for special states */
.spinner-aurora {
  width: 20px;
  height: 20px;
  border: 2px solid transparent;
  border-radius: var(--radius-full);
  background:
    linear-gradient(var(--color-surface), var(--color-surface)) padding-box,
    var(--brand-aurora) border-box;
  animation: spin 1s linear infinite;
}

.btn-ai .spinner,
.btn-primary .spinner {
  border-color: rgba(255, 255, 255, 0.3);
  border-top-color: white;
}

/* Cancelling state */
.btn.is-cancelling {
  opacity: 0.6;
  cursor: not-allowed;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* AI typing indicator - Simple dots */
.ai-typing {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: var(--space-2);
}

.ai-typing span {
  width: 6px;
  height: 6px;
  background: var(--color-accent);
  border-radius: 50%;
  animation: ai-dot-pulse 1.2s ease-in-out infinite;
}

.ai-typing span:nth-child(2) {
  animation-delay: 0.15s;
}

.ai-typing span:nth-child(3) {
  animation-delay: 0.3s;
}

/* AI Processing indicator - Simple */
.ai-processing {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1-5) var(--space-3);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
}

.ai-processing::before {
  content: '';
  width: 6px;
  height: 6px;
  background: var(--color-accent);
  border-radius: 50%;
  animation: ai-dot-pulse 1.2s ease-in-out infinite;
}

/* AI Enhancement Status Badge */
.ai-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  background: var(--color-accent-subtle);
  border-radius: var(--radius-full);
  font-size: var(--text-2xs);
  font-weight: var(--font-medium);
  color: var(--color-accent);
}

.ai-badge svg {
  width: 12px;
  height: 12px;
}

/* AI Status Indicator - Simple states */
.ai-status-indicator {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1-5) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

.ai-status-indicator.idle {
  background: var(--color-bg-muted);
  color: var(--color-text-tertiary);
}

.ai-status-indicator.thinking {
  background: var(--color-accent-subtle);
  color: var(--color-accent);
}

.ai-status-indicator.thinking::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-accent);
  animation: ai-dot-pulse 1.2s ease-in-out infinite;
}

.ai-status-indicator.processing {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

.ai-status-indicator.processing::before {
  content: '';
  width: 12px;
  height: 12px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.ai-status-indicator.success {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.ai-status-indicator.error {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

/* ============================================
   Notes Toolbar - Premium Glass Search
   ============================================ */
.notes-toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-2-5);
  padding-bottom: var(--space-4);
}

.search-box {
  position: relative;
  flex: 1;
}

/* Ambient glow behind search on focus */
.search-box::before {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: calc(var(--radius-xl) + 4px);
  background: linear-gradient(
    135deg,
    rgba(99, 102, 241, 0.15) 0%,
    rgba(139, 92, 246, 0.1) 100%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: -1;
  filter: blur(8px);
}

.search-box:focus-within::before {
  opacity: 1;
}

.search-box svg {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-tertiary);
  pointer-events: none;
  width: 16px;
  height: 16px;
  transition: all 0.3s var(--ease-spring);
}

.search-box:focus-within svg {
  color: var(--color-accent);
  transform: translateY(-50%) scale(1.1);
}

.search-input {
  width: 100%;
  padding: 10px 36px 10px 40px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font-family: inherit;
  font-size: var(--text-sm);
  transition: border-color var(--transition-fast);
}

@media (prefers-color-scheme: dark) {
  .search-input {
    background: var(--color-surface);
    border-color: var(--color-border);
  }
}

.search-input::placeholder {
  color: var(--color-placeholder);
}

.search-input:hover:not(:focus) {
  border-color: var(--color-border-strong);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: var(--shadow-focus);
}

.search-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--color-text-tertiary);
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 10px;
  transition: color var(--transition-fast);
}

.search-clear:hover {
  color: var(--color-text);
}

/* Search highlight */
.search-highlight,
mark.highlight {
  background: rgba(255, 204, 0, 0.3);
  color: inherit;
  padding: 1px 3px;
  border-radius: var(--radius-xs);
}


/* ============================================
   Sources Panel - Side drawer
   ============================================ */
.chat-panel-body {
  display: flex;
  flex-direction: column; /* Stack chat container vertically */
  gap: 0;
  flex: 1 1 auto; /* Fill parent height via flex */
  height: 100%; /* Ensure full height */
  min-height: 0; /* Allow flex shrinking for proper scroll containment */
  overflow: hidden; /* Contain children */
  padding: 0; /* Remove padding - parent panel-body handles it */
  box-sizing: border-box;
}

.chat-container.with-sources {
  flex: 1;
  min-width: 0;
  min-height: 0; /* Allow shrinking */
}

/* Sources Modal Overlay */
.sources-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--space-4);
}

.sources-modal {
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-modal);
}

@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-scale-in {
  animation: scale-in 0.25s var(--ease-spring);
}

.sources-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-separator);
}

.sources-modal-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-text);
  letter-spacing: var(--tracking-tight);
}

.sources-count {
  padding: 2px 7px;
  font-size: var(--text-2xs);
  font-weight: var(--font-bold);
  font-family: var(--font-mono);
  background: var(--color-surface-hover);
  color: var(--color-text-secondary);
  border-radius: var(--radius-full);
}

.sources-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-5);
}

.sources-trust-hint {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-4);
  background: var(--color-success-bg);
  border: 1px solid var(--color-success-border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-success);
}

.sources-trust-hint svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.sources-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.source-card {
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  cursor: pointer;
  transition: all var(--transition-normal);
}

.source-card:hover {
  background: var(--color-surface-hover);
  box-shadow: var(--shadow-sm);
}

.source-card:active {
  transform: scale(0.99);
}

.source-card.selected {
  border-color: var(--color-text);
  background: var(--color-surface);
  box-shadow: var(--shadow-focus);
}

.source-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.source-badge {
  padding: 3px 8px;
  font-size: var(--text-2xs);
  font-weight: var(--font-bold);
  background: var(--color-text);
  color: white;
  border-radius: var(--radius-full);
}

.source-score {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
}

.source-score svg {
  width: 12px;
  height: 12px;
}

.source-snippet {
  margin: 0 0 12px;
  font-size: 14px;
  line-height: var(--leading-relaxed);
  color: var(--color-text);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.source-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid var(--color-border-subtle);
}

.source-card-footer .btn {
  color: var(--color-ai);
  font-weight: var(--font-medium);
}

.source-time {
  font-size: 12px;
  color: var(--color-text-secondary);
}


/* ============================================
   Citation Tooltip - Premium popover
   ============================================ */
.citation-chip-wrapper {
  position: relative;
  display: inline;
}

.citation-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  padding: 3px 8px;
  margin: 0 4px;
  background: var(--color-surface-elevated);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: 10px;
  font-weight: var(--font-bold);
  font-family: var(--font-mono);
  cursor: pointer;
  transition: all var(--transition-normal);
  vertical-align: middle;
  box-shadow: var(--shadow-xs);
}

.citation-chip:hover {
  background: var(--color-ai-bg);
  color: var(--color-ai);
  border-color: var(--color-ai-border);
  transform: scale(1.1);
  box-shadow: var(--shadow-sm);
}

.citation-tooltip {
  position: absolute;
  bottom: calc(100% + 12px);
  left: 50%;
  transform: translateX(-50%);
  width: 280px;
  padding: var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  pointer-events: none;
  animation: tooltip-in 0.2s var(--ease-out);
}

@keyframes tooltip-in {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.citation-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 7px solid transparent;
  border-top-color: var(--color-surface);
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.05));
}

.citation-tooltip-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.citation-tooltip-badge {
  padding: 4px 10px;
  font-size: 10px;
  font-weight: var(--font-bold);
  font-family: var(--font-mono);
  background: var(--color-surface-elevated);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
}

.citation-tooltip-score {
  font-size: 10px;
  color: var(--color-muted);
}

.citation-tooltip-text {
  margin: 0 0 10px;
  font-size: 12px;
  line-height: var(--leading-relaxed);
  color: var(--color-text);
}

.citation-tooltip-hint {
  font-size: 10px;
  font-weight: var(--font-medium);
  color: var(--color-ai);
}

/* Chat bubble states */
.chat-bubble-loading {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chat-bubble-error {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex-wrap: wrap;
  background: var(--color-danger-bg);
  border: 1px solid var(--color-danger-border);
  color: var(--color-danger);
}

.chat-bubble-error .error-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.chat-bubble-error .retry-btn {
  margin-left: auto;
  margin-top: 8px;
  color: var(--color-danger);
  border-color: var(--color-danger-border);
}

.chat-bubble-error .retry-btn:hover {
  background: var(--color-danger);
  color: white;
  border-color: var(--color-danger);
}

/* ============================================
   Note Detail Drawer - Clean Modal
   ============================================ */
.note-drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--space-5);
}

.note-drawer {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  max-width: 600px;
  width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

@media (prefers-color-scheme: dark) {
  .note-drawer {
    background: var(--color-surface);
    border-color: var(--color-border);
  }
}

.note-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border-subtle);
}

.note-drawer-header h3 {
  display: flex;
  align-items: center;
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-text);
}

.note-drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-5);
}

.note-detail-text {
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--color-text);
}

.note-drawer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-5);
  border-top: 1px solid var(--color-border-subtle);
}

.note-drawer-meta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.note-drawer-time {
  display: flex;
  align-items: center;
  font-weight: var(--font-medium);
}

.note-drawer-id {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  padding: 2px 8px;
  background: var(--color-bg-muted);
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
}

.note-drawer-actions {
  display: flex;
  gap: var(--space-2);
}

/* ============================================
   Utilities & Helpers - Apple-style
   ============================================ */
/* Note: .sr-only is defined in Reset & Base Styles section */
/* Note: :focus-visible is defined in Reset & Base Styles section */
/* Note: ::selection is defined in Utility Classes section */

/* Stagger animation for lists - Apple-style cascade */
.stagger-children > * {
  animation: fade-slide-in 0.35s var(--ease-out) backwards;
}

.stagger-children > *:nth-child(1) { animation-delay: 0.03s; }
.stagger-children > *:nth-child(2) { animation-delay: 0.06s; }
.stagger-children > *:nth-child(3) { animation-delay: 0.09s; }
.stagger-children > *:nth-child(4) { animation-delay: 0.12s; }
.stagger-children > *:nth-child(5) { animation-delay: 0.15s; }
.stagger-children > *:nth-child(6) { animation-delay: 0.18s; }
.stagger-children > *:nth-child(7) { animation-delay: 0.21s; }
.stagger-children > *:nth-child(8) { animation-delay: 0.24s; }

@keyframes fade-slide-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Smooth appear animation */
.animate-appear {
  animation: appear 0.3s var(--ease-out);
}

@keyframes appear {
  from {
    opacity: 0;
    transform: scale(0.97);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* ============================================
   Premium Animations - Apple & Tesla Inspired
   Spring physics and smooth transitions
   ============================================ */

/* Base fade animation */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Legacy alias for fade-in (used by some components) */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide up with spring physics */
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Apple-style slide-in from right */
@keyframes slide-in-right {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Apple-style slide-in from left */
@keyframes slide-in-left {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Spring bounce entrance */
@keyframes spring-in {
  0% {
    opacity: 0;
    transform: scale(0.9) translateY(10px);
  }
  50% {
    transform: scale(1.02) translateY(-2px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Tesla-style smooth float */
@keyframes float-smooth {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

/* Subtle scale entrance */
@keyframes scale-bounce {
  0% {
    opacity: 0;
    transform: scale(0.95);
  }
  60% {
    transform: scale(1.02);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* Utility classes for animations */
.animate-fade-in {
  animation: fade-in 0.25s var(--ease-out) forwards;
}

.animate-slide-up {
  animation: slide-up 0.3s var(--ease-spring) forwards;
}

.animate-slide-right {
  animation: slide-in-right 0.3s var(--ease-spring) forwards;
}

.animate-slide-left {
  animation: slide-in-left 0.3s var(--ease-spring) forwards;
}

.animate-spring-in {
  animation: spring-in 0.4s var(--ease-spring) forwards;
}

.animate-scale-bounce {
  animation: scale-bounce 0.35s var(--ease-spring) forwards;
}

.animate-float {
  animation: float-smooth 3s ease-in-out infinite;
}

/* Staggered animation delays for lists */
.stagger-1 { animation-delay: 0.05s; }
.stagger-2 { animation-delay: 0.1s; }
.stagger-3 { animation-delay: 0.15s; }
.stagger-4 { animation-delay: 0.2s; }
.stagger-5 { animation-delay: 0.25s; }
.stagger-6 { animation-delay: 0.3s; }
.stagger-7 { animation-delay: 0.35s; }
.stagger-8 { animation-delay: 0.4s; }

/* Premium stagger for grid items - Apple-style cascade */
.stagger-grid > * {
  animation: grid-item-in 0.4s var(--ease-tesla) backwards;
}
.stagger-grid > *:nth-child(1) { animation-delay: 0.02s; }
.stagger-grid > *:nth-child(2) { animation-delay: 0.04s; }
.stagger-grid > *:nth-child(3) { animation-delay: 0.06s; }
.stagger-grid > *:nth-child(4) { animation-delay: 0.08s; }
.stagger-grid > *:nth-child(5) { animation-delay: 0.1s; }
.stagger-grid > *:nth-child(6) { animation-delay: 0.12s; }

@keyframes grid-item-in {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.97);
    filter: blur(2px);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}

/* Smooth content reveal - Tesla-inspired */
.animate-reveal {
  animation: content-reveal 0.5s var(--ease-tesla) forwards;
}

@keyframes content-reveal {
  from {
    opacity: 0;
    transform: translateY(8px);
    filter: blur(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}

/* Magnetic hover effect for premium CTAs */
.btn-magnetic {
  transition: transform 0.2s var(--ease-out);
}

/* Elastic press feedback */
.press-elastic:active {
  animation: elastic-press 0.4s var(--ease-spring);
}

@keyframes elastic-press {
  0% { transform: scale(1); }
  30% { transform: scale(0.94); }
  50% { transform: scale(1.02); }
  70% { transform: scale(0.98); }
  100% { transform: scale(1); }
}

/* Subtle glow for AI elements */
.glow-ai {
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.08);
}

/* Enhanced gradient text */
.gradient-text {
  background: var(--brand-aurora);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Elevated panel effect */
.glass-panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-lg);
}

/* ============================================
   Mobile Optimizations (up to tablet portrait)
   ============================================ */
@media (max-width: 899px) {
  /* Landing page - allow normal scrolling */
  html:has(.landing-page), body:has(.landing-page) {
    overflow: auto;
    height: auto;
  }

  .landing-page {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .main-grid {
    flex: 1 1 0;
    min-height: 0;
    overflow: hidden;
    padding-bottom: 0;
    display: flex;
    flex-direction: column;
  }

  /* Full-width panel without card styling */
  .panel {
    border: none;
    border-radius: 0;
    min-height: 0;
    max-height: none;
    flex: 1 1 0;
    box-shadow: none;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .panel-header {
    padding: var(--space-3) var(--space-4);
    border-radius: 0;
    flex-shrink: 0;
  }

  .panel-body {
    padding: 0;
    border-radius: 0;
    overflow: hidden;
    flex: 1 1 0;
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  /* Header - compact on mobile */
  .app-header {
    padding: var(--space-2) var(--space-3);
    padding-top: calc(var(--space-2) + env(safe-area-inset-top, 0px));
  }

  .app-icon {
    width: 28px;
    height: 28px;
  }

  /* Chat panel body - CRITICAL: flex column to push input to bottom */
  .chat-panel-body {
    display: flex;
    flex-direction: column;
    flex: 1 1 0; /* Fill panel body height via flex */
    min-height: 0;
    overflow: hidden;
  }

  /* Chat container - fills remaining space */
  .chat-container {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto; /* Fill parent height via flex */
    height: 100%; /* Ensure full height */
    min-height: 0;
    overflow: hidden;
    padding: 0;
  }

  /* Chat messages - scrollable area that fills available space */
  .chat-messages {
    flex: 1 1 auto;
    min-height: 0;
    max-height: none; /* Let flex control height */
    overflow-y: auto;
    overflow-x: hidden;
    padding: 0 10px var(--space-3) 0; /* Minimal padding for scrollbar space */
    padding-right: calc(10px + 10px);
    margin-right: -10px;
  }

  /* Chat input - FIXED at bottom, never scrolls away */
  .chat-input-area {
    flex-shrink: 0;
    padding: 0 0 var(--space-3) 0; /* Bottom padding for safe area + breathing room */
    padding-bottom: calc(var(--space-3) + env(safe-area-inset-bottom, 0px));
    background: transparent;
    position: relative;
    z-index: 10;
  }

  /* Composer optimization - iOS-friendly */
  .composer-input {
    min-height: 64px;
    font-size: 16px; /* Prevents iOS zoom on focus */
    border-radius: var(--radius-lg);
  }

  .composer-row {
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  /* Chat input optimization - iOS-friendly */
  .chat-input {
    font-size: 16px; /* Prevents iOS zoom on focus */
    padding: var(--space-3) var(--space-4);
    padding-right: 48px; /* Space for send button */
  }

  .chat-input-wrapper {
    /* No extra margin needed - parent has padding */
  }

  .chat-send-btn {
    width: 30px;
    height: 30px;
    right: 5px;
  }

  /* Mic button on mobile */
  .chat-mic-btn {
    width: 32px;
    height: 32px;
    margin-left: 4px;
  }

  /* Adjust input padding with mic */
  .chat-input.has-mic {
    padding-left: var(--space-1);
  }

  /* Chat messages - Apple-style bubbles */
  .chat-bubble {
    padding: var(--space-3);
    font-size: var(--text-sm);
    max-width: 92%;
    border-radius: var(--radius-xl);
  }

  .chat-empty {
    padding: var(--space-6);
  }

  .chat-empty-icon {
    width: 72px;
    height: 72px;
  }

  .chat-empty h3 {
    font-size: var(--text-lg);
  }

  .chat-empty p {
    font-size: var(--text-sm);
  }

  /* Suggestions on mobile - compact with horizontal padding */
  .chat-suggestions {
    display: flex; /* Override grid with flex for wrapping */
    flex-wrap: wrap;
    gap: var(--space-2);
    padding: 0; /* Parent panel-body handles padding */
  }

  .suggestion-chip {
    font-size: var(--text-xs);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-md);
  }

  /* Note cards - compact but readable */
  .note-card {
    padding: var(--space-3);
    border-radius: var(--radius-lg);
  }

  .note-text {
    font-size: var(--text-sm);
    line-height: var(--leading-relaxed);
  }

  /* Sources modal - iOS sheet style */
  .sources-modal-overlay {
    padding: 0;
    align-items: flex-end;
  }

  .sources-modal {
    max-width: 100%;
    max-height: 85vh;
    border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
    padding-bottom: env(safe-area-inset-bottom);
  }

  .sources-modal-body {
    padding: var(--space-4);
  }

  .source-card {
    padding: var(--space-3);
  }

  /* Note drawer - iOS sheet style */
  .note-drawer-backdrop {
    padding: 0;
    align-items: flex-end;
  }

  .note-drawer {
    max-width: 100%;
    max-height: 90vh;
    border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
    padding-bottom: env(safe-area-inset-bottom);
  }

  .note-drawer-body {
    padding: var(--space-4);
  }

  /* Citation tooltip - wider on mobile */
  .citation-tooltip {
    width: 240px;
    padding: var(--space-3);
  }

  /* Mobile tabs - larger touch targets */
  .mobile-tabs button {
    padding: var(--space-3) var(--space-4);
    min-height: 44px;
  }

  /* Mobile tabs - Apple-style */
  .mobile-tabs {
    margin-bottom: var(--space-3);
    border-radius: var(--radius-lg);
  }

  /* Rate limit notice */
  .rate-limit-notice {
    font-size: var(--text-xs);
    padding: var(--space-2);
    border-radius: var(--radius-md);
  }

  /* Character count */
  .chat-char-count {
    font-size: var(--text-2xs);
  }

  /* Toolbar - stacked on mobile */
  .notes-toolbar {
    flex-direction: column;
    gap: var(--space-2);
  }

  .search-box {
    width: 100%;
  }

  /* Buttons - compact on mobile */
  .btn {
    font-size: var(--text-sm);
  }
}

/* Touch-friendly tap targets - Apple HIG compliant (44pt minimum) */
@media (hover: none) and (pointer: coarse) {
  .btn {
    min-height: 44px;
    min-width: 44px;
    /* Disable hover effects on touch devices */
    -webkit-tap-highlight-color: transparent;
  }

  /* Touch feedback: use active state instead of hover */
  .btn:active {
    transform: scale(0.96);
    opacity: 0.85;
    transition: transform 0.1s var(--ease-out), opacity 0.1s var(--ease-out);
  }

  .btn-sm {
    min-height: 38px;
    min-width: 38px;
  }

  .btn-icon {
    min-height: 44px;
    min-width: 44px;
  }

  .mobile-tabs button {
    min-height: 44px;
  }

  .note-card {
    padding: var(--space-4);
    /* Touch-optimized card interactions */
    -webkit-tap-highlight-color: transparent;
  }

  /* Touch: show actions always on mobile */
  .note-card .note-actions {
    opacity: 1;
    transform: translateX(0);
  }

  /* Touch: enhanced active feedback */
  .note-card:active {
    transform: scale(0.98);
    background: var(--color-surface-pressed);
    transition: transform 0.1s var(--ease-out), background 0.1s var(--ease-out);
  }

  .citation-chip {
    padding: 5px 12px;
    font-size: var(--text-xs);
    min-height: 32px;
  }

  .source-chip {
    padding: 6px 12px;
    min-height: 34px;
  }

  /* Larger touch targets for interactive elements */
  .profile-avatar {
    width: 40px;
    height: 40px;
  }

  .search-clear {
    width: 24px;
    height: 24px;
  }

  /* Suggestion chips - touch friendly */
  .suggestion-chip {
    min-height: 48px;
    padding: var(--space-3-5) var(--space-4);
  }

  .suggestion-chip:active {
    transform: scale(0.97);
    background: var(--color-surface-pressed);
  }

  /* Composer adjustments for touch */
  .composer-send-btn {
    width: 44px;
    height: 44px;
  }

  .composer-mic-btn {
    width: 44px;
    height: 44px;
  }

  /* Command palette items - touch friendly */
  .command-palette-item {
    min-height: 52px;
    padding: var(--space-3) var(--space-4);
  }

  /* Swipe hint for expandable content - iOS style */
  .swipe-hint::after {
    content: '';
    position: absolute;
    bottom: 8px;
    left: 50%;
    transform: translateX(-50%);
    width: 36px;
    height: 4px;
    background: var(--color-border-strong);
    border-radius: var(--radius-full);
    opacity: 0.6;
  }

  /* Touch-optimized scrollable areas */
  .notes-scroll,
  .chat-messages {
    -webkit-overflow-scrolling: touch;
    scroll-snap-type: y proximity;
  }

  /* Momentum scroll with elastic bounce */
  .notes-scroll > * {
    scroll-snap-align: start;
    scroll-margin-top: var(--space-2);
  }

  /* Drawer handle for mobile modals */
  .note-drawer::before {
    content: '';
    position: absolute;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    width: 36px;
    height: 4px;
    background: var(--color-border-strong);
    border-radius: var(--radius-full);
    opacity: 0.4;
  }

  /* Pull-to-refresh visual indicator area */
  .notes-scroll::before {
    content: '';
    display: block;
    height: 0;
    transition: height 0.2s var(--ease-out);
  }

  /* Long-press context menu hint */
  .note-card::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: var(--color-primary);
    opacity: 0;
    transform: scale(0.97);
    transition: opacity 0.3s var(--ease-out), transform 0.3s var(--ease-out);
    pointer-events: none;
  }

  /* Active long-press state */
  .note-card.long-pressing::after {
    opacity: 0.04;
    transform: scale(1);
  }
}

/* Safe area insets for notched devices (iPhone X+) */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  /* Only apply to non-mobile - mobile handles this in the mobile section */
  @media (min-width: 481px) {
    .app-shell {
      padding-bottom: calc(var(--space-3) + env(safe-area-inset-bottom));
    }
  }

  .sources-modal,
  .note-drawer {
    padding-bottom: env(safe-area-inset-bottom);
  }

  .toast-container {
    bottom: calc(var(--space-4) + env(safe-area-inset-bottom));
  }
}

/* ============================================
   Additional Component Styles
   ============================================ */

/* Warning toast */
.toast.warning .toast-icon {
  color: var(--color-warning);
}

/* Error Boundary */
.error-boundary {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  background: var(--color-bg-subtle);
}

.error-boundary-content {
  max-width: 480px;
  text-align: center;
  padding: var(--space-8);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-lg);
}

.error-boundary-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto var(--space-5);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-danger-bg);
  color: var(--color-danger);
  border-radius: var(--radius-full);
}

.error-boundary-content h2 {
  font-size: 20px;
  font-weight: var(--font-bold);
  color: var(--color-text);
  margin-bottom: var(--space-3);
}

.error-boundary-content p {
  color: var(--color-text-secondary);
  margin-bottom: var(--space-6);
  line-height: var(--leading-relaxed);
}

.error-boundary-details {
  text-align: left;
  margin-bottom: var(--space-6);
  padding: var(--space-4);
  background: var(--color-bg-muted);
  border-radius: var(--radius-lg);
  font-size: 12px;
}

.error-boundary-details summary {
  cursor: pointer;
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-2);
}

.error-boundary-details pre {
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-danger);
}

.error-boundary-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: center;
}

/* Panel Fallback - Granular error boundary for panels */
.panel-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 300px;
}

.panel-fallback-content {
  text-align: center;
  padding: var(--space-6);
  max-width: 320px;
}

.panel-fallback-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto var(--space-4);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-warning-bg);
  color: var(--color-warning);
  border-radius: var(--radius-full);
}

.panel-fallback-title {
  font-size: var(--text-md);
  font-weight: var(--font-semibold);
  color: var(--color-text);
  margin: 0 0 var(--space-2) 0;
}

.panel-fallback-description {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-5) 0;
  line-height: var(--leading-relaxed);
}

.panel-fallback-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

/* Note: .btn-danger is defined in the Buttons section (lines ~1845)
   Note: .skip-link is defined in Reset & Base Styles section */

/* Offline banner */
.offline-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: var(--space-2) var(--space-4);
  background: var(--color-warning-bg);
  border-bottom: 1px solid var(--color-warning);
  color: var(--color-warning);
  font-size: 13px;
  font-weight: var(--font-medium);
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  z-index: 1200;
  animation: slide-down 0.3s var(--ease-out);
}

@keyframes slide-down {
  from {
    transform: translateY(-100%);
  }
  to {
    transform: translateY(0);
  }
}

.offline-banner svg {
  flex-shrink: 0;
}

/* Clear chat button */
.clear-chat-btn {
  color: var(--color-text-secondary);
}

.clear-chat-btn:hover {
  color: var(--color-danger);
}

/* Edit note modal */
.edit-note-modal {
  max-width: 600px;
}

.edit-note-textarea {
  width: 100%;
  min-height: 200px;
  padding: var(--space-4);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  color: var(--color-text);
  font-family: inherit;
  font-size: 15px;
  line-height: var(--leading-relaxed);
  resize: vertical;
  transition: all var(--transition-normal);
}

.edit-note-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--ring);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding-top: var(--space-4);
  margin-top: var(--space-4);
  border-top: 1px solid var(--color-separator);
}

/* Modal base styles - Clean */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--space-5);
}

.modal {
  position: relative;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-xl);
  width: 100%;
  max-width: 480px;
}

@media (prefers-color-scheme: dark) {
  .modal {
    background: var(--color-surface);
    border-color: var(--color-border);
  }
}

.modal-close {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-text-tertiary);
  transition: background var(--transition-fast), color var(--transition-fast);
}

.modal-close:hover {
  background: var(--color-surface-hover);
  color: var(--color-text);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.modal-header h2 {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text);
}

/* Button variants */
.btn-secondary {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text);
}

.btn-secondary:hover {
  background: var(--color-surface-hover);
}

.btn-secondary:active {
  background: var(--color-surface-pressed);
}

.btn-warning {
  background: var(--color-warning);
  border-color: transparent;
  color: white;
}

.btn-warning:hover {
  filter: brightness(1.05);
}

/* Confirm dialog - Apple-style */
.confirm-dialog {
  max-width: 380px;
  text-align: center;
}

.confirm-dialog-icon {
  width: 52px;
  height: 52px;
  margin: 0 auto var(--space-4);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-danger-bg);
  color: var(--color-danger);
  border-radius: var(--radius-full);
}

.confirm-dialog h3 {
  font-size: 16px;
  font-weight: var(--font-semibold);
  color: var(--color-text);
  margin-bottom: var(--space-2);
}

.confirm-dialog p {
  color: var(--color-text-secondary);
  margin-bottom: var(--space-5);
}

.confirm-dialog-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: center;
}

/* Markdown content styles */
.markdown-content h1,
.markdown-content h2,
.markdown-content h3 {
  font-weight: var(--font-semibold);
  margin-top: 1em;
  margin-bottom: 0.5em;
  color: var(--color-text);
}

.markdown-content h1 { font-size: 1.5em; }
.markdown-content h2 { font-size: 1.25em; }
.markdown-content h3 { font-size: 1.1em; }

.markdown-content p {
  margin-bottom: 0.75em;
}

.markdown-content ul,
.markdown-content ol {
  margin-bottom: 0.75em;
  padding-left: 1.5em;
}

.markdown-content li {
  margin-bottom: 0.25em;
}

.markdown-content code {
  padding: 2px 6px;
  background: var(--color-bg-muted);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 0.9em;
}

.markdown-content pre {
  padding: var(--space-4);
  background: var(--color-bg-muted);
  border-radius: var(--radius-lg);
  overflow-x: auto;
  margin-bottom: 0.75em;
}

.markdown-content pre code {
  padding: 0;
  background: none;
}

.markdown-content blockquote {
  border-left: 3px solid var(--color-primary);
  padding-left: var(--space-4);
  margin: 0.75em 0;
  color: var(--color-text-secondary);
  font-style: italic;
}

.markdown-content a {
  color: var(--color-primary);
  text-decoration: underline;
}

.markdown-content a:hover {
  text-decoration: none;
}

.markdown-content strong {
  font-weight: var(--font-semibold);
}

.markdown-content em {
  font-style: italic;
}

/* ============================================
   Chat Markdown Styles
   ============================================ */
.chat-markdown {
  /* Reset margins for first/last elements */
}

.chat-markdown > *:first-child {
  margin-top: 0;
}

.chat-markdown > *:last-child {
  margin-bottom: 0;
}

.chat-markdown h1,
.chat-markdown h2,
.chat-markdown h3,
.chat-markdown h4,
.chat-markdown h5,
.chat-markdown h6 {
  font-weight: var(--font-semibold);
  margin-top: 1em;
  margin-bottom: 0.5em;
  color: var(--color-text);
  line-height: 1.3;
}

.chat-markdown h1 { font-size: 1.4em; }
.chat-markdown h2 { font-size: 1.25em; }
.chat-markdown h3 { font-size: 1.1em; }
.chat-markdown h4,
.chat-markdown h5,
.chat-markdown h6 { font-size: 1em; }

.chat-markdown p {
  margin-bottom: 0.75em;
  line-height: 1.65;
}

.chat-markdown ul,
.chat-markdown ol {
  margin-bottom: 0.75em;
  padding-left: 1.5em;
}

.chat-markdown ul {
  list-style-type: disc;
}

.chat-markdown ol {
  list-style-type: decimal;
}

.chat-markdown li {
  margin-bottom: 0.35em;
  line-height: 1.6;
}

.chat-markdown li > ul,
.chat-markdown li > ol {
  margin-top: 0.35em;
  margin-bottom: 0;
}

/* Inline code */
.chat-markdown .inline-code {
  padding: 2px 6px;
  background: rgba(99, 102, 241, 0.1);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 0.875em;
  color: var(--color-accent);
}

/* Code blocks */
.chat-markdown .code-block {
  padding: var(--space-4);
  background: var(--color-bg-muted);
  border-radius: var(--radius-lg);
  overflow-x: auto;
  margin: 0.75em 0;
  font-family: var(--font-mono);
  font-size: 0.875em;
  line-height: 1.5;
}

.chat-markdown .code-block code {
  padding: 0;
  background: none;
  color: inherit;
}

.chat-markdown blockquote {
  border-left: 3px solid var(--color-accent);
  padding-left: var(--space-4);
  margin: 0.75em 0;
  color: var(--color-text-secondary);
  font-style: italic;
}

.chat-markdown a {
  color: var(--color-accent);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.chat-markdown a:hover {
  text-decoration: none;
  opacity: 0.8;
}

.chat-markdown strong {
  font-weight: var(--font-semibold);
}

.chat-markdown em {
  font-style: italic;
}

.chat-markdown hr {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: 1em 0;
}

/* Tables */
.chat-markdown table {
  width: 100%;
  border-collapse: collapse;
  margin: 0.75em 0;
  font-size: 0.9em;
}

.chat-markdown th,
.chat-markdown td {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  text-align: left;
}

.chat-markdown th {
  background: var(--color-bg-muted);
  font-weight: var(--font-semibold);
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .chat-markdown .inline-code {
    background: rgba(99, 102, 241, 0.15);
  }

  .chat-markdown .code-block {
    background: rgba(0, 0, 0, 0.3);
  }
}


/* ============================================
   Keyboard Shortcuts Modal
   ============================================ */
.keyboard-shortcuts-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--space-4);
  animation: fade-in 0.15s var(--ease-out);
}

.keyboard-shortcuts-modal {
  background: var(--color-surface);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-xl);
  max-width: 480px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: modal-slide-up 0.2s var(--ease-out);
}

.keyboard-shortcuts-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.keyboard-shortcuts-header h2 {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.keyboard-shortcuts-content {
  padding: var(--space-4) var(--space-5);
  overflow-y: auto;
}

.shortcut-section {
  margin-bottom: var(--space-5);
}

.shortcut-section:last-child {
  margin-bottom: 0;
}

.shortcut-section h3 {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-3);
}

.shortcut-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.shortcut-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) 0;
}

.shortcut-description {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.shortcut-keys {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 var(--space-2);
  font-size: 11px;
  font-family: var(--font-mono);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  box-shadow: 0 1px 0 var(--color-border);
}

.kbd-plus {
  font-size: 10px;
  color: var(--color-text-tertiary);
}

/* ============================================
   Auth Loading State
   ============================================ */
.auth-loading {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  background: var(--color-bg);
  color: var(--color-text-secondary);
}

.auth-loading .spinner {
  color: var(--brand-aurora);
}

/* ============================================
   Landing Page - Aurora Premium Design (Legacy)
   Note: Most styles moved to Simple Landing Page section
   ============================================ */
.landing-page {
  min-height: 100dvh;
  position: relative;
  overflow-x: hidden;
  overflow-y: auto;
  background: var(--color-bg);
}

.landing-content {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-6);
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}

/* ============================================
   Simple Landing Page Styles - Premium Edition
   Tesla/Google/Apple-inspired modern design
   ============================================ */

/* Animated Aurora Background */
.landing-ambient {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
  background: var(--color-bg);
}

.landing-ambient::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background:
    radial-gradient(ellipse 80% 60% at 20% 40%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse 60% 80% at 80% 20%, rgba(139, 92, 246, 0.12) 0%, transparent 50%),
    radial-gradient(ellipse 70% 50% at 60% 80%, rgba(236, 72, 153, 0.08) 0%, transparent 50%);
  animation: auroraShift 20s ease-in-out infinite;
}

.landing-ambient::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 30% 70%, rgba(99, 102, 241, 0.08) 0%, transparent 30%),
    radial-gradient(circle at 70% 30%, rgba(139, 92, 246, 0.06) 0%, transparent 30%);
  animation: auroraFloat 15s ease-in-out infinite reverse;
}

@keyframes auroraShift {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(2%, -3%) rotate(2deg); }
  50% { transform: translate(-1%, 2%) rotate(-1deg); }
  75% { transform: translate(1%, -1%) rotate(1deg); }
}

@keyframes auroraFloat {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
}

/* Subtle grid overlay for depth */
.landing-grid-overlay {
  display: block;
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(99, 102, 241, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(99, 102, 241, 0.02) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
}

.landing-hero-simple {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  padding: var(--space-8) var(--space-4);
  text-align: center;
  animation: heroFadeIn 1s ease-out;
}

@keyframes heroFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Premium Logo with glow effect */
.landing-logo-simple {
  margin-bottom: var(--space-8);
  animation: logoFloat 1.2s ease-out, logoPulse 4s ease-in-out 1.2s infinite;
}

@keyframes logoFloat {
  from {
    opacity: 0;
    transform: translateY(-30px) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes logoPulse {
  0%, 100% { filter: drop-shadow(0 0 20px rgba(99, 102, 241, 0.3)); }
  50% { filter: drop-shadow(0 0 40px rgba(99, 102, 241, 0.5)); }
}

.landing-favicon {
  width: 88px;
  height: 88px;
  border-radius: var(--radius-2xl);
  box-shadow:
    0 8px 32px rgba(99, 102, 241, 0.25),
    0 4px 16px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: transform 0.4s var(--ease-spring), box-shadow 0.4s ease;
}

.landing-favicon:hover {
  transform: scale(1.08) rotate(-2deg);
  box-shadow:
    0 12px 48px rgba(99, 102, 241, 0.35),
    0 8px 24px rgba(0, 0, 0, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

/* Premium Typography */
.landing-title-simple {
  font-size: clamp(2rem, 7vw, 3.5rem);
  font-weight: var(--font-bold);
  color: var(--color-text);
  margin: 0 0 var(--space-4) 0;
  letter-spacing: -0.03em;
  line-height: 1.1;
  background: linear-gradient(
    135deg,
    var(--color-text) 0%,
    var(--color-text) 40%,
    var(--color-accent) 100%
  );
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: titleReveal 1s ease-out 0.2s backwards, titleShimmer 8s ease-in-out 2s infinite;
}

@keyframes titleReveal {
  from {
    opacity: 0;
    transform: translateY(20px);
    filter: blur(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}

@keyframes titleShimmer {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.landing-subtitle-simple {
  font-size: var(--text-xl);
  color: var(--color-text-secondary);
  max-width: 480px;
  margin: 0 0 var(--space-10) 0;
  line-height: var(--leading-relaxed);
  animation: subtitleFade 1s ease-out 0.4s backwards;
}

@keyframes subtitleFade {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Auth Container - Premium Glass Morphism */
.landing-auth {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
  max-width: 360px;
  animation: authFadeIn 1s ease-out 0.6s backwards;
}

@keyframes authFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.landing-auth-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-4) var(--space-5);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  border-radius: var(--radius-xl);
  cursor: pointer;
  min-height: 56px;
  overflow: hidden;
  transition:
    transform 0.3s var(--ease-spring),
    box-shadow 0.3s ease,
    background 0.2s ease,
    border-color 0.2s ease;
}

.landing-auth-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.landing-auth-btn:hover::before {
  opacity: 1;
}

.landing-auth-btn:active {
  transform: scale(0.98);
}

.landing-auth-btn:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 3px var(--color-bg),
    0 0 0 5px var(--color-accent);
}

/* Google Button - Clean */
.landing-auth-google {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text);
}

.landing-auth-google:hover:not(:disabled) {
  border-color: var(--color-border-strong);
  background: var(--color-bg-muted);
}

/* Phone Button - Secondary */
.landing-auth-phone {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

.landing-auth-phone:hover:not(:disabled) {
  background: var(--color-bg-muted);
  color: var(--color-text);
}

@media (prefers-color-scheme: dark) {
  .landing-auth-google {
    background: var(--color-surface);
    border-color: var(--color-border);
  }

  .landing-auth-google:hover:not(:disabled) {
    background: var(--color-surface-elevated);
  }

  .landing-auth-phone {
    background: transparent;
    border-color: var(--color-border);
  }

  .landing-auth-phone:hover:not(:disabled) {
    background: var(--color-surface-elevated);
  }
}

/* Primary Button - Gradient with Glow */
.landing-auth-primary {
  background: linear-gradient(135deg, var(--color-accent) 0%, #8B5CF6 100%);
  border: none;
  color: white;
  box-shadow:
    0 4px 20px rgba(99, 102, 241, 0.4),
    0 2px 8px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.landing-auth-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow:
    0 8px 32px rgba(99, 102, 241, 0.5),
    0 4px 16px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

.landing-auth-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* Divider - Elegant fade */
.landing-auth-divider {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.landing-auth-divider::before,
.landing-auth-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--color-border) 50%,
    transparent 100%
  );
}

/* Phone Input Form - Premium Styling */
.landing-phone-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
  animation: formSlideIn 0.4s ease-out;
}

@keyframes formSlideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.landing-back-btn {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  align-self: flex-start;
  padding: var(--space-2) var(--space-3);
  background: rgba(0, 0, 0, 0.03);
  border: none;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: var(--radius-full);
}

.landing-back-btn:hover {
  color: var(--color-text);
  background: rgba(0, 0, 0, 0.06);
  transform: translateX(-2px);
}

.landing-back-btn:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus-ring);
}

.landing-phone-hint {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  margin: 0;
  text-align: center;
  font-weight: var(--font-medium);
}

.landing-phone-input {
  width: 100%;
  padding: var(--space-4) var(--space-5);
  font-size: 20px;
  font-family: inherit;
  font-weight: var(--font-medium);
  text-align: center;
  letter-spacing: 0.08em;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  color: var(--color-text);
  transition: border-color var(--transition-fast);
}

.landing-phone-input:hover:not(:focus) {
  border-color: var(--color-border-strong);
}

.landing-phone-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: var(--shadow-focus);
}

.landing-phone-input::placeholder {
  color: var(--color-placeholder);
  letter-spacing: 0.05em;
  font-weight: var(--font-normal);
}

/* Input validation states */
.landing-phone-input.input-error {
  border-color: var(--color-danger);
  background: rgba(239, 68, 68, 0.05);
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
}

.landing-phone-input.input-success {
  border-color: var(--color-success);
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.1);
}

/* OTP Input - Premium Individual digit boxes */
.landing-otp-container {
  display: flex;
  justify-content: center;
  gap: var(--space-3);
}

.landing-otp-input {
  width: 52px;
  height: 64px;
  padding: 0;
  font-size: 28px;
  font-weight: var(--font-semibold);
  font-family: var(--font-mono);
  text-align: center;
  border: 2px solid rgba(0, 0, 0, 0.08);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  color: var(--color-text);
  transition: border-color var(--transition-fast);
}

.landing-otp-input:hover:not(:focus) {
  border-color: var(--color-border-strong);
}

.landing-otp-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: var(--shadow-focus);
}

.landing-otp-input.filled {
  border-color: var(--color-accent);
  background: var(--color-accent-subtle);
}

/* Error Message - Clean */
.landing-error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-danger);
  text-align: center;
  padding: var(--space-3);
  background: var(--color-danger-bg);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-md);
  margin: var(--space-2) 0 0 0;
}

@keyframes errorShake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-2px); }
  80% { transform: translateX(2px); }
}

/* Helper text below inputs */
.landing-helper-text {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  text-align: center;
  margin: calc(-1 * var(--space-2)) 0 0 0;
}

/* Mobile adjustments - Premium Responsive */
@media (max-width: 768px) {
  .landing-steps {
    flex-direction: column;
    gap: var(--space-4);
    max-width: 400px;
  }

  .landing-step {
    flex-direction: row;
    text-align: left;
    padding: var(--space-5);
  }

  .landing-step-icon {
    width: 48px;
    height: 48px;
    margin-bottom: 0;
    margin-right: var(--space-4);
    flex-shrink: 0;
  }

  .landing-step-content {
    flex: 1;
  }
}

@media (max-width: 480px) {
  .landing-hero-simple {
    padding: var(--space-6) var(--space-4);
    min-height: auto;
    padding-top: env(safe-area-inset-top, var(--space-6));
    padding-bottom: env(safe-area-inset-bottom, var(--space-6));
  }

  .landing-favicon {
    width: 72px;
    height: 72px;
  }

  .landing-title-simple {
    font-size: clamp(1.75rem, 8vw, 2.25rem);
  }

  .landing-subtitle-simple {
    font-size: var(--text-base);
    margin-bottom: var(--space-8);
  }

  .landing-auth {
    max-width: 100%;
  }

  .landing-auth-btn {
    min-height: 54px;
    border-radius: var(--radius-xl);
  }

  .landing-phone-input {
    font-size: 16px; /* Prevent iOS zoom */
    padding: var(--space-4);
  }

  .landing-step {
    padding: var(--space-4);
  }

  .landing-step-icon {
    width: 44px;
    height: 44px;
  }

  .landing-step-title {
    font-size: var(--text-sm);
    margin-bottom: var(--space-1);
  }

  .landing-step-desc {
    font-size: var(--text-xs);
  }

  /* Reduce animation intensity on mobile for performance */
  .landing-ambient::before,
  .landing-ambient::after {
    animation: none;
    opacity: 0.7;
  }

  .landing-logo-simple {
    animation: logoFloat 1.2s ease-out;
  }

  .landing-step:hover {
    transform: translateY(-4px);
  }
}

/* How It Works Steps - Premium Feature Cards */
.landing-steps {
  display: flex;
  gap: var(--space-5);
  margin-top: var(--space-12);
  width: 100%;
  max-width: 720px;
  animation: stepsReveal 1s ease-out 0.8s backwards;
}

@keyframes stepsReveal {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.landing-step {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  transition: border-color var(--transition-fast);
}

.landing-step:hover {
  border-color: var(--color-border-strong);
}

.landing-step-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin-bottom: var(--space-3);
  border-radius: var(--radius-md);
  background: var(--color-accent);
  color: white;
}

@media (prefers-color-scheme: dark) {
  .landing-step {
    background: var(--color-surface);
    border-color: var(--color-border);
  }
}

.landing-step-title {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-text);
  margin: 0 0 var(--space-2) 0;
  letter-spacing: -0.01em;
}

.landing-step-desc {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: var(--leading-relaxed);
}

/* Legal Footer - Premium */
.landing-legal-footer {
  margin-top: auto;
  padding: var(--space-8) var(--space-4);
  text-align: center;
  animation: footerFade 1s ease-out 1.2s backwards;
}

@keyframes footerFade {
  from { opacity: 0; }
  to { opacity: 1; }
}

.landing-legal-text {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  margin: 0 0 var(--space-3) 0;
  line-height: var(--leading-relaxed);
}

.landing-legal-link {
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: all 0.2s ease;
  padding-bottom: 1px;
  border-bottom: 1px solid transparent;
}

.landing-legal-link:hover {
  color: var(--color-accent);
  border-bottom-color: var(--color-accent);
}

.landing-copyright {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin: 0;
  letter-spacing: 0.02em;
}

/* ============================================
   Command Palette (Cmd/Ctrl+K)
   ============================================ */
.command-palette-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;
  animation: fadeIn 0.15s var(--ease-out);
}

.command-palette {
  width: 100%;
  max-width: 560px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-2xl);
  overflow: hidden;
  animation: slideDown 0.2s var(--ease-out);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-12px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.command-palette-input-wrapper {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border-subtle);
}

.command-palette-search-icon {
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.command-palette-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 16px;
  color: var(--color-text);
  outline: none;
}

.command-palette-input::placeholder {
  color: var(--color-text-muted);
}

.command-palette-kbd {
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 2px 6px;
  background: var(--color-bg-muted);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xs);
  color: var(--color-text-tertiary);
}

.command-palette-results {
  max-height: 320px;
  overflow-y: auto;
  padding: var(--space-2);
}

.command-palette-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-8);
  color: var(--color-text-tertiary);
}

.command-palette-empty p {
  font-size: 14px;
}

.command-palette-section-header {
  padding: var(--space-2) var(--space-3);
  font-size: 11px;
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-tertiary);
  margin-top: var(--space-2);
}

.command-palette-section-header:first-child {
  margin-top: 0;
}

.command-palette-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-3) var(--space-3);
  border: none;
  background: transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  text-align: left;
  transition: background var(--transition-fast);
}

.command-palette-item:hover,
.command-palette-item[data-selected="true"] {
  background: var(--color-bg-muted);
}

.command-palette-item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background: var(--color-bg-subtle);
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.command-palette-item[data-selected="true"] .command-palette-item-icon {
  background: var(--color-primary);
  color: white;
}

.command-palette-item-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.command-palette-item-label {
  font-size: 14px;
  font-weight: var(--font-medium);
  color: var(--color-text);
}

.command-palette-item-desc {
  font-size: 12px;
  color: var(--color-text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.command-palette-item-shortcut {
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 2px 6px;
  background: var(--color-bg-muted);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xs);
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.command-palette-footer {
  display: flex;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--color-border-subtle);
  background: var(--color-bg-subtle);
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.command-palette-footer kbd {
  font-family: var(--font-mono);
  font-size: 10px;
  padding: 1px 4px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xs);
  margin-right: 4px;
}

/* Mobile: Command palette full width with padding */
@media (max-width: 640px) {
  .command-palette-overlay {
    padding: var(--space-4);
    padding-top: 10vh;
  }

  .command-palette {
    max-width: 100%;
  }
}

/* ============================================
   Action Results (Agentic AI)
   ============================================ */

.action-result {
  margin-top: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  font-size: 14px;
}

.action-result-success {
  border-color: var(--color-success-border);
  background: var(--color-success-bg);
}

.action-result-error {
  border-color: var(--color-danger-border);
  background: var(--color-danger-bg);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-danger);
}

.action-result-empty {
  border-color: var(--color-border);
  background: var(--color-bg-subtle);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-tertiary);
}

.action-result-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
  font-weight: 500;
  color: var(--color-text);
}

.action-result-title {
  font-size: 14px;
}

.action-result-content {
  display: flex;
  gap: var(--space-2);
  align-items: flex-start;
}

.action-result-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.action-result-note-title {
  font-weight: 500;
  color: var(--color-text);
}

.action-result-note-preview {
  color: var(--color-text-secondary);
  font-size: 13px;
}

.action-result-reminder-text {
  color: var(--color-text);
}

.action-result-reminder-due {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.action-result-summary {
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.action-result-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.action-result-item {
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  border: 1px solid var(--color-border-subtle);
}

.action-result-item-preview {
  color: var(--color-text-secondary);
  font-size: 13px;
  margin-bottom: var(--space-1);
}

.action-result-item-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.action-result-item-date {
  color: var(--color-text-tertiary);
}

.action-result-link {
  color: var(--color-accent);
  background: none;
  border: none;
  padding: 0;
  font-size: 12px;
  cursor: pointer;
  text-decoration: none;
  transition: color 0.15s ease;
}

.action-result-link:hover {
  color: var(--color-accent-hover);
  text-decoration: underline;
}

.action-result-more {
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: 12px;
  padding: var(--space-1);
}

.action-result-action-item {
  background: var(--color-bg-subtle);
}

.action-result-item-text {
  color: var(--color-text);
  font-size: 13px;
}

.action-item-status {
  color: var(--color-text-tertiary);
  font-size: 11px;
  font-weight: 500;
  margin-right: var(--space-1);
}

```

## src/test/setup.ts

```typescript
/**
 * Vitest test setup file
 * Configures the testing environment with jsdom and testing-library matchers
 */

import '@testing-library/jest-dom';

// Mock import.meta.env for tests
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_API_BASE: 'https://test-api.example.com',
    VITE_API_KEY: 'test-api-key',
  },
  writable: true,
});


```

