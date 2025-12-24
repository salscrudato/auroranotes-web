/**
 * ThreadSidebar component - List of chat threads with CRUD operations
 * Supports infinite scroll, create, rename, delete
 */

import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { Plus, MessageSquare, MoreHorizontal, Pencil, Trash2, Check, X, Loader2 } from 'lucide-react';
import { useThreadsList, useThreadMutations } from '@/hooks/useThreads';
import { formatRelativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';

interface ThreadSidebarProps {
  activeThreadId: string | null;
  onSelectThread: (threadId: string) => void;
  onNewThread: () => void;
  className?: string;
}

export const ThreadSidebar = memo(function ThreadSidebar({
  activeThreadId,
  onSelectThread,
  onNewThread,
  className,
}: ThreadSidebarProps) {
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage, useLocalFallback, localThreads } = useThreadsList();
  const { deleteThread, updateThread, deleteLocalThread, updateLocalThread } = useThreadMutations();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Flatten pages into single array
  const threads = useLocalFallback
    ? localThreads
    : (data?.pages.flatMap(page => page.threads) ?? []);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current || !hasNextPage || isFetchingNextPage) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollHeight - scrollTop - clientHeight < 100) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const startEditing = useCallback((id: string, title: string) => {
    setEditingId(id);
    setEditTitle(title);
    setMenuOpenId(null);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingId(null);
    setEditTitle('');
  }, []);

  const saveEditing = useCallback(async () => {
    if (!editingId || !editTitle.trim()) return;
    if (editingId.startsWith('local-')) {
      updateLocalThread(editingId, { title: editTitle.trim() });
    } else {
      await updateThread.mutateAsync({ id: editingId, title: editTitle.trim() });
    }
    setEditingId(null);
    setEditTitle('');
  }, [editingId, editTitle, updateThread, updateLocalThread]);

  const handleDelete = useCallback(async (id: string) => {
    setMenuOpenId(null);
    if (id.startsWith('local-')) {
      deleteLocalThread(id);
    } else {
      await deleteThread.mutateAsync(id);
    }
  }, [deleteThread, deleteLocalThread]);

  return (
    <div className={cn('thread-sidebar', className)}>
      <div className="thread-sidebar-header">
        <h2 className="thread-sidebar-title">Conversations</h2>
        <button
          className="thread-new-btn"
          onClick={onNewThread}
          aria-label="Start new conversation"
          title="New conversation"
        >
          <Plus size={18} />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="thread-list"
        onScroll={handleScroll}
      >
        {isLoading && threads.length === 0 ? (
          <ThreadSkeletons count={4} />
        ) : threads.length === 0 ? (
          <div className="thread-empty">
            <MessageSquare size={24} className="thread-empty-icon" />
            <p>No conversations yet</p>
            <button className="thread-empty-btn" onClick={onNewThread}>
              Start your first chat
            </button>
          </div>
        ) : (
          <>
            {threads.map((thread) => {
              const isActive = thread.id === activeThreadId;
              const isEditing = thread.id === editingId;
              const isMenuOpen = thread.id === menuOpenId;

              return (
                <ThreadItem
                  key={thread.id}
                  thread={thread}
                  isActive={isActive}
                  isEditing={isEditing}
                  isMenuOpen={isMenuOpen}
                  editTitle={editTitle}
                  onSelect={() => onSelectThread(thread.id)}
                  onEditTitle={setEditTitle}
                  onStartEdit={() => startEditing(thread.id, thread.title)}
                  onSaveEdit={saveEditing}
                  onCancelEdit={cancelEditing}
                  onToggleMenu={() => setMenuOpenId(isMenuOpen ? null : thread.id)}
                  onDelete={() => handleDelete(thread.id)}
                />
              );
            })}
            {isFetchingNextPage && (
              <div className="thread-loading-more">
                <Loader2 size={16} className="spinner" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
});

// ============================================================================
// Sub-components
// ============================================================================

interface ThreadItemProps {
  thread: { id: string; title: string; updatedAt: string };
  isActive: boolean;
  isEditing: boolean;
  isMenuOpen: boolean;
  editTitle: string;
  onSelect: () => void;
  onEditTitle: (title: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onToggleMenu: () => void;
  onDelete: () => void;
}

const ThreadItem = memo(function ThreadItem({
  thread,
  isActive,
  isEditing,
  isMenuOpen,
  editTitle,
  onSelect,
  onEditTitle,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onToggleMenu,
  onDelete,
}: ThreadItemProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  return (
    <div
      className={cn('thread-item', { active: isActive, editing: isEditing })}
      role="button"
      tabIndex={0}
      onClick={!isEditing ? onSelect : undefined}
      onKeyDown={(e) => {
        if (!isEditing && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {isEditing ? (
        <div className="thread-edit-form">
          <input
            ref={inputRef}
            type="text"
            value={editTitle}
            onChange={(e) => onEditTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSaveEdit();
              if (e.key === 'Escape') onCancelEdit();
            }}
            className="thread-edit-input"
            autoFocus
          />
          <div className="thread-edit-actions">
            <button onClick={onSaveEdit} className="thread-edit-btn save" aria-label="Save">
              <Check size={14} />
            </button>
            <button onClick={onCancelEdit} className="thread-edit-btn cancel" aria-label="Cancel">
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        <>
          <MessageSquare size={16} className="thread-icon" />
          <div className="thread-content">
            <span className="thread-title">{thread.title}</span>
            <span className="thread-time">{formatRelativeTime(new Date(thread.updatedAt))}</span>
          </div>
          <button
            className={cn('thread-menu-btn', { open: isMenuOpen })}
            onClick={(e) => {
              e.stopPropagation();
              onToggleMenu();
            }}
            aria-label="Thread options"
          >
            <MoreHorizontal size={16} />
          </button>
          {isMenuOpen && (
            <div className="thread-menu" onClick={(e) => e.stopPropagation()}>
              <button className="thread-menu-item" onClick={onStartEdit}>
                <Pencil size={14} />
                <span>Rename</span>
              </button>
              <button className="thread-menu-item danger" onClick={onDelete}>
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
});

const ThreadSkeletons = memo(function ThreadSkeletons({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="thread-skeleton">
          <div className="thread-skeleton-icon" />
          <div className="thread-skeleton-content">
            <div className="thread-skeleton-title" />
            <div className="thread-skeleton-time" />
          </div>
        </div>
      ))}
    </>
  );
});
