import { useState, useCallback, useEffect, useRef, memo } from 'react';
import { Loader2, ArrowRight, Phone, ChevronLeft, PenLine, MessageCircle, Sparkles, Shield, Lock, RefreshCw } from 'lucide-react';
import { useAuth } from '@/auth/useAuth';
import { GoogleIcon } from './GoogleIcon';
import { formatPhoneNumber, toE164 } from '@/lib/utils';

const CURRENT_YEAR = new Date().getFullYear();
const RESEND_COOLDOWN_SECONDS = 60;

const STEPS = [
  { icon: PenLine, title: 'Capture', description: 'Jot down thoughts, ideas, and notes as they come to you.' },
  { icon: MessageCircle, title: 'Ask', description: 'Ask questions about your notes in plain English.' },
  { icon: Sparkles, title: 'Discover', description: 'Get AI-powered answers with sources from your notes.' },
] as const;

const SECURITY_FEATURES = [
  { icon: Shield, text: 'End-to-end privacy' },
  { icon: Lock, text: 'Your data stays yours' },
] as const;

export const LandingPage = memo(function LandingPage() {
  const { signInWithGoogle, startPhoneSignIn, verifyPhoneCode, phoneVerificationPending, error, clearError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // Start countdown when verification pending
  useEffect(() => {
    if (phoneVerificationPending && resendCountdown === 0) {
      setResendCountdown(RESEND_COOLDOWN_SECONDS);
      countdownRef.current = setInterval(() => {
        setResendCountdown(prev => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [phoneVerificationPending, resendCountdown]);

  const withLoading = useCallback(async (fn: () => Promise<void>) => {
    setLoading(true);
    clearError();
    try {
      await fn();
    } catch {
      // Error handled by AuthProvider
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  const handleGoogleSignIn = useCallback(() => withLoading(signInWithGoogle), [withLoading, signInWithGoogle]);

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(formatPhoneNumber(e.target.value).formatted);
  }, []);

  const handlePhoneSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;
    withLoading(() => startPhoneSignIn(toE164(phoneNumber)));
  }, [phoneNumber, startPhoneSignIn, withLoading]);

  const handleVerifyCode = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) return;
    withLoading(() => verifyPhoneCode(verificationCode));
  }, [verificationCode, verifyPhoneCode, withLoading]);

  const handleResendCode = useCallback(async () => {
    if (resendCountdown > 0 || isResending) return;
    setIsResending(true);
    clearError();
    try {
      await startPhoneSignIn(toE164(phoneNumber));
      setResendCountdown(RESEND_COOLDOWN_SECONDS);
      countdownRef.current = setInterval(() => {
        setResendCountdown(prev => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      // Error handled by AuthProvider
    } finally {
      setIsResending(false);
    }
  }, [resendCountdown, isResending, phoneNumber, startPhoneSignIn, clearError]);

  const handleBackToOptions = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setShowPhoneInput(false);
    setPhoneNumber('');
    setVerificationCode('');
    setResendCountdown(0);
    clearError();
  }, [clearError]);

  const BackButton = (
    <button type="button" className="landing-back-btn" onClick={handleBackToOptions} aria-label="Go back">
      <ChevronLeft size={20} />
      Back
    </button>
  );

  return (
    <div className="landing-page">
      <div className="landing-ambient" aria-hidden="true">
        <div className="landing-grid-overlay" />
      </div>

      <div className="landing-content">
        <header className="landing-hero-simple">
          <div className="landing-logo-simple">
            <img src="/favicon.svg" alt="AuroraNotes" className="landing-favicon" />
          </div>

          <h1 className="landing-title-simple">Your notes, brilliantly searchable</h1>
          <p className="landing-subtitle-simple">
            Jot down notes naturally, then ask questions in plain English. Our AI instantly finds and synthesizes answers from everything you've written.
          </p>

          <div className="landing-auth">
            {!showPhoneInput && !phoneVerificationPending ? (
              <>
                <button className="landing-auth-btn landing-auth-google" onClick={handleGoogleSignIn} disabled={loading} type="button">
                  {loading ? <Loader2 size={20} className="spinner" /> : <GoogleIcon size={20} />}
                  <span>Continue with Google</span>
                </button>
                <div className="landing-auth-divider"><span>or</span></div>
                <button className="landing-auth-btn landing-auth-phone" onClick={() => setShowPhoneInput(true)} type="button">
                  <Phone size={20} />
                  <span>Continue with Phone</span>
                </button>
              </>
            ) : phoneVerificationPending ? (
              <form onSubmit={handleVerifyCode} className="landing-phone-form">
                {BackButton}
                <p className="landing-phone-hint">Enter the 6-digit code sent to {phoneNumber}</p>
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
                  aria-label="Verification code"
                />
                <button type="submit" className="landing-auth-btn landing-auth-primary" disabled={loading || verificationCode.length < 6}>
                  {loading ? <Loader2 size={20} className="spinner" /> : <ArrowRight size={20} />}
                  <span>Verify Code</span>
                </button>
                <button
                  type="button"
                  className="landing-resend-btn"
                  onClick={handleResendCode}
                  disabled={resendCountdown > 0 || isResending}
                  aria-label={resendCountdown > 0 ? `Resend code in ${resendCountdown} seconds` : 'Resend code'}
                >
                  {isResending ? (
                    <Loader2 size={16} className="spinner" />
                  ) : (
                    <RefreshCw size={16} />
                  )}
                  <span>
                    {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend Code'}
                  </span>
                </button>
              </form>
            ) : (
              <form onSubmit={handlePhoneSubmit} className="landing-phone-form">
                {BackButton}
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
                <button id="phone-sign-in-button" type="submit" className="landing-auth-btn landing-auth-primary" disabled={loading || phoneNumber.replace(/\D/g, '').length < 10}>
                  {loading ? <Loader2 size={20} className="spinner" /> : <ArrowRight size={20} />}
                  <span>Send Code</span>
                </button>
              </form>
            )}
            {error && <p className="landing-error" role="alert">{error.message}</p>}
          </div>

          <section className="landing-steps" aria-label="How it works">
            {STEPS.map((step) => (
              <div key={step.title} className="landing-step">
                <div className="landing-step-icon" aria-hidden="true">
                  <step.icon size={24} />
                </div>
                <h3 className="landing-step-title">{step.title}</h3>
                <p className="landing-step-desc">{step.description}</p>
              </div>
            ))}
          </section>

          {/* Security highlights */}
          <div className="landing-security" aria-label="Security features">
            {SECURITY_FEATURES.map((feature) => (
              <div key={feature.text} className="landing-security-item">
                <feature.icon size={14} aria-hidden="true" />
                <span>{feature.text}</span>
              </div>
            ))}
          </div>
        </header>

        <footer className="landing-legal-footer">
          <p className="landing-legal-text">
            By continuing, you agree to our{' '}
            <a href="/terms" className="landing-legal-link">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" className="landing-legal-link">Privacy Policy</a>
          </p>
          <p className="landing-copyright">© {CURRENT_YEAR} AuroraNotes. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
});
