/**
 * CommandPalette component
 * Cmd/Ctrl+K powered command palette for power users
 * Provides quick access to common actions and navigation
 */

import { useState, useCallback, useEffect, useRef, memo, useMemo } from 'react';
import { Search } from 'lucide-react';

export interface CommandAction {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  actions: CommandAction[];
}

export const CommandPalette = memo(function CommandPalette({
  isOpen,
  onClose,
  actions,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const prevIsOpen = useRef(isOpen);

  // Filter actions based on query
  const filteredActions = useMemo(() => {
    if (!query.trim()) return actions;
    const searchText = query.toLowerCase();
    return actions.filter((action) =>
      action.label.toLowerCase().includes(searchText) ||
      action.description?.toLowerCase().includes(searchText) ||
      action.keywords?.some((k) => k.toLowerCase().includes(searchText))
    );
  }, [actions, query]);

  // Compute bounded selected index
  const boundedSelectedIndex = useMemo(() => {
    if (filteredActions.length === 0) return 0;
    return Math.min(selectedIndex, filteredActions.length - 1);
  }, [selectedIndex, filteredActions.length]);

  // Reset state when opened (detect edge from closed to open)
  useEffect(() => {
    if (isOpen && !prevIsOpen.current) {
      // Just opened - reset via timeout to avoid sync setState in effect
      const timeoutId = setTimeout(() => {
        setQuery('');
        setSelectedIndex(0);
        inputRef.current?.focus();
      }, 0);
      return () => clearTimeout(timeoutId);
    }
    prevIsOpen.current = isOpen;
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    const listEl = listRef.current;
    if (!listEl) return;
    const selectedEl = listEl.querySelector('[data-selected="true"]');
    selectedEl?.scrollIntoView({ block: 'nearest' });
  }, [boundedSelectedIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, filteredActions.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredActions[boundedSelectedIndex]) {
            filteredActions[boundedSelectedIndex].action();
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [filteredActions, boundedSelectedIndex, onClose]
  );

  const handleItemClick = useCallback(
    (action: CommandAction) => {
      action.action();
      onClose();
    },
    [onClose]
  );

  if (!isOpen) return null;

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div
        className="command-palette"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        {/* Search Input */}
        <div className="command-palette-input-wrapper">
          <Search size={18} className="command-palette-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="command-palette-input"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Search commands"
          />
          <kbd className="command-palette-kbd">ESC</kbd>
        </div>

        {/* Results */}
        <div className="command-palette-results" ref={listRef}>
          {filteredActions.length === 0 ? (
            <div className="command-palette-empty">
              <Search size={24} />
              <p>No commands found</p>
            </div>
          ) : (
            filteredActions.map((action, index) => (
              <button
                key={action.id}
                className="command-palette-item"
                data-selected={index === boundedSelectedIndex}
                onClick={() => handleItemClick(action)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span className="command-palette-item-icon">{action.icon}</span>
                <div className="command-palette-item-content">
                  <span className="command-palette-item-label">{action.label}</span>
                  {action.description && (
                    <span className="command-palette-item-desc">{action.description}</span>
                  )}
                </div>
                {action.shortcut && (
                  <kbd className="command-palette-item-shortcut">{action.shortcut}</kbd>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="command-palette-footer">
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>↵</kbd> select</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
});
