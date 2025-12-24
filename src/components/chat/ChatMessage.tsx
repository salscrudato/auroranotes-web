import { memo, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { BookOpen, AlertCircle, AlertTriangle, RotateCcw, Copy, ThumbsUp, ThumbsDown, Send, X } from 'lucide-react';
import type { ChatMessage as ChatMessageType, Source, FeedbackRating, ConfidenceLevel } from '@/lib/types';
import { parseSources, getReferencedSources } from '@/lib/citations';
import { formatRelativeTime } from '@/lib/format';
import { copyToClipboard, cn } from '@/lib/utils';
import { useToast } from '@/components/common/useToast';
import { useAnnounce } from '@/components/common/LiveRegion';
import { SourceRefChip, SourceBadge } from './CitationChip';
import { ChatMarkdown } from './ChatMarkdown';
import { ActionResult } from './ActionResult';

function StreamingElapsed({ startTime }: { startTime: Date }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  if (elapsed < 3) return null;

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `${seconds}s`;

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

const CONFIDENCE_WARNINGS: Record<string, { message: string; severe: boolean }> = {
  low: { message: 'This response may be less accurate. Consider verifying with your notes.', severe: false },
  none: { message: 'No relevant notes found. This response is based on general knowledge.', severe: true },
};

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
  suggestedQuestions?: string[];
  onSuggestedQuestion?: (question: string) => void;
  isLastMessage?: boolean;
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
  const { role, content, sources, contextSources, isError, isStreaming, meta, errorCode, action, timestamp } = message;
  const isUser = role === 'user';
  const segments = parseSources(content, sources);
  const isAssistantReady = !isUser && !isError && !isStreaming;

  useEffect(() => {
    if (wasStreamingRef.current && !isStreaming && !isUser && !isError) {
      const count = sources?.length || 0;
      announce(count > 0 ? `Response complete with ${count} source${count === 1 ? '' : 's'}` : 'Response complete');
    }
    wasStreamingRef.current = isStreaming || false;
  }, [isStreaming, isUser, isError, sources?.length, announce]);

  const referencedSources = useMemo(() => getReferencedSources(content, sources), [content, sources]);

  const citedSources = useMemo(() => {
    const citedIds = new Set(referencedSources.map(s => s.noteId));
    return {
      cited: referencedSources,
      context: (contextSources || []).filter(s => !citedIds.has(s.noteId)),
    };
  }, [referencedSources, contextSources]);

  const showRetry = isError && onRetry && (errorCode === 503 || (errorCode && errorCode >= 500));
  const confidenceWarning = useMemo(() => {
    const level = meta?.confidence;
    return level && CONFIDENCE_WARNINGS[level] ? { level: level as ConfidenceLevel, ...CONFIDENCE_WARNINGS[level] } : null;
  }, [meta?.confidence]);

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(content);
    showToast(success ? 'Copied' : 'Failed to copy', success ? 'success' : 'error');
  }, [content, showToast]);

  const renderFeedback = () => {
    if (!feedbackState || !onFeedback) return null;
    if (feedbackState.hasSent) return <span className="feedback-thanks">Thanks!</span>;
    if (feedbackState.isCommentMode) {
      return (
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
              if (e.key === 'Enter') { e.preventDefault(); onFeedback('down', feedbackState.comment); }
              else if (e.key === 'Escape') onCancelFeedback?.();
            }}
          />
          <button className="btn btn-icon btn-ghost btn-sm" onClick={() => onFeedback('down', feedbackState.comment)} disabled={feedbackState.isSubmitting} aria-label="Submit feedback">
            {feedbackState.isSubmitting ? <span className="spinner" /> : <Send size={14} />}
          </button>
          <button className="btn btn-icon btn-ghost btn-sm" onClick={onCancelFeedback} disabled={feedbackState.isSubmitting} aria-label="Cancel">
            <X size={14} />
          </button>
        </div>
      );
    }
    return (
      <>
        <button className="btn btn-icon btn-ghost btn-sm feedback-btn" onClick={() => onFeedback('up')} aria-label="Good response" title="Good response">
          <ThumbsUp size={14} />
        </button>
        <button className="btn btn-icon btn-ghost btn-sm feedback-btn" onClick={() => onFeedback('down')} aria-label="Poor response" title="Poor response">
          <ThumbsDown size={14} />
        </button>
      </>
    );
  };

  return (
    <div className={cn('chat-message', isUser ? 'user' : 'assistant', isStreaming && 'streaming')}>
      <div className={cn('chat-bubble', isError && 'chat-bubble-error')} aria-busy={isStreaming}>
        {isError && <AlertCircle size={14} className="error-icon" />}
        {isUser || isError ? (
          segments.map((segment, i) =>
            segment.type === 'source' && segment.source
              ? <SourceRefChip key={`${segment.source.id}-${i}`} source={segment.source} onClick={onSourceClick} />
              : <span key={i}>{segment.content}</span>
          )
        ) : (
          <ChatMarkdown content={content} {...(sources && { sources })} onSourceClick={onSourceClick} />
        )}
        {isStreaming && <span className="streaming-cursor" />}
        {showRetry && (
          <button className="btn btn-sm btn-ghost retry-btn" onClick={onRetry}>
            <RotateCcw size={12} /> Retry
          </button>
        )}
      </div>

      {isStreaming && <StreamingElapsed startTime={timestamp} />}
      {isAssistantReady && action && <ActionResult action={action} {...(onNoteClick && { onNoteClick })} />}

      {isAssistantReady && confidenceWarning && (
        <div className={cn('confidence-warning', confidenceWarning.severe && 'severe')}>
          <AlertTriangle size={14} />
          <span>{confidenceWarning.message}</span>
        </div>
      )}

      {isAssistantReady && (
        <div className="chat-message-footer">
          <div className="chat-footer-sources">
            {citedSources.cited.length > 0 && (
              <>
                <span className="sources-label"><BookOpen size={14} /> Cited:</span>
                <div className="sources-chips">
                  {citedSources.cited.map((source) => (
                    <SourceBadge key={source.id} id={source.id} onClick={() => onSourceClick(source)} isActive={source.id === activeSourceId} />
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="chat-footer-feedback">{renderFeedback()}</div>
        </div>
      )}

      {showTimestamp && !isStreaming && (
        <div className="chat-message-meta">
          <span className="chat-timestamp">{formatRelativeTime(timestamp)}</span>
          {isAssistantReady && (
            <button className="btn btn-icon btn-ghost btn-sm chat-copy-btn" onClick={handleCopy} title="Copy message" aria-label="Copy message">
              <Copy size={12} />
            </button>
          )}
        </div>
      )}

      {isLastMessage && isAssistantReady && suggestedQuestions?.length && onSuggestedQuestion && (
        <div className="suggested-questions">
          {suggestedQuestions.slice(0, 3).map((question, idx) => (
            <button key={idx} className="suggestion-chip" onClick={() => onSuggestedQuestion(question)}>{question}</button>
          ))}
        </div>
      )}
    </div>
  );
});

export function ChatMessageLoading() {
  return (
    <div className="chat-message assistant animate-fade-in">
      <div className="chat-bubble chat-bubble-loading">
        <div className="ai-typing"><span /><span /><span /></div>
        <span className="text-muted">Searching your notes...</span>
      </div>
    </div>
  );
}
