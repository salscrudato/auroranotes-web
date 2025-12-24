/**
 * useTags hook - TanStack Query wrapper for tags operations
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import { listTags, ApiRequestError } from '../lib/api';
import { useState, useEffect } from 'react';

/**
 * Hook for fetching user's tags
 * Includes background polling for real-time updates
 */
export function useTags() {
  const [useLocalFallback, setUseLocalFallback] = useState(false);

  const query = useQuery({
    queryKey: queryKeys.tags.list(),
    queryFn: async ({ signal }) => {
      const response = await listTags(signal);
      return response.tags;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    // Tags change less frequently, poll every 2 minutes
    refetchInterval: 2 * 60 * 1000,
    refetchIntervalInBackground: false,
  });

  // Switch to empty fallback on persistent errors (endpoint not available)
  useEffect(() => {
    if (query.isError && query.error instanceof ApiRequestError) {
      if (query.error.status === 0 || query.error.status === 404) {
        setUseLocalFallback(true);
      }
    }
  }, [query.isError, query.error]);

  return {
    tags: useLocalFallback ? [] : (query.data || []),
    isLoading: query.isLoading && !useLocalFallback,
    isError: query.isError && !useLocalFallback,
    error: query.error,
    useLocalFallback,
  };
}

/**
 * Extract tags from notes locally as a fallback
 */
export function extractTagsFromNotes(notes: Array<{ tags?: string[] }>): Array<{ name: string; count: number }> {
  const tagCounts = new Map<string, number>();
  
  for (const note of notes) {
    if (note.tags) {
      for (const tag of note.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }
  }

  return Array.from(tagCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

