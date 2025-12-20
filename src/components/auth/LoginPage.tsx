/**
 * LoginPage - Authentication UI
 * Supports Google sign-in and phone (SMS) sign-in
 */

import { useState, useCallback, type FormEvent } from 'react';
import { Sparkles, Phone, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { GoogleIcon } from './GoogleIcon';

type AuthMode = 'select' | 'phone' | 'verify';

export function LoginPage() {
  const {
    signInWithGoogle,
    startPhoneSignIn,
    verifyPhoneCode,
    error,
    clearError,
    phoneVerificationPending,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>('select');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Format phone to E.164
  const formatPhoneE164 = (input: string): string => {
    const digits = input.replace(/\D/g, '');
    // Assume US if 10 digits, otherwise require country code
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }
    // Already has country code
    if (input.startsWith('+')) {
      return `+${digits}`;
    }
    return `+${digits}`;
  };

  const handleGoogleSignIn = useCallback(async () => {
    setLoading(true);
    setLocalError(null);
    clearError();
    try {
      await signInWithGoogle();
    } catch {
      // Error is handled by AuthProvider
    } finally {
      setLoading(false);
    }
  }, [signInWithGoogle, clearError]);

  const handlePhoneSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setLocalError('Please enter your phone number');
      return;
    }

    const phoneE164 = formatPhoneE164(phone);
    if (phoneE164.length < 10) {
      setLocalError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setLocalError(null);
    clearError();

    try {
      await startPhoneSignIn(phoneE164);
      setMode('verify');
    } catch {
      // Error is handled by AuthProvider
    } finally {
      setLoading(false);
    }
  }, [phone, startPhoneSignIn, clearError]);

  const handleVerifySubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setLocalError('Please enter the verification code');
      return;
    }

    if (code.length !== 6) {
      setLocalError('Verification code must be 6 digits');
      return;
    }

    setLoading(true);
    setLocalError(null);
    clearError();

    try {
      await verifyPhoneCode(code);
    } catch {
      // Error is handled by AuthProvider
    } finally {
      setLoading(false);
    }
  }, [code, verifyPhoneCode, clearError]);

  const handleBackToSelect = useCallback(() => {
    setMode('select');
    setPhone('');
    setCode('');
    setLocalError(null);
    clearError();
  }, [clearError]);

  const displayError = localError || error?.message;

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Logo and Title */}
        <div className="login-header">
          <div className="login-logo">
            <Sparkles size={32} />
          </div>
          <h1>AuroraNotes</h1>
          <p className="login-subtitle">Your AI-powered personal knowledge assistant</p>
        </div>

        {/* Error Display */}
        {displayError && (
          <div className="login-error">
            <AlertCircle size={16} />
            <span>{displayError}</span>
          </div>
        )}

        {/* reCAPTCHA container - required for phone auth */}
        <div id="recaptcha-container" />

        {/* Auth Mode: Select */}
        {mode === 'select' && (
          <div className="login-options">
            <button
              className="google-signin-btn"
              onClick={handleGoogleSignIn}
              disabled={loading}
              type="button"
            >
              <span className="google-signin-icon">
                {loading ? <Loader2 size={20} className="spinner" /> : <GoogleIcon size={20} />}
              </span>
              <span className="google-signin-text">Continue with Google</span>
            </button>

            <div className="login-divider">
              <span>or</span>
            </div>

            <button
              className="btn btn-secondary btn-lg login-btn"
              onClick={() => setMode('phone')}
              disabled={loading}
            >
              <Phone size={20} />
              Continue with Phone
            </button>
          </div>
        )}

        {/* Auth Mode: Phone */}
        {mode === 'phone' && (
          <form className="login-form" onSubmit={handlePhoneSubmit}>
            <label className="login-label" htmlFor="phone-input">
              Phone Number
            </label>
            <input
              id="phone-input"
              type="tel"
              className="login-input"
              placeholder="+1 (555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoFocus
              disabled={loading}
            />
            <p className="login-hint">We'll send you a verification code via SMS</p>

            <div className="login-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleBackToSelect}
                disabled={loading}
              >
                Back
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !phone.trim()}
              >
                {loading ? <Loader2 size={16} className="spinner" /> : null}
                Send Code
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        )}

        {/* Auth Mode: Verify */}
        {(mode === 'verify' || phoneVerificationPending) && (
          <form className="login-form" onSubmit={handleVerifySubmit}>
            <label className="login-label" htmlFor="code-input">
              Verification Code
            </label>
            <input
              id="code-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              className="login-input login-input-code"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              autoFocus
              disabled={loading}
            />
            <p className="login-hint">Enter the 6-digit code sent to {phone}</p>

            <div className="login-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleBackToSelect}
                disabled={loading}
              >
                Back
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || code.length !== 6}
              >
                {loading ? <Loader2 size={16} className="spinner" /> : null}
                Verify
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

