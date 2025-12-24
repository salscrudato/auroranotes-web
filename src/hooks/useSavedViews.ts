/**
 * useSavedViews hook - Local storage-based saved views
 * Ready for backend persistence when available
 * Uses user-scoped storage to prevent cross-user data leakage
 */

import { useState, useCallback, useEffect } from 'react';
import type { SavedView } from '../lib/types';
import { ScopedStorageKeys, getScopedItem, setScopedItem, getStorageUserId } from '../lib/scopedStorage';

function loadSavedViews(): SavedView[] {
  if (!getStorageUserId()) return [];
  try {
    return getScopedItem<SavedView[]>(ScopedStorageKeys.savedViews()) || [];
  } catch {
    return [];
  }
}

function persistSavedViews(views: SavedView[]): void {
  if (!getStorageUserId()) return;
  try {
    setScopedItem(ScopedStorageKeys.savedViews(), views);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Hook for managing saved filter views
 */
export function useSavedViews() {
  const [views, setViews] = useState<SavedView[]>(() => loadSavedViews());

  // Persist on change
  useEffect(() => {
    persistSavedViews(views);
  }, [views]);

  const createView = useCallback((name: string, filters: SavedView['filters']): SavedView => {
    const view: SavedView = {
      id: `view-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      filters,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setViews(prev => [view, ...prev]);
    return view;
  }, []);

  const updateView = useCallback((id: string, updates: Partial<Pick<SavedView, 'name' | 'filters'>>) => {
    setViews(prev => prev.map(v => 
      v.id === id 
        ? { ...v, ...updates, updatedAt: new Date().toISOString() } 
        : v
    ));
  }, []);

  const deleteView = useCallback((id: string) => {
    setViews(prev => prev.filter(v => v.id !== id));
  }, []);

  const getView = useCallback((id: string): SavedView | undefined => {
    return views.find(v => v.id === id);
  }, [views]);

  return {
    views,
    createView,
    updateView,
    deleteView,
    getView,
  };
}

