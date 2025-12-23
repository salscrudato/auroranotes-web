/**
 * useChat hook
 * Manages chat state, message history, and API interactions
 * Supports both streaming and non-streaming modes
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { ChatMessage, Source, StreamSource, ContextSource } from '../lib/types';
import { sendChatMessage, sendChatMessageStreaming, ApiRequestError } from '../lib/api';
import { CHAT, STORAGE_KEYS } from '../lib/constants';

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
 * Load chat history from localStorage
 */
function loadChatHistory(): ChatMessage[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
    if (stored) {
      const messages = JSON.parse(stored) as ChatMessage[];
      // Limit to max history size
      return messages.slice(-CHAT.MAX_HISTORY_MESSAGES);
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

/**
 * Save chat history to localStorage
 */
function saveChatHistory(messages: ChatMessage[]): void {
  try {
    const toSave = messages.slice(-CHAT.MAX_HISTORY_MESSAGES);
    localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(toSave));
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

  // Persist messages to localStorage
  useEffect(() => {
    saveChatHistory(messages);
  }, [messages]);

  // Cancel any active stream
  const cancelStream = useCallback(() => {
    if (streamControllerRef.current) {
      streamControllerRef.current.abort();
      streamControllerRef.current = null;
    }
    if (streamingMessageIdRef.current) {
      // Mark streaming message as complete
      setMessages(prev =>
        prev.map(m =>
          m.id === streamingMessageIdRef.current ? { ...m, isStreaming: false } : m
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
            // Append token to content
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantMessageId
                  ? { ...m, content: m.content + token }
                  : m
              )
            );
          },
          onDone: (meta) => {
            // Finalize message with meta
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantMessageId
                  ? { ...m, meta, isStreaming: false }
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
          prev.map(m =>
            m.id === assistantMessageId
              ? {
                  ...m,
                  content: isApiError ? err.getUserMessage() : 'Something went wrong. Please try again.',
                  isError: true,
                  isStreaming: false,
                  errorCode: isApiError ? err.status : undefined,
                }
              : m
          )
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
          contextSources: response.contextSources,
          timestamp: new Date(),
          meta: response.meta,
          action: response.meta?.action,  // Include action metadata if present
        };

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
          errorCode: isApiError ? err.status : undefined,
        };

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
      if (messages[i].role === 'user') {
        lastUserMessageIndex = i;
        break;
      }
    }
    if (lastUserMessageIndex === -1) return;

    const lastUserMessage = messages[lastUserMessageIndex];

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
    localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
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

