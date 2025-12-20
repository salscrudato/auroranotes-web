/**
 * NoteCard component
 * Compact note display with expandable text, hover actions, and relative time
 * Supports search highlighting and external highlight state
 */

import { useState, useCallback, useEffect, memo } from 'react';
import { Copy, Pencil, Trash2 } from 'lucide-react';
import type { Note } from '../../lib/types';
import { formatRelativeTime, formatFullTimestamp, shortId } from '../../lib/format';
import { escapeRegex, cn, copyToClipboard } from '../../lib/utils';
import { useToast } from '../common/useToast';
import { NOTES } from '../../lib/constants';

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
  const { showToast } = useToast();

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

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await copyToClipboard(note.text);
    showToast(success ? 'Copied' : 'Failed to copy', success ? 'success' : 'error');
  }, [note.text, showToast]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(note);
  }, [note, onEdit]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(note);
  }, [note, onDelete]);

  const displayId = shortId(note.id);
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

  const cardClasses = cn(
    'note-card',
    isPending && 'pending',
    showHighlight && 'highlighted'
  );

  return (
    <div
      className={cardClasses}
      onClick={handleToggle}
      role={needsExpansion ? 'button' : undefined}
      tabIndex={needsExpansion ? 0 : undefined}
      onKeyDown={(e) => {
        if (needsExpansion && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleToggle();
        }
      }}
    >
      <div className={`note-text${!expanded && needsExpansion ? ' clamped' : ''}`}>
        {renderText()}
      </div>

      <div className="note-meta">
        <span className="note-time" title={fullTime}>
          {isPending ? 'Saving…' : relativeTime}
        </span>

        <div className="note-actions">
          {onEdit && (
            <button
              className="btn btn-icon btn-ghost btn-sm"
              onClick={handleEdit}
              title="Edit note"
              aria-label="Edit note"
            >
              <Pencil size={14} />
            </button>
          )}
          <button
            className="btn btn-icon btn-ghost btn-sm"
            onClick={handleCopy}
            title="Copy note"
            aria-label="Copy note text"
          >
            <Copy size={14} />
          </button>
          {onDelete && (
            <button
              className="btn btn-icon btn-ghost btn-sm btn-danger"
              onClick={handleDelete}
              title="Delete note"
              aria-label="Delete note"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        {displayId && (
          <span className="note-id" title={`ID: ${note.id}`}>
            {displayId}
          </span>
        )}
      </div>
    </div>
  );
});

