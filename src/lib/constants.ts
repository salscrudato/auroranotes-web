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
  },
  TIMEOUTS: {
    DEFAULT: 10000,      // 10 seconds
    HEALTH: 5000,        // 5 seconds
    CHAT: 30000,         // 30 seconds for AI responses
    STREAM: 60000,       // 60 seconds for streaming responses
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
  HISTORY_STORAGE_KEY: 'aurora-chat-history',
  MAX_HISTORY_MESSAGES: 100,
} as const;

// ===========================================
// UI Configuration
// ===========================================

export const UI = {
  TOAST_DURATION_MS: 3000,
  ANIMATION: {
    FAST: 150,
    NORMAL: 200,
    SLOW: 300,
  },
  HEALTH_CHECK_INTERVAL_MS: 30000,
  SKELETON_COUNT: 3,
} as const;

// ===========================================
// Storage Keys
// ===========================================

export const STORAGE_KEYS = {
  THEME: 'aurora-theme',
  CHAT_HISTORY: 'aurora-chat-history',
  USER_PREFERENCES: 'aurora-preferences',
} as const;

// ===========================================
// Validation
// ===========================================

export const VALIDATION = {
  MIN_SEARCH_LENGTH: 1,
  MAX_SEARCH_LENGTH: 200,
} as const;

// ===========================================
// Feature Flags
// ===========================================

export const FEATURES = {
  ENABLE_MARKDOWN: true,
  ENABLE_CHAT_PERSISTENCE: true,
  ENABLE_NOTE_EDITING: true,
  ENABLE_NOTE_DELETION: true,
  ENABLE_OFFLINE_BANNER: true,
} as const;

