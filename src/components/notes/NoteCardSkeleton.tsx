/**
 * Loading placeholder skeleton matching NoteCard layout.
 */

import { memo, useMemo } from 'react';

interface NoteCardSkeletonProps {
  count?: number;
}

export const NoteCardSkeleton = memo(function NoteCardSkeleton({ count = 1 }: NoteCardSkeletonProps) {
  const indices = useMemo(() => Array.from({ length: count }, (_, i) => i), [count]);

  return (
    <>
      {indices.map((i) => (
        <SkeletonCard key={i} />
      ))}
    </>
  );
});

const SkeletonCard = memo(function SkeletonCard() {
  return (
    <div className="note-card-skeleton" aria-hidden="true">
      <div className="skeleton-text">
        <div className="skeleton-line skeleton-line-full" />
        <div className="skeleton-line skeleton-line-medium" />
      </div>
      <div className="skeleton-meta">
        <div className="skeleton-time" />
        <div className="skeleton-id" />
      </div>
    </div>
  );
});
