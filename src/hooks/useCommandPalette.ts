/**
 * Hook to manage command palette state and keyboard shortcut
 */
import { useState, useCallback, useEffect } from 'react';

const RECENT_ACTIONS_KEY = 'auroranotes:recent-actions';
const MAX_RECENT_ACTIONS = 5;

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [recentActionIds, setRecentActionIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_ACTIONS_KEY);
      return stored ? JSON.parse(stored) : [];
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

      // Persist to localStorage
      try {
        localStorage.setItem(RECENT_ACTIONS_KEY, JSON.stringify(updated));
      } catch {
        // Ignore localStorage errors
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

