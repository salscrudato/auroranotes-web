/**
 * Hover menu for chat message actions (copy, regenerate, expand, etc.)
 */

import { useState, useCallback, memo } from 'react';
import { Copy, RefreshCw, Maximize2, MoreHorizontal, BookOpen, Share2, Trash2 } from 'lucide-react';
import type { ChatMessage } from '../../lib/types';
import { cn, copyToClipboard } from '../../lib/utils';
import { useToast } from '../common/useToast';

interface MessageActionsProps {
  message: ChatMessage;
  onRegenerate?: () => void;
  onExpand?: () => void;
  onDelete?: () => void;
  onViewSources?: () => void;
  showRegenerate?: boolean;
  className?: string;
}

export const MessageActions = memo(function MessageActions({
  message,
  onRegenerate,
  onExpand,
  onDelete,
  onViewSources,
  showRegenerate = false,
  className,
}: MessageActionsProps) {
  const { showToast } = useToast();
  const [showMore, setShowMore] = useState(false);

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(message.content);
    showToast(success ? 'Copied to clipboard' : 'Failed to copy', success ? 'success' : 'error');
  }, [message.content, showToast]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Aurora Notes Chat',
          text: message.content,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      handleCopy();
    }
  }, [message.content, handleCopy]);

  const isAssistant = message.role === 'assistant';
  const hasSources = isAssistant && message.sources && message.sources.length > 0;

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {/* Copy */}
      <button
        onClick={handleCopy}
        className="p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
        title="Copy message"
        aria-label="Copy message"
      >
        <Copy size={14} />
      </button>

      {/* View Sources - only for assistant messages with sources */}
      {hasSources && onViewSources && (
        <button
          onClick={onViewSources}
          className="p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
          title="View sources"
          aria-label="View sources"
        >
          <BookOpen size={14} />
        </button>
      )}

      {/* Regenerate - only for the last assistant message */}
      {showRegenerate && onRegenerate && isAssistant && (
        <button
          onClick={onRegenerate}
          className="p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
          title="Regenerate response"
          aria-label="Regenerate response"
        >
          <RefreshCw size={14} />
        </button>
      )}

      {/* Expand - for long messages */}
      {onExpand && message.content.length > 500 && (
        <button
          onClick={onExpand}
          className="p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
          title="Expand message"
          aria-label="Expand message"
        >
          <Maximize2 size={14} />
        </button>
      )}

      {/* More Menu */}
      <div className="relative">
        <button
          onClick={() => setShowMore(!showMore)}
          className="p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
          title="More actions"
          aria-label="More actions"
          aria-expanded={showMore}
        >
          <MoreHorizontal size={14} />
        </button>

        {showMore && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMore(false)}
            />

            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full mt-1 z-20 min-w-[140px] py-1 rounded-lg shadow-lg bg-[var(--color-surface)] border border-[var(--color-border)]">
              <button
                onClick={() => {
                  handleShare();
                  setShowMore(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-[var(--color-surface-hover)]"
              >
                <Share2 size={14} />
                Share
              </button>
              {onDelete && (
                <button
                  onClick={() => {
                    onDelete();
                    setShowMore(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
});
