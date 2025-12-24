/**
 * useNotes hook - TanStack Query wrapper for notes operations
 * Provides paginated notes, optimistic updates, and mutations
 */

import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import {
  listNotes,
  getNote,
  createNote,
  createNoteWithMetadata,
  updateNote,
  updateNoteWithMetadata,
  deleteNote,
} from '../lib/api';
import { normalizeNote } from '../lib/format';
import type { Note } from '../lib/types';

/**
 * Hook for paginated notes list with infinite scroll
 */
export function useNotesInfinite(pageSize = 50) {
  return useInfiniteQuery({
    queryKey: queryKeys.notes.all,
    queryFn: async ({ pageParam, signal }) => {
      const response = await listNotes(pageParam as string | undefined, pageSize, signal);
      return {
        notes: response.notes.map(normalizeNote),
        cursor: response.cursor,
        hasMore: response.hasMore,
      };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => 
      lastPage.hasMore ? lastPage.cursor ?? undefined : undefined,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook for single note detail
 */
export function useNote(noteId: string | null) {
  return useQuery({
    queryKey: queryKeys.notes.detail(noteId || ''),
    queryFn: async ({ signal }) => {
      if (!noteId) throw new Error('Note ID required');
      const raw = await getNote(noteId, signal);
      return normalizeNote(raw);
    },
    enabled: !!noteId,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook for creating notes with optimistic updates
 */
export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { text: string; title?: string; tags?: string[] }) => {
      if (data.title || data.tags) {
        return createNoteWithMetadata(data);
      }
      return createNote(data.text);
    },
    onMutate: async (newNote) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.notes.all });

      // Snapshot previous value
      const previousNotes = queryClient.getQueryData(queryKeys.notes.all);

      // Optimistically add note to cache
      const optimisticNote: Note = {
        id: `temp-${Date.now()}`,
        text: newNote.text,
        tenantId: 'public',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      if (newNote.title !== undefined) optimisticNote.title = newNote.title;
      if (newNote.tags !== undefined) optimisticNote.tags = newNote.tags;

      queryClient.setQueryData(queryKeys.notes.all, (old: unknown) => {
        if (!old) return { pages: [{ notes: [optimisticNote], hasMore: false, cursor: null }], pageParams: [undefined] };
        const typed = old as { pages: { notes: Note[] }[]; pageParams: unknown[] };
        return {
          ...typed,
          pages: typed.pages.map((page, i) => 
            i === 0 ? { ...page, notes: [optimisticNote, ...page.notes] } : page
          ),
        };
      });

      return { previousNotes, optimisticId: optimisticNote.id };
    },
    onError: (_err, _newNote, context) => {
      // Rollback on error
      if (context?.previousNotes) {
        queryClient.setQueryData(queryKeys.notes.all, context.previousNotes);
      }
    },
    onSuccess: (data, _variables, context) => {
      // Replace optimistic note with real note
      const realNote = normalizeNote(data);
      queryClient.setQueryData(queryKeys.notes.all, (old: unknown) => {
        if (!old) return old;
        const typed = old as { pages: { notes: Note[] }[]; pageParams: unknown[] };
        return {
          ...typed,
          pages: typed.pages.map((page) => ({
            ...page,
            notes: page.notes.map((n) => 
              n.id === context?.optimisticId ? realNote : n
            ),
          })),
        };
      });
    },
  });
}

/**
 * Hook for updating notes
 */
export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; text?: string; title?: string; tags?: string[] }) => {
      if (data.title !== undefined || data.tags !== undefined) {
        return updateNoteWithMetadata(id, data);
      }
      if (!data.text) throw new Error('Text required');
      return updateNote(id, data.text);
    },
    onSuccess: (data) => {
      const updatedNote = normalizeNote(data);
      // Update note in list cache
      queryClient.setQueryData(queryKeys.notes.all, (old: unknown) => {
        if (!old) return old;
        const typed = old as { pages: { notes: Note[] }[]; pageParams: unknown[] };
        return {
          ...typed,
          pages: typed.pages.map((page) => ({
            ...page,
            notes: page.notes.map((n) => n.id === updatedNote.id ? updatedNote : n),
          })),
        };
      });
      // Update detail cache
      queryClient.setQueryData(queryKeys.notes.detail(updatedNote.id), updatedNote);
    },
  });
}

/**
 * Hook for deleting notes with optimistic updates
 */
export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteId: string) => deleteNote(noteId),
    onMutate: async (noteId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notes.all });
      const previousNotes = queryClient.getQueryData(queryKeys.notes.all);

      queryClient.setQueryData(queryKeys.notes.all, (old: unknown) => {
        if (!old) return old;
        const typed = old as { pages: { notes: Note[] }[]; pageParams: unknown[] };
        return {
          ...typed,
          pages: typed.pages.map((page) => ({
            ...page,
            notes: page.notes.filter((n) => n.id !== noteId),
          })),
        };
      });

      return { previousNotes };
    },
    onError: (_err, _noteId, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData(queryKeys.notes.all, context.previousNotes);
      }
    },
    onSuccess: (_data, noteId) => {
      queryClient.removeQueries({ queryKey: queryKeys.notes.detail(noteId) });
    },
  });
}

