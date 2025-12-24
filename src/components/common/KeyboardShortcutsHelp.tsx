/**
 * Modal displaying available keyboard shortcuts organized by category.
 */

import { memo, useCallback } from 'react';
import { Keyboard, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatShortcut, type Shortcut } from '../../hooks/useKeyboardShortcuts';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export interface ShortcutGroup {
  title: string;
  shortcuts: Shortcut[];
}

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
  groups: ShortcutGroup[];
}

export const KeyboardShortcutsHelp = memo(function KeyboardShortcutsHelp({
  isOpen,
  onClose,
  groups,
}: KeyboardShortcutsHelpProps) {
  const modalRef = useFocusTrap<HTMLDivElement>({
    enabled: isOpen,
    onEscape: onClose,
    restoreFocus: true,
  });

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className={cn(
          'w-full max-w-lg max-h-[80vh] overflow-hidden',
          'bg-[var(--color-surface)] rounded-xl shadow-2xl',
          'animate-scale-in'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
      >
        <ModalHeader onClose={onClose} />

        <div className="overflow-y-auto p-6 space-y-6">
          {groups.map((group) => (
            <ShortcutGroupSection key={group.title} group={group} />
          ))}
        </div>

        <ModalFooter />
      </div>
    </div>
  );
});

// ============================================================================
// Sub-components
// ============================================================================

const ModalHeader = memo(function ModalHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
      <div className="flex items-center gap-2">
        <Keyboard size={20} className="text-[var(--color-primary)]" />
        <h2 id="shortcuts-title" className="text-lg font-semibold">
          Keyboard Shortcuts
        </h2>
      </div>
      <button
        onClick={onClose}
        className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
        aria-label="Close"
      >
        <X size={18} />
      </button>
    </div>
  );
});

const ShortcutGroupSection = memo(function ShortcutGroupSection({
  group,
}: {
  group: ShortcutGroup;
}) {
  return (
    <div>
      <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">
        {group.title}
      </h3>
      <div className="space-y-2">
        {group.shortcuts.map((shortcut, idx) => (
          <ShortcutRow key={idx} shortcut={shortcut} />
        ))}
      </div>
    </div>
  );
});

const ShortcutRow = memo(function ShortcutRow({ shortcut }: { shortcut: Shortcut }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[var(--color-surface-hover)]">
      <span className="text-sm">{shortcut.description}</span>
      <kbd
        className={cn(
          'px-2 py-1 text-xs font-mono rounded',
          'bg-[var(--color-surface-hover)] border border-[var(--color-border)]',
          'text-[var(--color-text-secondary)]'
        )}
      >
        {formatShortcut(shortcut)}
      </kbd>
    </div>
  );
});

const ModalFooter = memo(function ModalFooter() {
  return (
    <div className="px-6 py-3 border-t border-[var(--color-border)] text-xs text-[var(--color-text-tertiary)]">
      Press <kbd className="px-1 py-0.5 rounded bg-[var(--color-surface-hover)]">?</kbd> to toggle this help
    </div>
  );
});
