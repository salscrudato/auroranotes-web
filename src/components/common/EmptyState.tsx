/**
 * Friendly empty state display with icon and contextual message.
 */

import { memo } from 'react';
import { FileText, Search, type LucideIcon } from 'lucide-react';

export type EmptyStateType = 'no-notes' | 'no-search-results';

interface EmptyStateConfig {
  icon: LucideIcon;
  title: string;
  description: string;
}

const EMPTY_STATE_CONFIG: Record<EmptyStateType, EmptyStateConfig> = {
  'no-notes': {
    icon: FileText,
    title: 'No notes yet',
    description: 'Write your first note above to get started. Your notes will appear here.',
  },
  'no-search-results': {
    icon: Search,
    title: 'No results found',
    description: "Try adjusting your search or filter to find what you're looking for.",
  },
};

interface EmptyStateProps {
  type: EmptyStateType;
  message?: string;
}

export const EmptyState = memo(function EmptyState({ type, message }: EmptyStateProps) {
  const { icon: Icon, title, description } = EMPTY_STATE_CONFIG[type];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-[var(--color-bg-muted)] flex items-center justify-center mb-4 text-[var(--color-text-tertiary)]">
        <Icon size={32} strokeWidth={1.5} />
      </div>
      <h3 className="text-base font-semibold text-[var(--color-text)] mb-2">
        {title}
      </h3>
      <p className="text-sm text-[var(--color-text-secondary)] max-w-[280px] leading-relaxed">
        {message || description}
      </p>
    </div>
  );
});
