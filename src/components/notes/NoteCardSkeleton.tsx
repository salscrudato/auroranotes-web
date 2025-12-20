/**
 * NoteCardSkeleton component
 * Loading placeholder that matches NoteCard layout
 */

import { memo } from 'react';

interface NoteCardSkeletonProps {
  /** Number of skeleton cards to render */
  count?: number;
}

export const NoteCardSkeleton = memo(function NoteCardSkeleton({ count = 1 }: NoteCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="note-card-skeleton" aria-hidden="true">
          <div className="skeleton-text">
            <div className="skeleton-line skeleton-line-full" />
            <div className="skeleton-line skeleton-line-medium" />
          </div>
          <div className="skeleton-meta">
            <div className="skeleton-time" />
            <div className="skeleton-id" />
          </div>
        </div>
      ))}
    </>
  );
});

