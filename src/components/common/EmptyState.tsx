/**
 * EmptyState component
 * Displays a friendly empty state with icon and message
 * Uses Tailwind utilities
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
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-[var(--color-bg-muted)] flex items-center justify-center mb-4 text-[var(--color-text-tertiary)]">
        <Icon size={32} strokeWidth={1.5} />
      </div>
      <h3 className="text-base font-semibold text-[var(--color-text)] mb-2">
        {config.title}
      </h3>
      <p className="text-sm text-[var(--color-text-secondary)] max-w-[280px] leading-relaxed">
        {message || config.description}
      </p>
    </div>
  );
});

