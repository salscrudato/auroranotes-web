/**
 * React Query client configuration
 * Centralized query client with sensible defaults
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale after 1 minute
      staleTime: 60 * 1000,
      // Cache for 5 minutes
      gcTime: 5 * 60 * 1000,
      // Retry once on failure
      retry: 1,
      // Don't refetch on window focus by default
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Retry once on failure
      retry: 1,
    },
  },
});

// Query keys factory for type-safe, consistent query keys
export const queryKeys = {
  // Notes
  notes: {
    all: ['notes'] as const,
    list: (cursor?: string) => [...queryKeys.notes.all, 'list', cursor] as const,
    detail: (id: string) => [...queryKeys.notes.all, 'detail', id] as const,
    search: (query: string, filters?: Record<string, unknown>) => 
      [...queryKeys.notes.all, 'search', query, filters] as const,
  },
  
  // Threads
  threads: {
    all: ['threads'] as const,
    list: (cursor?: string) => [...queryKeys.threads.all, 'list', cursor] as const,
    detail: (id: string) => [...queryKeys.threads.all, 'detail', id] as const,
  },
  
  // Tags
  tags: {
    all: ['tags'] as const,
    list: () => [...queryKeys.tags.all, 'list'] as const,
  },
  
  // Saved views (local storage based)
  savedViews: {
    all: ['savedViews'] as const,
  },
  
  // Pinned notes (local storage based)
  pinnedNotes: {
    all: ['pinnedNotes'] as const,
  },
};

