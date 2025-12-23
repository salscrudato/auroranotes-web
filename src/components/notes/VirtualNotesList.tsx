/**
 * VirtualNotesList component - Virtualized notes list for large datasets
 * Uses @tanstack/react-virtual for efficient rendering of 100k+ notes
 */

import { useRef, useCallback, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Note } from '../../lib/types';
import { groupNotesByDate } from '../../lib/format';
import { cn } from '../../lib/utils';
import { NoteCard } from './NoteCard';
import { NoteCardSkeleton } from './NoteCardSkeleton';
import { Pin } from 'lucide-react';

interface VirtualNotesListProps {
  notes: Note[];
  pinnedNotes: Note[];
  loading?: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  highlightNoteId?: string | null;
  searchQuery?: string;
  onLoadMore?: () => void;
  onEdit?: (note: Note) => void;
  onDelete?: (note: Note) => void;
  onNoteClick?: (note: Note) => void;
  className?: string;
}

// Row types for virtualization
type VirtualRow =
  | { type: 'pinned-header' }
  | { type: 'pinned-note'; note: Note }
  | { type: 'group-header'; group: string }
  | { type: 'note'; note: Note }
  | { type: 'loading-more' }
  | { type: 'load-more-button' };

export function VirtualNotesList({
  notes,
  pinnedNotes,
  loading = false,
  loadingMore = false,
  hasMore = false,
  highlightNoteId,
  searchQuery,
  onLoadMore,
  onEdit,
  onDelete,
  onNoteClick,
  className,
}: VirtualNotesListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  // Build flat list of rows for virtualization
  const rows = useMemo((): VirtualRow[] => {
    const result: VirtualRow[] = [];

    // Add pinned section if there are pinned notes
    if (pinnedNotes.length > 0) {
      result.push({ type: 'pinned-header' });
      for (const note of pinnedNotes) {
        result.push({ type: 'pinned-note', note });
      }
    }

    // Group remaining notes by date
    const groupedNotes = groupNotesByDate(notes);
    for (const group of groupedNotes) {
      result.push({ type: 'group-header', group: group.group });
      for (const note of group.notes) {
        result.push({ type: 'note', note });
      }
    }

    // Add loading/load more at end
    if (loadingMore) {
      result.push({ type: 'loading-more' });
    } else if (hasMore) {
      result.push({ type: 'load-more-button' });
    }

    return result;
  }, [notes, pinnedNotes, loadingMore, hasMore]);

  // Estimate row heights
  const estimateSize = useCallback((index: number): number => {
    const row = rows[index];
    switch (row.type) {
      case 'pinned-header':
      case 'group-header':
        return 40; // Header height
      case 'pinned-note':
      case 'note':
        // Estimate based on text length
        const text = row.note.text;
        const lines = Math.ceil(text.length / 80); // ~80 chars per line
        return Math.min(Math.max(80, lines * 24 + 60), 200); // Min 80, max 200
      case 'loading-more':
      case 'load-more-button':
        return 48;
      default:
        return 100;
    }
  }, [rows]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan: 5, // Render 5 extra items above/below viewport
  });



  // Handle reaching end of list
  const handleScroll = useCallback(() => {
    if (!parentRef.current || !onLoadMore || loadingMore || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
    if (scrollHeight - scrollTop - clientHeight < 200) {
      onLoadMore();
    }
  }, [onLoadMore, loadingMore, hasMore]);

  if (loading) {
    return (
      <div className={cn('overflow-y-auto', className)}>
        <NoteCardSkeleton count={5} />
      </div>
    );
  }

  if (rows.length === 0) {
    return null; // Let parent handle empty state
  }

  return (
    <div
      ref={parentRef}
      className={cn('overflow-y-auto', className)}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const row = rows[virtualRow.index];

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {row.type === 'pinned-header' && (
                <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] sticky top-0 bg-[var(--color-bg)]/95 backdrop-blur-sm z-10">
                  <Pin size={14} className="text-[var(--color-primary)]" />
                  Pinned
                </div>
              )}

              {row.type === 'group-header' && (
                <div className="notes-group-header px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] sticky top-0 bg-[var(--color-bg)]/95 backdrop-blur-sm z-10">
                  {row.group}
                </div>
              )}

              {(row.type === 'note' || row.type === 'pinned-note') && (
                <div
                  ref={row.note.id === highlightNoteId ? highlightRef : undefined}
                  className="px-2"
                  onClick={onNoteClick ? () => onNoteClick(row.note) : undefined}
                >
                  <NoteCard
                    note={row.note}
                    isPending={row.note.id.startsWith('temp-')}
                    isHighlighted={row.note.id === highlightNoteId}
                    searchQuery={searchQuery}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </div>
              )}

              {row.type === 'loading-more' && (
                <div className="flex items-center justify-center gap-2 py-4 text-sm text-[var(--color-text-secondary)]">
                  <span className="spinner" /> Loading more...
                </div>
              )}

              {row.type === 'load-more-button' && (
                <div className="px-3 py-2">
                  <button
                    className="w-full btn"
                    onClick={onLoadMore}
                  >
                    Load more notes
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

