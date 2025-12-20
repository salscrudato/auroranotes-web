/**
 * ChatPanel component
 * RAG-powered chat with inline source references, streaming support, and feedback
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  ArrowUp,
  FileText,
  ListChecks,
  HelpCircle,
  CheckSquare,
  Trash2,
  Square,
} from 'lucide-react';
import type { ChatMessage as ChatMessageType, Source, FeedbackRating } from '../../lib/types';
import { useChat } from '../../hooks/useChat';
import { submitFeedback, ApiRequestError } from '../../lib/api';
import { useToast } from '../common/useToast';
import { ChatMessage, ChatMessageLoading } from './ChatMessage';
import { SourcesPanel } from './SourcesPanel';

interface ChatPanelProps {
  className?: string;
  onOpenNote?: (noteId: string, preview?: string) => void;
}

const MAX_MESSAGE_LENGTH = 2000;

const SUGGESTIONS = [
  { label: 'Summarize my notes', prompt: 'Summarize my recent notes from this week', Icon: FileText },
  { label: 'What decisions did I make?', prompt: 'What decisions did I make recently?', Icon: ListChecks },
  { label: 'Open questions', prompt: 'What are my open questions or unresolved items?', Icon: HelpCircle },
  { label: 'Find action items', prompt: 'List action items from my notes', Icon: CheckSquare },
];

export function ChatPanel({ className = '', onOpenNote }: ChatPanelProps) {
  const {
    messages,
    loadingState,
    sendMessage,
    retryLastMessage,
    clearChat,
    cancelStream,
  } = useChat({ streaming: true }); // Streaming SSE by default per API spec

  const [input, setInput] = useState('');
  const [showSources, setShowSources] = useState(false);
  const [activeSources, setActiveSources] = useState<Source[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [feedbackSent, setFeedbackSent] = useState<Set<string>>(new Set());
  const [rateLimitCountdown, setRateLimitCountdown] = useState<number | null>(null);
  // Feedback comment state for thumbs-down
  const [feedbackCommentFor, setFeedbackCommentFor] = useState<string | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { showToast } = useToast();

  const isLoading = loadingState === 'sending' || loadingState === 'streaming';

  // Cleanup countdown interval on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  // Start rate limit countdown
  const startRateLimitCountdown = useCallback((seconds: number) => {
    setRateLimitCountdown(seconds);

    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    countdownRef.current = setInterval(() => {
      setRateLimitCountdown(prev => {
        if (prev === null || prev <= 1) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Collect all sources from messages for sources panel
  useEffect(() => {
    const allSources: Source[] = [];
    const seen = new Set<string>();

    for (const msg of messages) {
      if (msg.sources) {
        for (const s of msg.sources) {
          if (!seen.has(s.id)) {
            seen.add(s.id);
            allSources.push(s);
          }
        }
      }
    }

    setActiveSources(allSources);
  }, [messages]);

  const handleSend = useCallback(async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || isLoading || rateLimitCountdown !== null) return;

    if (messageText.length > MAX_MESSAGE_LENGTH) {
      showToast(`Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters.`, 'error');
      return;
    }

    setInput('');

    try {
      await sendMessage(messageText);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.status === 429) {
          const retrySeconds = err.retryAfterSeconds || 30;
          startRateLimitCountdown(retrySeconds);
        }
        showToast(err.getUserMessage(), 'error');
      }
    } finally {
      inputRef.current?.focus();
    }
  }, [input, isLoading, rateLimitCountdown, showToast, sendMessage, startRateLimitCountdown]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleSuggestionClick = useCallback((prompt: string) => {
    handleSend(prompt);
  }, [handleSend]);

  const handleSourceClick = useCallback((source: Source) => {
    setSelectedSourceId(source.id);
    setShowSources(true);
  }, []);

  const handleOpenNote = useCallback((noteId: string, preview?: string) => {
    onOpenNote?.(noteId, preview);
    setShowSources(false);
  }, [onOpenNote]);

  const handleRetry = useCallback(async () => {
    await retryLastMessage();
  }, [retryLastMessage]);

  const handleFeedback = useCallback(async (message: ChatMessageType, rating: FeedbackRating, comment?: string) => {
    const requestId = message.meta?.requestId;
    if (!requestId) {
      showToast('Cannot submit feedback: missing request ID', 'error');
      return;
    }

    // Check if already submitted
    if (feedbackSent.has(requestId)) {
      showToast('Feedback already submitted', 'info');
      return;
    }

    // For thumbs-down, show comment input first (unless already submitting with comment)
    if (rating === 'down' && !comment && feedbackCommentFor !== requestId) {
      setFeedbackCommentFor(requestId);
      setFeedbackComment('');
      return;
    }

    setFeedbackSubmitting(true);
    try {
      await submitFeedback(requestId, rating, comment?.trim() || undefined);
      setFeedbackSent(prev => new Set(prev).add(requestId));
      setFeedbackCommentFor(null);
      setFeedbackComment('');
      showToast(rating === 'up' ? 'Thanks for the feedback!' : 'Thanks, we\'ll improve', 'success');
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.getUserMessage() : 'Failed to submit feedback';
      showToast(msg, 'error');
    } finally {
      setFeedbackSubmitting(false);
    }
  }, [feedbackSent, feedbackCommentFor, showToast]);

  const handleCancelFeedbackComment = useCallback(() => {
    setFeedbackCommentFor(null);
    setFeedbackComment('');
  }, []);

  const handleCancelStream = useCallback(() => {
    cancelStream();
  }, [cancelStream]);

  const handleClearChat = useCallback(() => {
    clearChat();
    setFeedbackSent(new Set());
    setShowSources(false);
    setSelectedSourceId(null);
  }, [clearChat]);

  const hasSources = activeSources.length > 0;

  return (
    <div className={`panel ${className}`}>
      <div className="panel-header">
        <h2>
          <Sparkles size={16} />
          Ask Aurora
        </h2>
        <div className="header-actions-row">
          {hasSources && (
            <button
              className={`btn btn-sm ${showSources ? 'btn-ai' : 'btn-ghost'}`}
              onClick={() => setShowSources(!showSources)}
              aria-label={showSources ? 'Hide sources' : 'Show sources'}
            >
              <BookOpen size={14} />
              {activeSources.length} sources
            </button>
          )}
          {messages.length > 0 && (
            <button
              className="btn btn-sm btn-ghost"
              onClick={handleClearChat}
              aria-label="Clear chat"
              title="Clear chat history"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="panel-body chat-panel-body">
        <div className="chat-container">
          {/* Suggestion Chips */}
          {messages.length === 0 && (
            <div className="chat-suggestions stagger-children">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion.prompt}
                  className="suggestion-chip"
                  onClick={() => handleSuggestionClick(suggestion.prompt)}
                  disabled={isLoading}
                >
                  <suggestion.Icon size={15} className="suggestion-icon" />
                  <span>{suggestion.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Messages Area */}
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="chat-empty">
                <div className="chat-empty-icon">
                  <Sparkles size={28} />
                </div>
                <h3>Your AI-powered memory</h3>
                <p>
                  Ask questions and get instant answers with sources from your notes.
                </p>
              </div>
            ) : (
              messages.map((message, idx) => {
                const requestId = message.meta?.requestId;
                const showFeedback = message.role === 'assistant' && !message.isError && !message.isStreaming && requestId;
                const feedbackState = showFeedback ? {
                  hasSent: feedbackSent.has(requestId),
                  isCommentMode: feedbackCommentFor === requestId,
                  comment: feedbackComment,
                  isSubmitting: feedbackSubmitting,
                } : undefined;

                return (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    onSourceClick={handleSourceClick}
                    activeSourceId={selectedSourceId}
                    onRetry={message.isError && idx === messages.length - 1 ? handleRetry : undefined}
                    feedbackState={feedbackState}
                    onFeedback={showFeedback ? (rating, comment) => handleFeedback(message, rating, comment) : undefined}
                    onFeedbackCommentChange={showFeedback ? setFeedbackComment : undefined}
                    onCancelFeedback={showFeedback ? handleCancelFeedbackComment : undefined}
                  />
                );
              })
            )}
            {loadingState === 'sending' && <ChatMessageLoading />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="chat-input-area">
            {rateLimitCountdown !== null && (
              <div className="rate-limit-notice">
                Rate limited. Try again in {rateLimitCountdown}s
              </div>
            )}
            <div className="chat-input-row">
              <input
                ref={inputRef}
                type="text"
                className={`chat-input ${input.trim().length > MAX_MESSAGE_LENGTH ? 'input-error' : ''}`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={rateLimitCountdown !== null ? `Wait ${rateLimitCountdown}s...` : 'Ask a question...'}
                aria-label="Chat input"
                disabled={isLoading || rateLimitCountdown !== null}
                maxLength={MAX_MESSAGE_LENGTH + 100}
              />
              {loadingState === 'streaming' ? (
                <button
                  className="btn btn-ghost btn-icon"
                  onClick={handleCancelStream}
                  aria-label="Stop generating"
                  title="Stop generating"
                >
                  <Square size={16} />
                </button>
              ) : (
                <button
                  className="btn btn-primary btn-icon"
                  onClick={() => handleSend()}
                  disabled={!input.trim() || input.trim().length > MAX_MESSAGE_LENGTH || isLoading || rateLimitCountdown !== null}
                  aria-label="Send message"
                >
                  {loadingState === 'sending' ? <span className="spinner" /> : <ArrowUp size={18} />}
                </button>
              )}
            </div>
            {input.trim().length > 0 && (
              <div className={`chat-char-count ${input.trim().length > MAX_MESSAGE_LENGTH ? 'over-limit' : ''}`}>
                {input.trim().length.toLocaleString()} / {MAX_MESSAGE_LENGTH.toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {/* Sources Panel */}
        {showSources && (
          <SourcesPanel
            sources={activeSources}
            selectedSourceId={selectedSourceId}
            onSelectSource={setSelectedSourceId}
            onOpenNote={handleOpenNote}
            onClose={() => setShowSources(false)}
          />
        )}
      </div>
    </div>
  );
}

