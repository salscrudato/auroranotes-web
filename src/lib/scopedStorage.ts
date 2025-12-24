/**
 * User-scoped localStorage utilities
 * Ensures all localStorage data is isolated by user UID to prevent cross-user data leakage
 */

import { STORAGE_KEYS } from './constants';

// Current user UID - set by auth system
let currentUid: string | null = null;

/**
 * Set the current user UID for storage scoping
 * Should be called when user logs in
 */
export function setStorageUserId(uid: string | null): void {
  currentUid = uid;
}

/**
 * Get the current user UID
 */
export function getStorageUserId(): string | null {
  return currentUid;
}

/**
 * Build a user-scoped storage key
 * Format: `{baseKey}:user:{uid}`
 */
export function scopedKey(baseKey: string, uid?: string): string {
  const userId = uid ?? currentUid;
  if (!userId) {
    console.warn('[scopedStorage] No user ID set - using unscoped key');
    return baseKey;
  }
  return `${baseKey}:user:${userId}`;
}

/**
 * Get item from user-scoped localStorage
 */
export function getScopedItem<T>(key: string, uid?: string): T | null {
  try {
    const fullKey = scopedKey(key, uid);
    const stored = localStorage.getItem(fullKey);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Set item in user-scoped localStorage
 */
export function setScopedItem<T>(key: string, value: T, uid?: string): void {
  try {
    const fullKey = scopedKey(key, uid);
    localStorage.setItem(fullKey, JSON.stringify(value));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Remove item from user-scoped localStorage
 */
export function removeScopedItem(key: string, uid?: string): void {
  try {
    const fullKey = scopedKey(key, uid);
    localStorage.removeItem(fullKey);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Clear all storage for a specific user
 * Removes all keys that contain `:user:{uid}`
 */
export function clearUserStorage(uid?: string): void {
  const userId = uid ?? currentUid;
  if (!userId) return;

  try {
    const userSuffix = `:user:${userId}`;
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes(userSuffix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Clear all Aurora-prefixed storage (for logout cleanup)
 * This removes both scoped and unscoped Aurora keys
 */
export function clearAllAuroraStorage(): void {
  try {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('aurora') || key.startsWith('auroranotes'))) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Storage keys with user scoping helpers
 */
export const ScopedStorageKeys = {
  chatHistory: () => scopedKey(STORAGE_KEYS.CHAT_HISTORY),
  chatHistoryThreads: () => scopedKey(STORAGE_KEYS.CHAT_HISTORY + '-threads'),
  activeThread: () => scopedKey(STORAGE_KEYS.ACTIVE_THREAD_ID),
  pinnedNotes: () => scopedKey(STORAGE_KEYS.PINNED_NOTES),
  savedViews: () => scopedKey(STORAGE_KEYS.SAVED_VIEWS),
  chatFilters: () => scopedKey(STORAGE_KEYS.CHAT_FILTERS),
  conversations: () => scopedKey('aurora_conversations'),
  recentActions: () => scopedKey('auroranotes:recent-actions'),
};

