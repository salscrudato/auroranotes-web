/**
 * NoteDetailDrawer component
 * Modal/drawer for viewing full note content when navigating from citations
 * Supports viewing, editing, tags display, and pinning
 */

import { useEffect, useCallback, useState } from 'react';
import { FileText, X, Copy, Edit3, Pin, PinOff, Tag, Save, Trash2 } from 'lucide-react';
import type { Note } from '../../lib/types';
import { formatFullTimestamp, formatRelativeTime, shortId } from '../../lib/format';
import { splitTextForHighlight, copyToClipboard, cn } from '../../lib/utils';
import { NOTES } from '../../lib/constants';
import { useToast } from '../common/useToast';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { usePinnedNotes } from '../../hooks/usePinnedNotes';
import { TagInput } from '../ui/TagInput';
import { MarkdownEditor } from '../ui/MarkdownEditor';

interface NoteDetailDrawerProps {
  note: Note | null;
  onClose: () => void;
  onEdit?: (id: string, data: { text: string; title?: string; tags?: string[] }) => Promise<void>;
  onDelete?: (id: string) => void;
  highlightText?: string;
  tagSuggestions?: string[];
}

export function NoteDetailDrawer({
  note,
  onClose,
  onEdit,
  onDelete,
  highlightText,
  tagSuggestions = [],
}: NoteDetailDrawerProps) {
  const { showToast } = useToast();
  const { isPinned, togglePin } = usePinnedNotes();

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // useFocusTrap handles focus trapping, escape key, and restoration automatically
  const drawerRef = useFocusTrap<HTMLDivElement>({
    enabled: !!note,
    onEscape: isEditing ? () => setIsEditing(false) : onClose,
    restoreFocus: true,
  });

  // Reset edit state when note changes
  useEffect(() => {
    if (note) {
      setEditText(note.text);
      setEditTitle(note.title || '');
      setEditTags(note.tags || []);
      setIsEditing(false);
    }
  }, [note]);

  const handleCopy = useCallback(async () => {
    if (!note) return;
    const success = await copyToClipboard(note.text);
    showToast(success ? 'Copied to clipboard' : 'Failed to copy', success ? 'success' : 'error');
  }, [note, showToast]);

  const handleSave = useCallback(async () => {
    if (!note || !onEdit || !editText.trim()) return;
    setIsSaving(true);
    try {
      await onEdit(note.id, {
        text: editText.trim(),
        title: editTitle.trim() || undefined,
        tags: editTags.length > 0 ? editTags : undefined,
      });
      setIsEditing(false);
      showToast('Note updated', 'success');
    } catch {
      showToast('Failed to update note', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [note, onEdit, editText, editTitle, editTags, showToast]);

  const handleTogglePin = useCallback(() => {
    if (!note) return;
    togglePin(note.id);
    showToast(isPinned(note.id) ? 'Unpinned' : 'Pinned', 'success');
  }, [note, togglePin, isPinned, showToast]);

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
  const relativeTime = note.createdAt ? formatRelativeTime(note.createdAt) : '';
  const fullTime = note.createdAt ? formatFullTimestamp(note.createdAt) : '';
  const pinned = isPinned(note.id);

  // Highlight matching text if provided
  const renderText = () => {
    const parts = splitTextForHighlight(note.text, highlightText || '');
    return (
      <div className="note-detail-text whitespace-pre-wrap">
        {parts.map((part, i) =>
          part.isMatch ? (
            <mark key={i} className="highlight bg-yellow-200 dark:bg-yellow-800">{part.text}</mark>
          ) : (
            <span key={i}>{part.text}</span>
          )
        )}
      </div>
    );
  };

  return (
    <div className="note-drawer-backdrop" onClick={handleBackdropClick}>
      <div
        ref={drawerRef}
        className={cn('note-drawer', 'flex flex-col max-h-[90vh]')}
        role="dialog"
        aria-modal="true"
        aria-labelledby="note-drawer-title"
      >
        {/* Header */}
        <div className="note-drawer-header flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-[var(--color-text-secondary)]" />
            {isEditing ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Title (optional)"
                className="bg-transparent border-none outline-none text-lg font-semibold"
              />
            ) : (
              <h3 id="note-drawer-title" className="text-lg font-semibold">
                {note.title || 'Note'}
              </h3>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              className={cn(
                'p-2 rounded-lg transition-colors',
                pinned
                  ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/10'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
              )}
              onClick={handleTogglePin}
              aria-label={pinned ? 'Unpin note' : 'Pin note'}
              title={pinned ? 'Unpin' : 'Pin'}
            >
              {pinned ? <PinOff size={16} /> : <Pin size={16} />}
            </button>
            <button
              className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tags */}
        {(isEditing || (note.tags && note.tags.length > 0)) && (
          <div className="px-4 py-2 border-b border-[var(--color-border)]">
            {isEditing ? (
              <TagInput
                tags={editTags}
                onChange={setEditTags}
                suggestions={tagSuggestions}
                placeholder="Add tags..."
              />
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <Tag size={14} className="text-[var(--color-text-tertiary)]" />
                {note.tags?.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs rounded-md bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Body */}
        <div className="note-drawer-body flex-1 overflow-y-auto px-4 py-4">
          {isEditing ? (
            <MarkdownEditor
              value={editText}
              onChange={setEditText}
              minHeight="200px"
              maxHeight="100%"
              autoFocus
            />
          ) : (
            renderText()
          )}
        </div>

        {/* Footer */}
        <div className="note-drawer-footer flex items-center justify-between px-4 py-3 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-3 text-sm text-[var(--color-text-tertiary)]">
            {relativeTime && (
              <span title={fullTime}>{relativeTime}</span>
            )}
            {displayId && (
              <span className="font-mono text-xs">{displayId}</span>
            )}
            {isEditing && (
              <span className={cn(
                editText.length > NOTES.MAX_LENGTH ? 'text-[var(--color-danger)]' : ''
              )}>
                {editText.length.toLocaleString()} / {NOTES.MAX_LENGTH.toLocaleString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  className="btn btn-sm"
                  onClick={() => {
                    setEditText(note.text);
                    setEditTitle(note.title || '');
                    setEditTags(note.tags || []);
                    setIsEditing(false);
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-sm btn-primary flex items-center gap-1"
                  onClick={handleSave}
                  disabled={isSaving || !editText.trim() || editText.length > NOTES.MAX_LENGTH}
                >
                  <Save size={14} />
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-sm flex items-center gap-1" onClick={handleCopy}>
                  <Copy size={14} />
                  Copy
                </button>
                {onEdit && (
                  <button
                    className="btn btn-sm flex items-center gap-1"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit3 size={14} />
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    className="btn btn-sm text-[var(--color-danger)] flex items-center gap-1"
                    onClick={() => onDelete(note.id)}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}




