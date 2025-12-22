/**
 * NoteCard component - Apple-inspired design
 * Clean, typography-focused note display with subtle interactions
 * Supports search highlighting, external highlight state, and touch gestures
 */

import { useState, useCallback, useEffect, memo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { Note } from '../../lib/types';
import { formatRelativeTime, formatFullTimestamp } from '../../lib/format';
import { escapeRegex, cn, copyToClipboard, triggerHaptic } from '../../lib/utils';
import { useToast } from '../common/useToast';
import { NOTES } from '../../lib/constants';
import { useTouchGestures } from '../../hooks/useTouchGestures';

interface NoteCardProps {
  note: Note;
  isPending?: boolean;
  isHighlighted?: boolean;
  searchQuery?: string;
  onEdit?: (note: Note) => void;
  onDelete?: (note: Note) => void;
}

export const NoteCard = memo(function NoteCard({
  note,
  isPending = false,
  isHighlighted = false,
  searchQuery = '',
  onEdit,
  onDelete,
}: NoteCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [highlightActive, setHighlightActive] = useState(false);
  const [swipeHint, setSwipeHint] = useState<'edit' | 'delete' | null>(null);
  const { showToast } = useToast();

  // Touch gestures for mobile - swipe left to delete, right to edit, long press to copy
  const { isLongPressing, handlers: touchHandlers } = useTouchGestures({
    longPressDelay: 400,
    swipeThreshold: 60,
    hapticFeedback: true,
    onLongPressStart: () => {
      // Long press to copy on mobile
      copyToClipboard(note.text).then(success => {
        showToast(success ? 'Copied to clipboard' : 'Failed to copy', success ? 'success' : 'error');
      });
    },
    onSwipeLeft: () => {
      // Swipe left to delete (with visual hint)
      if (onDelete && !isPending) {
        setSwipeHint('delete');
        setTimeout(() => {
          setSwipeHint(null);
          onDelete(note);
        }, 150);
      }
    },
    onSwipeRight: () => {
      // Swipe right to edit
      if (onEdit && !isPending) {
        setSwipeHint('edit');
        setTimeout(() => {
          setSwipeHint(null);
          onEdit(note);
        }, 150);
      }
    },
  });

  // Flash highlight effect - triggered when isHighlighted prop changes
  useEffect(() => {
    if (!isHighlighted) {
      return;
    }
    // Start highlight animation after a microtask to avoid synchronous setState
    const startTimeout = setTimeout(() => setHighlightActive(true), 0);
    const endTimeout = setTimeout(() => setHighlightActive(false), NOTES.HIGHLIGHT_DURATION_MS);
    return () => {
      clearTimeout(startTimeout);
      clearTimeout(endTimeout);
    };
  }, [isHighlighted]);

  const showHighlight = isHighlighted || highlightActive;

  const needsExpansion = note.text.length > 200 || note.text.split('\n').length > 2;

  const handleToggle = useCallback(() => {
    if (needsExpansion) {
      setExpanded((prev) => !prev);
    }
  }, [needsExpansion]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(note);
  }, [note, onEdit]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('medium');
    onDelete?.(note);
  }, [note, onDelete]);

  const relativeTime = formatRelativeTime(note.createdAt);
  const fullTime = formatFullTimestamp(note.createdAt);

  // Render text with optional search highlighting
  const renderText = () => {
    if (!searchQuery || !note.text.toLowerCase().includes(searchQuery.toLowerCase())) {
      return note.text;
    }

    // Simple case-insensitive highlight
    const parts = note.text.split(new RegExp(`(${escapeRegex(searchQuery)})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === searchQuery.toLowerCase() ? (
            <mark key={i} className="search-highlight">{part}</mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  // Handle keyboard shortcuts for note actions
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Expand/collapse with Enter or Space
    if (needsExpansion && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleToggle();
      return;
    }

    // Keyboard shortcuts for actions
    if (e.key === 'e' && onEdit) {
      // 'e' to edit
      e.preventDefault();
      onEdit(note);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      // Delete/Backspace to delete (with confirmation in parent)
      if (onDelete) {
        e.preventDefault();
        onDelete(note);
      }
    }
  }, [needsExpansion, handleToggle, note, onEdit, onDelete]);

  const cardClasses = cn(
    'note-card',
    isPending && 'pending',
    showHighlight && 'highlighted',
    isLongPressing && 'long-pressing',
    swipeHint === 'edit' && 'swipe-edit',
    swipeHint === 'delete' && 'swipe-delete'
  );

  // Extract first line as title, rest as preview
  const lines = note.text.split('\n');
  const firstLine = lines[0] || '';

  // Get a preview of the content (first ~60 chars or first line)
  const titleText = firstLine.length > 60 ? firstLine.slice(0, 57) + '...' : firstLine;
  const previewText = lines.length > 1
    ? lines.slice(1).join(' ').trim().slice(0, 100)
    : firstLine.length > 60 ? firstLine.slice(60).trim().slice(0, 100) : '';

  return (
    <article
      className={cardClasses}
      onClick={handleToggle}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`Note: ${note.text.slice(0, 50)}${note.text.length > 50 ? '...' : ''}`}
      aria-expanded={needsExpansion ? expanded : undefined}
      role={needsExpansion ? 'button' : undefined}
      {...touchHandlers}
    >
      {/* Collapsed view: Apple Notes style */}
      {!expanded && (
        <>
          <div className="note-title">
            {searchQuery ? renderText() : titleText}
          </div>
          {previewText && !searchQuery && (
            <div className="note-preview">{previewText}</div>
          )}
          <div className="note-footer">
            <span className="note-time" title={fullTime}>
              {isPending ? 'Saving…' : relativeTime}
            </span>

            {/* Overflow menu button - visible on hover */}
            <div className="note-actions">
              {onEdit && (
                <button
                  className="note-action-btn"
                  onClick={handleEdit}
                  title="Edit"
                  aria-label="Edit note"
                >
                  <Pencil size={15} />
                </button>
              )}
              {onDelete && (
                <button
                  className="note-action-btn note-action-danger"
                  onClick={handleDelete}
                  title="Delete"
                  aria-label="Delete note"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Expanded view: full content */}
      {expanded && (
        <>
          <div className="note-text">
            {renderText()}
          </div>
          <div className="note-footer">
            <span className="note-time" title={fullTime}>
              {isPending ? 'Saving…' : relativeTime}
            </span>
            <div className="note-actions note-actions-visible">
              {onEdit && (
                <button
                  className="note-action-btn"
                  onClick={handleEdit}
                  title="Edit"
                  aria-label="Edit note"
                >
                  <Pencil size={15} />
                </button>
              )}
              {onDelete && (
                <button
                  className="note-action-btn note-action-danger"
                  onClick={handleDelete}
                  title="Delete"
                  aria-label="Delete note"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </article>
  );
});

