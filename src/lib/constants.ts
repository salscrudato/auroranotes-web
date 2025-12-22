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

// ===========================================
// Feature Flags
// ===========================================

export const FEATURES = {
  ENABLE_OFFLINE_BANNER: true,
} as const;

