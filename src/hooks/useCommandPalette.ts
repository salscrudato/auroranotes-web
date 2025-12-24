/**
 * Hook to manage command palette state and keyboard shortcut
 * Uses user-scoped storage to prevent cross-user data leakage
 */
import { useState, useCallback, useEffect } from 'react';
import { ScopedStorageKeys, getScopedItem, setScopedItem, getStorageUserId } from '../lib/scopedStorage';

const MAX_RECENT_ACTIONS = 5;

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [recentActionIds, setRecentActionIds] = useState<string[]>(() => {
    if (!getStorageUserId()) return [];
    try {
      return getScopedItem<string[]>(ScopedStorageKeys.recentActions()) || [];
    } catch {
      return [];
    }
  });

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  // Track recent actions
  const trackAction = useCallback((actionId: string) => {
    setRecentActionIds((prev) => {
      // Remove if already exists, then add to front
      const filtered = prev.filter((id) => id !== actionId);
      const updated = [actionId, ...filtered].slice(0, MAX_RECENT_ACTIONS);

      // Persist to user-scoped localStorage
      if (getStorageUserId()) {
        try {
          setScopedItem(ScopedStorageKeys.recentActions(), updated);
        } catch {
          // Ignore localStorage errors
        }
      }

      return updated;
    });
  }, []);

  // Global keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  return { isOpen, open, close, toggle, recentActionIds, trackAction };
}

