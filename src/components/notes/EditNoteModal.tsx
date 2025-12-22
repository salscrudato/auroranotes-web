/**
 * EditNoteModal component
 * Modal for editing an existing note
 * Uses new Tailwind-based UI components
 */

import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { Save } from 'lucide-react';
import type { Note } from '../../lib/types';
import { NOTES } from '../../lib/constants';
import { cn } from '../../lib/utils';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { Button } from '../ui/Button';
import { Dialog, DialogClose, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '../ui/Dialog';

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

  const charCount = text.length;
  const isOverLimit = charCount > NOTES.MAX_LENGTH;
  const hasChanges = note?.text !== text;
  const canSave = hasChanges && text.trim() && !isOverLimit && !isSaving;

  if (!note) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      aria-labelledby="edit-note-title"
      className="max-w-lg"
    >
      <div ref={modalRef}>
        <DialogHeader className="relative">
          <DialogTitle id="edit-note-title">Edit Note</DialogTitle>
          <DialogClose onClose={onClose} />
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody>
            <textarea
              ref={textareaRef}
              className={cn(
                'w-full min-h-[200px] max-h-[400px] resize-y',
                'p-4 text-base leading-relaxed',
                'bg-[var(--color-surface)] text-[var(--color-text)]',
                'border border-[var(--color-border)] rounded-[var(--radius-lg)]',
                'placeholder:text-[var(--color-placeholder)]',
                'focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20',
                'transition-all duration-150',
                isOverLimit && 'border-[var(--color-danger)] focus:border-[var(--color-danger)]'
              )}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Edit your note..."
              maxLength={NOTES.MAX_LENGTH + 100}
              disabled={isSaving}
              aria-label="Edit note content"
              aria-invalid={isOverLimit}
              aria-describedby="edit-note-char-count"
            />

            <div
              id="edit-note-char-count"
              className={cn(
                'text-xs text-right mt-2',
                isOverLimit ? 'text-[var(--color-danger)] font-medium' : 'text-[var(--color-text-tertiary)]'
              )}
              role={isOverLimit ? 'alert' : undefined}
            >
              {isOverLimit
                ? `Note too long: ${charCount.toLocaleString()} / ${NOTES.MAX_LENGTH.toLocaleString()}`
                : `${charCount.toLocaleString()} / ${NOTES.MAX_LENGTH.toLocaleString()}`
              }
            </div>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="default" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={!canSave}>
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </div>
    </Dialog>
  );
});

