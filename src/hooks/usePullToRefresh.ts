/**
 * usePullToRefresh - iOS-style pull-to-refresh gesture hook
 * Triggers a refresh callback when user pulls down at the top of a scrollable area
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import { triggerHaptic } from '@/lib/utils';

interface PullToRefreshConfig {
  /** Callback to execute on refresh */
  onRefresh: () => Promise<void>;
  /** Minimum pull distance to trigger refresh (default: 80) */
  threshold?: number;
  /** Whether pull-to-refresh is enabled (default: true) */
  enabled?: boolean;
}

interface PullToRefreshState {
  /** Current pull distance in pixels */
  pullDistance: number;
  /** Whether currently refreshing */
  isRefreshing: boolean;
  /** Whether the threshold has been reached */
  isPulledEnough: boolean;
}

export function usePullToRefresh<T extends HTMLElement = HTMLElement>({
  onRefresh,
  threshold = 80,
  enabled = true,
}: PullToRefreshConfig) {
  const containerRef = useRef<T>(null);
  const startYRef = useRef<number>(0);
  const currentYRef = useRef<number>(0);
  const isPullingRef = useRef(false);
  
  const [state, setState] = useState<PullToRefreshState>({
    pullDistance: 0,
    isRefreshing: false,
    isPulledEnough: false,
  });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || state.isRefreshing) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    // Only start pull if at the top of the scroll area
    if (container.scrollTop <= 0) {
      const touch = e.touches[0];
      if (touch) {
        startYRef.current = touch.clientY;
        isPullingRef.current = true;
      }
    }
  }, [enabled, state.isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || !isPullingRef.current || state.isRefreshing) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    const touch = e.touches[0];
    if (!touch) return;
    
    currentYRef.current = touch.clientY;
    const pullDistance = Math.max(0, currentYRef.current - startYRef.current);
    
    // Apply resistance factor for more natural feel
    const resistedDistance = Math.min(pullDistance * 0.5, threshold * 1.5);
    const isPulledEnough = resistedDistance >= threshold;
    
    // Haptic feedback when crossing threshold
    if (isPulledEnough && !state.isPulledEnough) {
      triggerHaptic('light');
    }
    
    setState(prev => ({
      ...prev,
      pullDistance: resistedDistance,
      isPulledEnough,
    }));
    
    // Prevent default scrolling when pulling
    if (pullDistance > 10 && container.scrollTop <= 0) {
      e.preventDefault();
    }
  }, [enabled, state.isRefreshing, state.isPulledEnough, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPullingRef.current) return;
    isPullingRef.current = false;
    
    if (state.isPulledEnough && !state.isRefreshing) {
      triggerHaptic('medium');
      setState(prev => ({ ...prev, isRefreshing: true, pullDistance: threshold * 0.6 }));
      
      try {
        await onRefresh();
      } finally {
        setState({ pullDistance: 0, isRefreshing: false, isPulledEnough: false });
      }
    } else {
      setState({ pullDistance: 0, isRefreshing: false, isPulledEnough: false });
    }
  }, [state.isPulledEnough, state.isRefreshing, threshold, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    containerRef,
    ...state,
  };
}

