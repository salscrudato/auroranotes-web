/**
 * NoteDetailDrawer component
 * Modal/drawer for viewing full note content when navigating from citations
 */

import { useEffect, useCallback } from 'react';
import { FileText, X, Copy } from 'lucide-react';
import type { Note } from '../../lib/types';
import { formatFullTimestamp, formatRelativeTime, shortId } from '../../lib/format';
import { splitTextForHighlight, copyToClipboard } from '../../lib/utils';
import { useToast } from '../common/useToast';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface NoteDetailDrawerProps {
  note: Note | null;
  onClose: () => void;
  highlightText?: string;
}

export function NoteDetailDrawer({ note, onClose, highlightText }: NoteDetailDrawerProps) {
  const { showToast } = useToast();
  // useFocusTrap handles focus trapping, escape key, and restoration automatically
  const drawerRef = useFocusTrap<HTMLDivElement>({
    enabled: !!note,
    onEscape: onClose,
    restoreFocus: true,
  });

  const handleCopy = useCallback(async () => {
    if (!note) return;
    const success = await copyToClipboard(note.text);
    showToast(success ? 'Copied to clipboard' : 'Failed to copy', success ? 'success' : 'error');
  }, [note, showToast]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (note) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [note]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!note) return null;

  const displayId = shortId(note.id);
  const relativeTime = formatRelativeTime(note.createdAt);
  const fullTime = formatFullTimestamp(note.createdAt);

  // Highlight matching text if provided
  const renderText = () => {
    const parts = splitTextForHighlight(note.text, highlightText || '');
    return (
      <p className="note-detail-text">
        {parts.map((part, i) =>
          part.isMatch ? (
            <mark key={i} className="highlight">{part.text}</mark>
          ) : (
            part.text
          )
        )}
      </p>
    );
  };

  return (
    <div className="note-drawer-backdrop" onClick={handleBackdropClick}>
      <div
        ref={drawerRef}
        className="note-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="note-drawer-title"
      >
        <div className="note-drawer-header">
          <h3 id="note-drawer-title">
            <FileText size={18} style={{ marginRight: '8px' }} />
            Note
          </h3>
          <button
            className="btn btn-icon btn-ghost"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="note-drawer-body">
          {renderText()}
        </div>

        <div className="note-drawer-footer">
          <div className="note-drawer-meta">
            <span className="note-drawer-time" title={fullTime}>
              {relativeTime}
            </span>
            {displayId && (
              <span className="note-drawer-id">{displayId}</span>
            )}
          </div>
          <div className="note-drawer-actions">
            <button className="btn btn-sm" onClick={handleCopy}>
              <Copy size={14} />
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}




