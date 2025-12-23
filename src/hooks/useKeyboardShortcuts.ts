/**
 * useKeyboardShortcuts hook
 * Global keyboard shortcut system with modifier key support
 */

import { useEffect, useCallback, useRef } from 'react';

export interface Shortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;  // Cmd on Mac
  shift?: boolean;
  alt?: boolean;
  handler: () => void;
  description: string;
  /** If true, works even when an input is focused */
  global?: boolean;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: Shortcut[];
  enabled?: boolean;
}

/** Check if user is on Mac */
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);

/** Get the modifier key name for display */
export function getModifierSymbol(modifier: 'ctrl' | 'meta' | 'shift' | 'alt'): string {
  if (isMac) {
    switch (modifier) {
      case 'ctrl': return '⌃';
      case 'meta': return '⌘';
      case 'shift': return '⇧';
      case 'alt': return '⌥';
    }
  } else {
    switch (modifier) {
      case 'ctrl': return 'Ctrl';
      case 'meta': return 'Win';
      case 'shift': return 'Shift';
      case 'alt': return 'Alt';
    }
  }
}

/** Format shortcut for display */
export function formatShortcut(shortcut: Shortcut): string {
  const parts: string[] = [];
  
  if (shortcut.ctrl) parts.push(getModifierSymbol('ctrl'));
  if (shortcut.meta) parts.push(getModifierSymbol('meta'));
  if (shortcut.alt) parts.push(getModifierSymbol('alt'));
  if (shortcut.shift) parts.push(getModifierSymbol('shift'));
  
  // Format key
  let key = shortcut.key.toUpperCase();
  if (key === ' ') key = 'Space';
  if (key === 'ARROWUP') key = '↑';
  if (key === 'ARROWDOWN') key = '↓';
  if (key === 'ARROWLEFT') key = '←';
  if (key === 'ARROWRIGHT') key = '→';
  if (key === 'ESCAPE') key = 'Esc';
  if (key === 'ENTER') key = '↵';
  
  parts.push(key);
  
  return isMac ? parts.join('') : parts.join('+');
}

export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    // Check if we're in an input field
    const target = e.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || 
                    target.tagName === 'TEXTAREA' || 
                    target.isContentEditable;

    for (const shortcut of shortcutsRef.current) {
      // Skip non-global shortcuts when in input
      if (isInput && !shortcut.global) continue;

      // Check key match (case insensitive)
      if (e.key.toLowerCase() !== shortcut.key.toLowerCase()) continue;

      // Check modifier keys
      const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || (isMac && e.metaKey)) : !e.ctrlKey;
      const metaMatch = shortcut.meta ? e.metaKey : !e.metaKey;
      const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
      const altMatch = shortcut.alt ? e.altKey : !e.altKey;

      // For cross-platform Cmd/Ctrl shortcuts, use meta on Mac, ctrl on others
      const crossPlatformCtrl = shortcut.meta && isMac ? e.metaKey : 
                                shortcut.meta && !isMac ? e.ctrlKey : true;

      if (ctrlMatch && metaMatch && shiftMatch && altMatch && crossPlatformCtrl) {
        e.preventDefault();
        shortcut.handler();
        return;
      }
    }
  }, [enabled]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { formatShortcut };
}

/** Common app shortcuts */
export const APP_SHORTCUTS = {
  SEARCH: { key: 'k', meta: true, description: 'Open search' },
  NEW_NOTE: { key: 'n', meta: true, description: 'New note' },
  NEW_CHAT: { key: 'j', meta: true, description: 'New chat' },
  TOGGLE_SIDEBAR: { key: 'b', meta: true, description: 'Toggle sidebar' },
  FOCUS_NOTES: { key: '1', meta: true, description: 'Focus notes panel' },
  FOCUS_CHAT: { key: '2', meta: true, description: 'Focus chat panel' },
  ESCAPE: { key: 'Escape', description: 'Close/Cancel', global: true },
} as const;

