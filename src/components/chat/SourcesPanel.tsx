/**
 * SourcesPanel component
 * Shows sources in a modal dialog
 * Allows viewing source previews and navigating to full notes
 */

import { useEffect, useRef } from 'react';
import { BookOpen, X, ShieldCheck, ArrowRight } from 'lucide-react';
import type { Source } from '../../lib/types';
import { formatPreview, getConfidenceFromRelevance } from '../../lib/citations';

interface SourcesPanelProps {
  sources: Source[];
  selectedSourceId: string | null;
  onSelectSource: (id: string | null) => void;
  onOpenNote: (noteId: string, preview?: string) => void;
  onClose: () => void;
}

export function SourcesPanel({
  sources,
  selectedSourceId,
  onSelectSource,
  onOpenNote,
  onClose,
}: SourcesPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLDivElement>(null);

  // Scroll to selected source when it changes
  useEffect(() => {
    if (selectedSourceId && selectedRef.current) {
      selectedRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedSourceId]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (sources.length === 0) return null;

  return (
    <div className="sources-modal-overlay" onClick={onClose}>
      <div
        className="sources-modal animate-scale-in"
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sources-modal-header">
          <div className="sources-modal-title">
            <BookOpen size={16} />
            <span>Sources</span>
            <span className="sources-count">{sources.length}</span>
          </div>
          <button
            className="btn btn-icon btn-ghost btn-sm"
            onClick={onClose}
            aria-label="Close sources panel"
          >
            <X size={16} />
          </button>
        </div>

        <div className="sources-modal-body">
          <div className="sources-trust-hint">
            <ShieldCheck size={14} />
            Grounded in your notes
          </div>

          <div className="sources-list">
            {sources.map((source) => {
              const isSelected = source.id === selectedSourceId;
              const confidence = getConfidenceFromRelevance(source.relevance);
              const relevancePercent = Math.round(source.relevance * 100);

              return (
                <div
                  key={source.id}
                  ref={isSelected ? selectedRef : null}
                  className={`source-card ${isSelected ? 'selected' : ''} confidence-${confidence}`}
                  onClick={() => onSelectSource(isSelected ? null : source.id)}
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
                    <span className="source-date">
                      {source.date}
                    </span>
                    <button
                      className="btn btn-sm btn-ghost jump-to-note-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenNote(source.noteId, source.preview);
                      }}
                      title="Jump to this note in the notes list"
                    >
                      Jump to note
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

