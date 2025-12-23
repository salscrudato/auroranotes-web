/**
 * SourcesDrawer component
 * Improved sources panel with grouping, relevance sorting, and better UX
 */

import { useMemo, useCallback } from 'react';
import { BookOpen, X, ExternalLink, Star, FileText } from 'lucide-react';
import type { Source } from '../../lib/types';
import { cn } from '../../lib/utils';
import { formatPreview, getConfidenceFromRelevance } from '../../lib/citations';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface SourcesDrawerProps {
  sources: Source[];
  isOpen: boolean;
  onClose: () => void;
  onOpenNote: (noteId: string, preview?: string) => void;
  selectedSourceId?: string | null;
  onSelectSource?: (id: string) => void;
}

interface GroupedSource {
  relevance: 'high' | 'medium' | 'low';
  sources: Source[];
}

export function SourcesDrawer({
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

  // Group sources by relevance
  const groupedSources = useMemo((): GroupedSource[] => {
    const high: Source[] = [];
    const medium: Source[] = [];
    const low: Source[] = [];

    for (const source of sources) {
      const confidence = getConfidenceFromRelevance(source.relevance);
      if (confidence === 'high') high.push(source);
      else if (confidence === 'medium') medium.push(source);
      else low.push(source);
    }

    const groups: GroupedSource[] = [];
    if (high.length > 0) groups.push({ relevance: 'high', sources: high });
    if (medium.length > 0) groups.push({ relevance: 'medium', sources: medium });
    if (low.length > 0) groups.push({ relevance: 'low', sources: low });

    return groups;
  }, [sources]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) return null;

  const relevanceLabels = {
    high: { label: 'Highly Relevant', icon: Star, color: 'text-amber-500' },
    medium: { label: 'Relevant', icon: FileText, color: 'text-blue-500' },
    low: { label: 'Possibly Relevant', icon: FileText, color: 'text-[var(--color-text-tertiary)]' },
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        ref={drawerRef}
        className={cn(
          'w-full max-w-md h-full flex flex-col',
          'bg-[var(--color-surface)] shadow-2xl',
          'animate-slide-in-right'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sources-drawer-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-[var(--color-primary)]" />
            <h2 id="sources-drawer-title" className="text-lg font-semibold">
              Sources
            </h2>
            <span className="px-1.5 py-0.5 text-xs rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              {sources.length}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {sources.length === 0 ? (
            <div className="text-center text-[var(--color-text-tertiary)] py-8">
              No sources found for this response.
            </div>
          ) : (
            groupedSources.map(group => {
              const { label, icon: Icon, color } = relevanceLabels[group.relevance];
              
              return (
                <div key={group.relevance}>
                  {/* Group Header */}
                  <div className={cn('flex items-center gap-2 mb-2 text-sm font-medium', color)}>
                    <Icon size={14} />
                    {label}
                    <span className="text-[var(--color-text-tertiary)]">({group.sources.length})</span>
                  </div>

                  {/* Source Cards */}
                  <div className="space-y-2">
                    {group.sources.map(source => (
                      <div
                        key={source.id}
                        onClick={() => onSelectSource?.(source.id)}
                        className={cn(
                          'p-3 rounded-lg border transition-all cursor-pointer',
                          selectedSourceId === source.id
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                            : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
                        )}
                      >
                        {/* Source Header */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-[var(--color-primary)]">
                            [{source.id}]
                          </span>
                          <span className="text-xs text-[var(--color-text-tertiary)]">
                            {Math.round(source.relevance * 100)}% match
                          </span>
                        </div>

                        {/* Preview */}
                        <p className="text-sm text-[var(--color-text-secondary)] line-clamp-3 mb-2">
                          {formatPreview(source.preview, 150)}
                        </p>

                        {/* Footer */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[var(--color-text-tertiary)]">
                            {source.date}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenNote(source.noteId, source.preview);
                            }}
                            className="flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
                          >
                            View note
                            <ExternalLink size={10} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[var(--color-border)] text-xs text-[var(--color-text-tertiary)]">
          Sources are ranked by semantic relevance to your question.
        </div>
      </div>
    </div>
  );
}

