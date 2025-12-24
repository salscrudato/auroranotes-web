/**
 * useThreads hook - TanStack Query wrapper for thread operations
 * Handles chat thread persistence with localStorage fallback
 * Uses user-scoped storage to prevent cross-user data leakage
 */

import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import {
  listThreads,
  getThread,
  createThread,
  updateThread,
  deleteThread,
  ApiRequestError,
} from '../lib/api';
import type { ThreadDetail, ChatMessage } from '../lib/types';
import { useState, useCallback, useEffect } from 'react';
import { ScopedStorageKeys, getScopedItem, setScopedItem, getStorageUserId } from '../lib/scopedStorage';

// Local storage fallback for threads when API is unavailable
interface LocalThread {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

function loadLocalThreads(): LocalThread[] {
  // Only load if we have a user
  if (!getStorageUserId()) return [];
  try {
    return getScopedItem<LocalThread[]>(ScopedStorageKeys.chatHistoryThreads()) || [];
  } catch {
    return [];
  }
}

function saveLocalThreads(threads: LocalThread[]): void {
  // Only save if we have a user
  if (!getStorageUserId()) return;
  try {
    setScopedItem(ScopedStorageKeys.chatHistoryThreads(), threads);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Hook for thread list with pagination
 * Includes background polling for real-time updates
 */
export function useThreadsList() {
  const [useLocalFallback, setUseLocalFallback] = useState(false);
  const [localThreads, setLocalThreads] = useState<LocalThread[]>(() => loadLocalThreads());

  const query = useInfiniteQuery({
    queryKey: queryKeys.threads.all,
    queryFn: async ({ pageParam, signal }) => {
      const response = await listThreads(pageParam as string | undefined, 20, signal);
      return response;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.cursor ?? undefined : undefined,
    retry: 1,
    // Background polling every 60 seconds for real-time updates
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: false,
  });

  // Switch to local fallback on persistent errors
  useEffect(() => {
    if (query.isError && query.error instanceof ApiRequestError) {
      if (query.error.status === 0 || query.error.status === 404 || query.error.status === 503) {
        setUseLocalFallback(true);
      }
    }
  }, [query.isError, query.error]);

  // Refresh local threads when needed
  const refreshLocalThreads = useCallback(() => {
    setLocalThreads(loadLocalThreads());
  }, []);

  return {
    ...query,
    useLocalFallback,
    localThreads,
    refreshLocalThreads,
  };
}

/**
 * Hook for single thread detail
 */
export function useThread(threadId: string | null) {
  const [localThread, setLocalThread] = useState<LocalThread | null>(null);

  const query = useQuery({
    queryKey: queryKeys.threads.detail(threadId || ''),
    queryFn: async ({ signal }) => {
      if (!threadId) throw new Error('Thread ID required');
      return getThread(threadId, signal);
    },
    enabled: !!threadId && !threadId.startsWith('local-'),
    retry: 1,
  });

  // Handle local threads
  useEffect(() => {
    if (threadId?.startsWith('local-')) {
      const threads = loadLocalThreads();
      setLocalThread(threads.find(t => t.id === threadId) || null);
    } else {
      setLocalThread(null);
    }
  }, [threadId]);

  return {
    ...query,
    localThread,
    isLocal: threadId?.startsWith('local-'),
  };
}

/**
 * Hook for thread mutations
 */
export function useThreadMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createThread,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.threads.all });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => updateThread(id, title),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.threads.all });
      queryClient.setQueryData(queryKeys.threads.detail(data.id), (old: ThreadDetail | undefined) => 
        old ? { ...old, title: data.title } : undefined
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteThread,
    onSuccess: (_data, threadId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.threads.all });
      queryClient.removeQueries({ queryKey: queryKeys.threads.detail(threadId) });
    },
  });

  // Local thread operations
  const createLocalThread = useCallback((title?: string): LocalThread => {
    const thread: LocalThread = {
      id: `local-${Date.now()}`,
      title: title || 'New Chat',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    const threads = loadLocalThreads();
    saveLocalThreads([thread, ...threads]);
    return thread;
  }, []);

  const updateLocalThread = useCallback((id: string, updates: Partial<LocalThread>) => {
    const threads = loadLocalThreads();
    const idx = threads.findIndex(t => t.id === id);
    const existingThread = threads[idx];
    if (idx >= 0 && existingThread) {
      threads[idx] = { ...existingThread, ...updates, updatedAt: new Date().toISOString() };
      saveLocalThreads(threads);
    }
  }, []);

  const deleteLocalThread = useCallback((id: string) => {
    const threads = loadLocalThreads();
    saveLocalThreads(threads.filter(t => t.id !== id));
  }, []);

  return {
    createThread: createMutation,
    updateThread: updateMutation,
    deleteThread: deleteMutation,
    createLocalThread,
    updateLocalThread,
    deleteLocalThread,
  };
}

