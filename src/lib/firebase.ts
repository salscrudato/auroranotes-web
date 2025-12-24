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
const USE_AUTH_EMULATOR = import.meta.env['VITE_USE_FIREBASE_EMULATOR'] === 'true';
const AUTH_EMULATOR_URL = import.meta.env['VITE_FIREBASE_AUTH_EMULATOR_URL'] || 'http://127.0.0.1:9099';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env['VITE_FIREBASE_API_KEY'] as string,
  authDomain: import.meta.env['VITE_FIREBASE_AUTH_DOMAIN'] as string,
  projectId: import.meta.env['VITE_FIREBASE_PROJECT_ID'] as string,
  storageBucket: import.meta.env['VITE_FIREBASE_STORAGE_BUCKET'] as string,
  messagingSenderId: import.meta.env['VITE_FIREBASE_MESSAGING_SENDER_ID'] as string,
  appId: import.meta.env['VITE_FIREBASE_APP_ID'] as string,
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
let recaptchaRendered = false;

/**
 * Initialize invisible reCAPTCHA attached to a container element
 * @param containerIdOrElement The ID of the container element or the element itself
 */
export async function initRecaptcha(containerIdOrElement: string | HTMLElement): Promise<RecaptchaVerifier> {
  const auth = getFirebaseAuth();

  // Clear existing verifier if any
  await clearRecaptcha();

  // Wait a tick to ensure DOM is ready
  await new Promise(resolve => setTimeout(resolve, 0));

  recaptchaVerifier = new RecaptchaVerifier(auth, containerIdOrElement, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved - this is called automatically
    },
    'expired-callback': () => {
      recaptchaRendered = false;
    },
    'error-callback': () => {
      recaptchaRendered = false;
    },
  });

  // Pre-render the reCAPTCHA
  try {
    await recaptchaVerifier.render();
    recaptchaRendered = true;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[reCAPTCHA] Render warning:', e);
    recaptchaRendered = true;
  }

  return recaptchaVerifier;
}

/**
 * Check if reCAPTCHA has been solved (always true for invisible)
 */
export function isRecaptchaSolved(): boolean {
  return recaptchaRendered;
}

/**
 * Check if reCAPTCHA is ready
 */
export function isRecaptchaReady(): boolean {
  return recaptchaVerifier !== null && recaptchaRendered;
}

/**
 * Clear the reCAPTCHA verifier (call when unmounting)
 */
export async function clearRecaptcha(): Promise<void> {
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch {
      // Ignore errors when clearing
    }
    recaptchaVerifier = null;
    recaptchaRendered = false;
  }

  // Also clean up any lingering reCAPTCHA iframes
  const recaptchaElements = document.querySelectorAll('.grecaptcha-badge, [id^="g-recaptcha"]');
  recaptchaElements.forEach(el => el.remove());
}

/**
 * Start phone sign-in flow
 * @param phoneNumber Phone number in E.164 format (e.g., +14155551234)
 * @param containerId The ID of the container element for reCAPTCHA
 */
export async function startPhoneSignIn(phoneNumber: string, containerId: string): Promise<void> {
  const auth = getFirebaseAuth();

  try {
    // For emulator, we need a mock verifier
    if (USE_AUTH_EMULATOR) {
      const mockVerifier = {
        type: 'recaptcha' as const,
        verify: () => Promise.resolve('mock-recaptcha-token'),
      };
      phoneConfirmationResult = await signInWithPhoneNumber(auth, phoneNumber, mockVerifier);
    } else {
      // Initialize reCAPTCHA if not ready
      if (!recaptchaVerifier || !recaptchaRendered) {
        // eslint-disable-next-line no-console
        console.log('[Phone Auth] Initializing reCAPTCHA for container:', containerId);
        await initRecaptcha(containerId);
      }

      if (!recaptchaVerifier) {
        throw new Error('Failed to initialize verification. Please refresh and try again.');
      }

      // eslint-disable-next-line no-console
      console.log('[Phone Auth] Sending verification to:', phoneNumber);
      phoneConfirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      // eslint-disable-next-line no-console
      console.log('[Phone Auth] Verification code sent successfully');
    }
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };

    // eslint-disable-next-line no-console
    console.error('[Phone Auth] Error:', firebaseError.code, firebaseError.message);

    // Reset reCAPTCHA on error for retry
    await clearRecaptcha();

    // Provide user-friendly error messages
    if (firebaseError.code === 'auth/invalid-phone-number') {
      throw new Error('Please enter a valid phone number.');
    } else if (firebaseError.code === 'auth/too-many-requests') {
      throw new Error('Too many attempts. Please wait a few minutes.');
    } else if (firebaseError.code === 'auth/captcha-check-failed') {
      throw new Error('Verification failed. Please try again.');
    } else if (firebaseError.code === 'auth/quota-exceeded') {
      throw new Error('SMS limit reached. Try Google sign-in instead.');
    } else if (firebaseError.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your connection.');
    } else if (firebaseError.code === 'auth/operation-not-allowed') {
      throw new Error('Phone sign-in is not enabled. Please use Google sign-in.');
    } else if (firebaseError.message?.includes('400') || firebaseError.message?.includes('OPERATION_NOT_ALLOWED')) {
      throw new Error('Phone sign-in unavailable. Please use Google sign-in.');
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
    throw new Error('Verification expired. Please request a new code.');
  }

  try {
    const result = await phoneConfirmationResult.confirm(code);
    phoneConfirmationResult = null;
    await clearRecaptcha();
    return result.user;
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };

    if (firebaseError.code === 'auth/invalid-verification-code') {
      throw new Error('Invalid code. Please check and try again.');
    } else if (firebaseError.code === 'auth/code-expired') {
      phoneConfirmationResult = null;
      throw new Error('Code expired. Please request a new one.');
    }
    throw error;
  }
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

