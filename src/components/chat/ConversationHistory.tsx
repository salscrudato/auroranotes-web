/**
 * Sidebar for managing past chat conversations.
 */

import { useState, useCallback, useMemo, memo } from 'react';
import { MessageSquare, Plus, Trash2, Edit3, Check, X, Clock } from 'lucide-react';
import type { Conversation } from '../../lib/types';
import { cn } from '../../lib/utils';
import { formatRelativeTime } from '../../lib/format';

interface ConversationHistoryProps {
  conversations: Conversation[];
  activeConversationId?: string;
  onSelectConversation: (conversation: Conversation) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, name: string) => void;
  className?: string;
}

export const ConversationHistory = memo(function ConversationHistory({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  className,
}: ConversationHistoryProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleStartEdit = useCallback((conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditName(conv.title || getDefaultTitle(conv));
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingId || !editName.trim()) return;
    onRenameConversation(editingId, editName.trim());
    setEditingId(null);
    setEditName('');
  }, [editingId, editName, onRenameConversation]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditName('');
  }, []);

  const handleDelete = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteConversation(id);
  }, [onDeleteConversation]);

  // Group conversations by date
  const groupedConversations = useMemo(() => {
    const groups: { label: string; conversations: Conversation[] }[] = [];
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const todayItems: Conversation[] = [];
    const yesterdayItems: Conversation[] = [];
    const thisWeekItems: Conversation[] = [];
    const olderItems: Conversation[] = [];

    for (const conv of conversations) {
      const date = new Date(conv.updatedAt);
      if (date.toDateString() === today.toDateString()) {
        todayItems.push(conv);
      } else if (date.toDateString() === yesterday.toDateString()) {
        yesterdayItems.push(conv);
      } else if (date > weekAgo) {
        thisWeekItems.push(conv);
      } else {
        olderItems.push(conv);
      }
    }

    if (todayItems.length) groups.push({ label: 'Today', conversations: todayItems });
    if (yesterdayItems.length) groups.push({ label: 'Yesterday', conversations: yesterdayItems });
    if (thisWeekItems.length) groups.push({ label: 'This Week', conversations: thisWeekItems });
    if (olderItems.length) groups.push({ label: 'Older', conversations: olderItems });

    return groups;
  }, [conversations]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* New Conversation Button */}
      <div className="p-2 border-b border-[var(--color-border)]">
        <button
          onClick={onNewConversation}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 rounded-lg',
            'bg-[var(--color-primary)] text-white',
            'hover:bg-[var(--color-primary-hover)] transition-colors'
          )}
        >
          <Plus size={16} />
          New Chat
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {groupedConversations.length === 0 ? (
          <div className="p-4 text-center text-sm text-[var(--color-text-tertiary)]">
            No conversations yet
          </div>
        ) : (
          groupedConversations.map(group => (
            <div key={group.label}>
              <div className="px-3 py-2 text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
                {group.label}
              </div>
              {group.conversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => onSelectConversation(conv)}
                  className={cn(
                    'group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors',
                    activeConversationId === conv.id
                      ? 'bg-[var(--color-primary)]/10 border-l-2 border-[var(--color-primary)]'
                      : 'hover:bg-[var(--color-surface-hover)]'
                  )}
                >
                  <MessageSquare size={14} className="flex-shrink-0 text-[var(--color-text-secondary)]" />
                  
                  {editingId === conv.id ? (
                    <div className="flex-1 flex items-center gap-1">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-1 py-0.5 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                      />
                      <button onClick={handleSaveEdit} className="p-0.5 text-[var(--color-primary)]">
                        <Check size={12} />
                      </button>
                      <button onClick={handleCancelEdit} className="p-0.5 text-[var(--color-text-secondary)]">
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">
                          {conv.title || getDefaultTitle(conv)}
                        </div>
                        <div className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1">
                          <Clock size={10} />
                          {formatRelativeTime(new Date(conv.updatedAt))}
                        </div>
                      </div>
                      <div className="hidden group-hover:flex items-center gap-0.5">
                        <button
                          onClick={(e) => handleStartEdit(conv, e)}
                          className="p-1 rounded hover:bg-[var(--color-surface)] text-[var(--color-text-tertiary)]"
                          title="Rename"
                        >
                          <Edit3 size={12} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(conv.id, e)}
                          className="p-1 rounded hover:bg-[var(--color-surface)] text-[var(--color-danger)]"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
});

/** Generate default title from first user message */
function getDefaultTitle(conv: Conversation): string {
  const firstUserMessage = conv.messages?.find(m => m.role === 'user');
  if (firstUserMessage) {
    return firstUserMessage.content.slice(0, 40) + (firstUserMessage.content.length > 40 ? '...' : '');
  }
  return 'New Chat';
}

