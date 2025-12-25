/**
 * useChat hook
 * Manages chat state, message history, and API interactions
 * Supports both streaming and non-streaming modes
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { ChatMessage, Source, StreamSource, ContextSource } from '../lib/types';
import { sendChatMessage, sendChatMessageStreaming, ApiRequestError } from '../lib/api';
import { CHAT } from '../lib/constants';
import { ScopedStorageKeys, getScopedItem, setScopedItem, removeScopedItem, getStorageUserId } from '../lib/scopedStorage';

// Token buffering for performance - batch updates using requestAnimationFrame
const TOKEN_BUFFER_INTERVAL = 16; // ~60fps, matches rAF

export type ChatLoadingState = 'idle' | 'sending' | 'streaming' | 'error';

interface UseChatOptions {
  streaming?: boolean;
}

interface UseChatReturn {
  messages: ChatMessage[];
  loadingState: ChatLoadingState;
  activeSource: Source | null;
  setActiveSource: (source: Source | null) => void;
  sendMessage: (text: string) => Promise<void>;
  retryLastMessage: () => Promise<void>;
  clearChat: () => void;
  cancelStream: () => void;
  /** Follow-up question suggestions from the last response */
  followups: string[];
  /** Context sources retrieved but not cited */
  contextSources: ContextSource[];
}

/**
 * Generate a unique message ID
 */
function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Load chat history from user-scoped localStorage
 */
function loadChatHistory(): ChatMessage[] {
  // Only load if we have a user
  if (!getStorageUserId()) return [];
  try {
    const messages = getScopedItem<ChatMessage[]>(ScopedStorageKeys.chatHistory());
    if (messages) {
      // Limit to max history size
      return messages.slice(-CHAT.MAX_HISTORY_MESSAGES);
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

/**
 * Save chat history to user-scoped localStorage
 */
function saveChatHistory(messages: ChatMessage[]): void {
  // Only save if we have a user
  if (!getStorageUserId()) return;
  try {
    const toSave = messages.slice(-CHAT.MAX_HISTORY_MESSAGES);
    setScopedItem(ScopedStorageKeys.chatHistory(), toSave);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Convert StreamSource to Source by adding default relevance
 */
function streamSourceToSource(ss: StreamSource): Source {
  return {
    ...ss,
    relevance: 0, // Will be updated when done event arrives with full meta
  };
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  // Default to non-streaming mode for better compatibility
  const { streaming = false } = options;

  const [messages, setMessages] = useState<ChatMessage[]>(() => loadChatHistory());
  const [loadingState, setLoadingState] = useState<ChatLoadingState>('idle');
  const [activeSource, setActiveSource] = useState<Source | null>(null);
  const [followups, setFollowups] = useState<string[]>([]);
  const [contextSources, setContextSources] = useState<ContextSource[]>([]);

  // Ref to track the current stream controller
  const streamControllerRef = useRef<AbortController | null>(null);
  // Ref to track the current streaming message ID
  const streamingMessageIdRef = useRef<string | null>(null);

  // Token buffering for batched updates during streaming
  const tokenBufferRef = useRef<string>('');
  const tokenFlushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist messages to localStorage
  useEffect(() => {
    saveChatHistory(messages);
  }, [messages]);

  // Cancel any active stream
  const cancelStream = useCallback(() => {
    // Clear token buffer timer
    if (tokenFlushTimerRef.current) {
      clearTimeout(tokenFlushTimerRef.current);
      tokenFlushTimerRef.current = null;
    }
    // Flush any remaining buffered tokens
    const remainingTokens = tokenBufferRef.current;
    tokenBufferRef.current = '';

    if (streamControllerRef.current) {
      streamControllerRef.current.abort();
      streamControllerRef.current = null;
    }
    if (streamingMessageIdRef.current) {
      // Mark streaming message as complete with any remaining tokens
      setMessages(prev =>
        prev.map(m =>
          m.id === streamingMessageIdRef.current
            ? { ...m, content: m.content + remainingTokens, isStreaming: false }
            : m
        )
      );
      streamingMessageIdRef.current = null;
    }
    setLoadingState('idle');
  }, []);

  // Send a message (streaming or non-streaming)
  const sendMessage = useCallback(async (text: string) => {
    // Cancel any existing stream
    cancelStream();

    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    if (streaming) {
      // Streaming mode
      const assistantMessageId = generateMessageId();
      streamingMessageIdRef.current = assistantMessageId;

      // Add initial streaming message
      const initialMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
        sources: [],
      };
      setMessages(prev => [...prev, initialMessage]);
      setLoadingState('streaming');

      // Clear previous followups and context sources for new message
      setFollowups([]);
      setContextSources([]);

      try {
        const controller = await sendChatMessageStreaming(text, {
          onSources: (sources) => {
            // Update message with sources immediately
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantMessageId
                  ? { ...m, sources: sources.map(streamSourceToSource) }
                  : m
              )
            );
          },
          onContextSources: (sources) => {
            // Store context sources (retrieved but not cited)
            setContextSources(sources);
            // Also add to message for persistence
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantMessageId
                  ? { ...m, contextSources: sources }
                  : m
              )
            );
          },
          onToken: (token) => {
            // Buffer tokens and flush periodically for better performance
            // This reduces re-renders from potentially 100s/sec to ~60/sec
            tokenBufferRef.current += token;

            if (!tokenFlushTimerRef.current) {
              tokenFlushTimerRef.current = setTimeout(() => {
                const bufferedContent = tokenBufferRef.current;
                tokenBufferRef.current = '';
                tokenFlushTimerRef.current = null;

                if (bufferedContent) {
                  setMessages(prev =>
                    prev.map(m =>
                      m.id === assistantMessageId
                        ? { ...m, content: m.content + bufferedContent }
                        : m
                    )
                  );
                }
              }, TOKEN_BUFFER_INTERVAL);
            }
          },
          onDone: (meta) => {
            // Flush any remaining buffered tokens before finalizing
            if (tokenFlushTimerRef.current) {
              clearTimeout(tokenFlushTimerRef.current);
              tokenFlushTimerRef.current = null;
            }
            const remainingTokens = tokenBufferRef.current;
            tokenBufferRef.current = '';

            // Finalize message with meta and any remaining tokens
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantMessageId
                  ? { ...m, content: m.content + remainingTokens, meta, isStreaming: false }
                  : m
              )
            );
            streamingMessageIdRef.current = null;
            streamControllerRef.current = null;
            setLoadingState('idle');
          },
          onError: (error) => {
            // Update message to show error
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantMessageId
                  ? { ...m, content: error, isError: true, isStreaming: false }
                  : m
              )
            );
            streamingMessageIdRef.current = null;
            streamControllerRef.current = null;
            setLoadingState('error');
          },
          onFollowups: (suggestions) => {
            // Store follow-up question suggestions
            setFollowups(suggestions);
          },
          onHeartbeat: (_seq) => {
            // Heartbeat received - could update UI to show connection is alive
            // Currently a no-op, but useful for detecting stale connections
          },
        });

        streamControllerRef.current = controller;
      } catch (err) {
        const isApiError = err instanceof ApiRequestError;
        // Update the streaming message to show error
        setMessages(prev =>
          prev.map((m): ChatMessage => {
            if (m.id !== assistantMessageId) return m;
            const updated: ChatMessage = {
              ...m,
              content: isApiError ? err.getUserMessage() : 'Something went wrong. Please try again.',
              isError: true,
              isStreaming: false,
            };
            if (isApiError && err.status !== undefined) updated.errorCode = err.status;
            return updated;
          })
        );
        streamingMessageIdRef.current = null;
        setLoadingState('error');
      }
    } else {
      // Non-streaming mode
      setLoadingState('sending');

      try {
        const response = await sendChatMessage(text);

        const assistantMessage: ChatMessage = {
          id: generateMessageId(),
          role: 'assistant',
          content: response.answer,
          sources: response.sources,
          timestamp: new Date(),
          meta: response.meta,
        };
        if (response.contextSources) assistantMessage.contextSources = response.contextSources;
        if (response.meta?.action) assistantMessage.action = response.meta.action;

        setMessages(prev => [...prev, assistantMessage]);
        setLoadingState('idle');
      } catch (err) {
        const isApiError = err instanceof ApiRequestError;
        const errorMessage: ChatMessage = {
          id: generateMessageId(),
          role: 'assistant',
          content: isApiError ? err.getUserMessage() : 'Something went wrong. Please try again.',
          timestamp: new Date(),
          isError: true,
        };
        if (isApiError && err.status !== undefined) errorMessage.errorCode = err.status;

        setMessages(prev => [...prev, errorMessage]);
        setLoadingState('error');
      }
    }
  }, [streaming, cancelStream]);

  // Retry the last failed message
  const retryLastMessage = useCallback(async () => {
    // Find the last user message before the error
    let lastUserMessageIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg && msg.role === 'user') {
        lastUserMessageIndex = i;
        break;
      }
    }
    if (lastUserMessageIndex === -1) return;

    const lastUserMessage = messages[lastUserMessageIndex];
    if (!lastUserMessage) return;

    // Remove BOTH the error message AND the last user message
    // sendMessage will re-add the user message, avoiding duplicates
    setMessages(prev => prev.filter((m, idx) => !m.isError && idx !== lastUserMessageIndex));

    // Re-send using the existing sendMessage logic
    await sendMessage(lastUserMessage.content);
  }, [messages, sendMessage]);

  // Clear all messages
  const clearChat = useCallback(() => {
    cancelStream();
    setMessages([]);
    setActiveSource(null);
    setLoadingState('idle');
    setFollowups([]);
    setContextSources([]);
    removeScopedItem(ScopedStorageKeys.chatHistory());
  }, [cancelStream]);

  return {
    messages,
    loadingState,
    activeSource,
    setActiveSource,
    sendMessage,
    retryLastMessage,
    clearChat,
    cancelStream,
    followups,
    contextSources,
  };
}

