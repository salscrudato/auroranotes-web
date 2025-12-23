/**
 * usePinnedNotes hook - Local storage-based note pinning
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { STORAGE_KEYS } from '../lib/constants';
import type { PinnedNote, Note } from '../lib/types';

function loadPinnedNotes(): PinnedNote[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PINNED_NOTES);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function persistPinnedNotes(pinned: PinnedNote[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PINNED_NOTES, JSON.stringify(pinned));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Hook for managing pinned notes
 */
export function usePinnedNotes() {
  const [pinnedNotes, setPinnedNotes] = useState<PinnedNote[]>(() => loadPinnedNotes());

  // Persist on change
  useEffect(() => {
    persistPinnedNotes(pinnedNotes);
  }, [pinnedNotes]);

  const pinnedIds = useMemo(
    () => new Set(pinnedNotes.map(p => p.noteId)),
    [pinnedNotes]
  );

  const isPinned = useCallback((noteId: string): boolean => {
    return pinnedIds.has(noteId);
  }, [pinnedIds]);

  const pinNote = useCallback((noteId: string) => {
    setPinnedNotes(prev => {
      if (prev.some(p => p.noteId === noteId)) return prev;
      return [...prev, { noteId, pinnedAt: new Date().toISOString() }];
    });
  }, []);

  const unpinNote = useCallback((noteId: string) => {
    setPinnedNotes(prev => prev.filter(p => p.noteId !== noteId));
  }, []);

  const togglePin = useCallback((noteId: string) => {
    if (isPinned(noteId)) {
      unpinNote(noteId);
    } else {
      pinNote(noteId);
    }
  }, [isPinned, pinNote, unpinNote]);

  /**
   * Sort notes with pinned first, maintaining date order within each group
   */
  const sortWithPinned = useCallback(<T extends Note>(notes: T[]): { pinned: T[]; unpinned: T[] } => {
    const pinned: T[] = [];
    const unpinned: T[] = [];

    for (const note of notes) {
      if (pinnedIds.has(note.id)) {
        pinned.push(note);
      } else {
        unpinned.push(note);
      }
    }

    // Sort pinned by pin date (most recent first)
    const pinnedMap = new Map(pinnedNotes.map(p => [p.noteId, p.pinnedAt]));
    pinned.sort((a, b) => {
      const aTime = pinnedMap.get(a.id) || '';
      const bTime = pinnedMap.get(b.id) || '';
      return bTime.localeCompare(aTime);
    });

    return { pinned, unpinned };
  }, [pinnedIds, pinnedNotes]);

  return {
    pinnedNotes,
    pinnedIds,
    isPinned,
    pinNote,
    unpinNote,
    togglePin,
    sortWithPinned,
  };
}

