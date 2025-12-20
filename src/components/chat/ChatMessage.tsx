/**
 * ChatMessage component
 * Renders chat messages with inline source chips and sources summary
 */

import { memo, useCallback, useMemo } from 'react';
import { BookOpen, AlertCircle, RotateCcw, Copy, ThumbsUp, ThumbsDown, Send, X } from 'lucide-react';
import type { ChatMessage as ChatMessageType, Source, FeedbackRating } from '../../lib/types';
import { parseSources, getReferencedSources } from '../../lib/citations';
import { formatRelativeTime } from '../../lib/format';
import { copyToClipboard, cn } from '../../lib/utils';
import { useToast } from '../common/useToast';
import { SourceRefChip, SourceBadge } from './CitationChip';

interface FeedbackState {
  hasSent: boolean;
  isCommentMode: boolean;
  comment: string;
  isSubmitting: boolean;
}

interface ChatMessageProps {
  message: ChatMessageType;
  onSourceClick: (source: Source) => void;
  activeSourceId?: string | null;
  onRetry?: () => void;
  showTimestamp?: boolean;
  feedbackState?: FeedbackState;
  onFeedback?: (rating: FeedbackRating, comment?: string) => void;
  onFeedbackCommentChange?: (comment: string) => void;
  onCancelFeedback?: () => void;
}

export const ChatMessage = memo(function ChatMessage({
  message,
  onSourceClick,
  activeSourceId,
  onRetry,
  showTimestamp = true,
  feedbackState,
  onFeedback,
  onFeedbackCommentChange,
  onCancelFeedback,
}: ChatMessageProps) {
  const { showToast } = useToast();
  const isUser = message.role === 'user';
  const isError = message.isError;
  const isStreaming = message.isStreaming;
  const segments = parseSources(message.content, message.sources);
  const referencedSources = getReferencedSources(message.content, message.sources);

  // Get all sources: combine cited sources with context sources, avoiding duplicates
  const allSources = useMemo(() => {
    const citedIds = new Set(referencedSources.map(s => s.noteId));
    const contextSources = (message.contextSources || []).filter(s => !citedIds.has(s.noteId));
    return {
      cited: referencedSources,
      context: contextSources,
      hasAny: referencedSources.length > 0 || contextSources.length > 0,
    };
  }, [referencedSources, message.contextSources]);

  // Show retry button for 503 and 5xx errors
  const showRetry = isError && onRetry && (message.errorCode === 503 || (message.errorCode && message.errorCode >= 500));

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(message.content);
    showToast(success ? 'Copied' : 'Failed to copy', success ? 'success' : 'error');
  }, [message.content, showToast]);

  return (
    <div className={cn('chat-message', isUser ? 'user' : 'assistant', isStreaming && 'streaming')}>
      <div className={cn('chat-bubble', isError && 'chat-bubble-error')}>
        {isError && <AlertCircle size={14} className="error-icon" />}
        {segments.map((segment, i) => {
          if (segment.type === 'source' && segment.source) {
            return (
              <SourceRefChip
                key={`${segment.source.id}-${i}`}
                source={segment.source}
                onClick={onSourceClick}
              />
            );
          }
          return <span key={i}>{segment.content}</span>;
        })}
        {isStreaming && <span className="streaming-cursor" />}
        {showRetry && (
          <button className="btn btn-sm btn-ghost retry-btn" onClick={onRetry}>
            <RotateCcw size={12} />
            Retry
          </button>
        )}
      </div>

      {/* Message meta row: sources + feedback on same line */}
      {!isUser && !isError && !isStreaming && (
        <div className="chat-message-footer">
          {/* Left side: Cited sources */}
          <div className="chat-footer-sources">
            {allSources.cited.length > 0 && (
              <>
                <span className="sources-label">
                  <BookOpen size={14} />
                  Cited:
                </span>
                <div className="sources-chips">
                  {allSources.cited.map((source) => (
                    <SourceBadge
                      key={source.id}
                      id={source.id}
                      onClick={() => onSourceClick(source)}
                      isActive={source.id === activeSourceId}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right side: Feedback buttons */}
          {feedbackState && onFeedback && (
            <div className="chat-footer-feedback">
              {feedbackState.hasSent ? (
                <span className="feedback-thanks">Thanks!</span>
              ) : feedbackState.isCommentMode ? (
                <div className="feedback-comment-form">
                  <input
                    type="text"
                    className="feedback-comment-input"
                    value={feedbackState.comment}
                    onChange={(e) => onFeedbackCommentChange?.(e.target.value.slice(0, 1000))}
                    placeholder="What went wrong?"
                    aria-label="Feedback comment"
                    maxLength={1000}
                    disabled={feedbackState.isSubmitting}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        onFeedback('down', feedbackState.comment);
                      } else if (e.key === 'Escape') {
                        onCancelFeedback?.();
                      }
                    }}
                  />
                  <button
                    className="btn btn-icon btn-ghost btn-sm"
                    onClick={() => onFeedback('down', feedbackState.comment)}
                    disabled={feedbackState.isSubmitting}
                    aria-label="Submit feedback"
                  >
                    {feedbackState.isSubmitting ? <span className="spinner" /> : <Send size={14} />}
                  </button>
                  <button
                    className="btn btn-icon btn-ghost btn-sm"
                    onClick={onCancelFeedback}
                    disabled={feedbackState.isSubmitting}
                    aria-label="Cancel"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    className="btn btn-icon btn-ghost btn-sm feedback-btn"
                    onClick={() => onFeedback('up')}
                    aria-label="Good response"
                    title="Good response"
                  >
                    <ThumbsUp size={14} />
                  </button>
                  <button
                    className="btn btn-icon btn-ghost btn-sm feedback-btn"
                    onClick={() => onFeedback('down')}
                    aria-label="Poor response"
                    title="Poor response"
                  >
                    <ThumbsDown size={14} />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Timestamp row */}
      {showTimestamp && !isStreaming && (
        <div className="chat-message-meta">
          <span className="chat-timestamp">
            {formatRelativeTime(message.timestamp)}
          </span>
          {!isUser && !isError && (
            <button
              className="btn btn-icon btn-ghost btn-sm chat-copy-btn"
              onClick={handleCopy}
              title="Copy message"
              aria-label="Copy message"
            >
              <Copy size={12} />
            </button>
          )}
        </div>
      )}
    </div>
  );
});

/**
 * Loading state message bubble with AI typing indicator
 */
export function ChatMessageLoading() {
  return (
    <div className="chat-message assistant animate-fade-in">
      <div className="chat-bubble chat-bubble-loading">
        <div className="ai-typing">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <span className="text-muted">Searching your notes...</span>
      </div>
    </div>
  );
}

/**
 * Error state message with retry option
 */
interface ChatMessageErrorProps {
  error: string;
  onRetry?: () => void;
}

export function ChatMessageError({ error, onRetry }: ChatMessageErrorProps) {
  return (
    <div className="chat-message assistant">
      <div className="chat-bubble chat-bubble-error">
        <AlertCircle size={14} />
        <span>{error || 'Something went wrong. Please try again.'}</span>
        {onRetry && (
          <button className="btn btn-sm btn-ghost" onClick={onRetry}>
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

