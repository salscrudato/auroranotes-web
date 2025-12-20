/**
 * EmptyState component
 * Displays a friendly empty state with icon and message
 */

import { memo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { FileText, Search } from 'lucide-react';

interface EmptyStateProps {
  /** Type of empty state */
  type: 'no-notes' | 'no-search-results';
  /** Custom message (optional) */
  message?: string;
}

const configs: Record<EmptyStateProps['type'], { icon: LucideIcon; title: string; description: string }> = {
  'no-notes': {
    icon: FileText,
    title: 'No notes yet',
    description: 'Write your first note above to get started. Your notes will appear here.',
  },
  'no-search-results': {
    icon: Search,
    title: 'No results found',
    description: 'Try adjusting your search or filter to find what you\'re looking for.',
  },
};

export const EmptyState = memo(function EmptyState({ type, message }: EmptyStateProps) {
  const config = configs[type];
  const Icon = config.icon;

  return (
    <div className="empty-state-container">
      <div className="empty-state-icon">
        <Icon size={32} strokeWidth={1.5} />
      </div>
      <h3 className="empty-state-title">{config.title}</h3>
      <p className="empty-state-description">{message || config.description}</p>
    </div>
  );
});

