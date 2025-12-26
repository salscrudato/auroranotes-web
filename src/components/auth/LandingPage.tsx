import { useState, useCallback, useEffect, useRef, memo } from 'react';
import { Loader2, Phone, ChevronLeft, PenLine, MessageCircle, Sparkles, Shield, Lock, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/auth/useAuth';
import { GoogleIcon } from './GoogleIcon';
import { PhoneInput } from './PhoneInput';
import { clearRecaptcha, initRecaptcha } from '@/lib/firebase';

const CURRENT_YEAR = new Date().getFullYear();
const RESEND_COOLDOWN_SECONDS = 60;
const OTP_LENGTH = 6;

// Type for Web OTP API
interface OTPCredential extends Credential {
  code: string;
}

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
  const [phoneE164, setPhoneE164] = useState('');
  const [phoneFormatted, setPhoneFormatted] = useState('');
  const [phoneIsValid, setPhoneIsValid] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const otpContainerRef = useRef<HTMLDivElement>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const webOtpAbortRef = useRef<AbortController | null>(null);

  // Convert OTP string to array of digits for display
  const otpDigits = otpValue.padEnd(OTP_LENGTH, '').split('').slice(0, OTP_LENGTH);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (webOtpAbortRef.current) webOtpAbortRef.current.abort();
      clearRecaptcha();
    };
  }, []);

  // Initialize reCAPTCHA when phone input is shown
  useEffect(() => {
    if (showPhoneInput && !phoneVerificationPending) {
      const timer = setTimeout(async () => {
        try {
          await initRecaptcha('recaptcha-container');
        } catch (e) {
          console.error('Failed to init reCAPTCHA:', e);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showPhoneInput, phoneVerificationPending]);

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

  // Auto-focus hidden input when verification starts + Web OTP API
  useEffect(() => {
    if (phoneVerificationPending) {
      // Focus the hidden input for autofill
      setTimeout(() => hiddenInputRef.current?.focus(), 100);

      // Try Web OTP API (Chrome on Android)
      if ('OTPCredential' in window) {
        webOtpAbortRef.current = new AbortController();
        navigator.credentials.get({
          // @ts-expect-error - Web OTP API types not in TS lib
          otp: { transport: ['sms'] },
          signal: webOtpAbortRef.current.signal,
        }).then((credential: Credential | null) => {
          if (credential && 'code' in credential) {
            const otpCred = credential as OTPCredential;
            setOtpValue(otpCred.code.slice(0, OTP_LENGTH));
          }
        }).catch(() => {
          // Web OTP not available or user denied - that's fine
        });
      }
    }

    return () => {
      if (webOtpAbortRef.current) webOtpAbortRef.current.abort();
    };
  }, [phoneVerificationPending]);

  // Auto-submit when OTP is complete
  useEffect(() => {
    if (otpValue.length === OTP_LENGTH && !isVerifying && !loading && !verifySuccess) {
      handleVerifyCode();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpValue, isVerifying, loading, verifySuccess]);

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

  // Handle phone input changes from the PhoneInput component
  const handlePhoneChange = useCallback((e164: string, formatted: string, isValid: boolean) => {
    setPhoneE164(e164);
    setPhoneFormatted(formatted);
    setPhoneIsValid(isValid);
    if (error) clearError();
  }, [error, clearError]);

  const handlePhoneSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneIsValid || !phoneE164) return;
    withLoading(() => startPhoneSignIn(phoneE164));
  }, [phoneE164, phoneIsValid, startPhoneSignIn, withLoading]);

  const handleVerifyCode = useCallback(async () => {
    if (otpValue.length !== OTP_LENGTH || isVerifying) return;

    setIsVerifying(true);
    clearError();
    try {
      await verifyPhoneCode(otpValue);
      setVerifySuccess(true);
    } catch {
      // Error handled - clear OTP on error with shake animation
      setOtpValue('');
      setFocusedIndex(0);
      setTimeout(() => hiddenInputRef.current?.focus(), 100);
    } finally {
      setIsVerifying(false);
    }
  }, [otpValue, isVerifying, verifyPhoneCode, clearError]);

  // Handle hidden input change (captures SMS autofill)
  const handleHiddenInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setOtpValue(value);
    setFocusedIndex(Math.min(value.length, OTP_LENGTH - 1));
  }, []);

  // Handle paste event to extract OTP from clipboard
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    // Extract only digits from pasted content
    const digits = pastedText.replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (digits.length > 0) {
      setOtpValue(digits);
      setFocusedIndex(Math.min(digits.length, OTP_LENGTH - 1));
    }
  }, []);

  // Handle key events on hidden input
  const handleHiddenInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (otpValue.length > 0) {
        setOtpValue(prev => prev.slice(0, -1));
        setFocusedIndex(Math.max(0, otpValue.length - 2));
      }
    } else if (e.key === 'ArrowLeft') {
      setFocusedIndex(prev => Math.max(0, prev - 1));
    } else if (e.key === 'ArrowRight') {
      setFocusedIndex(prev => Math.min(OTP_LENGTH - 1, prev + 1));
    }
  }, [otpValue]);

  // Handle clicking on a digit box - focus the hidden input
  const handleDigitClick = useCallback((index: number) => {
    setFocusedIndex(index);
    hiddenInputRef.current?.focus();
  }, []);

  const handleResendCode = useCallback(async () => {
    if (resendCountdown > 0 || isResending || !phoneE164) return;
    setIsResending(true);
    clearError();
    setOtpValue('');
    setFocusedIndex(0);
    try {
      await startPhoneSignIn(phoneE164);
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
      setTimeout(() => hiddenInputRef.current?.focus(), 100);
    } catch {
      // Error handled by AuthProvider
    } finally {
      setIsResending(false);
    }
  }, [resendCountdown, isResending, phoneE164, startPhoneSignIn, clearError]);

  const handleBackToOptions = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (webOtpAbortRef.current) webOtpAbortRef.current.abort();
    setShowPhoneInput(false);
    setPhoneE164('');
    setPhoneFormatted('');
    setPhoneIsValid(false);
    setOtpValue('');
    setFocusedIndex(0);
    setResendCountdown(0);
    setVerifySuccess(false);
    clearError();
    clearRecaptcha();
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
            {/* Invisible reCAPTCHA container */}
            <div
              id="recaptcha-container"
              ref={recaptchaContainerRef}
            />

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
              <div className="landing-phone-form">
                {BackButton}
                <p className="landing-phone-hint">
                  {verifySuccess ? 'Code verified!' : `Enter the 6-digit code sent to ${phoneFormatted || phoneE164}`}
                </p>

                {/* Hidden input for SMS autofill - this is the key for proper autofill! */}
                <input
                  ref={hiddenInputRef}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="landing-otp-hidden-input"
                  value={otpValue}
                  onChange={handleHiddenInputChange}
                  onKeyDown={handleHiddenInputKeyDown}
                  onPaste={handlePaste}
                  maxLength={OTP_LENGTH}
                  disabled={isVerifying || verifySuccess}
                  aria-label="Enter verification code"
                  autoFocus
                />

                {/* Visual OTP Boxes - these are just for display */}
                <div
                  ref={otpContainerRef}
                  className={`landing-otp-container ${error ? 'shake' : ''} ${verifySuccess ? 'success' : ''}`}
                  onClick={() => hiddenInputRef.current?.focus()}
                  role="group"
                  aria-label="Verification code"
                >
                  {otpDigits.map((digit, index) => {
                    const isFilled = digit !== '' && digit !== ' ';
                    const isFocused = focusedIndex === index && !isVerifying && !verifySuccess;
                    const isCurrentPosition = index === otpValue.length && !isVerifying && !verifySuccess;

                    return (
                      <button
                        key={index}
                        type="button"
                        className={`landing-otp-digit ${isFilled ? 'filled' : ''} ${isFocused || isCurrentPosition ? 'focused' : ''} ${isVerifying ? 'verifying' : ''} ${verifySuccess ? 'success' : ''}`}
                        onClick={(e) => { e.stopPropagation(); handleDigitClick(index); }}
                        tabIndex={-1}
                        aria-hidden="true"
                      >
                        {isFilled ? (
                          <span className="landing-otp-digit-value">{digit}</span>
                        ) : isCurrentPosition && !isVerifying ? (
                          <span className="landing-otp-cursor" />
                        ) : null}
                        {verifySuccess && index === OTP_LENGTH - 1 && (
                          <span className="landing-otp-check">
                            <CheckCircle2 size={20} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Status indicator */}
                <div className="landing-otp-status">
                  {isVerifying ? (
                    <div className="landing-verifying">
                      <Loader2 size={16} className="spinner" />
                      <span>Verifying...</span>
                    </div>
                  ) : verifySuccess ? (
                    <div className="landing-success">
                      <CheckCircle2 size={16} />
                      <span>Success! Signing you in...</span>
                    </div>
                  ) : null}
                </div>

                {!verifySuccess && (
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
                )}
              </div>
            ) : (
              <form onSubmit={handlePhoneSubmit} className="landing-phone-form">
                {BackButton}
                <p className="landing-phone-hint">Enter your phone number</p>
                <PhoneInput
                  value={phoneFormatted}
                  onChange={handlePhoneChange}
                  disabled={loading}
                  autoFocus
                  error={error?.code?.includes('phone') ? error.message : null}
                />
                <button
                  id="phone-sign-in-button"
                  type="submit"
                  className="landing-auth-btn landing-auth-primary"
                  disabled={loading || !phoneIsValid}
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="spinner" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRight size={20} />
                      <span>Send Verification Code</span>
                    </>
                  )}
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
