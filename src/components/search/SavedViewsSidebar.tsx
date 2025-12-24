/**
 * Sidebar to manage and apply saved filter views.
 */

import { useState, useCallback, useMemo, memo } from 'react';
import { Bookmark, Plus, Trash2, Edit3, Check, X, Filter } from 'lucide-react';
import type { SavedView } from '../../lib/types';
import { cn } from '../../lib/utils';
import { useSavedViews } from '../../hooks/useSavedViews';

interface SavedViewsSidebarProps {
  activeViewId?: string;
  onApplyView: (view: SavedView) => void;
  onClearView: () => void;
  currentFilters?: SavedView['filters'];
  className?: string;
}

export const SavedViewsSidebar = memo(function SavedViewsSidebar({
  activeViewId,
  onApplyView,
  onClearView,
  currentFilters,
  className,
}: SavedViewsSidebarProps) {
  const { views, createView, updateView, deleteView } = useSavedViews();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newViewName, setNewViewName] = useState('');

  const handleCreate = useCallback(() => {
    if (!newViewName.trim() || !currentFilters) return;
    const view = createView(newViewName.trim(), currentFilters);
    setNewViewName('');
    setShowCreateForm(false);
    onApplyView(view);
  }, [newViewName, currentFilters, createView, onApplyView]);

  const handleStartEdit = useCallback((view: SavedView) => {
    setEditingId(view.id);
    setEditName(view.name);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingId || !editName.trim()) return;
    updateView(editingId, { name: editName.trim() });
    setEditingId(null);
    setEditName('');
  }, [editingId, editName, updateView]);

  const handleDelete = useCallback((id: string) => {
    deleteView(id);
    if (activeViewId === id) {
      onClearView();
    }
  }, [deleteView, activeViewId, onClearView]);

  const hasActiveFilters = useMemo(() => currentFilters && (
    currentFilters.tags?.length ||
    currentFilters.noteType ||
    currentFilters.dateRange?.start ||
    currentFilters.dateRange?.end ||
    currentFilters.searchQuery
  ), [currentFilters]);

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)]">
          <Bookmark size={14} />
          Saved Views
        </div>
        {hasActiveFilters && !showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="p-1 rounded hover:bg-[var(--color-surface-hover)] text-[var(--color-primary)]"
            title="Save current view"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="p-2 border-b border-[var(--color-border)] bg-[var(--color-surface-hover)]/50">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              placeholder="View name..."
              className="flex-1 px-2 py-1 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') setShowCreateForm(false);
              }}
            />
            <button
              onClick={handleCreate}
              disabled={!newViewName.trim()}
              className="p-1 rounded hover:bg-[var(--color-surface-hover)] text-[var(--color-primary)] disabled:opacity-50"
            >
              <Check size={14} />
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="p-1 rounded hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Views List */}
      <div className="flex-1 overflow-y-auto">
        {/* All Notes (default) */}
        <button
          onClick={onClearView}
          className={cn(
            'w-full px-3 py-2 flex items-center gap-2 text-left text-sm transition-colors',
            !activeViewId
              ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
              : 'hover:bg-[var(--color-surface-hover)] text-[var(--color-text-primary)]'
          )}
        >
          <Filter size={14} />
          All Notes
        </button>

        {views.length === 0 ? (
          <div className="px-3 py-4 text-xs text-center text-[var(--color-text-tertiary)]">
            No saved views yet.
            {hasActiveFilters ? ' Apply filters and save them here.' : ''}
          </div>
        ) : (
          views.map((view) => (
            <div
              key={view.id}
              className={cn(
                'group flex items-center gap-2 px-3 py-2 transition-colors',
                activeViewId === view.id
                  ? 'bg-[var(--color-primary)]/10'
                  : 'hover:bg-[var(--color-surface-hover)]'
              )}
            >
              {editingId === view.id ? (
                <div className="flex-1 flex items-center gap-1">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-1 py-0.5 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit();
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                  />
                  <button onClick={handleSaveEdit} className="p-0.5 text-[var(--color-primary)]">
                    <Check size={12} />
                  </button>
                  <button onClick={() => setEditingId(null)} className="p-0.5 text-[var(--color-text-secondary)]">
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => onApplyView(view)}
                    className={cn(
                      'flex-1 text-left text-sm truncate',
                      activeViewId === view.id
                        ? 'text-[var(--color-primary)] font-medium'
                        : 'text-[var(--color-text-primary)]'
                    )}
                  >
                    {view.name}
                  </button>
                  <div className="hidden group-hover:flex items-center gap-0.5">
                    <button
                      onClick={() => handleStartEdit(view)}
                      className="p-1 rounded hover:bg-[var(--color-surface)] text-[var(--color-text-tertiary)]"
                      title="Rename"
                    >
                      <Edit3 size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(view.id)}
                      className="p-1 rounded hover:bg-[var(--color-surface)] text-[var(--color-danger)]"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Filter Summary */}
      {hasActiveFilters && currentFilters && (
        <div className="px-3 py-2 border-t border-[var(--color-border)] text-xs text-[var(--color-text-tertiary)]">
          <div className="flex items-center gap-1 flex-wrap">
            {currentFilters.tags?.map(tag => (
              <span key={tag} className="px-1.5 py-0.5 rounded bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                #{tag}
              </span>
            ))}
            {currentFilters.noteType && (
              <span className="px-1.5 py-0.5 rounded bg-[var(--color-surface-hover)]">
                {currentFilters.noteType}
              </span>
            )}
            {currentFilters.searchQuery && (
              <span className="px-1.5 py-0.5 rounded bg-[var(--color-surface-hover)]">
                "{currentFilters.searchQuery}"
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
