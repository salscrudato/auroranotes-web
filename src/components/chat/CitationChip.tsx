/**
 * Citation chip components for displaying source references in chat messages.
 * Renders clickable [1], [2] chips with tooltips that trigger source panel navigation.
 */

import { useState, useRef, useEffect, useMemo, memo } from 'react';
import type { Source } from '../../lib/types';
import { formatPreview } from '../../lib/citations';
import { cn } from '../../lib/utils';

interface SourceRefChipProps {
  source: Source;
  onClick: (source: Source) => void;
}

/** Inline source reference chip with hover tooltip. */
export const SourceRefChip = memo(function SourceRefChip({ source, onClick }: SourceRefChipProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const preview = useMemo(() => formatPreview(source.preview, 100), [source.preview]);
  const relevancePercent = useMemo(() => Math.round(source.relevance * 100), [source.relevance]);

  // Reposition tooltip to stay within viewport
  useEffect(() => {
    if (!showTooltip || !tooltipRef.current) return;

    const tooltip = tooltipRef.current;
    const viewportWidth = window.innerWidth;
    const rect = tooltip.getBoundingClientRect();

    // Reset to centered position
    tooltip.style.left = '50%';
    tooltip.style.right = 'auto';
    tooltip.style.transform = 'translateX(-50%)';

    // Adjust if overflowing right edge
    if (rect.right > viewportWidth - 8) {
      tooltip.style.left = 'auto';
      tooltip.style.right = '0';
      tooltip.style.transform = 'none';
    }
    // Adjust if overflowing left edge
    else if (rect.left < 8) {
      tooltip.style.left = '0';
      tooltip.style.transform = 'none';
    }
  }, [showTooltip]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick(source);
  };

  const showTip = () => setShowTooltip(true);
  const hideTip = () => setShowTooltip(false);

  return (
    <span className="source-chip-wrapper">
      <button
        className="source-ref-chip"
        onClick={handleClick}
        onMouseEnter={showTip}
        onMouseLeave={hideTip}
        onFocus={showTip}
        onBlur={hideTip}
        aria-label={`Source ${source.id}: ${preview}`}
      >
        [{source.id}]
      </button>

      {showTooltip && (
        <div ref={tooltipRef} className="source-tooltip" role="tooltip">
          <div className="source-tooltip-header">
            <span className="source-tooltip-badge">[{source.id}]</span>
            {source.relevance > 0 && (
              <span className="source-tooltip-score">{relevancePercent}% match</span>
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

interface SourceBadgeProps {
  id: string;
  onClick: () => void;
  isActive?: boolean;
  /** Use 'context' for sources that provided context but weren't directly cited */
  variant?: 'cited' | 'context';
}

/** Compact badge for source lists in the sources panel. */
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
