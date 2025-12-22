/**
 * ChatMessage component
 * Renders chat messages with inline source chips and sources summary
 */

import { memo, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { BookOpen, AlertCircle, AlertTriangle, RotateCcw, Copy, ThumbsUp, ThumbsDown, Send, X } from 'lucide-react';
import type { ChatMessage as ChatMessageType, Source, FeedbackRating, ConfidenceLevel } from '../../lib/types';
import { parseSources, getReferencedSources } from '../../lib/citations';
import { formatRelativeTime } from '../../lib/format';
import { copyToClipboard, cn } from '../../lib/utils';
import { useToast } from '../common/useToast';
import { useAnnounce } from '../common/LiveRegion';
import { SourceRefChip, SourceBadge } from './CitationChip';
import { ChatMarkdown } from './ChatMarkdown';
import { ActionResult } from './ActionResult';

/** Streaming elapsed time indicator */
function StreamingElapsed({ startTime }: { startTime: Date }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  // Only show after 3 seconds
  if (elapsed < 3) return null;

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = minutes > 0
    ? `${minutes}:${seconds.toString().padStart(2, '0')}`
    : `${seconds}s`;

  return (
    <div className="streaming-elapsed">
      <span>Generating... {timeStr}</span>
    </div>
  );
}

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
  /** Suggested follow-up questions */
  suggestedQuestions?: string[];
  /** Callback when a suggested question is clicked */
  onSuggestedQuestion?: (question: string) => void;
  /** Whether this is the last message (for showing suggestions) */
  isLastMessage?: boolean;
  /** Callback when a note is clicked from action results */
  onNoteClick?: (noteId: string) => void;
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
  suggestedQuestions,
  onSuggestedQuestion,
  isLastMessage = false,
  onNoteClick,
}: ChatMessageProps) {
  const { showToast } = useToast();
  const announce = useAnnounce();
  const wasStreamingRef = useRef(false);
  const isUser = message.role === 'user';
  const isError = message.isError;
  const isStreaming = message.isStreaming;
  const segments = parseSources(message.content, message.sources);

  // Announce when streaming completes for screen readers
  useEffect(() => {
    if (wasStreamingRef.current && !isStreaming && !isUser && !isError) {
      const sourceCount = message.sources?.length || 0;
      const announcement = sourceCount > 0
        ? `Response complete with ${sourceCount} source${sourceCount === 1 ? '' : 's'}`
        : 'Response complete';
      announce(announcement);
    }
    wasStreamingRef.current = isStreaming || false;
  }, [isStreaming, isUser, isError, message.sources?.length, announce]);

  // Memoize referenced sources to avoid recalculation on every render
  const referencedSources = useMemo(
    () => getReferencedSources(message.content, message.sources),
    [message.content, message.sources]
  );

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

  // Confidence warning for low-confidence responses
  const confidenceWarning = useMemo(() => {
    if (isUser || isError || isStreaming || !message.meta?.confidence) return null;
    const level = message.meta.confidence;
    if (level === 'low') {
      return {
        level: 'low' as ConfidenceLevel,
        message: 'This response may be less accurate. Consider verifying with your notes.',
        severe: false,
      };
    }
    if (level === 'none') {
      return {
        level: 'none' as ConfidenceLevel,
        message: 'No relevant notes found. This response is based on general knowledge.',
        severe: true,
      };
    }
    return null;
  }, [isUser, isError, isStreaming, message.meta?.confidence]);

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(message.content);
    showToast(success ? 'Copied' : 'Failed to copy', success ? 'success' : 'error');
  }, [message.content, showToast]);

  return (
    <div className={cn('chat-message', isUser ? 'user' : 'assistant', isStreaming && 'streaming')}>
      <div className={cn('chat-bubble', isError && 'chat-bubble-error')} aria-busy={isStreaming}>
        {isError && <AlertCircle size={14} className="error-icon" />}
        {isUser || isError ? (
          // User messages and errors: render as plain text with source chips
          segments.map((segment, i) => {
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
          })
        ) : (
          // Assistant messages: render as markdown with source citations
          <ChatMarkdown
            content={message.content}
            sources={message.sources}
            onSourceClick={onSourceClick}
          />
        )}
        {isStreaming && <span className="streaming-cursor" />}
        {showRetry && (
          <button className="btn btn-sm btn-ghost retry-btn" onClick={onRetry}>
            <RotateCcw size={12} />
            Retry
          </button>
        )}
      </div>

      {/* Streaming progress indicator */}
      {isStreaming && <StreamingElapsed startTime={message.timestamp} />}

      {/* Action result display */}
      {!isUser && !isError && !isStreaming && message.action && (
        <ActionResult action={message.action} onNoteClick={onNoteClick} />
      )}

      {/* Confidence warning for low-confidence responses */}
      {confidenceWarning && (
        <div className={cn('confidence-warning', confidenceWarning.severe && 'severe')}>
          <AlertTriangle size={14} />
          <span>{confidenceWarning.message}</span>
        </div>
      )}

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

      {/* Suggested follow-up questions */}
      {isLastMessage && !isUser && !isError && !isStreaming && suggestedQuestions && suggestedQuestions.length > 0 && onSuggestedQuestion && (
        <div className="suggested-questions">
          {suggestedQuestions.slice(0, 3).map((question, idx) => (
            <button
              key={idx}
              className="suggestion-chip"
              onClick={() => onSuggestedQuestion(question)}
            >
              {question}
            </button>
          ))}
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



