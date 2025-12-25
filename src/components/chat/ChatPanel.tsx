import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { ArrowUp, Square, Clock, Sparkles, Mic } from 'lucide-react';
import type { ChatMessage as ChatMessageType, Source, FeedbackRating } from '@/lib/types';
import { useChat } from '@/hooks/useChat';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { submitFeedback, ApiRequestError } from '@/lib/api';
import { useToast } from '@/components/common/useToast';
import { ChatMessage, ChatMessageLoading } from './ChatMessage';
import { SourcesPanel } from './SourcesPanel';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

interface ChatPanelProps {
  className?: string;
  onOpenNote?: (noteId: string, preview?: string) => void;
}

const MAX_MESSAGE_LENGTH = 2000;

export const ChatPanel = memo(function ChatPanel({ className = '', onOpenNote }: ChatPanelProps) {
  const { messages, loadingState, sendMessage, retryLastMessage, clearChat, cancelStream } = useChat({ streaming: true });
  const { showToast } = useToast();

  const [input, setInput] = useState('');
  const [showSources, setShowSources] = useState(false);
  const [activeSources, setActiveSources] = useState<Source[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [feedbackSent, setFeedbackSent] = useState<Set<string>>(new Set());
  const [rateLimitCountdown, setRateLimitCountdown] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [feedbackCommentFor, setFeedbackCommentFor] = useState<string | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isLoading = loadingState === 'sending' || loadingState === 'streaming';

  const {
    state: recordingState,
    isSupported: isSpeechSupported,
    startRecording,
    stopRecording,
    cancelRecording,
    transcript: voiceTranscript,
  } = useSpeechToText({
    onError: useCallback((msg: string) => showToast(msg, 'error'), [showToast]),
    autoEnhance: false,
  });

  const isRecording = recordingState === 'recording';

  useEffect(() => {
    if (recordingState === 'preview' && voiceTranscript.trim()) {
      setInput(voiceTranscript.trim());
      cancelRecording();
      inputRef.current?.focus();
    }
  }, [recordingState, voiceTranscript, cancelRecording]);

  const handleMicClick = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  useEffect(() => () => { if (countdownRef.current) clearInterval(countdownRef.current); }, []);

  const startRateLimitCountdown = useCallback((seconds: number) => {
    setRateLimitCountdown(seconds);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setRateLimitCountdown(prev => {
        if (prev === null || prev <= 1) {
          if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    const seen = new Set<string>();
    const sources = messages.flatMap(m => m.sources || []).filter(s => !seen.has(s.id) && seen.add(s.id));
    setActiveSources(sources);
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
        if (err.status === 429) startRateLimitCountdown(err.retryAfterSeconds || 30);
        showToast(err.getUserMessage(), 'error');
      }
    } finally {
      inputRef.current?.focus();
    }
  }, [input, isLoading, rateLimitCountdown, showToast, sendMessage, startRateLimitCountdown]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
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
    setIsCancelling(true);
    cancelStream();
    // Brief visual feedback then reset
    setTimeout(() => setIsCancelling(false), 300);
  }, [cancelStream]);

  const handleClearChat = useCallback(() => {
    clearChat();
    setFeedbackSent(new Set());
    setShowSources(false);
    setSelectedSourceId(null);
  }, [clearChat]);

  return (
    <div className={`panel panel-chat ${className}`}>
      <div className="panel-body chat-panel-body">
        <div className="chat-container">
          {/* Messages Area */}
          <div
            ref={messagesContainerRef}
            className="chat-messages"
            role="log"
            aria-live="polite"
            aria-atomic="false"
            aria-relevant="additions"
          >
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
                const isLastMessage = idx === messages.length - 1;

                const feedbackStateProps = showFeedback ? {
                  feedbackState: {
                    hasSent: feedbackSent.has(requestId),
                    isCommentMode: feedbackCommentFor === requestId,
                    comment: feedbackComment,
                    isSubmitting: feedbackSubmitting,
                  },
                  onFeedback: (rating: FeedbackRating, comment?: string) => handleFeedback(message, rating, comment),
                  onFeedbackCommentChange: setFeedbackComment,
                  onCancelFeedback: handleCancelFeedbackComment,
                } : {};

                return (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    onSourceClick={handleSourceClick}
                    activeSourceId={selectedSourceId}
                    {...(message.isError && isLastMessage && { onRetry: handleRetry })}
                    {...feedbackStateProps}
                    isLastMessage={isLastMessage}
                    {...(onOpenNote && { onNoteClick: onOpenNote })}
                  />
                );
              })
            )}
            {loadingState === 'sending' && <ChatMessageLoading />}
            {messages.length > 0 && !isLoading && (
              <div className="chat-clear-container">
                <button
                  className="chat-clear-btn"
                  onClick={handleClearChat}
                  aria-label="Clear chat"
                >
                  Clear
                </button>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="chat-input-area">
            {rateLimitCountdown !== null && (
              <div className="rate-limit-notice" role="alert" aria-live="polite">
                <Clock size={14} aria-hidden="true" />
                <div className="rate-limit-content">
                  <strong>Slow down</strong>
                  <span>You're sending messages too quickly. Please wait {rateLimitCountdown}s</span>
                </div>
              </div>
            )}
            <div className={`chat-input-wrapper ${isRecording ? 'recording' : ''}`}>
              {/* Mic button - shown on left when speech is supported */}
              {isSpeechSupported && (
                <button
                  className={`chat-mic-btn ${isRecording ? 'recording' : ''}`}
                  onClick={handleMicClick}
                  disabled={isLoading || rateLimitCountdown !== null}
                  aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
                  title={isRecording ? 'Stop recording' : 'Voice input'}
                >
                  <Mic size={18} />
                </button>
              )}
              <input
                ref={inputRef}
                type="text"
                className={`chat-input ${input.trim().length > MAX_MESSAGE_LENGTH ? 'input-error' : ''} ${isSpeechSupported ? 'has-mic' : ''}`}
                value={isRecording ? voiceTranscript : input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isRecording
                    ? 'Listening...'
                    : rateLimitCountdown !== null
                    ? `Wait ${rateLimitCountdown}s...`
                    : 'Ask a question...'
                }
                aria-label="Chat input"
                aria-invalid={input.trim().length > MAX_MESSAGE_LENGTH}
                aria-describedby={input.trim().length > MAX_MESSAGE_LENGTH ? 'chat-input-error' : undefined}
                disabled={isLoading || rateLimitCountdown !== null || isRecording}
                maxLength={MAX_MESSAGE_LENGTH + 100}
              />
              {loadingState === 'streaming' || isCancelling ? (
                <button
                  className={`chat-send-btn ${isCancelling ? 'is-cancelling' : ''}`}
                  onClick={handleCancelStream}
                  disabled={isCancelling}
                  aria-label={isCancelling ? 'Cancelling...' : 'Stop generating'}
                  title={isCancelling ? 'Cancelling...' : 'Stop generating'}
                >
                  {isCancelling ? <span className="spinner-sm" /> : <Square size={16} />}
                </button>
              ) : (
                <button
                  className={`chat-send-btn ${input.trim() && input.trim().length <= MAX_MESSAGE_LENGTH ? 'active' : ''}`}
                  onClick={() => handleSend()}
                  disabled={!input.trim() || input.trim().length > MAX_MESSAGE_LENGTH || isLoading || rateLimitCountdown !== null || isRecording}
                  aria-label="Send message"
                >
                  {loadingState === 'sending' ? <span className="spinner-sm" /> : <ArrowUp size={18} strokeWidth={2.5} />}
                </button>
              )}
            </div>
            {input.trim().length > 0 && (
              <div
                id="chat-input-error"
                className={`chat-char-count ${input.trim().length > MAX_MESSAGE_LENGTH ? 'over-limit' : ''}`}
                role={input.trim().length > MAX_MESSAGE_LENGTH ? 'alert' : undefined}
              >
                {input.trim().length > MAX_MESSAGE_LENGTH
                  ? `Message too long: ${input.trim().length.toLocaleString()} / ${MAX_MESSAGE_LENGTH.toLocaleString()}`
                  : `${input.trim().length.toLocaleString()} / ${MAX_MESSAGE_LENGTH.toLocaleString()}`
                }
              </div>
            )}
          </div>
        </div>

        {/* Sources Panel */}
        {showSources && (
          <ErrorBoundary
            fallback={
              <div className="sources-panel sources-panel-error">
                <div className="sources-error-content">
                  <p className="text-muted">Unable to load sources</p>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => setShowSources(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            }
          >
            <SourcesPanel
              sources={activeSources}
              selectedSourceId={selectedSourceId}
              onSelectSource={setSelectedSourceId}
              onOpenNote={handleOpenNote}
              onClose={() => setShowSources(false)}
            />
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
});

