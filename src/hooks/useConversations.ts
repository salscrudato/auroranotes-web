/**
 * useConversations hook
 * Manage multiple chat conversations with local storage persistence
 */

import { useState, useCallback, useEffect } from 'react';
import { nanoid } from 'nanoid';
import type { Conversation, ChatMessage } from '../lib/types';

const STORAGE_KEY = 'aurora_conversations';
const MAX_CONVERSATIONS = 50;

function loadConversations(): Conversation[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const convs = JSON.parse(stored) as Conversation[];
      // Sort by updatedAt descending
      return convs.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    }
  } catch (err) {
    console.error('Failed to load conversations:', err);
  }
  return [];
}

function saveConversations(conversations: Conversation[]): void {
  try {
    // Limit to max conversations
    const toSave = conversations.slice(0, MAX_CONVERSATIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (err) {
    console.error('Failed to save conversations:', err);
  }
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => {
    const convs = loadConversations();
    const first = convs[0];
    return first ? first.id : null;
  });

  // Persist on change
  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  // Get active conversation
  const activeConversation = conversations.find(c => c.id === activeConversationId) || null;

  // Create new conversation
  const createConversation = useCallback((title?: string): Conversation => {
    const now = new Date().toISOString();
    const conv: Conversation = {
      id: nanoid(),
      title: title ?? 'New conversation',
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
    setConversations(prev => [conv, ...prev]);
    setActiveConversationId(conv.id);
    return conv;
  }, []);

  // Update conversation messages
  const updateConversationMessages = useCallback((id: string, messages: ChatMessage[]) => {
    setConversations(prev => prev.map(c => 
      c.id === id 
        ? { ...c, messages, updatedAt: new Date().toISOString() }
        : c
    ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
  }, []);

  // Rename conversation
  const renameConversation = useCallback((id: string, title: string) => {
    setConversations(prev => prev.map(c => 
      c.id === id 
        ? { ...c, title, updatedAt: new Date().toISOString() }
        : c
    ));
  }, []);

  // Delete conversation
  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => {
      const filtered = prev.filter(c => c.id !== id);
      // If we deleted the active one, switch to the next
      if (id === activeConversationId) {
        setActiveConversationId(filtered[0]?.id || null);
      }
      return filtered;
    });
  }, [activeConversationId]);

  // Select conversation
  const selectConversation = useCallback((conv: Conversation) => {
    setActiveConversationId(conv.id);
  }, []);

  // Start new conversation (clears active and creates new)
  const startNewConversation = useCallback(() => {
    createConversation();
  }, [createConversation]);

  return {
    conversations,
    activeConversation,
    activeConversationId,
    createConversation,
    updateConversationMessages,
    renameConversation,
    deleteConversation,
    selectConversation,
    startNewConversation,
  };
}

