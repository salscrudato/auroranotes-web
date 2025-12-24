/**
 * useRealtimeSync - Firestore real-time listener for automatic updates
 *
 * Listens to Firestore collections and invalidates React Query cache
 * when changes are detected, enabling instant UI updates across devices.
 *
 * This hook provides true real-time sync without aggressive polling.
 */

import { useEffect, useRef } from 'react';
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  type Unsubscribe
} from 'firebase/firestore';
import { getFirebaseApp } from '../lib/firebase';
import { queryClient, queryKeys } from '../lib/queryClient';

// Debounce invalidations to prevent excessive refetches
const INVALIDATION_DEBOUNCE_MS = 500;

// Firestore collection names (matches backend structure)
// Backend uses flat collections with tenantId field for filtering
const COLLECTIONS = {
  notes: 'notes',
  threads: 'threads',
} as const;

/**
 * Hook that establishes Firestore real-time listeners for the current user.
 * When documents change in Firestore, React Query cache is invalidated
 * to trigger a refetch with fresh data.
 *
 * @param userId - The current user's UID (used as tenantId)
 * @param enabled - Whether to enable real-time sync (default: true)
 */
export function useRealtimeSync(userId: string | null, enabled = true) {
  const unsubscribesRef = useRef<Unsubscribe[]>([]);
  const debounceTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    // Don't subscribe if disabled or no user
    if (!enabled || !userId) {
      return;
    }

    let db;
    try {
      const app = getFirebaseApp();
      db = getFirestore(app);
    } catch (error) {
      console.warn('[RealtimeSync] Failed to initialize Firestore:', error);
      return;
    }

    /**
     * Debounced invalidation to prevent rapid-fire refetches
     * when multiple documents change in quick succession
     */
    const debouncedInvalidate = (key: string, queryKey: readonly unknown[]) => {
      const existing = debounceTimersRef.current.get(key);
      if (existing) {
        clearTimeout(existing);
      }

      const timer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey });
        debounceTimersRef.current.delete(key);
      }, INVALIDATION_DEBOUNCE_MS);

      debounceTimersRef.current.set(key, timer);
    };

    // Subscribe to notes collection (filtered by tenantId = userId)
    try {
      const notesRef = collection(db, COLLECTIONS.notes);
      // Filter by tenantId and order by updatedAt for recent changes
      const notesQuery = query(
        notesRef,
        where('tenantId', '==', userId),
        orderBy('updatedAt', 'desc'),
        limit(100)
      );

      const notesUnsubscribe = onSnapshot(
        notesQuery,
        { includeMetadataChanges: false },
        (snapshot) => {
          // Skip the initial snapshot (we already have data from API)
          if (!snapshot.metadata.fromCache && snapshot.docChanges().length > 0) {
            const hasRealChanges = snapshot.docChanges().some(
              change => change.type === 'added' || change.type === 'modified' || change.type === 'removed'
            );
            if (hasRealChanges) {
              debouncedInvalidate('notes', queryKeys.notes.all);
              // Also invalidate tags since they derive from notes
              debouncedInvalidate('tags', queryKeys.tags.all);
            }
          }
        },
        (error) => {
          // Silently handle permission errors (user might not have access)
          if (error.code !== 'permission-denied') {
            console.warn('[RealtimeSync] Notes listener error:', error.message);
          }
        }
      );
      unsubscribesRef.current.push(notesUnsubscribe);
    } catch (error) {
      console.warn('[RealtimeSync] Failed to subscribe to notes:', error);
    }

    // Subscribe to threads collection (filtered by tenantId = userId)
    try {
      const threadsRef = collection(db, COLLECTIONS.threads);
      const threadsQuery = query(
        threadsRef,
        where('tenantId', '==', userId),
        orderBy('updatedAt', 'desc'),
        limit(50)
      );

      const threadsUnsubscribe = onSnapshot(
        threadsQuery,
        { includeMetadataChanges: false },
        (snapshot) => {
          if (!snapshot.metadata.fromCache && snapshot.docChanges().length > 0) {
            const hasRealChanges = snapshot.docChanges().some(
              change => change.type === 'added' || change.type === 'modified' || change.type === 'removed'
            );
            if (hasRealChanges) {
              debouncedInvalidate('threads', queryKeys.threads.all);
            }
          }
        },
        (error) => {
          if (error.code !== 'permission-denied') {
            console.warn('[RealtimeSync] Threads listener error:', error.message);
          }
        }
      );
      unsubscribesRef.current.push(threadsUnsubscribe);
    } catch (error) {
      console.warn('[RealtimeSync] Failed to subscribe to threads:', error);
    }

    // Cleanup function
    return () => {
      // Unsubscribe from all listeners
      unsubscribesRef.current.forEach(unsub => unsub());
      unsubscribesRef.current = [];

      // Clear any pending debounce timers
      debounceTimersRef.current.forEach(timer => clearTimeout(timer));
      debounceTimersRef.current.clear();
    };
  }, [userId, enabled]);
}

