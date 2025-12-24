/**
 * Modal dialog for displaying source citations with navigation to original notes.
 */

import { useEffect, useRef, memo, useMemo } from 'react';
import { BookOpen, X, ShieldCheck, ArrowRight } from 'lucide-react';
import type { Source } from '../../lib/types';
import { cn } from '../../lib/utils';
import { formatPreview, getConfidenceFromRelevance } from '../../lib/citations';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface SourcesPanelProps {
  sources: Source[];
  selectedSourceId: string | null;
  onSelectSource: (id: string | null) => void;
  onOpenNote: (noteId: string, preview?: string) => void;
  onClose: () => void;
}

export const SourcesPanel = memo(function SourcesPanel({
  sources,
  selectedSourceId,
  onSelectSource,
  onOpenNote,
  onClose,
}: SourcesPanelProps) {
  const selectedRef = useRef<HTMLDivElement>(null);

  const modalRef = useFocusTrap<HTMLDivElement>({
    enabled: sources.length > 0,
    onEscape: onClose,
    restoreFocus: true,
  });

  // Scroll to selected source when it changes
  useEffect(() => {
    if (selectedSourceId && selectedRef.current) {
      selectedRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedSourceId]);

  if (sources.length === 0) return null;

  return (
    <div className="sources-modal-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        className="sources-modal animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHeader count={sources.length} onClose={onClose} />

        <div className="sources-modal-body">
          <TrustHint />

          <div className="sources-list">
            {sources.map((source) => (
              <SourceCard
                key={source.id}
                ref={source.id === selectedSourceId ? selectedRef : null}
                source={source}
                isSelected={source.id === selectedSourceId}
                onSelect={() => onSelectSource(source.id === selectedSourceId ? null : source.id)}
                onOpenNote={onOpenNote}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

/** Modal header with title and close button */
const ModalHeader = memo(function ModalHeader({
  count,
  onClose
}: {
  count: number;
  onClose: () => void;
}) {
  return (
    <div className="sources-modal-header">
      <div className="sources-modal-title">
        <BookOpen size={16} />
        <span>Sources</span>
        <span className="sources-count">{count}</span>
      </div>
      <button
        className="btn btn-icon btn-ghost btn-sm"
        onClick={onClose}
        aria-label="Close sources panel"
      >
        <X size={16} />
      </button>
    </div>
  );
});

/** Trust indicator hint */
const TrustHint = memo(function TrustHint() {
  return (
    <div className="sources-trust-hint">
      <ShieldCheck size={14} />
      Grounded in your notes
    </div>
  );
});

interface SourceCardProps {
  source: Source;
  isSelected: boolean;
  onSelect: () => void;
  onOpenNote: (noteId: string, preview?: string) => void;
}

/** Individual source card with preview and navigation */
const SourceCard = memo(function SourceCard({
  source,
  isSelected,
  onSelect,
  onOpenNote,
  ref,
}: SourceCardProps & { ref?: React.Ref<HTMLDivElement> }) {
  const confidence = useMemo(() => getConfidenceFromRelevance(source.relevance), [source.relevance]);
  const relevancePercent = useMemo(() => Math.round(source.relevance * 100), [source.relevance]);

  const handleJumpToNote = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenNote(source.noteId, source.preview);
  };

  return (
    <div
      ref={ref}
      className={cn(
        'source-card',
        isSelected && 'selected',
        `confidence-${confidence}`
      )}
      onClick={onSelect}
    >
      <div className="source-card-header">
        <span className="source-badge">[{source.id}]</span>
        {source.relevance > 0 && (
          <span className="source-score" title={`Relevance: ${relevancePercent}%`}>
            {relevancePercent}%
          </span>
        )}
      </div>

      <p className="source-preview">
        {formatPreview(source.preview, 200)}
      </p>

      <div className="source-card-footer">
        <span className="source-date">{source.date}</span>
        <button
          className="btn btn-sm btn-ghost jump-to-note-btn"
          onClick={handleJumpToNote}
          title="Jump to this note in the notes list"
        >
          Jump to note
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
});
