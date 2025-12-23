/**
 * ChatContext - Share chat state and actions across components
 * Enables global access to chat functionality from any component
 */

import { createContext, useContext, useCallback, type ReactNode } from 'react';
import type { ChatMessage, Conversation } from '../lib/types';
import { useConversations } from '../hooks/useConversations';

interface ChatContextValue {
  // Conversations
  conversations: Conversation[];
  activeConversation: Conversation | null;
  activeConversationId: string | null;
  selectConversation: (conv: Conversation) => void;
  startNewConversation: () => void;
  renameConversation: (id: string, title: string) => void;
  deleteConversation: (id: string) => void;
  updateConversationMessages: (id: string, messages: ChatMessage[]) => void;
  
  // Chat actions (to be wired up by consumer)
  sendMessage?: (text: string) => Promise<void>;
  clearChat?: () => void;
  
  // Note integration
  openNoteFromSource?: (noteId: string, preview?: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

interface ChatProviderProps {
  children: ReactNode;
  onOpenNote?: (noteId: string, preview?: string) => void;
}

export function ChatProvider({ children, onOpenNote }: ChatProviderProps) {
  const {
    conversations,
    activeConversation,
    activeConversationId,
    selectConversation,
    startNewConversation,
    renameConversation,
    deleteConversation,
    updateConversationMessages,
  } = useConversations();

  const openNoteFromSource = useCallback((noteId: string, preview?: string) => {
    onOpenNote?.(noteId, preview);
  }, [onOpenNote]);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        activeConversationId,
        selectConversation,
        startNewConversation,
        renameConversation,
        deleteConversation,
        updateConversationMessages,
        openNoteFromSource,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}

/** Hook to check if we're inside a ChatProvider */
export function useOptionalChatContext(): ChatContextValue | null {
  return useContext(ChatContext);
}

