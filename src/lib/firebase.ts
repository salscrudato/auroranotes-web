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

