/**
 * ThreadPanel component
 * Context controls for chat threads - filter by date, notes, and topic
 */

import { useState, useCallback, useMemo } from 'react';
import { Calendar, Tag, FileText, X, ChevronDown, Settings } from 'lucide-react';
import type { Note } from '../../lib/types';
import { cn } from '../../lib/utils';

interface ThreadContext {
  dateRange?: { start?: string; end?: string };
  tags?: string[];
  noteIds?: string[];
  maxSources?: number;
}

interface ThreadPanelProps {
  context: ThreadContext;
  onContextChange: (context: ThreadContext) => void;
  availableTags: string[];
  recentNotes?: Note[];
  className?: string;
}

export function ThreadPanel({
  context,
  onContextChange,
  availableTags,
  recentNotes = [],
  className,
}: ThreadPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [showNotePicker, setShowNotePicker] = useState(false);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (context.dateRange?.start || context.dateRange?.end) count++;
    if (context.tags && context.tags.length > 0) count++;
    if (context.noteIds && context.noteIds.length > 0) count++;
    return count;
  }, [context]);

  const handleAddTag = useCallback((tag: string) => {
    const current = context.tags || [];
    if (!current.includes(tag)) {
      onContextChange({ ...context, tags: [...current, tag] });
    }
    setShowTagPicker(false);
  }, [context, onContextChange]);

  const handleRemoveTag = useCallback((tag: string) => {
    const current = context.tags || [];
    onContextChange({ ...context, tags: current.filter(t => t !== tag) });
  }, [context, onContextChange]);

  const handleAddNote = useCallback((noteId: string) => {
    const current = context.noteIds || [];
    if (!current.includes(noteId)) {
      onContextChange({ ...context, noteIds: [...current, noteId] });
    }
    setShowNotePicker(false);
  }, [context, onContextChange]);

  const handleRemoveNote = useCallback((noteId: string) => {
    const current = context.noteIds || [];
    onContextChange({ ...context, noteIds: current.filter(id => id !== noteId) });
  }, [context, onContextChange]);

  const handleDateChange = useCallback((type: 'start' | 'end', value: string) => {
    onContextChange({
      ...context,
      dateRange: {
        ...context.dateRange,
        [type]: value || undefined,
      },
    });
  }, [context, onContextChange]);

  const handleClearAll = useCallback(() => {
    onContextChange({});
  }, [onContextChange]);

  const handleMaxSourcesChange = useCallback((value: number) => {
    onContextChange({
      ...context,
      maxSources: value,
    });
  }, [context, onContextChange]);

  return (
    <div className={cn('border-b border-[var(--color-border)]', className)}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-2',
          'hover:bg-[var(--color-surface-hover)] transition-colors'
        )}
      >
        <div className="flex items-center gap-2 text-sm">
          <Settings size={14} className="text-[var(--color-text-secondary)]" />
          <span className="font-medium">Context</span>
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs rounded-full bg-[var(--color-primary)] text-white">
              {activeFilterCount}
            </span>
          )}
        </div>
        <ChevronDown
          size={14}
          className={cn('transition-transform', isExpanded && 'rotate-180')}
        />
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-3 space-y-3">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors',
                context.dateRange?.start || context.dateRange?.end
                  ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                  : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
              )}
            >
              <Calendar size={12} />
              Date Range
            </button>
            <button
              onClick={() => setShowTagPicker(!showTagPicker)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors',
                context.tags && context.tags.length > 0
                  ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                  : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
              )}
            >
              <Tag size={12} />
              Tags
            </button>
            <button
              onClick={() => setShowNotePicker(!showNotePicker)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors',
                context.noteIds && context.noteIds.length > 0
                  ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                  : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
              )}
            >
              <FileText size={12} />
              Specific Notes
            </button>
            {activeFilterCount > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded-md text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
              >
                <X size={12} />
                Clear All
              </button>
            )}
          </div>

          {/* Date Picker */}
          {showDatePicker && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[var(--color-text-tertiary)]">From:</span>
              <input
                type="date"
                value={context.dateRange?.start || ''}
                onChange={(e) => handleDateChange('start', e.target.value)}
                className="px-2 py-1 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded"
              />
              <span className="text-[var(--color-text-tertiary)]">To:</span>
              <input
                type="date"
                value={context.dateRange?.end || ''}
                onChange={(e) => handleDateChange('end', e.target.value)}
                className="px-2 py-1 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded"
              />
            </div>
          )}

          {/* Tag Picker */}
          {showTagPicker && availableTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {availableTags.slice(0, 15).map(tag => (
                <button
                  key={tag}
                  onClick={() => handleAddTag(tag)}
                  disabled={context.tags?.includes(tag)}
                  className={cn(
                    'px-2 py-0.5 text-xs rounded-md transition-colors',
                    context.tags?.includes(tag)
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-[var(--color-surface-hover)] hover:bg-[var(--color-primary)]/20'
                  )}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {/* Note Picker */}
          {showNotePicker && recentNotes.length > 0 && (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {recentNotes.slice(0, 10).map(note => (
                <button
                  key={note.id}
                  onClick={() => handleAddNote(note.id)}
                  disabled={context.noteIds?.includes(note.id)}
                  className={cn(
                    'w-full text-left px-2 py-1 text-xs rounded-md transition-colors truncate',
                    context.noteIds?.includes(note.id)
                      ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                      : 'hover:bg-[var(--color-surface-hover)]'
                  )}
                >
                  {note.title || note.text.slice(0, 50)}
                </button>
              ))}
            </div>
          )}

          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-1 pt-2 border-t border-[var(--color-border)]">
              {context.tags?.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                >
                  #{tag}
                  <button onClick={() => handleRemoveTag(tag)} className="hover:text-[var(--color-danger)]">
                    <X size={10} />
                  </button>
                </span>
              ))}
              {context.noteIds?.map(id => (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-[var(--color-surface-hover)]"
                >
                  Note: {id.slice(0, 6)}...
                  <button onClick={() => handleRemoveNote(id)} className="hover:text-[var(--color-danger)]">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Max Sources Slider */}
          <div className="flex items-center gap-2 text-sm pt-2 border-t border-[var(--color-border)]">
            <span className="text-[var(--color-text-tertiary)]">Max sources:</span>
            <input
              type="range"
              min={1}
              max={10}
              value={context.maxSources || 5}
              onChange={(e) => handleMaxSourcesChange(parseInt(e.target.value, 10))}
              className="flex-1"
            />
            <span className="text-xs font-mono w-4">{context.maxSources || 5}</span>
          </div>
        </div>
      )}
    </div>
  );
}

