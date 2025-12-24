/**
 * Context controls for chat threads - filter by date, notes, and topic.
 */

import { useState, useCallback, useMemo, memo } from 'react';
import { Calendar, Tag, FileText, X, ChevronDown, Settings, type LucideIcon } from 'lucide-react';
import type { Note } from '../../lib/types';
import { cn } from '../../lib/utils';

export interface ThreadContext {
  dateRange?: { start?: string; end?: string };
  tags?: string[];
  noteIds?: string[];
  maxSources?: number;
}

type PickerType = 'date' | 'tag' | 'note' | null;

interface ThreadPanelProps {
  context: ThreadContext;
  onContextChange: (context: ThreadContext) => void;
  availableTags: string[];
  recentNotes?: Note[];
  className?: string;
}

export const ThreadPanel = memo(function ThreadPanel({
  context,
  onContextChange,
  availableTags,
  recentNotes = [],
  className,
}: ThreadPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activePicker, setActivePicker] = useState<PickerType>(null);

  // Derived filter states
  const hasDateFilter = Boolean(context.dateRange?.start || context.dateRange?.end);
  const hasTagFilter = Boolean(context.tags?.length);
  const hasNoteFilter = Boolean(context.noteIds?.length);
  const activeFilterCount = (hasDateFilter ? 1 : 0) + (hasTagFilter ? 1 : 0) + (hasNoteFilter ? 1 : 0);

  const togglePicker = useCallback((picker: PickerType) => {
    setActivePicker(prev => prev === picker ? null : picker);
  }, []);

  const handleAddTag = useCallback((tag: string) => {
    const current = context.tags || [];
    if (!current.includes(tag)) {
      onContextChange({ ...context, tags: [...current, tag] });
    }
    setActivePicker(null);
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
    setActivePicker(null);
  }, [context, onContextChange]);

  const handleRemoveNote = useCallback((noteId: string) => {
    const current = context.noteIds || [];
    onContextChange({ ...context, noteIds: current.filter(id => id !== noteId) });
  }, [context, onContextChange]);

  const handleDateChange = useCallback((type: 'start' | 'end', value: string) => {
    onContextChange({
      ...context,
      dateRange: { ...context.dateRange, [type]: value || undefined },
    });
  }, [context, onContextChange]);

  const handleClearAll = useCallback(() => {
    onContextChange({});
  }, [onContextChange]);

  const handleMaxSourcesChange = useCallback((value: number) => {
    onContextChange({ ...context, maxSources: value });
  }, [context, onContextChange]);

  return (
    <div className={cn('border-b border-[var(--color-border)]', className)}>
      <PanelHeader
        isExpanded={isExpanded}
        activeFilterCount={activeFilterCount}
        onToggle={() => setIsExpanded(prev => !prev)}
      />

      {isExpanded && (
        <div className="px-4 pb-3 space-y-3">
          <FilterButtons
            hasDateFilter={hasDateFilter}
            hasTagFilter={hasTagFilter}
            hasNoteFilter={hasNoteFilter}
            activeFilterCount={activeFilterCount}
            activePicker={activePicker}
            onTogglePicker={togglePicker}
            onClearAll={handleClearAll}
          />

          {activePicker === 'date' && (
            <DateRangePicker
              dateRange={context.dateRange}
              onDateChange={handleDateChange}
            />
          )}

          {activePicker === 'tag' && availableTags.length > 0 && (
            <TagPicker
              tags={availableTags}
              selectedTags={context.tags}
              onAddTag={handleAddTag}
            />
          )}

          {activePicker === 'note' && recentNotes.length > 0 && (
            <NotePicker
              notes={recentNotes}
              selectedNoteIds={context.noteIds}
              onAddNote={handleAddNote}
            />
          )}

          {activeFilterCount > 0 && (
            <ActiveFilters
              tags={context.tags}
              noteIds={context.noteIds}
              onRemoveTag={handleRemoveTag}
              onRemoveNote={handleRemoveNote}
            />
          )}

          <MaxSourcesSlider
            value={context.maxSources || 5}
            onChange={handleMaxSourcesChange}
          />
        </div>
      )}
    </div>
  );
});

// ============================================================================
// Sub-components
// ============================================================================

interface PanelHeaderProps {
  isExpanded: boolean;
  activeFilterCount: number;
  onToggle: () => void;
}

const PanelHeader = memo(function PanelHeader({
  isExpanded,
  activeFilterCount,
  onToggle,
}: PanelHeaderProps) {
  return (
    <button
      onClick={onToggle}
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
  );
});

interface FilterButtonsProps {
  hasDateFilter: boolean;
  hasTagFilter: boolean;
  hasNoteFilter: boolean;
  activeFilterCount: number;
  activePicker: PickerType;
  onTogglePicker: (picker: PickerType) => void;
  onClearAll: () => void;
}

const FilterButtons = memo(function FilterButtons({
  hasDateFilter,
  hasTagFilter,
  hasNoteFilter,
  activeFilterCount,
  activePicker,
  onTogglePicker,
  onClearAll,
}: FilterButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <FilterButton
        icon={Calendar}
        label="Date Range"
        isActive={hasDateFilter}
        isOpen={activePicker === 'date'}
        onClick={() => onTogglePicker('date')}
      />
      <FilterButton
        icon={Tag}
        label="Tags"
        isActive={hasTagFilter}
        isOpen={activePicker === 'tag'}
        onClick={() => onTogglePicker('tag')}
      />
      <FilterButton
        icon={FileText}
        label="Specific Notes"
        isActive={hasNoteFilter}
        isOpen={activePicker === 'note'}
        onClick={() => onTogglePicker('note')}
      />
      {activeFilterCount > 0 && (
        <button
          onClick={onClearAll}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded-md text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
        >
          <X size={12} />
          Clear All
        </button>
      )}
    </div>
  );
});

interface FilterButtonProps {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  isOpen: boolean;
  onClick: () => void;
}

const FilterButton = memo(function FilterButton({
  icon: Icon,
  label,
  isActive,
  isOpen,
  onClick,
}: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors',
        isActive || isOpen
          ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
          : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
      )}
    >
      <Icon size={12} />
      {label}
    </button>
  );
});

interface DateRangePickerProps {
  dateRange: { start?: string; end?: string } | undefined;
  onDateChange: (type: 'start' | 'end', value: string) => void;
}

const DateRangePicker = memo(function DateRangePicker({
  dateRange,
  onDateChange,
}: DateRangePickerProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-[var(--color-text-tertiary)]">From:</span>
      <input
        type="date"
        value={dateRange?.start || ''}
        onChange={(e) => onDateChange('start', e.target.value)}
        className="px-2 py-1 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded"
      />
      <span className="text-[var(--color-text-tertiary)]">To:</span>
      <input
        type="date"
        value={dateRange?.end || ''}
        onChange={(e) => onDateChange('end', e.target.value)}
        className="px-2 py-1 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded"
      />
    </div>
  );
});

interface TagPickerProps {
  tags: string[];
  selectedTags: string[] | undefined;
  onAddTag: (tag: string) => void;
}

const TagPicker = memo(function TagPicker({ tags, selectedTags, onAddTag }: TagPickerProps) {
  const displayTags = useMemo(() => tags.slice(0, 15), [tags]);

  return (
    <div className="flex flex-wrap gap-1">
      {displayTags.map(tag => {
        const isSelected = selectedTags?.includes(tag);
        return (
          <button
            key={tag}
            onClick={() => onAddTag(tag)}
            disabled={isSelected}
            className={cn(
              'px-2 py-0.5 text-xs rounded-md transition-colors',
              isSelected
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-surface-hover)] hover:bg-[var(--color-primary)]/20'
            )}
          >
            #{tag}
          </button>
        );
      })}
    </div>
  );
});

interface NotePickerProps {
  notes: Note[];
  selectedNoteIds: string[] | undefined;
  onAddNote: (noteId: string) => void;
}

const NotePicker = memo(function NotePicker({ notes, selectedNoteIds, onAddNote }: NotePickerProps) {
  const displayNotes = useMemo(() => notes.slice(0, 10), [notes]);

  return (
    <div className="space-y-1 max-h-32 overflow-y-auto">
      {displayNotes.map(note => {
        const isSelected = selectedNoteIds?.includes(note.id);
        return (
          <button
            key={note.id}
            onClick={() => onAddNote(note.id)}
            disabled={isSelected}
            className={cn(
              'w-full text-left px-2 py-1 text-xs rounded-md transition-colors truncate',
              isSelected
                ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                : 'hover:bg-[var(--color-surface-hover)]'
            )}
          >
            {note.title || note.text.slice(0, 50)}
          </button>
        );
      })}
    </div>
  );
});

interface ActiveFiltersProps {
  tags: string[] | undefined;
  noteIds: string[] | undefined;
  onRemoveTag: (tag: string) => void;
  onRemoveNote: (noteId: string) => void;
}

const ActiveFilters = memo(function ActiveFilters({
  tags,
  noteIds,
  onRemoveTag,
  onRemoveNote,
}: ActiveFiltersProps) {
  return (
    <div className="flex flex-wrap gap-1 pt-2 border-t border-[var(--color-border)]">
      {tags?.map(tag => (
        <FilterChip key={tag} label={`#${tag}`} onRemove={() => onRemoveTag(tag)} variant="primary" />
      ))}
      {noteIds?.map(id => (
        <FilterChip key={id} label={`Note: ${id.slice(0, 6)}...`} onRemove={() => onRemoveNote(id)} />
      ))}
    </div>
  );
});

interface FilterChipProps {
  label: string;
  onRemove: () => void;
  variant?: 'default' | 'primary';
}

const FilterChip = memo(function FilterChip({ label, onRemove, variant = 'default' }: FilterChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full',
        variant === 'primary'
          ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
          : 'bg-[var(--color-surface-hover)]'
      )}
    >
      {label}
      <button onClick={onRemove} className="hover:text-[var(--color-danger)]">
        <X size={10} />
      </button>
    </span>
  );
});

interface MaxSourcesSliderProps {
  value: number;
  onChange: (value: number) => void;
}

const MaxSourcesSlider = memo(function MaxSourcesSlider({ value, onChange }: MaxSourcesSliderProps) {
  return (
    <div className="flex items-center gap-2 text-sm pt-2 border-t border-[var(--color-border)]">
      <span className="text-[var(--color-text-tertiary)]">Max sources:</span>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="flex-1"
      />
      <span className="text-xs font-mono w-4">{value}</span>
    </div>
  );
});
