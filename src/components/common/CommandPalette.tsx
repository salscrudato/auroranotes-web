/**
 * Cmd/Ctrl+K command palette for quick access to actions and navigation.
 */

import { useState, useCallback, useEffect, useRef, memo, useMemo } from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../lib/utils';

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
  recentActionIds?: string[];
  onActionExecuted?: (actionId: string) => void;
}

export const CommandPalette = memo(function CommandPalette({
  isOpen,
  onClose,
  actions,
  recentActionIds = [],
  onActionExecuted,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const prevIsOpen = useRef(isOpen);

  // Get recent actions
  const recentActions = useMemo(() => {
    return recentActionIds
      .map((id) => actions.find((a) => a.id === id))
      .filter((a): a is CommandAction => a !== undefined);
  }, [recentActionIds, actions]);

  // Filter actions based on query
  const filteredActions = useMemo(() => {
    if (!query.trim()) {
      const nonRecentActions = actions.filter((a) => !recentActionIds.includes(a.id));
      return [...recentActions, ...nonRecentActions];
    }
    const searchText = query.toLowerCase();
    return actions.filter((action) =>
      action.label.toLowerCase().includes(searchText) ||
      action.description?.toLowerCase().includes(searchText) ||
      action.keywords?.some((k) => k.toLowerCase().includes(searchText))
    );
  }, [actions, query, recentActions, recentActionIds]);

  // Bounded selected index - clamps to valid range
  const boundedSelectedIndex = useMemo(() => {
    if (filteredActions.length === 0) return 0;
    return Math.min(selectedIndex, filteredActions.length - 1);
  }, [selectedIndex, filteredActions.length]);

  // Reset state when opened
  useEffect(() => {
    if (isOpen && !prevIsOpen.current) {
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
    const selectedEl = listRef.current?.querySelector('[data-selected="true"]');
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
            onActionExecuted?.(filteredActions[boundedSelectedIndex].id);
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [filteredActions, boundedSelectedIndex, onClose, onActionExecuted]
  );

  const handleItemClick = useCallback(
    (action: CommandAction) => {
      action.action();
      onActionExecuted?.(action.id);
      onClose();
    },
    [onClose, onActionExecuted]
  );

  const handleSelectIndex = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-modal)] overflow-hidden animate-in zoom-in-95 slide-in-from-top-2 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <SearchInput
          ref={inputRef}
          value={query}
          onChange={setQuery}
          onKeyDown={handleKeyDown}
        />

        <ResultsList
          ref={listRef}
          actions={filteredActions}
          recentCount={query ? 0 : recentActions.length}
          selectedIndex={boundedSelectedIndex}
          onItemClick={handleItemClick}
          onItemHover={handleSelectIndex}
        />

        <Footer />
      </div>
    </div>
  );
});

// ============================================================================
// Sub-components
// ============================================================================

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

const SearchInput = memo(function SearchInput({
  value,
  onChange,
  onKeyDown,
  ref,
}: SearchInputProps & { ref: React.Ref<HTMLInputElement> }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
      <Search size={18} className="text-[var(--color-text-tertiary)] flex-shrink-0" />
      <input
        ref={ref}
        type="text"
        className="flex-1 bg-transparent border-none outline-none text-base text-[var(--color-text)] placeholder:text-[var(--color-placeholder)]"
        placeholder="Type a command or search..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        aria-label="Search commands"
      />
      <kbd className="px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text-tertiary)] bg-[var(--color-bg-muted)] border border-[var(--color-border)] rounded">
        ESC
      </kbd>
    </div>
  );
});

interface ResultsListProps {
  actions: CommandAction[];
  recentCount: number;
  selectedIndex: number;
  onItemClick: (action: CommandAction) => void;
  onItemHover: (index: number) => void;
}

const ResultsList = memo(function ResultsList({
  actions,
  recentCount,
  selectedIndex,
  onItemClick,
  onItemHover,
  ref,
}: ResultsListProps & { ref: React.Ref<HTMLDivElement> }) {
  if (actions.length === 0) {
    return (
      <div className="max-h-[300px] overflow-y-auto p-2" ref={ref}>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="max-h-[300px] overflow-y-auto p-2" ref={ref}>
      {recentCount > 0 && <SectionHeader label="Recent" />}
      {actions.map((action, index) => (
        <CommandItem
          key={action.id}
          action={action}
          isSelected={index === selectedIndex}
          showHeader={index === recentCount && recentCount > 0}
          onClick={() => onItemClick(action)}
          onMouseEnter={() => onItemHover(index)}
        />
      ))}
    </div>
  );
});

const EmptyState = memo(function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-[var(--color-text-tertiary)]">
      <Search size={24} className="mb-2 opacity-50" />
      <p className="text-sm">No commands found</p>
    </div>
  );
});

const SectionHeader = memo(function SectionHeader({ label, className }: { label: string; className?: string }) {
  return (
    <div className={cn('px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]', className)}>
      {label}
    </div>
  );
});

interface CommandItemProps {
  action: CommandAction;
  isSelected: boolean;
  showHeader: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}

const CommandItem = memo(function CommandItem({
  action,
  isSelected,
  showHeader,
  onClick,
  onMouseEnter,
}: CommandItemProps) {
  return (
    <>
      {showHeader && <SectionHeader label="All Commands" className="mt-2" />}
      <button
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-left transition-colors duration-100',
          isSelected ? 'bg-[var(--color-accent)] text-white' : 'hover:bg-[var(--color-surface-hover)]'
        )}
        data-selected={isSelected}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
      >
        <span className={cn(
          'flex-shrink-0 [&>svg]:w-[18px] [&>svg]:h-[18px]',
          isSelected ? 'text-white/80' : 'text-[var(--color-text-tertiary)]'
        )}>
          {action.icon}
        </span>
        <div className="flex-1 min-w-0">
          <span className={cn(
            'block text-sm font-medium truncate',
            isSelected ? 'text-white' : 'text-[var(--color-text)]'
          )}>
            {action.label}
          </span>
          {action.description && (
            <span className={cn(
              'block text-xs truncate',
              isSelected ? 'text-white/70' : 'text-[var(--color-text-secondary)]'
            )}>
              {action.description}
            </span>
          )}
        </div>
        {action.shortcut && (
          <kbd className={cn(
            'px-1.5 py-0.5 text-[10px] font-medium rounded border',
            isSelected
              ? 'bg-white/10 border-white/20 text-white/80'
              : 'bg-[var(--color-bg-muted)] border-[var(--color-border)] text-[var(--color-text-tertiary)]'
          )}>
            {action.shortcut}
          </kbd>
        )}
      </button>
    </>
  );
});

const Footer = memo(function Footer() {
  return (
    <div className="flex items-center justify-center gap-4 px-4 py-2.5 border-t border-[var(--color-border)] bg-[var(--color-bg-muted)]">
      <KeyHint keyLabel="↑↓" action="navigate" />
      <KeyHint keyLabel="↵" action="select" />
      <KeyHint keyLabel="esc" action="close" />
    </div>
  );
});

const KeyHint = memo(function KeyHint({ keyLabel, action }: { keyLabel: string; action: string }) {
  return (
    <span className="text-xs text-[var(--color-text-tertiary)]">
      <kbd className="px-1 py-0.5 mr-1 text-[10px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded">
        {keyLabel}
      </kbd>
      {action}
    </span>
  );
});
