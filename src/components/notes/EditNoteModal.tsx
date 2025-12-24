/**
 * EditNoteModal component
 * Modal for editing an existing note with polished iOS-style design
 */

import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { Note } from '../../lib/types';
import { NOTES } from '../../lib/constants';
import { cn, triggerHaptic } from '../../lib/utils';
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
  const [text, setText] = useState(() => note?.text ?? '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const modalRef = useFocusTrap<HTMLDivElement>({
    enabled: isOpen && !!note,
    onEscape: onClose,
    restoreFocus: true,
  });

  useEffect(() => {
    if (note && isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [note, isOpen]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!note || !text.trim() || isSaving) return;
    triggerHaptic('light');
    onSave(note.id, text.trim());
  }, [note, text, isSaving, onSave]);

  const charCount = text.length;
  const isOverLimit = charCount > NOTES.MAX_LENGTH;
  const hasChanges = note?.text !== text;
  const canSave = hasChanges && text.trim() && !isOverLimit && !isSaving;
  const charPercentage = Math.min((charCount / NOTES.MAX_LENGTH) * 100, 100);

  if (!note || !isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />

      {/* Modal */}
      <div
        ref={modalRef}
        style={{ width: 'calc(100% - 48px)', maxWidth: '400px' }}
        className={cn(
          'relative',
          'bg-[var(--color-surface)]',
          'rounded-2xl',
          'shadow-2xl',
          'animate-in zoom-in-95 fade-in duration-200',
          'max-h-[80vh] flex flex-col',
          'overflow-hidden'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-note-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <h2 id="edit-note-title" className="text-lg font-semibold text-[var(--color-text)]">
            Edit Note
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'w-8 h-8 rounded-full',
              'bg-[var(--color-bg-muted)] hover:bg-[var(--color-surface-hover)]',
              'flex items-center justify-center',
              'text-[var(--color-text-secondary)]',
              'transition-colors duration-150',
              '-mr-1'
            )}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 pb-4">
            <textarea
              ref={textareaRef}
              className={cn(
                'w-full min-h-[140px] resize-none',
                'px-4 py-3 text-[15px] leading-relaxed',
                'bg-[var(--color-bg-muted)] text-[var(--color-text)]',
                'border border-transparent rounded-xl',
                'placeholder:text-[var(--color-placeholder)]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30',
                'transition-all duration-150',
                isOverLimit && 'ring-2 ring-[var(--color-danger)]/30'
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

            {/* Character count - subtle */}
            <div className="mt-2 flex justify-end">
              <span
                id="edit-note-char-count"
                className={cn(
                  'text-xs tabular-nums',
                  isOverLimit
                    ? 'text-[var(--color-danger)] font-medium'
                    : charPercentage > 80
                    ? 'text-amber-500'
                    : 'text-[var(--color-text-tertiary)]'
                )}
                role={isOverLimit ? 'alert' : undefined}
              >
                {charCount.toLocaleString()} / {NOTES.MAX_LENGTH.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 px-5 pb-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className={cn(
                'flex-1 h-12 rounded-xl',
                'text-[15px] font-medium',
                'text-[var(--color-text)]',
                'bg-[var(--color-bg-muted)]',
                'hover:bg-[var(--color-surface-hover)]',
                'active:scale-[0.98]',
                'transition-all duration-150',
                'disabled:opacity-50'
              )}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSave}
              className={cn(
                'flex-1 h-12 rounded-xl',
                'text-[15px] font-semibold',
                'bg-[var(--color-accent)] text-white',
                'hover:bg-[var(--color-accent-hover)]',
                'active:scale-[0.98]',
                'transition-all duration-150',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                'inline-flex items-center justify-center gap-2'
              )}
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

