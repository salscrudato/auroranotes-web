/**
 * Slide-in drawer displaying source citations grouped by relevance.
 */

import { useMemo, memo } from 'react';
import { BookOpen, X, ExternalLink, Star, FileText, type LucideIcon } from 'lucide-react';
import type { Source } from '../../lib/types';
import { cn } from '../../lib/utils';
import { formatPreview, getConfidenceFromRelevance } from '../../lib/citations';
import { useFocusTrap } from '../../hooks/useFocusTrap';

type RelevanceLevel = 'high' | 'medium' | 'low';

interface RelevanceConfig {
  label: string;
  icon: LucideIcon;
  color: string;
}

const RELEVANCE_CONFIG: Record<RelevanceLevel, RelevanceConfig> = {
  high: { label: 'Highly Relevant', icon: Star, color: 'text-amber-500' },
  medium: { label: 'Relevant', icon: FileText, color: 'text-blue-500' },
  low: { label: 'Possibly Relevant', icon: FileText, color: 'text-[var(--color-text-tertiary)]' },
};

const RELEVANCE_ORDER: RelevanceLevel[] = ['high', 'medium', 'low'];

interface SourcesDrawerProps {
  sources: Source[];
  isOpen: boolean;
  onClose: () => void;
  onOpenNote: (noteId: string, preview?: string) => void;
  selectedSourceId?: string | null;
  onSelectSource?: (id: string) => void;
}

export const SourcesDrawer = memo(function SourcesDrawer({
  sources,
  isOpen,
  onClose,
  onOpenNote,
  selectedSourceId,
  onSelectSource,
}: SourcesDrawerProps) {
  const drawerRef = useFocusTrap<HTMLDivElement>({
    enabled: isOpen,
    onEscape: onClose,
    restoreFocus: true,
  });

  // Group sources by relevance level
  const groupedSources = useMemo(() => {
    const groups = new Map<RelevanceLevel, Source[]>();

    for (const source of sources) {
      const level = getConfidenceFromRelevance(source.relevance);
      if (level === 'none') continue;

      const list = groups.get(level as RelevanceLevel) ?? [];
      list.push(source);
      groups.set(level as RelevanceLevel, list);
    }

    return RELEVANCE_ORDER
      .filter(level => groups.has(level))
      .map(level => ({ level, sources: groups.get(level)! }));
  }, [sources]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        ref={drawerRef}
        className="w-full max-w-md h-full flex flex-col bg-[var(--color-surface)] shadow-2xl animate-slide-in-right"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sources-drawer-title"
      >
        <DrawerHeader count={sources.length} onClose={onClose} />

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {sources.length === 0 ? (
            <EmptyState />
          ) : (
            groupedSources.map(({ level, sources: groupSources }) => (
              <RelevanceGroup
                key={level}
                level={level}
                sources={groupSources}
                selectedSourceId={selectedSourceId}
                onSelectSource={onSelectSource}
                onOpenNote={onOpenNote}
              />
            ))
          )}
        </div>

        <div className="px-4 py-3 border-t border-[var(--color-border)] text-xs text-[var(--color-text-tertiary)]">
          Sources are ranked by semantic relevance to your question.
        </div>
      </div>
    </div>
  );
});

/** Drawer header with title and close button */
const DrawerHeader = memo(function DrawerHeader({
  count,
  onClose
}: {
  count: number;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
      <div className="flex items-center gap-2">
        <BookOpen size={18} className="text-[var(--color-primary)]" />
        <h2 id="sources-drawer-title" className="text-lg font-semibold">Sources</h2>
        <span className="px-1.5 py-0.5 text-xs rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
          {count}
        </span>
      </div>
      <button
        onClick={onClose}
        className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
        aria-label="Close sources drawer"
      >
        <X size={18} />
      </button>
    </div>
  );
});

/** Empty state when no sources */
const EmptyState = memo(function EmptyState() {
  return (
    <div className="text-center text-[var(--color-text-tertiary)] py-8">
      No sources found for this response.
    </div>
  );
});

interface RelevanceGroupProps {
  level: RelevanceLevel;
  sources: Source[];
  selectedSourceId: string | null | undefined;
  onSelectSource: ((id: string) => void) | undefined;
  onOpenNote: (noteId: string, preview?: string) => void;
}

/** Group of sources with same relevance level */
const RelevanceGroup = memo(function RelevanceGroup({
  level,
  sources,
  selectedSourceId,
  onSelectSource,
  onOpenNote,
}: RelevanceGroupProps) {
  const { label, icon: Icon, color } = RELEVANCE_CONFIG[level];

  return (
    <div>
      <div className={cn('flex items-center gap-2 mb-2 text-sm font-medium', color)}>
        <Icon size={14} />
        {label}
        <span className="text-[var(--color-text-tertiary)]">({sources.length})</span>
      </div>
      <div className="space-y-2">
        {sources.map(source => (
          <SourceCard
            key={source.id}
            source={source}
            isSelected={selectedSourceId === source.id}
            onSelect={() => onSelectSource?.(source.id)}
            onOpenNote={onOpenNote}
          />
        ))}
      </div>
    </div>
  );
});

interface SourceCardProps {
  source: Source;
  isSelected: boolean;
  onSelect: () => void;
  onOpenNote: (noteId: string, preview?: string) => void;
}

/** Individual source card with preview and actions */
const SourceCard = memo(function SourceCard({
  source,
  isSelected,
  onSelect,
  onOpenNote,
}: SourceCardProps) {
  const handleViewNote = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenNote(source.noteId, source.preview);
  };

  return (
    <div
      onClick={onSelect}
      className={cn(
        'p-3 rounded-lg border transition-all cursor-pointer',
        isSelected
          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
          : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-[var(--color-primary)]">[{source.id}]</span>
        <span className="text-xs text-[var(--color-text-tertiary)]">
          {Math.round(source.relevance * 100)}% match
        </span>
      </div>

      <p className="text-sm text-[var(--color-text-secondary)] line-clamp-3 mb-2">
        {formatPreview(source.preview, 150)}
      </p>

      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--color-text-tertiary)]">{source.date}</span>
        <button
          onClick={handleViewNote}
          className="flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
        >
          View note
          <ExternalLink size={10} />
        </button>
      </div>
    </div>
  );
});
