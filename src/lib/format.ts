/**
 * Formatting utilities for timestamps and notes
 */

import type { RawTimestamp, RawNote, Note } from './types';

/**
 * Convert raw timestamp value to Date object
 */
export function toDate(value: RawTimestamp): Date | null {
  if (!value) return null;
  
  if (typeof value === 'string') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  
  if (typeof value === 'object' && '_seconds' in value) {
    return new Date(value._seconds * 1000);
  }
  
  return null;
}

/**
 * Format a date as relative time (e.g., "Just now", "5m", "2h", "3d")
 */
export function formatRelativeTime(d: Date | null): string {
  if (!d) return '';
  
  try {
    const now = Date.now();
    const diffMs = now - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m`;
    
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h`;
    
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d`;
    
    // For older, show short date
    return d.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric' 
    });
  } catch {
    return '';
  }
}

/**
 * Format a date as full timestamp for tooltips
 */
export function formatFullTimestamp(d: Date | null): string {
  if (!d) return 'Unknown time';
  
  try {
    return d.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return 'Unknown time';
  }
}

/**
 * Normalize a raw note from API to consistent format
 */
export function normalizeNote(raw: RawNote): Note {
  return {
    id: raw.id || `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: raw.title,
    text: raw.text || '',
    tenantId: raw.tenantId || 'public',
    processingStatus: raw.processingStatus,
    tags: raw.tags,
    metadata: raw.metadata,
    createdAt: toDate(raw.createdAt),
    updatedAt: toDate(raw.updatedAt),
  };
}

/**
 * Truncate text to specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '…';
}

/**
 * Get short ID for display (first 8 chars)
 */
export function shortId(id: string): string {
  if (!id || id.startsWith('temp-')) return '';
  return id.slice(0, 8);
}

/**
 * Get date group label for a date (Today, Yesterday, This Week, etc)
 * Used for grouping notes in Apple Notes style
 */
export function getDateGroup(d: Date | null): string {
  if (!d) return 'Unknown';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const noteDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (noteDate.getTime() === today.getTime()) {
    return 'Today';
  }
  if (noteDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  }
  if (noteDate >= lastWeek) {
    return 'This Week';
  }
  if (noteDate >= lastMonth) {
    return 'This Month';
  }

  // For older dates, show month and year
  return d.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Group notes by date category
 */
export function groupNotesByDate<T extends { createdAt: Date | null }>(
  notes: T[]
): { group: string; notes: T[] }[] {
  const groups = new Map<string, T[]>();

  for (const note of notes) {
    const group = getDateGroup(note.createdAt);
    if (!groups.has(group)) {
      groups.set(group, []);
    }
    groups.get(group)!.push(note);
  }

  // Convert to array, maintaining insertion order (most recent first)
  return Array.from(groups.entries()).map(([group, notes]) => ({ group, notes }));
}

