/**
 * EditNoteModal component
 * Modal for editing an existing note
 */

import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { X, Save } from 'lucide-react';
import type { Note } from '../../lib/types';
import { NOTES } from '../../lib/constants';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface EditNoteModalProps {
  note: Note | null;
  isOpen: boolean;
  isSaving?: boolean;
  onSave: (id: string, text: string) => void;
  onClose: () => void;
}

export const EditNoteModal = memo(function EditNoteModal({
  note,
  isOpen,
  isSaving = false,
  onSave,
  onClose,
}: EditNoteModalProps) {
  // Initialize text from note - component is remounted with key when note changes
  const [text, setText] = useState(() => note?.text ?? '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Use focus trap hook for proper focus management
  const modalRef = useFocusTrap<HTMLDivElement>({
    enabled: isOpen && !!note,
    onEscape: onClose,
    restoreFocus: true,
  });

  // Auto-focus textarea when opened
  useEffect(() => {
    if (note && isOpen) {
      // Focus textarea after a brief delay to ensure modal is visible
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [note, isOpen]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!note || !text.trim() || isSaving) return;
    onSave(note.id, text.trim());
  }, [note, text, isSaving, onSave]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const charCount = text.length;
  const isOverLimit = charCount > NOTES.MAX_LENGTH;
  const hasChanges = note?.text !== text;
  const canSave = hasChanges && text.trim() && !isOverLimit && !isSaving;

  if (!isOpen || !note) return null;

  return (
    <div
      className="modal-backdrop animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-note-title"
    >
      <div
        ref={modalRef}
        className="modal edit-note-modal animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="edit-note-title">Edit Note</h2>
          <button 
            className="modal-close btn btn-icon btn-ghost"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            className="edit-note-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Edit your note..."
            maxLength={NOTES.MAX_LENGTH + 100} // Allow some overflow for warning
            disabled={isSaving}
            aria-label="Edit note content"
            aria-invalid={isOverLimit}
            aria-describedby="edit-note-char-count"
          />

          <div
            id="edit-note-char-count"
            className={`chat-char-count ${isOverLimit ? 'over-limit' : ''}`}
            role={isOverLimit ? 'alert' : undefined}
          >
            {isOverLimit
              ? `Note too long: ${charCount.toLocaleString()} / ${NOTES.MAX_LENGTH.toLocaleString()}`
              : `${charCount.toLocaleString()} / ${NOTES.MAX_LENGTH.toLocaleString()}`
            }
          </div>

          <div className="modal-footer">
            <button 
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="btn btn-primary"
              disabled={!canSave}
            >
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

