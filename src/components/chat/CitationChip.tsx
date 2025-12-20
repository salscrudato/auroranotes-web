/**
 * Source/Citation chip components
 * Clickable inline chips that replace [1], [2] source tokens
 * Shows tooltip preview and triggers sources panel on click
 */

import { useState, useRef, useEffect, memo, useCallback } from 'react';
import type { Source, Citation } from '../../lib/types';
import { formatPreview, formatSnippet } from '../../lib/citations';
import { cn } from '../../lib/utils';

// ============================================
// New Source-based Components
// ============================================

interface SourceRefChipProps {
  source: Source;
  onClick: (source: Source) => void;
}

/**
 * Inline source reference chip with tooltip
 * Replaces [1], [2] tokens in chat messages
 */
export const SourceRefChip = memo(function SourceRefChip({ source, onClick }: SourceRefChipProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const chipRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Position tooltip to avoid overflow
  useEffect(() => {
    if (showTooltip && tooltipRef.current && chipRef.current) {
      const tooltip = tooltipRef.current;
      const viewportWidth = window.innerWidth;

      tooltip.style.left = '50%';
      tooltip.style.transform = 'translateX(-50%)';

      const tooltipRect = tooltip.getBoundingClientRect();
      if (tooltipRect.right > viewportWidth - 8) {
        tooltip.style.left = 'auto';
        tooltip.style.right = '0';
        tooltip.style.transform = 'none';
      }
      if (tooltipRect.left < 8) {
        tooltip.style.left = '0';
        tooltip.style.right = 'auto';
        tooltip.style.transform = 'none';
      }
    }
  }, [showTooltip]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick(source);
  };

  const preview = formatPreview(source.preview, 100);
  const relevancePercent = Math.round(source.relevance * 100);

  const handleMouseEnter = useCallback(() => setShowTooltip(true), []);
  const handleMouseLeave = useCallback(() => setShowTooltip(false), []);

  return (
    <span className="source-chip-wrapper">
      <button
        ref={chipRef}
        className="source-ref-chip"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        aria-label={`Source ${source.id}: ${preview}`}
        title=""
      >
        [{source.id}]
      </button>

      {showTooltip && (
        <div ref={tooltipRef} className="source-tooltip" role="tooltip">
          <div className="source-tooltip-header">
            <span className="source-tooltip-badge">[{source.id}]</span>
            {source.relevance > 0 && (
              <span className="source-tooltip-score">
                {relevancePercent}% match
              </span>
            )}
          </div>
          <p className="source-tooltip-text">{preview}</p>
          <div className="source-tooltip-footer">
            <span className="source-tooltip-date">{source.date}</span>
            <span className="source-tooltip-hint">Click to view</span>
          </div>
        </div>
      )}
    </span>
  );
});

/**
 * Small badge for source lists
 * variant="context" shows a muted style for context sources (not directly cited)
 */
interface SourceBadgeProps {
  id: string;
  onClick: () => void;
  isActive?: boolean;
  variant?: 'cited' | 'context';
}

export const SourceBadge = memo(function SourceBadge({
  id,
  onClick,
  isActive = false,
  variant = 'cited',
}: SourceBadgeProps) {
  return (
    <button
      className={cn(
        'source-badge-chip',
        isActive && 'active',
        variant === 'context' && 'context'
      )}
      onClick={onClick}
      aria-label={`View source ${id}`}
      title={variant === 'context' ? 'Context source (not directly cited)' : undefined}
    >
      [{id}]
    </button>
  );
});

// ============================================
// Legacy Citation Components (deprecated)
// ============================================

interface CitationChipProps {
  citation: Citation;
  onClick: (citation: Citation) => void;
}

/**
 * @deprecated Use SourceRefChip instead
 */
export const CitationChip = memo(function CitationChip({ citation, onClick }: CitationChipProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const chipRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showTooltip && tooltipRef.current && chipRef.current) {
      const tooltip = tooltipRef.current;
      const viewportWidth = window.innerWidth;

      tooltip.style.left = '50%';
      tooltip.style.transform = 'translateX(-50%)';

      const tooltipRect = tooltip.getBoundingClientRect();
      if (tooltipRect.right > viewportWidth - 8) {
        tooltip.style.left = 'auto';
        tooltip.style.right = '0';
        tooltip.style.transform = 'none';
      }
      if (tooltipRect.left < 8) {
        tooltip.style.left = '0';
        tooltip.style.right = 'auto';
        tooltip.style.transform = 'none';
      }
    }
  }, [showTooltip]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick(citation);
  };

  const snippetPreview = formatSnippet(citation.snippet, 100);

  const handleMouseEnter = useCallback(() => setShowTooltip(true), []);
  const handleMouseLeave = useCallback(() => setShowTooltip(false), []);

  return (
    <span className="citation-chip-wrapper">
      <button
        ref={chipRef}
        className="citation-chip"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        aria-label={`Source ${citation.cid}: ${snippetPreview}`}
        title=""
      >
        {citation.cid}
      </button>

      {showTooltip && (
        <div ref={tooltipRef} className="citation-tooltip" role="tooltip">
          <div className="citation-tooltip-header">
            <span className="citation-tooltip-badge">{citation.cid}</span>
            <span className="citation-tooltip-score">
              {Math.round(citation.score * 100)}% match
            </span>
          </div>
          <p className="citation-tooltip-text">{snippetPreview}</p>
          <div className="citation-tooltip-hint">Click to view source</div>
        </div>
      )}
    </span>
  );
});

/**
 * @deprecated Use SourceBadge instead
 */
interface SourceChipProps {
  cid: string;
  onClick: () => void;
  isActive?: boolean;
}

export const SourceChip = memo(function SourceChip({ cid, onClick, isActive = false }: SourceChipProps) {
  return (
    <button
      className={cn('source-chip', isActive && 'active')}
      onClick={onClick}
      aria-label={`View source ${cid}`}
    >
      {cid}
    </button>
  );
});

