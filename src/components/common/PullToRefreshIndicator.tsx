/**
 * PullToRefreshIndicator - Visual indicator for pull-to-refresh gesture
 */

import { memo } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  isPulledEnough: boolean;
  threshold?: number;
}

export const PullToRefreshIndicator = memo(function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  isPulledEnough,
  threshold = 80,
}: PullToRefreshIndicatorProps) {
  if (pullDistance === 0 && !isRefreshing) return null;

  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 180;

  return (
    <div
      className="pull-to-refresh-indicator"
      style={{
        height: pullDistance,
        opacity: Math.min(progress * 1.5, 1),
      }}
    >
      <div
        className={`pull-to-refresh-icon ${isRefreshing ? 'refreshing' : ''} ${isPulledEnough ? 'ready' : ''}`}
        style={{
          transform: isRefreshing ? undefined : `rotate(${rotation}deg)`,
        }}
      >
        <RefreshCw size={20} strokeWidth={2.5} />
      </div>
      {!isRefreshing && isPulledEnough && (
        <span className="pull-to-refresh-text">Release to refresh</span>
      )}
    </div>
  );
});

