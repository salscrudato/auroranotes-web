/**
 * GlobalSearch component - Command palette style global search
 * Searchable overlay with keyboard navigation
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Search, FileText, Tag, X, ArrowRight } from 'lucide-react';
import type { Note } from '../../lib/types';
import { cn } from '../../lib/utils';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  onSelectNote: (note: Note) => void;
  onSelectTag?: (tag: string) => void;
}

interface SearchItem {
  type: 'note' | 'tag' | 'recent';
  note?: Note;
  tag?: string;
  score: number;
}

export function GlobalSearch({ 
  isOpen, 
  onClose, 
  notes, 
  onSelectNote,
  onSelectTag,
}: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const containerRef = useFocusTrap<HTMLDivElement>({
    enabled: isOpen,
    onEscape: onClose,
    restoreFocus: true,
  });

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Extract all tags from notes
  const allTags = useMemo(() => {
    const tagCounts = new Map<string, number>();
    for (const note of notes) {
      if (note.tags) {
        for (const tag of note.tags) {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        }
      }
    }
    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);
  }, [notes]);

  // Search and rank results
  const results = useMemo((): SearchItem[] => {
    if (!query.trim()) {
      // Show recent notes when no query
      return notes.slice(0, 5).map(note => ({
        type: 'recent' as const,
        note,
        score: 0,
      }));
    }

    const q = query.toLowerCase();
    const items: SearchItem[] = [];

    // Search tags
    if (onSelectTag) {
      for (const tag of allTags) {
        if (tag.toLowerCase().includes(q)) {
          items.push({
            type: 'tag',
            tag,
            score: tag.toLowerCase().startsWith(q) ? 100 : 50,
          });
        }
      }
    }

    // Search notes
    for (const note of notes) {
      const textLower = note.text.toLowerCase();
      const titleLower = (note.title || '').toLowerCase();
      
      let score = 0;
      
      // Title match (highest priority)
      if (titleLower.includes(q)) {
        score += titleLower.startsWith(q) ? 80 : 60;
      }
      
      // Text match
      if (textLower.includes(q)) {
        const idx = textLower.indexOf(q);
        score += idx < 50 ? 40 : 20; // Higher score if match is near start
      }
      
      // Tag match
      if (note.tags?.some(t => t.toLowerCase().includes(q))) {
        score += 30;
      }

      if (score > 0) {
        items.push({ type: 'note', note, score });
      }
    }

    // Sort by score and limit
    return items
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [query, notes, allTags, onSelectTag]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        const selected = results[selectedIndex];
        if (selected) {
          if (selected.type === 'tag' && selected.tag && onSelectTag) {
            onSelectTag(selected.tag);
          } else if (selected.note) {
            onSelectNote(selected.note);
          }
          onClose();
        }
        break;
    }
  }, [results, selectedIndex, onSelectNote, onSelectTag, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    const listEl = listRef.current;
    if (!listEl) return;
    const selectedEl = listEl.children[selectedIndex] as HTMLElement;
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        ref={containerRef}
        className={cn(
          'w-full max-w-xl mx-4 rounded-xl shadow-2xl',
          'bg-[var(--color-surface)] border border-[var(--color-border)]',
          'overflow-hidden'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Search notes"
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
          <Search size={20} className="text-[var(--color-text-tertiary)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search notes, tags..."
            className={cn(
              'flex-1 bg-transparent border-none outline-none text-lg',
              'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]'
            )}
            aria-label="Search query"
          />
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]"
            aria-label="Close search"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-[var(--color-text-tertiary)]">
              No results found
            </div>
          ) : (
            results.map((item, index) => (
              <button
                key={item.type === 'tag' ? `tag-${item.tag}` : `note-${item.note?.id}`}
                className={cn(
                  'w-full px-4 py-3 flex items-start gap-3 text-left transition-colors',
                  index === selectedIndex
                    ? 'bg-[var(--color-primary)]/10'
                    : 'hover:bg-[var(--color-surface-hover)]'
                )}
                onClick={() => {
                  if (item.type === 'tag' && item.tag && onSelectTag) {
                    onSelectTag(item.tag);
                  } else if (item.note) {
                    onSelectNote(item.note);
                  }
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                {item.type === 'tag' ? (
                  <>
                    <Tag size={16} className="mt-0.5 text-[var(--color-primary)]" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">#{item.tag}</div>
                      <div className="text-xs text-[var(--color-text-tertiary)]">Filter by tag</div>
                    </div>
                  </>
                ) : (
                  <>
                    <FileText size={16} className="mt-0.5 text-[var(--color-text-secondary)]" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {item.note?.title || item.note?.text.slice(0, 50)}
                      </div>
                      <div className="text-sm text-[var(--color-text-tertiary)] truncate">
                        {item.note?.text.slice(0, 100)}
                      </div>
                      {item.note?.tags && item.note.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {item.note.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <ArrowRight size={14} className="mt-1 text-[var(--color-text-tertiary)]" />
                  </>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-[var(--color-border)] text-xs text-[var(--color-text-tertiary)] flex items-center gap-4">
          <span><kbd className="px-1 py-0.5 rounded bg-[var(--color-surface-hover)]">↑↓</kbd> Navigate</span>
          <span><kbd className="px-1 py-0.5 rounded bg-[var(--color-surface-hover)]">↵</kbd> Select</span>
          <span><kbd className="px-1 py-0.5 rounded bg-[var(--color-surface-hover)]">Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  );
}

