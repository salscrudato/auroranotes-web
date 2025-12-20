/**
 * Firebase Configuration and Initialization
 * Loads config from VITE_FIREBASE_* environment variables
 */

import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  type Auth,
  type ConfirmationResult,
  type User,
} from 'firebase/auth';

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

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
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
 * Initialize invisible reCAPTCHA for phone auth
 * Call this once before starting phone sign-in
 */
export function initRecaptcha(containerId: string): RecaptchaVerifier {
  const auth = getFirebaseAuth();
  
  // Clear existing verifier
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
  }
  
  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved - allow sign in
    },
    'expired-callback': () => {
      // reCAPTCHA expired - reset
      console.warn('reCAPTCHA expired');
    },
  });
  
  return recaptchaVerifier;
}

/**
 * Start phone sign-in flow
 * @param phoneNumber Phone number in E.164 format (e.g., +14155551234)
 */
export async function startPhoneSignIn(phoneNumber: string): Promise<void> {
  const auth = getFirebaseAuth();
  
  if (!recaptchaVerifier) {
    throw new Error('reCAPTCHA not initialized. Call initRecaptcha() first.');
  }
  
  phoneConfirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
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

