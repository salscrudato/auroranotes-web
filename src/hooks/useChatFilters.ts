/**
 * useChatFilters hook - Manage chat context filters
 * Controls which notes are included in chat context
 * Uses user-scoped storage to prevent cross-user data leakage
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { ChatFilters, ChatFilterMode, Note } from '../lib/types';
import { ScopedStorageKeys, getScopedItem, setScopedItem, getStorageUserId } from '../lib/scopedStorage';

const DEFAULT_FILTERS: ChatFilters = {
  mode: 'all',
};

function loadFilters(): ChatFilters {
  if (!getStorageUserId()) return DEFAULT_FILTERS;
  try {
    return getScopedItem<ChatFilters>(ScopedStorageKeys.chatFilters()) || DEFAULT_FILTERS;
  } catch {
    return DEFAULT_FILTERS;
  }
}

function persistFilters(filters: ChatFilters): void {
  if (!getStorageUserId()) return;
  try {
    setScopedItem(ScopedStorageKeys.chatFilters(), filters);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Hook for managing chat context filters
 */
export function useChatFilters() {
  const [filters, setFilters] = useState<ChatFilters>(() => loadFilters());

  // Persist on change
  useEffect(() => {
    persistFilters(filters);
  }, [filters]);

  const setMode = useCallback((mode: ChatFilterMode) => {
    setFilters(prev => ({ ...prev, mode }));
  }, []);

  const setNoteIds = useCallback((noteIds: string[]) => {
    setFilters(prev => ({ ...prev, noteIds, mode: 'selected' }));
  }, []);

  const setTags = useCallback((tags: string[]) => {
    setFilters(prev => ({ ...prev, tags, mode: 'tags' }));
  }, []);

  const setDateRange = useCallback((start?: string, end?: string) => {
    setFilters(prev => {
      const dateRange: { start?: string; end?: string } = {};
      if (start !== undefined) dateRange.start = start;
      if (end !== undefined) dateRange.end = end;
      return { ...prev, dateRange, mode: 'date' as const };
    });
  }, []);

  const setNoteContext = useCallback((noteId: string) => {
    setFilters({ mode: 'note', noteIds: [noteId] });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  /**
   * Get human-readable description of current filters
   */
  const filterDescription = useMemo((): string => {
    switch (filters.mode) {
      case 'all':
        return 'All notes';
      case 'selected':
        const count = filters.noteIds?.length || 0;
        return count === 1 ? '1 note selected' : `${count} notes selected`;
      case 'tags':
        const tags = filters.tags || [];
        return tags.length === 1 ? `Tag: ${tags[0]}` : `${tags.length} tags`;
      case 'date':
        if (filters.dateRange?.start && filters.dateRange?.end) {
          return `${filters.dateRange.start} to ${filters.dateRange.end}`;
        }
        if (filters.dateRange?.start) {
          return `After ${filters.dateRange.start}`;
        }
        if (filters.dateRange?.end) {
          return `Before ${filters.dateRange.end}`;
        }
        return 'Date range';
      case 'note':
        return 'Current note';
      default:
        return 'All notes';
    }
  }, [filters]);

  /**
   * Check if a note matches current filters
   */
  const matchesFilters = useCallback((note: Note): boolean => {
    switch (filters.mode) {
      case 'all':
        return true;
      case 'selected':
      case 'note':
        return filters.noteIds?.includes(note.id) ?? false;
      case 'tags':
        if (!filters.tags?.length) return true;
        return note.tags?.some(t => filters.tags?.includes(t)) ?? false;
      case 'date':
        if (!note.createdAt) return true;
        const noteDateParts = note.createdAt.toISOString().split('T');
        const noteDate = noteDateParts[0];
        if (!noteDate) return true;
        if (filters.dateRange?.start && noteDate < filters.dateRange.start) return false;
        if (filters.dateRange?.end && noteDate > filters.dateRange.end) return false;
        return true;
      default:
        return true;
    }
  }, [filters]);

  return {
    filters,
    setFilters,
    setMode,
    setNoteIds,
    setTags,
    setDateRange,
    setNoteContext,
    clearFilters,
    filterDescription,
    matchesFilters,
    isFiltered: filters.mode !== 'all',
  };
}

