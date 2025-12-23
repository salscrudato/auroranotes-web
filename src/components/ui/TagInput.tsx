/**
 * TagInput component - Interactive tag management
 * Allows adding, removing, and autocompleting tags
 */

import { useState, useCallback, useRef, useEffect, forwardRef } from 'react';
import { X, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  maxTags?: number;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

export const TagInput = forwardRef<HTMLInputElement, TagInputProps>(
  ({ 
    tags, 
    onChange, 
    suggestions = [], 
    placeholder = 'Add tag...', 
    maxTags = 10,
    disabled = false,
    className,
    'aria-label': ariaLabel = 'Add tags',
  }, ref) => {
    const [input, setInput] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Forward ref
    useEffect(() => {
      if (ref && typeof ref === 'function') {
        ref(inputRef.current);
      } else if (ref) {
        ref.current = inputRef.current;
      }
    }, [ref]);

    // Filter suggestions based on input
    const filteredSuggestions = suggestions
      .filter(s => 
        s.toLowerCase().includes(input.toLowerCase()) && 
        !tags.includes(s)
      )
      .slice(0, 5);

    const addTag = useCallback((tag: string) => {
      const normalized = tag.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
      if (!normalized || tags.includes(normalized) || tags.length >= maxTags) return;
      onChange([...tags, normalized]);
      setInput('');
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, [tags, onChange, maxTags]);

    const removeTag = useCallback((tag: string) => {
      onChange(tags.filter(t => t !== tag));
    }, [tags, onChange]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex >= 0 && filteredSuggestions[selectedIndex]) {
          addTag(filteredSuggestions[selectedIndex]);
        } else if (input.trim()) {
          addTag(input);
        }
      } else if (e.key === 'Backspace' && !input && tags.length > 0) {
        removeTag(tags[tags.length - 1]);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    }, [input, tags, filteredSuggestions, selectedIndex, addTag, removeTag]);

    // Close suggestions on click outside
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setShowSuggestions(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
      <div ref={containerRef} className={cn('relative', className)}>
        <div className={cn(
          'flex flex-wrap gap-1.5 p-2 rounded-lg border',
          'bg-[var(--color-surface)] border-[var(--color-border)]',
          'focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/20',
          disabled && 'opacity-50 pointer-events-none'
        )}>
          {tags.map(tag => (
            <span
              key={tag}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-sm',
                'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
                'border border-[var(--color-primary)]/20'
              )}
            >
              #{tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-[var(--color-danger)] transition-colors"
                aria-label={`Remove tag ${tag}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          {tags.length < maxTags && (
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setShowSuggestions(true);
                setSelectedIndex(-1);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              placeholder={tags.length === 0 ? placeholder : ''}
              disabled={disabled}
              className={cn(
                'flex-1 min-w-[80px] bg-transparent border-none outline-none',
                'text-sm text-[var(--color-text-primary)]',
                'placeholder:text-[var(--color-text-tertiary)]'
              )}
              aria-label={ariaLabel}
            />
          )}
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className={cn(
            'absolute z-50 w-full mt-1 py-1 rounded-lg shadow-lg',
            'bg-[var(--color-surface)] border border-[var(--color-border)]'
          )}>
            {filteredSuggestions.map((suggestion, i) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => addTag(suggestion)}
                className={cn(
                  'w-full px-3 py-1.5 text-left text-sm',
                  'hover:bg-[var(--color-surface-hover)]',
                  i === selectedIndex && 'bg-[var(--color-surface-hover)]'
                )}
              >
                <Plus size={12} className="inline mr-1.5 opacity-50" />
                #{suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);

TagInput.displayName = 'TagInput';

