import { useState, useCallback, useEffect, useRef, memo } from 'react';
import { Loader2, ArrowRight, Phone, ChevronLeft, PenLine, MessageCircle, Sparkles, Shield, Lock, RefreshCw } from 'lucide-react';
import { useAuth } from '@/auth/useAuth';
import { GoogleIcon } from './GoogleIcon';
import { formatPhoneNumber, toE164 } from '@/lib/utils';
import { clearRecaptcha, initRecaptcha } from '@/lib/firebase';

const CURRENT_YEAR = new Date().getFullYear();
const RESEND_COOLDOWN_SECONDS = 60;
const OTP_LENGTH = 6;

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
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      clearRecaptcha();
    };
  }, []);

  // Initialize reCAPTCHA when phone input is shown
  useEffect(() => {
    if (showPhoneInput && !phoneVerificationPending) {
      // Small delay to ensure container is visible
      const timer = setTimeout(async () => {
        try {
          await initRecaptcha('recaptcha-container');
        } catch (e) {
          // eslint-disable-next-line no-console
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

  // Auto-focus first OTP input when verification starts
  useEffect(() => {
    if (phoneVerificationPending) {
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    }
  }, [phoneVerificationPending]);

  // Auto-submit when OTP is complete
  useEffect(() => {
    const code = otpDigits.join('');
    if (code.length === OTP_LENGTH && !isVerifying && !loading) {
      handleVerifyCode();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpDigits, isVerifying, loading]);

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

  const handleVerifyCode = useCallback(async () => {
    const code = otpDigits.join('');
    if (code.length !== OTP_LENGTH || isVerifying) return;

    setIsVerifying(true);
    clearError();
    try {
      await verifyPhoneCode(code);
    } catch {
      // Error handled - clear OTP on error
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } finally {
      setIsVerifying(false);
    }
  }, [otpDigits, isVerifying, verifyPhoneCode, clearError]);

  const handleOtpChange = useCallback((index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);

    setOtpDigits(prev => {
      const newDigits = [...prev];
      newDigits[index] = digit;
      return newDigits;
    });

    // Auto-advance to next input
    if (digit && index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }
  }, [otpDigits]);

  const handleOtpPaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (pastedData) {
      const newDigits = Array(OTP_LENGTH).fill('');
      pastedData.split('').forEach((digit, i) => {
        newDigits[i] = digit;
      });
      setOtpDigits(newDigits);
      // Focus the input after the last pasted digit
      const focusIndex = Math.min(pastedData.length, OTP_LENGTH - 1);
      otpInputRefs.current[focusIndex]?.focus();
    }
  }, []);

  const handleResendCode = useCallback(async () => {
    if (resendCountdown > 0 || isResending) return;
    setIsResending(true);
    clearError();
    setOtpDigits(Array(OTP_LENGTH).fill(''));
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
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
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
    setOtpDigits(Array(OTP_LENGTH).fill(''));
    setResendCountdown(0);
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
                <p className="landing-phone-hint">Enter the 6-digit code sent to {phoneNumber}</p>

                {/* OTP Input Boxes */}
                <div className="landing-otp-container" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { otpInputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      autoComplete={index === 0 ? 'one-time-code' : 'off'}
                      className={`landing-otp-input ${digit ? 'filled' : ''} ${isVerifying ? 'verifying' : ''}`}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      maxLength={1}
                      disabled={isVerifying}
                      aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
                    />
                  ))}
                </div>

                {/* Verifying indicator */}
                {isVerifying && (
                  <div className="landing-verifying">
                    <Loader2 size={16} className="spinner" />
                    <span>Verifying...</span>
                  </div>
                )}

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
              </div>
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
