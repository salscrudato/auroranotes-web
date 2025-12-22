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
        <div className="landing-gradient-1" />
        <div className="landing-gradient-2" />
        <div className="landing-gradient-3" />
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

